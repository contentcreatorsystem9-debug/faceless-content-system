import Link from "next/link";
import type { Metadata } from "next";
import { Bell, Command, Plus, Sparkles } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/admin/theme-toggle";
import { isLocalAuthBypassEnabled } from "@/lib/config";

export const metadata: Metadata = {
  title: "Admin · Creator Tool",
  robots: { index: false, follow: false },
};

// Admin shell. Access is checked inside each page (see components/admin/admin-page.tsx)
// and, as a first quick check, in proxy.ts.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="admin-shell flex min-h-screen flex-1 flex-col md:flex-row">
      <aside className="admin-sidebar border-border w-full shrink-0 border-b md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-5 py-5 md:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_24px_rgba(139,92,246,0.35)]">
              <Sparkles className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">Creator Tool</span>
              <span className="text-muted-foreground block text-[10px] tracking-[0.16em] uppercase">Content OS</span>
            </span>
          </Link>
          <span className="text-muted-foreground hidden text-xs md:block">⌘K</span>
        </div>
        <AdminNav />
        <div className="mt-auto hidden border-t border-white/10 p-4 md:block">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600 text-xs font-semibold text-white">AD</span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">Admin workspace</p>
                <p className="text-muted-foreground truncate text-[11px]">Operations team</p>
              </div>
              <span className="ml-auto size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="admin-topbar border-border sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="relative hidden max-w-md flex-1 md:block">
              <Command className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <input readOnly placeholder="Search clients, scripts, videos..." className="admin-search h-10 w-full rounded-xl border bg-white/[0.04] pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground/70" />
            </div>
            <div className="flex items-center gap-2 md:ml-auto">
              <Link href="/admin/clients/new" className="hidden items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-[0_0_22px_rgba(139,92,246,0.28)] transition hover:bg-primary/85 sm:flex">
                <Plus className="size-4" /> New client
              </Link>
              <button type="button" aria-label="Notifications" className="text-muted-foreground hover:bg-muted relative rounded-xl border border-white/10 p-2.5 transition">
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-fuchsia-400" />
              </button>
              <ThemeToggle />
              <Link href="/admin" className="text-muted-foreground hover:text-foreground rounded-xl border border-white/10 px-3 py-2 text-xs transition">Admin home</Link>
            </div>
          </div>
        </header>
        {isLocalAuthBypassEnabled() ? (
          <div className="border-b border-amber-400/20 bg-amber-400/10 px-4 py-2 text-center text-xs text-amber-200">
            Temporary admin bypass active · authentication is disabled until this switch is turned off
          </div>
        ) : null}
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
