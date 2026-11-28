import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ClientFeedbackRow = {
  id: string;
  brand_id: string;
  post_id: string | null;
  script_id: string | null;
  customer_id: string;
  kind: "plan_approved" | "plan_change" | "script_approved" | "script_change" | "profile_change";
  message: string | null;
  status: "open" | "resolved";
  created_at: string;
};

export async function listClientFeedback(brandId: string): Promise<ClientFeedbackRow[]> {
  const { data, error } = await createAdminClient()
    .from("client_feedback")
    .select("id, brand_id, post_id, script_id, customer_id, kind, message, status, created_at")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Could not load client requests: ${error.message}`);
  return (data ?? []) as ClientFeedbackRow[];
}

export function feedbackLabel(kind: ClientFeedbackRow["kind"]): string {
  const labels: Record<ClientFeedbackRow["kind"], string> = {
    plan_approved: "Plan approved",
    plan_change: "Plan change requested",
    script_approved: "Script approved",
    script_change: "Script changes requested",
    profile_change: "Profile update requested",
  };
  return labels[kind];
}
