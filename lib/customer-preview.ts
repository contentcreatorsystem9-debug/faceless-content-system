import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/config";

export const CUSTOMER_PREVIEW_COOKIE = "creator-tool-preview-brand";

export async function previewBrandId(): Promise<string | null> {
  return (await cookies()).get(CUSTOMER_PREVIEW_COOKIE)?.value ?? null;
}

export function isPreviewBrandId(value: string | null | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}

export async function isClientPreview(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user?.isAdmin && (isLocalAuthBypassEnabled() || isPreviewBrandId(await previewBrandId())));
}
