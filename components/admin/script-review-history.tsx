import { scriptReviewHeadline, sortScriptReviews, type ScriptReviewRow } from "@/lib/qa/script-review";

const when = (iso: string) => `${new Date(iso).toISOString().slice(0, 16).replace("T", " ")} UTC`;

export function ScriptReviewHistory({ reviews }: { reviews: ScriptReviewRow[] }) {
  if (reviews.length === 0) return null;
  return (
    <ul className="space-y-1 text-sm">
      {sortScriptReviews(reviews).map((review) => (
        <li key={review.id} className="break-words">
          <span className="font-medium">{scriptReviewHeadline(review)}</span>
          {review.note ? <> · “{review.note}”</> : null}
          <span className="text-muted-foreground">
            {" "}
            · {review.admin}, {when(review.created_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}
