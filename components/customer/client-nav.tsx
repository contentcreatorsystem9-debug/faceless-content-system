"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BarChart3, CalendarDays, Clapperboard, FileText, Home, Settings, ShieldCheck, Sparkles, Video, X } from "lucide-react";
import { ThemeToggle } from "@/components/admin/theme-toggle";

const links = [
  ["/dashboard", "Overview", Home],
  ["/dashboard/calendar", "Content Plan", CalendarDays],
  ["/dashboard/scripts", "Script Review", FileText],
  ["/dashboard/videos", "Video Library", Video],
  ["/dashboard/review", "Video Review", Clapperboard],
  ["/dashboard/consent", "Brand & Consent", ShieldCheck],
  ["/dashboard/settings", "Settings", Settings],
] as const;

export function ClientNav({ name, preview, children }: { name: string; preview: boolean; children: ReactNode }) {
  const pathname = usePathname();
  return <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
    <aside className="admin-sidebar hidden w-64 shrink-0 border-r border-white/10 md:sticky md:top-0 md:flex md:h-screen md:flex-col lg:flex">
      <BrandMark />
      <nav aria-label="Client navigation" className="px-3 py-5"><p className="text-muted-foreground px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] uppercase">Workspace</p><ul className="space-y-1">{links.map(([href, label, Icon]) => <NavItem key={href} href={href} label={label} Icon={Icon} active={pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))} />)}</ul></nav>
      <div className="mt-auto border-t border-white/10 p-4">{preview ? <Link href="/admin/preview/exit" className="mb-3 flex items-center gap-2 rounded-xl border border-amber-600/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-900 hover:bg-amber-300/15 dark:border-amber-300/20 dark:text-amber-100"><X className="size-3.5" /> Exit preview</Link> : null}<div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600 text-xs font-semibold text-white">{initials(name)}</span><div className="min-w-0"><p className="truncate text-xs font-medium">{name}</p><p className="text-muted-foreground truncate text-[11px]">Client workspace</p></div><span className="ml-auto size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" /></div></div></div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="admin-topbar sticky top-0 z-20 border-b border-white/10 px-4 py-3 backdrop-blur-xl md:px-8"><div className="flex items-center justify-between gap-4"><Link href="/dashboard" className="flex items-center gap-2 lg:hidden"><span className="flex size-8 items-center justify-center rounded-xl bg-primary/20 text-primary"><Sparkles className="size-4" /></span><span className="text-sm font-semibold">Creator Tool</span></Link><div className="hidden items-center gap-2 text-sm lg:flex"><BarChart3 className="size-4 text-primary" /><span className="text-muted-foreground">Your content workspace</span></div><div className="ml-auto flex items-center gap-2"><ThemeToggle />{preview ? <Link href="/admin/preview/exit" className="rounded-xl border border-amber-600/20 px-3 py-2 text-xs text-amber-900 hover:bg-amber-300/10 dark:border-amber-300/20 dark:text-amber-100">Exit preview</Link> : null}<div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{initials(name)}</div></div></div><nav aria-label="Mobile client navigation" className="mt-3 flex gap-1 overflow-x-auto lg:hidden">{links.map(([href, label, Icon]) => <NavItem key={href} href={href} label={label} Icon={Icon} active={pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))} compact />)}</nav></header>
      <main className="min-w-0 flex-1"><div className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-6 lg:px-10 lg:py-9">{children}</div></main>
    </div>
  </div>;
}

function BrandMark() { return <div className="flex items-center gap-3 px-6 py-5"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_24px_rgba(139,92,246,0.35)]"><Sparkles className="size-4" /></span><span><span className="block text-sm font-semibold tracking-tight">Creator Tool</span><span className="text-muted-foreground block text-[10px] tracking-[0.16em] uppercase">Client portal</span></span></div>; }
function NavItem({ href, label, Icon, active, compact = false }: { href: string; label: string; Icon: typeof Home; active: boolean; compact?: boolean }) { return <Link href={href} className={active ? "bg-primary/15 text-primary flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium shadow-[inset_0_0_0_1px_rgba(167,139,250,0.18)]" : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"}><Icon className="size-4" strokeWidth={1.8} /><span className={compact ? "whitespace-nowrap" : ""}>{label}</span></Link>; }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CT"; }
