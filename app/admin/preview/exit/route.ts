import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { CUSTOMER_PREVIEW_COOKIE } from "@/lib/customer-preview";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const response = NextResponse.redirect(new URL("/admin/clients", request.url));
  response.cookies.set(CUSTOMER_PREVIEW_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 0 });
  return response;
}
