import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createVideoFiles } from "@/lib/video-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser("/dashboard/library");
  const { id } = await params;
  const db = await createClient();
  // RLS and the customer column grants verify ownership. final_path is
  // deliberately server-only, so fetch it only after this check.
  const { data: visibleVideo, error: visibleError } = await db.from("videos").select("id, status").eq("id", id).eq("status", "ready").maybeSingle();
  if (visibleError || !visibleVideo) return NextResponse.json({ error: "Video not found." }, { status: 404 });
  const { data: video, error } = await createAdminClient().from("videos").select("final_path").eq("id", id).maybeSingle();
  if (error || !video?.final_path) return NextResponse.json({ error: "Video not found." }, { status: 404 });
  const url = await createVideoFiles().signedUrl(video.final_path, 300);
  return NextResponse.redirect(url);
}
