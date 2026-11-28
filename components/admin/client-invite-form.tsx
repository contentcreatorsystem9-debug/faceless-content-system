"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/plain-error";

const idle: ActionState = { status: "idle", message: "" };

export function ClientInviteForm({ action, defaultEmail = "" }: { action: (previous: ActionState, formData: FormData) => Promise<ActionState>; defaultEmail?: string | null }) {
  const [state, formAction, pending] = useActionState(action, idle);
  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <Input name="email" type="email" required maxLength={254} defaultValue={defaultEmail ?? ""} placeholder="client@example.com" aria-label="Client email" />
      <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Invite client"}</Button>
      {state.message ? <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-destructive text-sm sm:pt-2" : "text-sm sm:pt-2"}>{state.message}</p> : null}
    </form>
  );
}
