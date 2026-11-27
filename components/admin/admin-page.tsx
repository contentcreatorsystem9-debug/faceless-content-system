import { Suspense, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";

/**
 * Wraps every admin page. The content renders only after the server confirms
 * the visitor is an admin. Put any admin data loading INSIDE `children`, so it
 * never runs for anyone else.
 */
export function AdminPage({
  title,
  description,
  phase,
  children,
}: {
  title: string;
  description?: string;
  phase?: number;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-7">
      <header className="admin-page-heading">
        <p className="text-primary mb-2 text-[10px] font-semibold tracking-[0.2em] uppercase">Operations</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">{title}</h1>
        {description && <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">{description}</p>}
      </header>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Checking access…</p>}>
        <AdminGate>{children ?? <ComingSoon phase={phase} />}</AdminGate>
      </Suspense>
    </div>
  );
}

async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

function ComingSoon({ phase }: { phase?: number }) {
  return (
    <Card>
      <CardContent className="text-muted-foreground text-sm">
        {phase ? `This section is built in Phase ${phase}.` : "Coming soon."}
      </CardContent>
    </Card>
  );
}
