import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/admin-page";
import { QueueItemView } from "@/components/admin/qa-queue-item";
import { getBrand } from "@/lib/brands";
import { listQueue } from "@/lib/qa/queue-store";
import { reviewVideoAction } from "../../../qa/actions";

export default function ClientQaPage({ params }: PageProps<"/admin/clients/[id]/qa">) {
  return (
    <AdminPage title="QA history" description="Review this client’s videos and record the human approval decision.">
      <QaList params={params} />
    </AdminPage>
  );
}

async function QaList({ params }: Pick<PageProps<"/admin/clients/[id]/qa">, "params">) {
  const { id } = await params;
  const brand = await getBrand(id);
  if (!brand) notFound();
  const items = (await listQueue()).filter((item) => item.brand_id === brand.id);

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">No videos are waiting for human review for this client.</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">{items.length} video{items.length === 1 ? "" : "s"} waiting for review.</p>
      {items.map((item) => (
        <QueueItemView key={item.id} item={item} action={reviewVideoAction} />
      ))}
    </div>
  );
}
