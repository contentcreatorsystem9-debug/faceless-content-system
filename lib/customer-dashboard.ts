import "server-only";
import { requireUser } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isPreviewBrandId, previewBrandId } from "@/lib/customer-preview";

export type CustomerPost = {
  id: string;
  scheduled_for: string;
  pillar: string | null;
  title: string;
  status: string;
  status_reason: string | null;
  scripts: Array<{ id: string; version: number; display_text: string | null; spoken_text: string | null; qa_status: string }>;
};

export type CustomerVideo = {
  id: string;
  post_id: string | null;
  status: string;
  duration_s: number | null;
  created_at: string;
};

export type CustomerWorkspace = {
  user: { id: string; email: string; isAdmin: boolean };
  profile: { plan: string | null; full_name: string | null } | null;
  brand: { id: string; name: string; niche: string | null; posts_per_week: number; autopilot_level: string } | null;
  posts: CustomerPost[];
  videos: CustomerVideo[];
  reviewedVideoIds: string[];
  consent: { admin_status: string; heygen_consent_status: string | null } | null;
  preview: boolean;
};

/** Customer-scoped read model. Supabase RLS limits every query to the signed-in owner's rows. */
export async function getCustomerWorkspace(): Promise<CustomerWorkspace> {
  const user = await requireUser("/dashboard");
  const requestedPreview = await previewBrandId();
  const preview = isLocalAuthBypassEnabled() || (user.isAdmin && isPreviewBrandId(requestedPreview));
  const db = preview ? createAdminClient() : await createClient();
  let brandQuery = db.from("brands").select("id, owner_id, name, niche, posts_per_week, autopilot_level").order("created_at", { ascending: true }).limit(1);
  if (preview && isPreviewBrandId(requestedPreview)) brandQuery = brandQuery.eq("id", requestedPreview);
  if (!preview) brandQuery = brandQuery.eq("owner_id", user.id);
  const brandResult = await brandQuery.maybeSingle();
  if (brandResult.error) throw new Error(`Could not load your workspace: ${brandResult.error.message}`);
  const brandRecord = brandResult.data as (NonNullable<CustomerWorkspace["brand"]> & { owner_id: string }) | null;
  const profileResult = await db.from("profiles").select("plan, full_name").eq("id", brandRecord?.owner_id ?? user.id).maybeSingle();
  if (profileResult.error) throw new Error(`Could not load your profile: ${profileResult.error.message}`);
  if (!brandRecord) return { user, profile: profileResult.data, brand: null, posts: [], videos: [], reviewedVideoIds: [], consent: null, preview };
  const { owner_id: _ownerId, ...brand } = brandRecord;

  const [postsResult, videosResult, consentResult, reviewedResult] = await Promise.all([
    db.from("posts").select("id, scheduled_for, pillar, title, status, status_reason, scripts(id, version, display_text, spoken_text, qa_status)").eq("brand_id", brand.id).order("scheduled_for", { ascending: true }).limit(120),
    // These are the customer-granted columns only. Storage paths stay server-only;
    // the signed URL route verifies ownership before reading final_path.
    db.from("videos").select("id, post_id, status, duration_s, created_at").eq("brand_id", brand.id).eq("kind", "post").order("created_at", { ascending: false }).limit(100),
    db.from("consents").select("admin_status, heygen_consent_status").eq("brand_id", brand.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    // The emergency preview bypass has no Supabase auth session, so an RPC
    // granted only to authenticated would correctly reject it. Keep the
    // preview shell usable; real customer sessions load the review IDs.
    preview ? Promise.resolve({ data: [], error: null }) : db.rpc("customer_reviewed_video_ids"),
  ]);
  if (postsResult.error) throw new Error(`Could not load your content plan: ${postsResult.error.message}`);
  if (videosResult.error) throw new Error(`Could not load your videos: ${videosResult.error.message}`);
  if (consentResult.error) throw new Error(`Could not load your consent status: ${consentResult.error.message}`);
  if (reviewedResult.error) throw new Error(`Could not load your review status: ${reviewedResult.error.message}`);

  return {
    user,
    profile: profileResult.data,
    brand,
    posts: (postsResult.data ?? []) as CustomerPost[],
    videos: ((videosResult.data ?? []) as Array<CustomerVideo & { duration_s: string | number | null }>).map((video) => ({
      ...video,
      duration_s: video.duration_s === null ? null : Number(video.duration_s),
    })),
    reviewedVideoIds: ((reviewedResult.data ?? []) as Array<{ video_id: string }>).map((row) => row.video_id),
    consent: consentResult.data,
    preview,
  };
}

export function latestCustomerScript(post: CustomerPost): CustomerPost["scripts"][number] | null {
  return [...post.scripts].sort((a, b) => b.version - a.version)[0] ?? null;
}

export function customerStatus(status: string): string {
  const labels: Record<string, string> = {
    planned: "Planned",
    scripting: "Being prepared",
    script_review: "Needs your review",
    approved: "Being made",
    rendering: "Being made",
    audio_qa: "Quality check",
    editing: "Quality check",
    final_qa: "Quality check",
    team_review: "Quality check",
    needs_you: "Needs your attention",
    ready: "Ready to download",
    skipped: "Skipped",
    posted: "Posted",
    delivered: "Delivered",
    failed: "Needs attention",
  };
  return labels[status] ?? "In progress";
}

export function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
}
