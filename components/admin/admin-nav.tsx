import Link from "next/link";
import { Activity, LayoutDashboard, Settings, Users } from "lucide-react";
import { ADMIN_NAV } from "@/lib/admin-sections";

const icons = {
  "/admin": LayoutDashboard,
  "/admin/clients": Users,
  "/admin/jobs": Activity,
  "/admin/settings": Settings,
} as const;

export function AdminNav() {
  return (
    <nav aria-label="Admin navigation" className="admin-sidebar-nav px-3 py-4">
      <p className="text-muted-foreground px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] uppercase">Workspace</p>
      <ul className="flex gap-1 overflow-x-auto text-sm whitespace-nowrap md:flex-col md:overflow-visible">
        {ADMIN_NAV.map((item) => (
          <li key={item.href}>
            {(() => {
              const Icon = icons[item.href as keyof typeof icons];
              return (
                <Link href={item.href} className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors">
                  <Icon className="size-4" strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })()}
          </li>
        ))}
      </ul>
    </nav>
  );
}
