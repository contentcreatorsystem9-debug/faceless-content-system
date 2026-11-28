import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileEditForm, WriteProfileButton } from "@/components/admin/brand-profile-forms";
import { pillarSchema } from "@/lib/ai-schemas";
import {
  AUTOPILOT_LEVELS,
  COUNTRIES,
  LANGUAGES,
  NICHE_PRESETS,
  soundAnswerList,
  splitSamples,
  WEEKDAYS,
} from "@/lib/brand-input";
import { getBrand, listBrandVersions } from "@/lib/brands";
import { timezoneFor } from "@/lib/posting-times";
import { listPosts } from "@/lib/posts";
import { feedbackLabel, listClientFeedback } from "@/lib/client-feedback-store";
import { generateBrandProfile, saveProfileEdit } from "./actions";
import { inviteClientAction } from "./invite-actions";
import { ClientInviteForm } from "@/components/admin/client-invite-form";

export default function BrandPage({ params }: PageProps<"/admin/clients/[id]">) {
  return (
    <AdminPage title="Overview" description="Client profile, current plan and production shortcuts.">
      <BrandDetail params={params} />
    </AdminPage>
  );
}

async function BrandDetail({ params }: Pick<PageProps<"/admin/clients/[id]">, "params">) {
  const { id } = await params;
  const brand = await getBrand(id);
  if (!brand) notFound();

  const label = <T extends { value: string | number; label: string }>(list: readonly T[], value: unknown) =>
    list.find((item) => item.value === value)?.label ?? String(value ?? "—");

  const parsedPillars = pillarSchema.array().safeParse(brand.pillars);
  const pillars = parsedPillars.success ? parsedPillars.data : [];
  const versions = await listBrandVersions(brand.id);
  const hasProfile = brand.current_version > 0 && Boolean(brand.profile_md);
  const samples = splitSamples(brand.samples);
  const timezone = timezoneFor(brand.audience_countries);
  const posts = await listPosts(brand.id);
  const clientFeedback = await listClientFeedback(brand.id);
  const scriptCount = posts.reduce((count, post) => count + post.scripts.length, 0);
  const inProduction = posts.filter((post) => post.videos?.some((video) => ["queued", "rendering", "editing", "technical_qa", "audio_qa", "visual_qa"].includes(video.status))).length;
  const approved = posts.filter((post) => ["approved", "delivered"].includes(post.status)).length;
  const needsReview = posts.filter((post) => post.status === "team_review").length;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{brand.name}</h2>
      <p className="text-sm">
        <Link href={`/admin/clients/${brand.id}/names`} className="underline">
          How to say names →
        </Link>{" "}
        ·{" "}
        <Link href={`/admin/clients/${brand.id}/consent`} className="underline">
          Consent clip and twin →
        </Link>
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Client access</CardTitle>
          <p className="text-muted-foreground text-sm">Invite this client to sign in and view only their own calendar, scripts and videos.</p>
        </CardHeader>
        <CardContent>
          <ClientInviteForm action={inviteClientAction.bind(null, brand.id)} defaultEmail={brand.contact_email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client requests</CardTitle>
          <p className="text-muted-foreground text-sm">Approvals and change requests submitted from the client portal.</p>
        </CardHeader>
        <CardContent>
          {clientFeedback.length === 0 ? <p className="text-muted-foreground text-sm">No client requests yet.</p> : <ul className="divide-y divide-border">{clientFeedback.map((item) => <li key={item.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{feedbackLabel(item.kind)}</span><span className={item.status === "open" ? "rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-300" : "rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"}>{item.status}</span></div>{item.message ? <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{item.message}</p> : null}</div><time className="text-muted-foreground shrink-0 text-xs" dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time></li>)}</ul>}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link href={`/admin/clients/${brand.id}/preview`} className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-[0_0_22px_rgba(139,92,246,0.25)] hover:bg-primary/85">
          Preview client dashboard →
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand profile {hasProfile ? `· version ${brand.current_version}` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasProfile ? (
            <>
              <div className="bg-muted/40 rounded-lg p-3 text-sm break-words whitespace-pre-wrap">{brand.profile_md}</div>
              <div>
                <h3 className="text-sm font-medium">Pillars</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  {pillars.map((pillar) => (
                    <li key={pillar.name}>
                      <span className="font-medium">{pillar.name}:</span> {pillar.description}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">No profile yet. Claude writes one from the answers below.</p>
          )}
          <WriteProfileButton action={generateBrandProfile.bind(null, brand.id)} hasProfile={hasProfile} />
        </CardContent>
      </Card>

      {hasProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileEditForm
              key={brand.current_version}
              action={saveProfileEdit.bind(null, brand.id)}
              profileMd={brand.profile_md ?? ""}
              pillars={pillars}
            />
          </CardContent>
        </Card>
      )}

      {versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Profile history</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y text-sm">
              {versions.map((v) => (
                <li key={v.id} className="flex justify-between py-1.5">
                  <span>
                    Version {v.version} · {v.source === "generated" ? "written by Claude" : "edited"}
                  </span>
                  <span className="text-muted-foreground">{new Date(v.created_at).toISOString().slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Production snapshot</CardTitle>
          <p className="text-muted-foreground text-sm">
            Times are local to {label(COUNTRIES, brand.audience_countries[0] ?? "PK")} ({timezone}). Detailed work is organized in the tabs above.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Scripts" value={scriptCount} />
            <Stat label="Videos in production" value={inProduction} />
            <Stat label="Videos approved" value={approved} />
            <Stat label="Needs review" value={needsReview} />
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickLink href={`/admin/clients/${brand.id}/plans`} label="Manage content plan" />
            <QuickLink href={`/admin/clients/${brand.id}/scripts`} label="Open scripts" />
            <QuickLink href={`/admin/clients/${brand.id}/videos`} label="Open videos" />
            <QuickLink href={`/admin/clients/${brand.id}/qa`} label="Review QA" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding answers</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
            <Row term="Niche">{label(NICHE_PRESETS, brand.niche)}</Row>
            <Row term="Audience">{brand.audience}</Row>
            <Row term="Offers">{brand.offers}</Row>
            <Row term="Tone">{brand.tone}</Row>
            <Row term="Language">{label(LANGUAGES, brand.language)}</Row>
            <Row term="Posting">
              {brand.posts_per_week} a week on {brand.posting_days.map((d) => label(WEEKDAYS, d)).join(", ")}
            </Row>
            <Row term="Countries">{brand.audience_countries.map((c) => label(COUNTRIES, c)).join(", ")}</Row>
            <Row term="Autopilot">{label(AUTOPILOT_LEVELS, brand.autopilot_level)}</Row>
            <Row term="Banned words">{brand.banned_words.join(", ") || "None"}</Row>
          </dl>
          <h3 className="mt-4 text-sm font-medium">How they sound</h3>
          <dl className="mt-1 space-y-2 text-sm">
            {soundAnswerList(brand.sound_answers).map((item) => (
              <div key={item.question}>
                <dt className="text-muted-foreground">{item.question}</dt>
                <dd className="break-words whitespace-pre-wrap">{item.answer}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-4 text-sm font-medium">Writing samples ({samples.length})</h3>
          {samples.length > 0 ? (
            <ol className="mt-1 list-decimal space-y-2 pl-5 text-sm">
              {samples.map((sample, i) => (
                <li key={i} className="break-words whitespace-pre-wrap">
                  {sample}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-muted-foreground text-sm">None saved.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="break-words whitespace-pre-wrap">{children}</dd>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">{label} →</Link>;
}
