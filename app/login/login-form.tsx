"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, signInWithGoogle, type LoginState } from "./actions";

export function LoginForm({
  next,
  initialError,
  googleEnabled,
}: {
  next: string;
  initialError?: string;
  googleEnabled: boolean;
}) {
  const initialState: LoginState = initialError
    ? { status: "error", message: initialError }
    : { status: "idle", message: "" };
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === "sent") {
    return (
      <div className="login-sent space-y-3 text-center" role="status">
        <p className="text-lg font-semibold text-white">Check your email</p>
        <div className="space-y-2 text-sm leading-6">
          <p className="text-slate-300">We sent a login link to</p>
          <p className="login-email-chip mx-auto w-fit max-w-full break-all rounded-full border border-sky-300/25 bg-sky-400/10 px-4 py-1.5 font-medium text-sky-200">
            {state.email}
          </p>
          <p className="text-slate-300">Open it on this device. It works once.</p>
        </div>
        <a href="/login" className="text-sm text-violet-200 underline underline-offset-4">
          Use a different email
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm text-slate-200">Email address</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="login-input h-12 rounded-full border-white/20 bg-white/[0.04] px-5 text-sm text-white placeholder:text-slate-500 focus-visible:border-violet-400 focus-visible:ring-violet-400/20" />
        </div>
        <Button type="submit" className="login-submit h-12 w-full rounded-full bg-white text-slate-950 shadow-[0_8px_28px_rgba(124,58,237,0.28)] hover:bg-violet-100" size="lg" disabled={pending}>
          {pending ? "Sending secure link…" : "Send login link"}
        </Button>
      </form>

      {googleEnabled && (
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <Button type="submit" variant="outline" className="h-12 w-full rounded-full border-white/20 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white" size="lg">
            Continue with Google
          </Button>
        </form>
      )}

      {state.status === "error" && (
        <p role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {state.message}
        </p>
      )}
    </div>
  );
}
