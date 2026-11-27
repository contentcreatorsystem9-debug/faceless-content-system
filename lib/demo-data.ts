import type { BrandListItem, BrandRow } from "@/lib/brands";
import type { PostWithScript } from "@/lib/posts";
import type { AdminVideoSummary, ClientVideoSummary } from "@/lib/video-store";

export const DEMO_BRAND_ID = "00000000-0000-4000-8000-000000000001";

export function demoBrand(): BrandRow {
  return {
    id: DEMO_BRAND_ID,
    owner_id: "00000000-0000-4000-8000-000000000002",
    name: "Rukhsar Ahmed",
    niche: "Personal branding",
    audience: "Pakistani and Gulf professionals",
    offers: "Personal brand content and consulting",
    tone: "Warm, clear and practical",
    sound_answers: { voice: "Confident and conversational" },
    samples: "3 tips for building a personal brand online\nConsistency matters more than virality.",
    banned_words: [],
    language: "roman_urdu",
    pillars: [
      { name: "Personal branding", description: "Practical positioning advice" },
      { name: "Creator systems", description: "Simple content workflows" },
    ],
    posting_days: [1, 3, 5],
    posts_per_week: 3,
    audience_countries: ["PK", "AE"],
    posting_times_override: null,
    autopilot_level: "review_videos",
    words_per_second: 2.4,
    is_managed: true,
    paused: false,
    profile_md: "Rukhsar helps professionals build a clear, consistent personal brand without filming every day.",
    current_version: 1,
    created_at: "2026-11-27T08:00:00.000Z",
  };
}

export function demoBrandListItem(): BrandListItem {
  const brand = demoBrand();
  return {
    id: brand.id,
    name: brand.name,
    niche: brand.niche,
    is_managed: brand.is_managed,
    current_version: brand.current_version,
    created_at: brand.created_at,
  };
}

export function demoPosts(brandId: string): PostWithScript[] {
  if (brandId !== DEMO_BRAND_ID) return [];
  return [
    {
      id: "00000000-0000-4000-8000-000000000011",
      brand_id: brandId,
      scheduled_for: "2026-12-01T09:00:00.000Z",
      pillar: "Personal branding",
      title: "3 personal branding mistakes",
      hook: "Most people make these three mistakes.",
      format: "talking",
      status: "approved",
      status_reason: null,
      scripts: [
        {
          id: "00000000-0000-4000-8000-000000000101",
          version: 1,
          qa_status: "passed",
          est_seconds: 38,
          display_text: "Here are three personal branding mistakes to avoid.",
          spoken_text: "Here are three personal branding mistakes to avoid.",
          hashtags: ["personalbranding", "careeradvice"],
        },
      ],
      videos: [{ kind: "post", status: "team_review" }],
    },
    {
      id: "00000000-0000-4000-8000-000000000012",
      brand_id: brandId,
      scheduled_for: "2026-12-03T09:00:00.000Z",
      pillar: "Creator systems",
      title: "How to plan a week of content",
      hook: "You do not need to create content every day.",
      format: "talking",
      status: "scripting",
      status_reason: null,
      scripts: [
        {
          id: "00000000-0000-4000-8000-000000000102",
          version: 1,
          qa_status: "passed",
          est_seconds: 42,
          display_text: "Plan one week of content in three simple steps.",
          spoken_text: "Plan one week of content in three simple steps.",
          hashtags: ["contentplanning"],
        },
      ],
      videos: [],
    },
    {
      id: "00000000-0000-4000-8000-000000000013",
      brand_id: brandId,
      scheduled_for: "2026-12-05T09:00:00.000Z",
      pillar: "Personal branding",
      title: "Why consistency beats virality",
      hook: "One viral post is not a content strategy.",
      format: "story",
      status: "planned",
      status_reason: null,
      scripts: [],
      videos: [],
    },
  ];
}

export function demoVideos(brandId = DEMO_BRAND_ID): ClientVideoSummary[] {
  if (brandId !== DEMO_BRAND_ID) return [];
  return [
    {
      id: "00000000-0000-4000-8000-000000000201",
      brand_id: DEMO_BRAND_ID,
      kind: "post",
      status: "team_review",
      engine: "heygen",
      heygen_video_id: null,
      late_heygen_video_id: null,
      error: null,
      created_at: "2026-11-27T10:15:00.000Z",
      post_title: "3 personal branding mistakes",
    },
    {
      id: "00000000-0000-4000-8000-000000000202",
      brand_id: DEMO_BRAND_ID,
      kind: "post",
      status: "rendering",
      engine: "heygen",
      heygen_video_id: "demo-render-202",
      late_heygen_video_id: null,
      error: null,
      created_at: "2026-11-27T11:00:00.000Z",
      post_title: "How to plan a week of content",
    },
  ];
}

export function demoAdminVideos(): AdminVideoSummary[] {
  return demoVideos().map(({ post_title: _postTitle, ...video }) => video);
}
