import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBrand } from "@/lib/brands";
import { isMockHeygen } from "@/lib/config";
import { listPosts } from "@/lib/posts";
import { canRunChecks, latestScript } from "@/lib/qa/can-run-checks";
import { checkScript, writeScript } from "../actions";
import { makeVideoAction } from "../render-actions";

const statusLabels: Record<string, string> = {
  planned: "Plan ready",
  scripting: "Writing script",
  script_review: "Script review",
  approved: "Ready for video",
  rendering: "Video processing",
  team_review: "Human review",
  delivered: "Delivered",
};

export default function ClientScriptsPage({ params }: PageProps<"/admin/clients/[id]/scripts">) {
  return (
    <AdminPage title="Scripts" description="Only this client’s scripts are shown here. Each script can produce one or more video versions.">
      <ScriptsList params={params} />
    </AdminPage>
  );
}

async function ScriptsList({ params }: Pick<PageProps<"/admin/clients/[id]/scripts">, "params">) {
  const { id } = await params;
  const brand = await getBrand(id);
  if (!brand) notFound();
  const posts = await listPosts(brand.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{brand.name} scripts ({posts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No scripts yet. Create a content plan first.</p>
        ) : (
          <ul className="divide-border divide-y">
            {posts.map((post) => {
              const script = latestScript(post.scripts);
              return (
                <li key={post.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{post.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {script ? `${script.est_seconds ? Math.round(script.est_seconds) : "—"} sec · ${script.qa_status}` : "No script written yet"} · {statusLabels[post.status] ?? post.status}
                    </p>
                    {post.status_reason ? <p className="text-destructive mt-1 text-xs">{post.status_reason}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!script && post.status === "planned" ? (
                      <ActionButton action={writeScript.bind(null, post.id)} label="Write script" pendingLabel="Writing…" variant="outline" size="sm" />
                    ) : null}
                    {script && canRunChecks(post.scripts, post) ? (
                      <ActionButton action={checkScript.bind(null, script.id)} label="Run checks" pendingLabel="Checking…" variant="outline" size="sm" />
                    ) : null}
                    {post.status === "approved" ? (
                      <ActionForm action={makeVideoAction.bind(null, post.id)} label="Create video" pendingLabel="Starting…" confirmSpend={!isMockHeygen()} variant="default" size="sm" />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
