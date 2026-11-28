import { Suspense } from "react";
import type { Metadata } from "next";
import { VideoReviewActions } from "@/components/customer/video-review-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerWorkspace } from "@/lib/customer-dashboard";

export const metadata: Metadata = { title: "Review · Creator Tool" };

export default function ReviewPage() {
  return <Suspense fallback={<p className="text-muted-foreground text-sm">Loading reviews…</p>}><ReviewContent /></Suspense>;
}

async function ReviewContent() {
  const { videos, posts, reviewedVideoIds } = await getCustomerWorkspace();
  const reviewable = videos.filter((video) => video.status === "ready" && !reviewedVideoIds.includes(video.id));
  return <div className="space-y-6"><div><p className="text-muted-foreground text-sm">Watch and decide</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Review</h1><p className="text-muted-foreground mt-2 text-sm">Approve a finished video, request a redo, or skip it.</p></div>{reviewable.length === 0 ? <Card><CardHeader><CardTitle>No videos need your review</CardTitle></CardHeader><CardContent><p className="text-muted-foreground text-sm">When a finished video is ready, it will appear here for your approval.</p></CardContent></Card> : <div className="space-y-5">{reviewable.map((video) => <Card key={video.id}><CardHeader><CardTitle className="text-lg">{posts.find((post) => post.id === video.post_id)?.title ?? "Finished video"}</CardTitle></CardHeader><CardContent className="space-y-5"><video src={`/api/dashboard/videos/${video.id}`} controls playsInline preload="metadata" className="aspect-[9/16] w-full max-w-[360px] rounded-xl bg-black" /><VideoReviewActions videoId={video.id} /></CardContent></Card>)}</div>}</div>;
}
