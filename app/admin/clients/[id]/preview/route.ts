import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { CUSTOMER_PREVIEW_COOKIE, isPreviewBrandId } from "@/lib/customer-preview";
import { getBrand } from "@/lib/brands";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isPreviewBrandId(id) || !(await getBrand(id))) return new NextResponse("Client not found", { status: 404 });
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set(CUSTOMER_PREVIEW_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60,
  });
  return response;
}
