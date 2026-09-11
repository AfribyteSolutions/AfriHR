import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSubdomain } from "@/lib/getSubdomain";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith("/api") || pathname.startsWith("/_next/") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const hostname = req.headers.get("host") || "";
  const subdomain = hostname === "www.afrihrm.com" ? null : getSubdomain(hostname);
  const response = NextResponse.next();
  response.headers.set("x-subdomain", subdomain || "");
  response.cookies.set("subdomain", subdomain || "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  // Base44 owns the authenticated session. Client-side protected shells validate
  // base44.auth.me(); legacy Firebase cookies are intentionally no longer trusted.
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
