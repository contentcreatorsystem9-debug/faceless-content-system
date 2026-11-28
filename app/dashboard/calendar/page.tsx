import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerStatus, dateLabel, getCustomerWorkspace, latestCustomerScript } from "@/lib/customer-dashboard";

export const metadata: Metadata = { title: "Calendar · Creator Tool" };

export default function CalendarPage() {
  return <Suspense fallback={<p className="text-muted-foreground text-sm">Loading calendar…</p>}><CalendarContent /></Suspense>;
}

async function CalendarContent() {
  const { posts } = await getCustomerWorkspace();
  return <div className="space-y-6"><div><p className="text-muted-foreground text-sm">Your upcoming content</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Calendar</h1></div><Card><CardHeader><CardTitle>Planned posts</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="text-muted-foreground border-b text-xs uppercase tracking-wide"><tr><th className="px-3 py-3">Date</th><th className="px-3 py-3">Topic</th><th className="px-3 py-3">Script</th><th className="px-3 py-3">Status</th></tr></thead><tbody className="divide-y">{posts.map((post) => { const script = latestCustomerScript(post); return <tr key={post.id}><td className="px-3 py-4 whitespace-nowrap">{dateLabel(post.scheduled_for)}</td><td className="px-3 py-4"><p className="font-medium">{post.title}</p><p className="text-muted-foreground text-xs">{post.pillar ?? "General"}</p></td><td className="max-w-md px-3 py-4">{script?.display_text ? <details><summary className="text-primary cursor-pointer">Read script</summary><p className="mt-2 whitespace-pre-wrap text-xs">{script.display_text}</p></details> : <span className="text-muted-foreground text-xs">Being prepared</span>}</td><td className="px-3 py-4 whitespace-nowrap"><span className="rounded-full border px-2.5 py-1 text-xs">{customerStatus(post.status)}</span></td></tr>; })}</tbody></table></div>{posts.length === 0 ? <p className="text-muted-foreground text-sm">No posts are planned yet.</p> : null}</CardContent></Card></div>;
}
