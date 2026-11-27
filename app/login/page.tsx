import { Suspense } from "react";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isGoogleLoginEnabled } from "@/lib/config";
import { DEFAULT_AFTER_LOGIN, safeNextPath } from "@/lib/safe-redirect";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in · Creator Tool" };

const ERROR_MESSAGES: Record<string, string> = {
  link: "That login link has expired or was already used. Send yourself a new one.",
  google: "Google login didn't work. Try the email link instead.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  const googleEnabled = isGoogleLoginEnabled();
  return (
    <main className="login-shell relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <div className="login-orb login-orb-top" aria-hidden="true" />
      <div className="login-orb login-orb-bottom" aria-hidden="true" />
      <div className="login-line login-line-one" aria-hidden="true" />
      <div className="login-line login-line-two" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-500/20 text-violet-200 shadow-[0_0_32px_rgba(124,58,237,0.45)]">
            <Sparkles className="size-5" />
          </div>
          <p className="text-xs font-semibold tracking-[0.28em] text-violet-200/80 uppercase">Creator Tool</p>
          <p className="mt-2 text-xs text-slate-400">Content operations workspace</p>
        </div>

        <Card className="login-card relative w-full">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-3xl tracking-[-0.04em] text-white">Welcome back</CardTitle>
            <CardDescription className="mt-1 max-w-sm text-center text-slate-300">
              Manage clients, scripts, and videos from one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoginForm next={DEFAULT_AFTER_LOGIN} googleEnabled={googleEnabled} />}>
              <LoginFormWithParams searchParams={searchParams} googleEnabled={googleEnabled} />
            </Suspense>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-xs text-slate-500">Secure passwordless access · Built for the production team</p>
      </div>
    </main>
  );
}

async function LoginFormWithParams({
  searchParams,
  googleEnabled,
}: {
  searchParams: PageProps<"/login">["searchParams"];
  googleEnabled: boolean;
}) {
  const params = await searchParams;
  const next = safeNextPath(first(params.next));
  const errorKey = first(params.error);
  return (
    <LoginForm
      next={next}
      googleEnabled={googleEnabled}
      initialError={errorKey ? ERROR_MESSAGES[errorKey] : undefined}
    />
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
