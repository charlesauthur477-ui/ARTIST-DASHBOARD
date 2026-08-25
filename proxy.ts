import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ---------------------------------------------------------------------------
// First gate for /admin/* — PHASE_4_PLAN.md Section 1 / 12.
//
// This is deliberately a CHEAP check, not the only layer: it confirms a
// valid, non-expired session JWT cookie exists and redirects anonymous
// visitors to /admin/login. It does NOT check role/isActive — that's
// re-verified independently by requireAdmin()/requireRole()
// (lib/admin/auth.ts) inside every protected Server Component and Server
// Action, per the explicit "middleware must not be the only security
// layer" requirement. A deactivated admin's session cookie will still pass
// this proxy check, but every actual page/action they try to use will
// reject them.
//
// This reads the JWT directly via next-auth/jwt's getToken() instead of
// going through the full auth() wrapper. auth() re-runs the app's
// `session` callback (lib: auth.ts), which queries admin_users on every
// call — Next.js's own Proxy docs explicitly say Proxy "should ... avoid
// database checks to prevent performance issues" and should only read the
// session from the cookie (see node_modules/next/dist/docs/01-app/
// 02-guides/authentication.md, "Optimistic checks with Proxy (Optional)").
// getToken() only decodes/verifies the signed JWT cookie — no adapter, no
// database, no bcrypt import chain — which is both the officially
// recommended pattern and what resolved the "Proxy file must export a
// function" error (that generic message was masking a real exception
// thrown while the full auth()-wrapped handler's import chain evaluated;
// see the diagnostic test result and PHASE_4 chat history for the
// step-by-step elimination).
// ---------------------------------------------------------------------------

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/admin/login";

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isSignedIn = Boolean(token);

  if (isLoginPage) {
    if (isSignedIn) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  if (!isSignedIn) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
