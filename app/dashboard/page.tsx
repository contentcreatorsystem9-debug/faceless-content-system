import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { customerStatus, dateLabel, getCustomerWorkspace } from "@/lib/customer-dashboard";

export const metadata: Metadata = { title: "Home · Creator Tool" };

export default function DashboardPage() {
  return <Suspense fallback={<p className="text-muted-foreground text-sm">Loading your workspace…</p>}><HomeContent /></Suspense>;
}

async function HomeContent() {
  const workspace = await getCustomerWorkspace();
  if (!workspace.brand) {
    return <Card><CardHeader><CardTitle>Welcome to Creator Tool</CardTitle></CardHeader><CardContent><p className="text-muted-foreground text-sm">Your workspace is being set up. We’ll let you know when it is ready.</p></CardContent></Card>;
  }
  const needsYou = workspace.posts.filter((post) => ["script_review", "needs_you"].includes(post.status));
  const readyVideos = workspace.videos.filter((video) => video.status === "ready").length;
  const planVideos = Math.max(1, workspace.brand.posts_per_week * 4);
  return (
    <div className="space-y-6">
      <div><p className="text-muted-foreground text-sm">Your content workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Welcome back, {workspace.profile?.full_name ?? workspace.brand.name}</h1></div>
      {needsYou.length > 0 ? <Card className="border-primary/30 bg-primary/5"><CardHeader><CardTitle className="text-lg">Needs you</CardTitle></CardHeader><CardContent className="space-y-3">{needsYou.slice(0, 3).map((post) => <div key={post.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 p-3"><div><p className="font-medium">{post.title}</p><p className="text-muted-foreground text-xs">{customerStatus(post.status)}</p></div><Link href={post.status === "script_review" ? "/dashboard/calendar" : "/dashboard/review"} className={buttonVariants({ variant: "outline", size: "sm" })}>Open</Link></div>)}</CardContent></Card> : null}
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="This month" value={`${Math.min(readyVideos, planVideos)} of ${planVideos}`} note="videos ready" /><Stat label="Upcoming posts" value={String(workspace.posts.length)} note="in your plan" /><Stat label="Consent" value={workspace.consent?.admin_status === "approved" ? "Approved" : "Pending"} note="twin setup" /></div>
      <Card><CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>This week</CardTitle><Link href="/dashboard/calendar" className="text-primary text-sm underline-offset-4 hover:underline">View calendar</Link></CardHeader><CardContent className="space-y-2">{workspace.posts.slice(0, 5).map((post) => <div key={post.id} className="flex items-center justify-between gap-4 border-b py-3 last:border-0"><div><p className="font-medium">{post.title}</p><p className="text-muted-foreground text-xs">{dateLabel(post.scheduled_for)}</p></div><span className="text-muted-foreground text-xs">{customerStatus(post.status)}</span></div>)}{workspace.posts.length === 0 ? <p className="text-muted-foreground text-sm">Your first content plan will appear here.</p> : null}</CardContent></Card>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return <Card><CardContent className="p-5"><p className="text-muted-foreground text-xs">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="text-muted-foreground mt-1 text-xs">{note}</p></CardContent></Card>;
}
