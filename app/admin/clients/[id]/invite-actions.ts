"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSiteUrl } from "@/lib/config";
import { isAdminEmail } from "@/lib/admin";
import { PlainError, type ActionState } from "@/lib/plain-error";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ email: z.email().max(254) });

export async function inviteClientAction(brandId: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { status: "error", message: "Enter the client’s valid email address." };
  if (isAdminEmail(parsed.data.email)) return { status: "error", message: "Use a non-admin email for the client account." };

  try {
    const db = createAdminClient();
    const { data: brand, error: brandError } = await db.from("brands").select("id, name").eq("id", brandId).maybeSingle();
    if (brandError || !brand) throw new PlainError("Client not found.");
    const { data, error } = await db.auth.admin.inviteUserByEmail(parsed.data.email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
    });
    if (error || !data.user) throw new Error(error?.message ?? "No invited user returned.");

    // Keep the FK valid even if the profile trigger is delayed, then make this
    // brand visible only to the invited customer after they sign in.
    const { error: profileError } = await db.from("profiles").upsert(
      { id: data.user.id, email: parsed.data.email, role: "customer" },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;
    const { error: linkError } = await db.from("brands").update({ owner_id: data.user.id, contact_email: parsed.data.email }).eq("id", brandId);
    if (linkError) throw linkError;
    revalidatePath(`/admin/clients/${brandId}`);
    return { status: "ok", message: `Invite sent to ${parsed.data.email}. They can open the client dashboard from the email.` };
  } catch (error) {
    console.error("[admin] client invite failed:", error instanceof Error ? error.message : error);
    return { status: "error", message: "The invite could not be sent. Check the email provider and try again." };
  }
}
