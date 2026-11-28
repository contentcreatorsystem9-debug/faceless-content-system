import type { ReactNode } from "react";
import { ClientNav } from "@/components/customer/client-nav";

export function ClientShell({ name, preview, children }: { name: string; preview: boolean; children: ReactNode }) {
  return <div className="admin-shell min-h-screen"><ClientNav name={name} preview={preview}>{children}</ClientNav></div>;
}
