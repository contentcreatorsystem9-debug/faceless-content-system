import Link from "next/link";
import { AdminPage } from "@/components/admin/admin-page";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminSection } from "@/lib/admin-sections";
import { NICHE_PRESETS } from "@/lib/brand-input";
import { listBrands } from "@/lib/brands";

const section = adminSection("/admin/clients");

export default function ClientsPage() {
  return (
    <AdminPage title={section.label} description={section.about}>
      <Link href="/admin/clients/new" className={buttonVariants({ size: "lg" })}>
        New client
      </Link>
      <ClientList />
    </AdminPage>
  );
}

async function ClientList() {
  let brands;
  try {
    brands = await listBrands();
  } catch (error) {
    console.error("[admin] clients:", error instanceof Error ? error.message : error);
    return <p className="text-destructive mt-4 text-sm">Couldn&apos;t load clients. Check that Supabase is set up.</p>;
  }

  if (brands.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="text-muted-foreground text-sm">No clients yet. Add the first one.</CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {brands.map((brand) => (
        <Link key={brand.id} href={`/admin/clients/${brand.id}`} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/[0.08]">
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400/80 to-fuchsia-700/80 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.25)]">
              {brand.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-muted-foreground text-xs transition group-hover:text-primary">Open →</span>
          </div>
          <p className="mt-5 truncate font-medium">{brand.name}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {NICHE_PRESETS.find((n) => n.value === brand.niche)?.label ?? "No niche"}
            {brand.is_managed ? " · Done for you" : " · Self-serve"}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px]">
            <span className="text-muted-foreground">Brand profile</span>
            <span className="text-emerald-300">{brand.current_version > 0 ? `v${brand.current_version} ready` : "Not set"}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
