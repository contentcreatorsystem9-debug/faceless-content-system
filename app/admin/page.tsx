import Link from "next/link";
import { ClipboardCheck, Download, LoaderCircle, Users } from "lucide-react";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listBrands } from "@/lib/brands";
import { listAdminVideos } from "@/lib/video-store";

export default function AdminOverviewPage() {
  return (
    <AdminPage title="Dashboard" description="A simple view of what needs attention across all clients.">
      <DashboardSummary />
    </AdminPage>
  );
}

async function DashboardSummary() {
  const [clients, videos] = await Promise.all([listBrands(), listAdminVideos(200)]);
  const processing = videos.filter((video) => ["queued", "rendering", "editing", "technical_qa", "audio_qa", "visual_qa"].includes(video.status)).length;
  const review = videos.filter((video) => video.status === "team_review").length;
  const ready = videos.filter((video) => ["approved", "ready"].includes(video.status)).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Active clients" value={clients.length} icon={Users} />
        <SummaryCard label="Videos processing" value={processing} icon={LoaderCircle} />
        <SummaryCard label="Needs human review" value={review} icon={ClipboardCheck} />
        <SummaryCard label="Ready to download" value={ready} icon={Download} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>Open a client workspace to manage plans, scripts, videos and QA.</CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-muted-foreground text-sm">No clients yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {clients.slice(0, 8).map((client) => (
                <Link
                  key={client.id}
                  href={`/admin/clients/${client.id}`}
                  className="hover:bg-muted/60 flex items-center justify-between rounded-lg border px-3 py-3 text-sm transition-colors"
                >
                  <span>
                    <span className="block font-medium">{client.name}</span>
                    <span className="text-muted-foreground text-xs">{client.niche ?? "No niche set"}</span>
                  </span>
                  <span className="text-muted-foreground">Open →</span>
                </Link>
              ))}
            </div>
          )}
          <Link href="/admin/clients" className="mt-4 inline-block text-sm underline underline-offset-4">
            View all clients
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 pt-4">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="text-muted-foreground mt-1 text-[11px]">Across your workspace</p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-[0_0_24px_rgba(139,92,246,0.2)]">
          <Icon className="size-5" strokeWidth={1.8} />
        </span>
      </CardContent>
    </Card>
  );
}
