import Link from "next/link";
import { ClientSwitcher } from "@/components/admin/client-switcher";
import { Card, CardContent } from "@/components/ui/card";
import { listBrands, type BrandListItem, type BrandRow } from "@/lib/brands";

export async function ClientWorkspace({ brand, children }: { brand: BrandRow; children: React.ReactNode }) {
  const clients = await listBrands();
  const tabs = [
    { href: `/admin/clients/${brand.id}`, label: "Overview", exact: true },
    { href: `/admin/clients/${brand.id}/plans`, label: "Content plans" },
    { href: `/admin/clients/${brand.id}/scripts`, label: "Scripts" },
    { href: `/admin/clients/${brand.id}/videos`, label: "Videos" },
    { href: `/admin/clients/${brand.id}/consent`, label: "Consent & twin" },
    { href: `/admin/clients/${brand.id}/qa`, label: "QA history" },
  ];

  return (
    <div className="space-y-5">
      <Card className="overflow-visible">
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Client workspace</p>
              <h1 className="mt-1 text-xl font-semibold">{brand.name}</h1>
            </div>
            <ClientSwitcher clients={clients} selectedId={brand.id} />
          </div>
          <nav aria-label={`${brand.name} workspace`} className="-mb-1 overflow-x-auto">
            <ul className="flex min-w-max gap-1 border-b">
              {tabs.map((tab) => (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    className="text-muted-foreground hover:text-foreground inline-flex border-b-2 border-transparent px-3 py-2 text-sm hover:border-foreground/30"
                  >
                    {tab.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </CardContent>
      </Card>
      {children}
    </div>
  );
}

export type ClientOption = Pick<BrandListItem, "id" | "name" | "niche">;
