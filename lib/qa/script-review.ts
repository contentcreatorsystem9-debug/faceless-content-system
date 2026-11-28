export type ScriptReviewDecision = "approve" | "changes_requested";

export type ScriptReviewRow = {
  id: string;
  post_id: string;
  script_id: string;
  decision: ScriptReviewDecision;
  note: string | null;
  admin: string;
  created_at: string;
};

export type ScriptReviewOutcome = "approved" | "changes_requested" | "not_found" | "not_latest" | "not_in_review" | "not_ready" | "bad_input";

export function scriptReviewHeadline(review: Pick<ScriptReviewRow, "decision">): string {
  return review.decision === "approve" ? "Script approved" : "Changes requested";
}

export function sortScriptReviews(reviews: ScriptReviewRow[]): ScriptReviewRow[] {
  return [...reviews].sort((a, b) => b.created_at.localeCompare(a.created_at));
}
