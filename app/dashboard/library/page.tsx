import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getCustomerWorkspace } from "@/lib/customer-dashboard";

export const metadata: Metadata = { title: "Library · Creator Tool" };

export default function LibraryPage() {
  return <Suspense fallback={<p className="text-muted-foreground text-sm">Loading library…</p>}><LibraryContent /></Suspense>;
}

async function LibraryContent() {
  const { videos } = await getCustomerWorkspace();
  const ready = videos.filter((video) => video.status === "ready");
  return <div className="space-y-6"><div><p className="text-muted-foreground text-sm">Your finished content</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Library</h1></div>{ready.length === 0 ? <Card><CardHeader><CardTitle>Your library is empty</CardTitle></CardHeader><CardContent><p className="text-muted-foreground text-sm">Approved final videos will appear here with download links.</p></CardContent></Card> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ready.map((video) => <Card key={video.id}><CardHeader><CardTitle className="text-lg">Finished video</CardTitle></CardHeader><CardContent><Link href={`/api/dashboard/videos/${video.id}`} className={buttonVariants({ size: "sm" })}>Download video</Link></CardContent></Card>)}</div>}</div>;
}
