import { Suspense } from "react";
import type { Metadata } from "next";
import { FileText, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerStatus, getCustomerWorkspace, latestCustomerScript } from "@/lib/customer-dashboard";

export const metadata: Metadata = { title: "Scripts · Creator Tool" };

export default function ScriptsPage() { return <Suspense fallback={<p className="text-muted-foreground text-sm">Loading scripts…</p>}><ScriptsContent /></Suspense>; }

async function ScriptsContent() {
  const { posts, preview } = await getCustomerWorkspace();
  const withScripts = posts.map((post) => ({ post, script: latestCustomerScript(post) })).filter((item) => item.script);
  return <div className="space-y-6">{preview ? <PreviewNotice /> : null}<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">Content workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Scripts</h1><p className="text-muted-foreground mt-2 text-sm">Read the words before they become videos.</p></div><div className="text-muted-foreground flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs"><Search className="size-3.5" /> {withScripts.length} scripts</div></div>{withScripts.length === 0 ? <Card><CardContent className="flex flex-col items-center px-6 py-16 text-center"><FileText className="size-8 text-primary" /><h2 className="mt-4 font-semibold">No scripts yet</h2><p className="text-muted-foreground mt-2 max-w-md text-sm">Your team will write scripts from your approved content plan. They will appear here for you to read.</p></CardContent></Card> : <div className="grid gap-4 lg:grid-cols-2">{withScripts.map(({ post, script }) => <Card key={post.id}><CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-white/10"><div><p className="text-muted-foreground text-xs">{post.pillar ?? "General"}</p><CardTitle className="mt-1 text-lg">{post.title}</CardTitle></div><StatusPill status={customerStatus(post.status)} /></CardHeader><CardContent className="space-y-4 pt-5"><p className="text-muted-foreground text-xs">Version {script!.version}</p><div className="rounded-xl border border-white/10 bg-black/10 p-4 text-sm leading-7 whitespace-pre-wrap">{script!.display_text ?? script!.spoken_text ?? "Script text is being prepared."}</div><details className="rounded-xl border border-white/10 px-4 py-3"><summary className="cursor-pointer text-sm font-medium">View script details</summary><div className="text-muted-foreground mt-3 space-y-2 text-sm"><p><span className="text-foreground font-medium">QA:</span> {script!.qa_status}</p><p><span className="text-foreground font-medium">Scheduled:</span> {new Date(post.scheduled_for).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p></div></details></CardContent></Card>)}</div>}</div>;
}

function StatusPill({ status }: { status: string }) { return <span className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] text-primary">{status}</span>; }
function PreviewNotice() { return <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"><strong>Preview mode:</strong> Read-only client view.</div>; }
