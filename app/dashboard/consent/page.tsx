import { Suspense } from "react";
import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/action-form";
import { ConsentUpload } from "@/components/admin/consent-upload";
import { RecordingGuide } from "@/components/admin/recording-guide";
import { StartConsentForm } from "@/components/admin/consent-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabasePublicConfig } from "@/lib/config";
import { clipCheckStatusLine } from "@/lib/clip-check-status";
import { clipPlaybackUrl } from "@/lib/consent-flow";
import { createClipStorage, createConsentStore } from "@/lib/consent-store";
import { wordsExpired } from "@/lib/consent-words";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerWorkspace } from "@/lib/customer-dashboard";
import {
  confirmCustomerConsentUploadAction,
  newCustomerConsentWordsAction,
  prepareCustomerConsentUploadAction,
  recheckCustomerConsentAction,
  startCustomerConsentAction,
} from "@/app/dashboard/actions";

export const metadata: Metadata = { title: "Consent & recording · Creator Tool" };

export default function ConsentPage() {
  return <Suspense fallback={<p className="text-muted-foreground text-sm">Loading consent…</p>}><ConsentContent /></Suspense>;
}

async function ConsentContent() {
  const workspace = await getCustomerWorkspace();
  const db = workspace.preview ? createAdminClient() : await createClient();
  const brand = workspace.brand;
  if (!brand) {
    return <Card><CardHeader><CardTitle>Workspace is being set up</CardTitle></CardHeader><CardContent><p className="text-muted-foreground text-sm">Your consent recording screen will be available when your client workspace is ready.</p></CardContent></Card>;
  }

  const { data: consentRow, error: consentError } = await db
    .from("consents")
    .select("id, admin_status, heygen_consent_status, created_at")
    .eq("brand_id", brand.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (consentError) throw new Error("Could not load your consent status.");

  if (!consentRow) {
    return <div className="max-w-2xl space-y-6"><Intro />{workspace.preview ? <PreviewCard text="Invite the client first, then they can complete their consent recording from their own dashboard." /> : <Card><CardHeader><CardTitle>Start your consent recording</CardTitle></CardHeader><CardContent><StartConsentForm action={startCustomerConsentAction} /></CardContent></Card>}<RecordingGuide /></div>;
  }

  const fullConsent = await createConsentStore().getConsent(consentRow.id);
  if (!fullConsent) throw new Error("Consent not found.");
  const supabase = getSupabasePublicConfig();
  const expired = wordsExpired(fullConsent.words_expire_at);
  const checks = fullConsent.clip_checks?.clip_path === fullConsent.clip_path ? fullConsent.clip_checks : null;
  const videoUrl = fullConsent.clip_path ? await clipPlaybackUrl(fullConsent, createClipStorage()) : null;
  const pending = fullConsent.admin_status === "pending";

  return <div className="max-w-3xl space-y-6"><Intro /><Card><CardHeader><CardTitle>Consent status: {fullConsent.admin_status}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p className="text-muted-foreground">Your recording is used only to set up your approved digital twin.</p>{fullConsent.admin_note ? <p>{fullConsent.admin_note}</p> : null}<p className="text-muted-foreground">HeyGen consent: {fullConsent.heygen_consent_status ?? "Not started"}</p></CardContent></Card>
    {pending ? <Card><CardHeader><CardTitle>Say these 3 words first</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-2xl font-semibold tracking-wide">{fullConsent.words.join(" · ")}</p><p className="text-muted-foreground text-sm">{expired ? "These words have expired. Get fresh words before recording." : `Valid until ${new Date(fullConsent.words_expire_at).toLocaleTimeString("en-GB")}.`}</p>{workspace.preview ? <p className="text-muted-foreground text-sm">Preview only — the client records these words from their own account.</p> : <div className="flex flex-wrap gap-3"><ActionForm action={newCustomerConsentWordsAction} hidden={{ consent_id: fullConsent.id }} label="New words" pendingLabel="Picking…" variant="outline" size="sm" /></div>}</CardContent></Card> : null}
    {pending && !workspace.preview && !expired && supabase ? <Card><CardHeader><CardTitle>Record or upload your clip</CardTitle></CardHeader><CardContent><ConsentUpload consentId={fullConsent.id} supabaseUrl={supabase.url} supabaseKey={supabase.publishableKey} prepare={prepareCustomerConsentUploadAction} confirm={confirmCustomerConsentUploadAction} /></CardContent></Card> : null}
    {videoUrl ? <Card><CardHeader><CardTitle>Your recording</CardTitle></CardHeader><CardContent><video src={videoUrl} controls playsInline className="aspect-[9/16] w-full max-w-[320px] rounded-xl bg-black" /></CardContent></Card> : null}
    {fullConsent.clip_path ? <Card><CardHeader><CardTitle>Automatic recording checks {checks ? (checks.passed ? "— passed" : "— reshoot needed") : "— pending"}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-muted-foreground text-sm">{clipCheckStatusLine(fullConsent)}</p>{checks ? <ul className="space-y-1 text-sm">{checks.checks.map((check) => <li key={check.code} className={check.passed ? "" : "text-destructive"}>{check.passed ? "✓" : "✗"} {check.label}: {check.value}{check.tip ? ` — ${check.tip}` : ""}</li>)}</ul> : null}{pending && !workspace.preview && fullConsent.clip_path ? <ActionForm action={recheckCustomerConsentAction} hidden={{ consent_id: fullConsent.id }} label="Run checks again" pendingLabel="Checking…" variant="outline" size="sm" /> : null}</CardContent></Card> : null}
    <RecordingGuide />
  </div>;
}

function Intro() {
  return <div><p className="text-muted-foreground text-sm">Camera, microphone and digital twin consent</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Consent & recording</h1><p className="text-muted-foreground mt-2 text-sm">Record one short clip in a quiet, well-lit place. We will show the checks before the team reviews it.</p></div>;
}

function PreviewCard({ text }: { text: string }) {
  return <Card className="border-amber-300/20 bg-amber-300/[0.08]"><CardContent className="py-6"><p className="text-sm text-amber-100"><strong>Preview mode:</strong> {text}</p></CardContent></Card>;
}
