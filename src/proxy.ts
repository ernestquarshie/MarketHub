import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic auth redirect: signed-out visitors to protected areas go to /login.
 * This only checks that a session cookie exists; real authorization (role, ownership)
 * happens in each layout, page and server action via src/server/auth/policy.ts.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/seller/apply") return NextResponse.next();
  if (!getSessionCookie(request)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/seller/:path*", "/admin/:path*"],
};
