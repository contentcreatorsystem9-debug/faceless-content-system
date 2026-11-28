"use server";

import { idempotencyKeys, tasks } from "@trigger.dev/sdk";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { readEnv } from "@/lib/config";
import { confirmUpload, newWords, prepareUpload, runClipCheckJob, startConsent } from "@/lib/consent-flow";
import { createClipStorage, createConsentStore } from "@/lib/consent-store";
import { PlainError, type ActionState } from "@/lib/plain-error";
import { createClient } from "@/lib/supabase/server";
import { isClientPreview } from "@/lib/customer-preview";
import type { checkClipTask } from "@/trigger/check-clip";

const idleFailure = "Something went wrong. Please try again in a minute.";
const reviewSchema = z.object({
  video_id: z.string().uuid(),
  decision: z.enum(["approve", "redo", "skip"]),
  reason: z.string().max(80).optional(),
  note: z.string().max(500).optional(),
});
const reasonValues = ["wrong_words", "does_not_look_like_me", "wrong_topic", "captions", "music", "other"] as const;
const consentStartSchema = z.object({
  legal_name: z.string().trim().min(3).max(120),
  agree: z.literal("on"),
});

function formText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function friendly(error: unknown): string {
  return error instanceof PlainError ? error.message : idleFailure;
}

export async function reviewVideoAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser("/dashboard/review");
  if (await isClientPreview()) return { status: "error", message: "Preview mode is read-only." };
  const parsed = reviewSchema.safeParse({
    video_id: formText(formData, "video_id"),
    decision: formText(formData, "decision"),
    reason: formText(formData, "reason") || undefined,
    note: formText(formData, "note") || undefined,
  });
  if (!parsed.success) return { status: "error", message: "Choose a valid review action." };
  if (parsed.data.decision === "redo" && !reasonValues.includes(parsed.data.reason as (typeof reasonValues)[number])) {
    return { status: "error", message: "Choose a reason so the team knows what to fix." };
  }
  if (parsed.data.decision !== "redo" && parsed.data.reason) {
    return { status: "error", message: "That review action is not valid." };
  }

  try {
    const db = await createClient();
    const { data, error } = await db.rpc("customer_review_video", {
      p_video_id: parsed.data.video_id,
      p_decision: parsed.data.decision,
      p_reason: parsed.data.reason ?? null,
      p_note: parsed.data.note ?? null,
    });
    if (error) throw error;
    const outcome = (data as { outcome?: string } | null)?.outcome;
    const messages: Record<string, ActionState> = {
      approved: { status: "ok", message: "Approved. This video is now in your library." },
      redo_requested: { status: "ok", message: "Redo requested. The team will prepare another version." },
      skipped: { status: "ok", message: "Skipped. This video will not be used." },
      already_reviewed: { status: "error", message: "This video has already been reviewed." },
      not_allowed: { status: "error", message: "This video is no longer available for review." },
      bad_input: { status: "error", message: "Choose a valid review action." },
      not_authenticated: { status: "error", message: "Please sign in again." },
    };
    const result = messages[outcome ?? ""] ?? { status: "error", message: idleFailure };
    if (result.status === "ok") {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/review");
      revalidatePath("/dashboard/library");
      revalidatePath("/dashboard/calendar");
    }
    return result;
  } catch {
    return { status: "error", message: idleFailure };
  }
}

async function ownedBrand() {
  const user = await requireUser("/dashboard/consent");
  if (await isClientPreview()) throw new PlainError("Preview mode is read-only.");
  const db = await createClient();
  const { data, error } = await db.from("brands").select("id, name").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;
  if (!data) throw new PlainError("Your client workspace is not ready yet.");
  return { user, brand: data };
}

