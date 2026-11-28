import { Suspense } from "react";
import type { Metadata } from "next";
import { ClientFeedbackForm } from "@/components/customer/client-feedback-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerStatus, dateLabel, getCustomerWorkspace, latestCustomerScript } from "@/lib/customer-dashboard";

export const metadata: Metadata = { title: "Calendar · Creator Tool" };

export default function CalendarPage() {
  return <Suspense fallback={<p className="text-muted-foreground text-sm">Loading calendar…</p>}><CalendarContent /></Suspense>;
}

async function CalendarContent() {
  const { brand, posts, preview } = await getCustomerWorkspace();
  if (!brand) return <EmptyPlan />;
  return <div className="space-y-6">{preview ? <PreviewNotice /> : null}<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-muted-foreground text-sm">Your team plans the content. You approve the direction or suggest a change.</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Content Plan</h1></div>{posts.length > 0 ? <ClientFeedbackForm brandId={brand.id} kind="plan_approved" label="Approve plan" pendingLabel="Approving…" disabled={preview} variant="default" /> : null}</div><Card><CardHeader><CardTitle>Planned posts</CardTitle><p className="text-muted-foreground text-sm">You can review every topic without changing the production workflow.</p></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="text-muted-foreground border-b text-xs uppercase tracking-wide"><tr><th className="px-3 py-3">Date</th><th className="px-3 py-3">Topic</th><th className="px-3 py-3">Pillar</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th></tr></thead><tbody className="divide-y">{posts.map((post) => { const script = latestCustomerScript(post); return <tr key={post.id} className="align-top"><td className="px-3 py-4 whitespace-nowrap">{dateLabel(post.scheduled_for)}</td><td className="max-w-[260px] px-3 py-4"><p className="font-medium">{post.title}</p>{script?.display_text ? <details className="mt-2"><summary className="text-primary cursor-pointer text-xs">Read script preview</summary><p className="mt-2 max-w-md whitespace-pre-wrap text-xs leading-5">{script.display_text}</p></details> : <span className="text-muted-foreground mt-1 block text-xs">Script being prepared</span>}</td><td className="text-muted-foreground px-3 py-4 whitespace-nowrap">{post.pillar ?? "General"}</td><td className="px-3 py-4 whitespace-nowrap"><span className="rounded-full border px-2.5 py-1 text-xs">{customerStatus(post.status)}</span></td><td className="min-w-[230px] px-3 py-4"><ClientFeedbackForm brandId={brand.id} postId={post.id} kind="plan_change" label="Suggest a change" pendingLabel="Sending…" placeholder="What should we change about this topic?" disabled={preview} /></td></tr>; })}</tbody></table></div>{posts.length === 0 ? <p className="text-muted-foreground text-sm">No posts are planned yet.</p> : null}</CardContent></Card></div>;
}

function PreviewNotice() { return <div className="rounded-xl border border-amber-600/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-900 dark:border-amber-300/20 dark:text-amber-100"><strong>Preview mode:</strong> You are viewing the client portal as an admin. Client actions are disabled.</div>; }
function EmptyPlan() { return <Card><CardContent className="flex flex-col items-center px-6 py-16 text-center"><h1 className="text-2xl font-semibold">Your content plan is being prepared</h1><p className="text-muted-foreground mt-2 max-w-md text-sm">Your team will add topics here after the brand onboarding is complete.</p></CardContent></Card>; }
