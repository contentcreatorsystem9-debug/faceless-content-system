"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/plain-error";
import { submitClientFeedbackAction } from "@/app/dashboard/actions";

const idle: ActionState = { status: "idle", message: "" };

type FeedbackKind = "plan_approved" | "plan_change" | "script_approved" | "script_change" | "profile_change";

export function ClientFeedbackForm({
  brandId,
  kind,
  postId,
  scriptId,
  label,
  pendingLabel = "Sending…",
  placeholder,
  variant = "outline",
  disabled = false,
}: {
  brandId: string;
  kind: FeedbackKind;
  postId?: string;
  scriptId?: string;
  label: string;
  pendingLabel?: string;
  placeholder?: string;
  variant?: "default" | "outline";
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(submitClientFeedbackAction, idle);
  const needsMessage = kind === "plan_change" || kind === "script_change" || kind === "profile_change";
  return <form action={formAction} className="space-y-2" aria-busy={pending}>
    <input type="hidden" name="brand_id" value={brandId} />
    <input type="hidden" name="kind" value={kind} />
    {postId ? <input type="hidden" name="post_id" value={postId} /> : null}
    {scriptId ? <input type="hidden" name="script_id" value={scriptId} /> : null}
    {needsMessage ? <textarea name="message" required maxLength={1000} placeholder={placeholder ?? "Tell the team what you would like changed…"} className="min-h-20 w-full rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60" /> : null}
    <Button type="submit" variant={variant} size="sm" disabled={pending || disabled}>{pending ? pendingLabel : label}</Button>
    {state.status !== "idle" ? <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-destructive text-xs" : "text-emerald-500 text-xs"}>{state.message}</p> : null}
  </form>;
}
