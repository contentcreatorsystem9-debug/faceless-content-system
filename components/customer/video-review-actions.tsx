"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/plain-error";
import { reviewVideoAction } from "@/app/dashboard/actions";

const idle: ActionState = { status: "idle", message: "" };

export function VideoReviewActions({ videoId }: { videoId: string }) {
  const [state, formAction, pending] = useActionState(reviewVideoAction, idle);
  return (
    <form action={formAction} className="space-y-3" aria-busy={pending}>
      <input type="hidden" name="video_id" value={videoId} />
      <div className="space-y-1">
        <label htmlFor={`reason-${videoId}`} className="text-sm font-medium">If you want a redo, what should we fix?</label>
        <select id={`reason-${videoId}`} name="reason" defaultValue="" className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm">
          <option value="">Choose a reason for Redo</option>
          <option value="wrong_words">Something was said incorrectly</option>
          <option value="does_not_look_like_me">It doesn&apos;t look like me</option>
          <option value="wrong_topic">Wrong topic</option>
          <option value="captions">Captions need fixing</option>
          <option value="music">Music needs fixing</option>
          <option value="other">Other</option>
        </select>
      </div>
      <Textarea name="note" maxLength={500} placeholder="Optional note for the team" aria-label="Optional note for the team" />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="approve" disabled={pending}>Approve</Button>
        <Button type="submit" name="decision" value="redo" variant="outline" disabled={pending}>Redo</Button>
        <Button
          type="submit"
          name="decision"
          value="skip"
          variant="ghost"
          disabled={pending}
          onClick={(event) => {
            if (!window.confirm("Skip this video? It will not be used.")) event.preventDefault();
          }}
        >
          Skip
        </Button>
      </div>
      {state.message ? <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-destructive text-sm" : "text-sm"}>{state.message}</p> : null}
    </form>
  );
}
