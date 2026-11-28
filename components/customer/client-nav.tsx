import Link from "next/link";

const links = [
  ["/dashboard", "Home"],
  ["/dashboard/calendar", "Calendar"],
  ["/dashboard/review", "Review"],
  ["/dashboard/library", "Library"],
  ["/dashboard/consent", "Consent & recording"],
  ["/dashboard/settings", "Settings"],
] as const;

export function ClientNav({ name }: { name: string }) {
  return (
    <header className="border-border/70 border-b">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">Creator Tool</Link>
          <span className="text-muted-foreground max-w-44 truncate text-sm">{name}</span>
        </div>
        <nav aria-label="Client navigation" className="flex gap-1 overflow-x-auto text-sm">
          {links.map(([href, label]) => <Link key={href} href={href} className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-3 py-2 transition-colors">{label}</Link>)}
        </nav>
      </div>
    </header>
  );
}
