import type { ReactNode } from "react";
import { ReviewHistory } from "@/components/admin/review-history";
import { calendarWeeks } from "@/lib/plan-calendar";
import { localTimeString } from "@/lib/posting-times";
import type { PostWithScript } from "@/lib/posts";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const longDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

/** The planned posts as a month grid (local dates in the primary country). */
export function PlanGrid({ posts, timezone }: { posts: PostWithScript[]; timezone: string }) {
  const weeks = calendarWeeks(posts, timezone);
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[36rem] grid-cols-7 gap-px rounded-lg border text-xs">
        {DAY_NAMES.map((name) => (
          <div key={name} className="bg-muted/60 p-1 text-center font-medium">
            {name}
          </div>
        ))}
        {weeks.flat().map((day) => (
          <div key={day.date} className="min-h-16 p-1">
            <div className="text-muted-foreground">{Number(day.date.slice(8))}</div>
            {day.posts.map((post) => (
              <div key={post.id} className="bg-muted mt-0.5 truncate rounded px-1" title={post.title}>
                {localTimeString(new Date(post.scheduled_for), timezone)} {post.title}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** The planned posts as a list; `actions` renders the buttons for one post. */
export function PlanList({
  posts,
  timezone,
  actions,
}: {
  posts: PostWithScript[];
  timezone: string;
  actions?: (post: PostWithScript) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Topic</th>
            <th className="px-4 py-3 font-medium">Pillar</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {posts.map((post) => {
            const date = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date(post.scheduled_for));
            const script = [...post.scripts].sort((a, b) => b.version - a.version)[0];
            const status = planStatus(post);
            return (
              <tr key={post.id} className="align-top transition hover:bg-white/[0.03]">
                <td className="whitespace-nowrap px-4 py-4">
                  <p className="font-medium">{longDate(date)}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{localTimeString(new Date(post.scheduled_for), timezone)}</p>
                </td>
                <td className="max-w-sm px-4 py-4">
                  <p className="font-medium">{post.title}</p>
                  {post.hook ? <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">“{post.hook}”</p> : null}
                  {script ? (
                    <details className="mt-2 text-xs">
                      <summary className="text-primary cursor-pointer">View script · {Math.round(Number(script.est_seconds ?? 0))} sec</summary>
                      <p className="mt-2 break-words whitespace-pre-wrap">{script.display_text}</p>
                    </details>
                  ) : null}
                  {post.status_reason ? <p className="text-destructive mt-2 text-xs">{post.status_reason}</p> : null}
                  {post.human_reviews && post.human_reviews.length > 0 ? (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer">QA history</summary>
                      <ReviewHistory reviews={post.human_reviews} />
                    </details>
                  ) : null}
                </td>
                <td className="px-4 py-4">{post.pillar ?? "—"}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{status}</span>
                </td>
                <td className="px-4 py-4 text-right">{actions?.(post) ?? <span className="text-muted-foreground text-xs">—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function planStatus(post: PostWithScript): string {
  if (post.status === "planned" && post.scripts.length === 0) return "Planned";
  if (post.status === "approved") return "Script ready";
  if (post.status === "team_review") return "Human review";
  if (post.status === "scripting") return "Draft";
  return post.status.replaceAll("_", " ");
}
