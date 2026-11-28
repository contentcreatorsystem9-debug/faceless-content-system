import type { ReactNode } from "react";
import { ClientNav } from "@/components/customer/client-nav";

export function ClientShell({ name, children }: { name: string; children: ReactNode }) {
  return <div className="min-h-full"><ClientNav name={name} /><main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main></div>;
}
