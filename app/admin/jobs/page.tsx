import Link from "next/link";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listBrands } from "@/lib/brands";
import { requireAdmin } from "@/lib/auth";
import { listAdminVideos } from "@/lib/video-store";

const statusLabels: Record<string, string> = {
  queued: "Queued",
  rendering: "Rendering",
  editing: "Editing",
  team_review: "Needs human review",
  approved: "Approved",
  failed: "Failed",
};

export default function JobsPage() {
  return (
    <AdminPage title="Jobs" description="Background work across all clients. Open a client for the full content context.">
      <JobsList />
    </AdminPage>
  );
}

async function JobsList() {
  await requireAdmin();
  const [videos, clients] = await Promise.all([listAdminVideos(100), listBrands()]);
  const names = new Map(clients.map((client) => [client.id, client.name]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <p className="text-muted-foreground text-sm">No background jobs yet.</p>
        ) : (
          <ul className="divide-border divide-y text-sm">
            {videos.map((video) => (
              <li key={video.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <Link href={`/admin/videos/${video.id}`} className="font-medium hover:underline">
                    {video.kind === "likeness_test" ? "Likeness test" : "Video render"}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    {names.get(video.brand_id) ?? "Unknown client"} · {new Date(video.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={video.status === "failed" ? "text-destructive text-xs font-medium" : "text-muted-foreground text-xs font-medium"}>
                  {statusLabels[video.status] ?? video.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
