import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSession,
  isAdminAuthConfigured,
  verifyAdminCredentials,
} from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.redirect(new URL("/admin-login?error=config", request.url), 303);
  }

  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.redirect(new URL("/admin-login?error=credentials", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url), 303);
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSession(username),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
