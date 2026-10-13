import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin-login?logged_out=1", request.url), 303);
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
