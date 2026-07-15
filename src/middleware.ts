import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Lightweight session check — avoid importing next-auth/prisma into Edge (Vercel 1MB limit). */
function hasSession(req: NextRequest): boolean {
  return Boolean(
    req.cookies.get("authjs.session-token")?.value ||
      req.cookies.get("__Secure-authjs.session-token")?.value ||
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value
  );
}

export function middleware(req: NextRequest) {
  const isLoggedIn = hasSession(req);
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/login")) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/items/:path*",
    "/purchases/:path*",
    "/sales/:path*",
    "/suppliers/:path*",
    "/customers/:path*",
    "/companies/:path*",
    "/banks/:path*",
    "/reports/:path*",
    "/users/:path*",
  ],
};
