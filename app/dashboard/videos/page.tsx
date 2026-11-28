import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Download, Film, Play, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { customerStatus, getCustomerWorkspace } from "@/lib/customer-dashboard";

export const metadata: Metadata = { title: "Videos · Creator Tool" };

export default function VideosPage() { return <Suspense fallback={<p className="text-muted-foreground text-sm">Loading videos…</p>}><VideosContent /></Suspense>; }

async function VideosContent() {
  const { videos, posts, preview } = await getCustomerWorkspace();
  return <div className="space-y-6">{preview ? <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"><strong>Preview mode:</strong> Read-only client view.</div> : null}<div><p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">Production library</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Videos</h1><p className="text-muted-foreground mt-2 text-sm">Follow production and watch finished videos in one place.</p></div>{videos.length === 0 ? <Card><CardContent className="flex flex-col items-center px-6 py-16 text-center"><Film className="size-8 text-primary" /><h2 className="mt-4 font-semibold">No videos yet</h2><p className="text-muted-foreground mt-2 max-w-md text-sm">Videos will appear here once your approved scripts enter production.</p><Link href="/dashboard/calendar" className="text-primary mt-4 text-sm hover:underline">View content plan →</Link></CardContent></Card> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{videos.map((video) => { const post = posts.find((item) => item.id === video.post_id); const ready = video.status === "ready"; return <Card key={video.id}><div className="relative flex aspect-video items-center justify-center bg-black/30"><Video className="size-8 text-primary/70" /><span className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] text-white">{customerStatus(video.status)}</span></div><CardHeader><CardTitle className="truncate text-base">{post?.title ?? "Content video"}</CardTitle><p className="text-muted-foreground text-xs">{post?.pillar ?? "Production"} · {video.duration_s ? `${Math.round(video.duration_s)} sec` : "Duration pending"}</p></CardHeader><CardContent className="flex gap-2">{ready ? <><Link href={`/api/dashboard/videos/${video.id}`} className={buttonVariants({ size: "sm" })}><Play className="size-3.5" /> Watch</Link><Link href={`/api/dashboard/videos/${video.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Download className="size-3.5" /> Download</Link></> : <span className="text-muted-foreground text-xs">Your team is working on this video.</span>}</CardContent></Card>; })}</div>}</div>;
}
