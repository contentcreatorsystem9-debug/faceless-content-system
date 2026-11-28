import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/admin-page";
import { ActionButton } from "@/components/admin/action-button";
import { PlanList } from "@/components/admin/plan-view";
import { ActionForm } from "@/components/admin/action-form";
import { ScriptReviewActions } from "@/components/admin/script-review-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBrand } from "@/lib/brands";
import { isMockHeygen } from "@/lib/config";
import { listPosts } from "@/lib/posts";
import { canOfferRewriteAnyway } from "@/lib/qa/script-override";
import { canRunChecks, latestScript } from "@/lib/qa/can-run-checks";
import { checkScript, planNextFourWeeks, reviewScriptAction, rewriteAnyway, writeScript } from "../actions";
import { makeVideoAction } from "../render-actions";

export default function PlansPage({ params }: PageProps<"/admin/clients/[id]/plans">) {
  return (
    <AdminPage title="Content plans" description="Plan the client’s content calendar before writing scripts.">
      <Plans params={params} />
    </AdminPage>
  );
}

async function Plans({ params }: Pick<PageProps<"/admin/clients/[id]/plans">, "params">) {
  const { id } = await params;
  const brand = await getBrand(id);
  if (!brand) notFound();
  const posts = await listPosts(brand.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{brand.name} content calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ActionButton action={planNextFourWeeks.bind(null, brand.id)} label="Plan next 4 weeks" pendingLabel="Planning…" size="lg" />
        {posts.length > 0 ? (
          <>
            <PlanList
              posts={posts}
              timezone="Asia/Karachi"
              actions={(post) => {
                const latest = latestScript(post.scripts);
                if (post.status === "planned" && post.scripts.length === 0) {
                  return <ActionButton action={writeScript.bind(null, post.id)} label="Write script" pendingLabel="Writing…" variant="outline" size="sm" />;
                }
                if (post.status === "script_review" && latest?.qa_status === "passed") {
                  return (
                    <div className="space-y-2">
                      <ScriptReviewActions
                        approve={reviewScriptAction.bind(null, latest.id, "approve")}
                        requestChanges={reviewScriptAction.bind(null, latest.id, "changes_requested")}
                      />
                      {canOfferRewriteAnyway(post) ? (
                        <ActionForm
                          action={rewriteAnyway.bind(null, latest.id)}
                          label="Rewrite script"
                          pendingLabel="Rewriting…"
                          textField={{ name: "reason", label: "Why rewrite it?", minLength: 5, maxLength: 300 }}
                          confirmCheck={{ name: "confirm", label: "I want a new script version." }}
                          variant="outline"
                          size="sm"
                        />
                      ) : null}
                    </div>
                  );
                }
                if (post.status === "approved") {
                  return <ActionForm action={makeVideoAction.bind(null, post.id)} label="Create video" pendingLabel="Starting…" confirmSpend={!isMockHeygen()} variant="outline" size="sm" />;
                }
                if (latest && canOfferRewriteAnyway(post)) {
                  return (
                    <ActionForm
                      action={rewriteAnyway.bind(null, latest.id)}
                      label="Rewrite script"
                      pendingLabel="Rewriting…"
                      textField={{ name: "reason", label: "Why rewrite it?", minLength: 5, maxLength: 300 }}
                      confirmCheck={{ name: "confirm", label: "I want a new script version." }}
                      variant="outline"
                      size="sm"
                    />
                  );
                }
                return latest && canRunChecks(post.scripts, post) ? (
                  <ActionButton action={checkScript.bind(null, latest.id)} label="Run checks" pendingLabel="Checking…" variant="outline" size="sm" />
                ) : null;
              }}
            />
          </>
        ) : (
          <p className="text-muted-foreground text-sm">No content planned yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
