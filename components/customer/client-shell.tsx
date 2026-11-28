import type { ReactNode } from "react";
import { ClientNav } from "@/components/customer/client-nav";

export function ClientShell({ name, preview, children }: { name: string; preview: boolean; children: ReactNode }) {
  return <div className="admin-shell flex min-h-screen flex-col lg:flex-row"><ClientNav name={name} preview={preview} /><main className="min-w-0 flex-1"><div className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-6 lg:px-10 lg:py-9">{children}</div></main></div>;
}
