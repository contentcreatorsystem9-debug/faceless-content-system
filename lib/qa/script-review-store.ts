import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ScriptReviewDecision, ScriptReviewOutcome } from "@/lib/qa/script-review";

const answerSchema = z.object({
  outcome: z.enum(["approved", "changes_requested", "not_found", "not_latest", "not_in_review", "not_ready", "bad_input"]),
});

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`[script-review] ${what}: ${error?.message ?? "no data"}`);
}

export function scriptReviewResult(data: unknown): ScriptReviewOutcome {
  const parsed = answerSchema.safeParse(data);
  if (!parsed.success) fail("review script", { message: "unexpected answer" });
  return parsed.data.outcome;
}

export function createScriptReviewStore() {
  const db = createAdminClient();
  return {
    async review(input: { scriptId: string; decision: ScriptReviewDecision; note: string | null; admin: string }): Promise<ScriptReviewOutcome> {
      const { data, error } = await db.rpc("review_script", {
        p_script_id: input.scriptId,
        p_decision: input.decision,
        p_note: input.note,
        p_admin: input.admin,
      });
      if (error) fail("review script", error);
      return scriptReviewResult(data);
    },
  };
}
