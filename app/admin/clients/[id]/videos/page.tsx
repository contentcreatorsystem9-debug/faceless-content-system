import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBrand } from "@/lib/brands";
import { listClientVideos } from "@/lib/video-store";

const statusLabels: Record<string, string> = {
  queued: "Queued",
  rendering: "Rendering",
  editing: "Editing",
  team_review: "Needs human review",
  approved: "Approved",
  delivered: "Ready to download",
  failed: "Failed",
};

export default function ClientVideosPage({ params }: PageProps<"/admin/clients/[id]/videos">) {
  return (
    <AdminPage title="Videos" description="Only this client’s video versions and production status are shown here.">
      <VideosList params={params} />
    </AdminPage>
  );
}

async function VideosList({ params }: Pick<PageProps<"/admin/clients/[id]/videos">, "params">) {
  const { id } = await params;
  const brand = await getBrand(id);
  if (!brand) notFound();
  const videos = await listClientVideos(brand.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{brand.name} videos ({videos.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <p className="text-muted-foreground text-sm">No videos yet. Approve a script to create the first video.</p>
        ) : (
          <ul className="divide-border divide-y">
            {videos.map((video) => (
              <li key={video.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/admin/videos/${video.id}`} className="font-medium hover:underline">
                    {video.post_title ?? (video.kind === "likeness_test" ? "Likeness test" : "Untitled video")}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    {video.kind === "likeness_test" ? "Likeness test" : "Post video"} · {new Date(video.created_at).toLocaleDateString()}
                  </p>
                  {video.error ? <p className="text-destructive mt-1 text-xs">{video.error}</p> : null}
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
