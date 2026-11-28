import { ActionForm } from "@/components/admin/action-form";
import type { ActionState } from "@/lib/plain-error";

type ReviewAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export function ScriptReviewActions({ approve, requestChanges }: { approve: ReviewAction; requestChanges: ReviewAction }) {
  return (
    <div className="space-y-2 text-left">
      <ActionForm
        action={approve}
        label="Approve script"
        pendingLabel="Approving…"
        confirmCheck={{ name: "confirm_review", label: "I reviewed the script and approve it for video." }}
        size="sm"
      />
      <ActionForm
        action={requestChanges}
        label="Request changes"
        pendingLabel="Saving…"
        textField={{ name: "note", label: "What should change?", minLength: 3, maxLength: 500 }}
        variant="outline"
        size="sm"
      />
    </div>
  );
}
