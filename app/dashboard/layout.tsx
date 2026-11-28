import { Suspense } from "react";
import { ClientShell } from "@/components/customer/client-shell";
import { getCustomerWorkspace } from "@/lib/customer-dashboard";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Suspense fallback={<div className="text-muted-foreground mx-auto w-full max-w-6xl px-4 py-8 text-sm">Loading workspace…</div>}><DashboardShell>{children}</DashboardShell></Suspense>;
}

async function DashboardShell({ children }: { children: React.ReactNode }) {
  const workspace = await getCustomerWorkspace();
  return <ClientShell name={workspace.brand?.name ?? workspace.user.email} preview={workspace.preview}>{children}</ClientShell>;
}