async function ownConsent(consentId: string) {
  if (!z.string().uuid().safeParse(consentId).success) throw new PlainError("Consent not found.");
  const { user, brand } = await ownedBrand();
  const store = createConsentStore();
  const consent = await store.getConsent(consentId);
  if (!consent || consent.brand_id !== brand.id) throw new PlainError("Consent not found.");
  return { user, brand, consent, store };
}

async function requestInfo() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null,
    userAgent: h.get("user-agent"),
  };
}

export async function startCustomerConsentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = consentStartSchema.safeParse({ legal_name: formText(formData, "legal_name"), agree: formText(formData, "agree") });
  if (!parsed.success) return { status: "error", message: "Enter the full name and tick the consent box." };
  try {
    const { user, brand } = await ownedBrand();
    const info = await requestInfo();
    await startConsent(
      { brandId: brand.id, legalName: parsed.data.legal_name, agreed: true, ip: info.ip, userAgent: info.userAgent, clientEmail: user.email },
      { store: createConsentStore() },
    );
  } catch (error) {
    return { status: "error", message: friendly(error) };
  }
  revalidatePath("/dashboard/consent");
  redirect("/dashboard/consent");
}

export type CustomerUploadTicket = { ok: true; path: string; token: string } | { ok: false; message: string };

export async function prepareCustomerConsentUploadAction(
  consentId: string,
  file: { name: string; type: string; size: number },
): Promise<CustomerUploadTicket> {
  try {
    const { consent } = await ownConsent(consentId);
    const ticket = await prepareUpload(consent.id, file, { store: createConsentStore(), storage: createClipStorage() });
    return { ok: true, ...ticket };
  } catch (error) {
    return { ok: false, message: friendly(error) };
  }
}

async function runCustomerChecks(consentId: string): Promise<ActionState> {
  const { consent, store } = await ownConsent(consentId);
  if (!consent.clip_path) throw new PlainError("Upload or record the clip first.");
  await store.updateConsent(consent.id, { clip_check_status: "pending", clip_check_error: null }, true);
  if (readEnv("TRIGGER_SECRET_KEY")) {
    const idempotencyKey = await idempotencyKeys.create([consent.id, consent.clip_path], { scope: "global" });
    await tasks.trigger<typeof checkClipTask>("check-clip", { consentId: consent.id, clipPath: consent.clip_path }, { idempotencyKey, idempotencyKeyTTL: "10m" });
    return { status: "ok", message: "Recording uploaded. Automatic checks are running; refresh this page in a minute." };
  }
  const outcome = await runClipCheckJob(consent.id, consent.clip_path, { store, storage: createClipStorage() });
  if (outcome.status === "done" && outcome.passed) return { status: "ok", message: "Recording uploaded and all automatic checks passed." };
  if (outcome.status === "done") return { status: "error", message: "Recording uploaded, but a reshoot is needed. See the tips below." };
  return { status: "error", message: "The recording checks could not finish. Please try again." };
}

export async function confirmCustomerConsentUploadAction(consentId: string, objectPath: string): Promise<ActionState> {
  try {
    await ownConsent(consentId);
    await confirmUpload(consentId, objectPath, { store: createConsentStore(), storage: createClipStorage() });
    const result = await runCustomerChecks(consentId);
    revalidatePath("/dashboard/consent");
    return result;
  } catch (error) {
    return { status: "error", message: friendly(error) };
  }
}

export async function newCustomerConsentWordsAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const consentId = formText(formData, "consent_id");
  try {
    const { consent, store } = await ownConsent(consentId ?? "");
    await newWords(consent.id, { store });
    revalidatePath("/dashboard/consent");
    return { status: "ok", message: "New recording words are ready for 30 minutes." };
  } catch (error) {
    return { status: "error", message: friendly(error) };
  }
}

export async function recheckCustomerConsentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const consentId = formText(formData, "consent_id");
    const result = await runCustomerChecks(consentId ?? "");
    revalidatePath("/dashboard/consent");
    return result;
  } catch (error) {
    return { status: "error", message: friendly(error) };
  }
}
