import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ClientWorkspace } from "@/components/admin/client-workspace";
import { getBrand } from "@/lib/brands";
import { requireAdmin } from "@/lib/auth";

export default function ClientLayout({ children, params }: LayoutProps<"/admin/clients/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Loading client workspace…</p>}>
      <ClientWorkspaceContent params={params}>{children}</ClientWorkspaceContent>
    </Suspense>
  );
}

async function ClientWorkspaceContent({ children, params }: LayoutProps<"/admin/clients/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const brand = await getBrand(id);
  if (!brand) notFound();

  return <ClientWorkspace brand={brand}>{children}</ClientWorkspace>;
}
