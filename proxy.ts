import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken, decode } from "next-auth/jwt";

// Deliberately a literal, NOT an import from lib/artist/session.ts — that
// module is "server-only" and pulls in next/headers + the Drizzle db client
// (getDb/schema), which is exactly the kind of heavier import chain the
// admin branch below already avoids in this file (see its comment: Proxy
// should do a cheap cookie check only, no database access). Keeping this
// name in sync with lib/artist/session.ts's ARTIST_COOKIE_NAME is the
// tradeoff for keeping this file's import graph minimal.
const ARTIST_COOKIE_NAME = "artist-session-token";

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

// ---------------------------------------------------------------------------
// Sprint 5: the artist portal branch, gating /artist/* the same way the
// admin branch above gates /admin/* — a cheap, cookie-only check. It reads
// the artist session cookie directly (req.cookies, not next/headers'
// cookies()) and verifies it with next-auth/jwt's decode() using the same
// salt/secret lib/artist/session.ts signs with, so this never touches the
// database or the admin auth system. Role/is_active is NOT checked here —
// same defense-in-depth split as admin: requireArtistSession()
// (lib/artist/session.ts) re-verifies against artist_users on every
// Server Component/Action.
// ---------------------------------------------------------------------------
// Public, unauthenticated pages under /artist/* — the self-service password
// reset flow (3-day sprint, item 3) has to work for a signed-OUT visitor by
// definition, so both steps must be exempted here the same way /artist/login
// already is. Missing this would make the entire forgot/reset-password
// feature unreachable: every request would get redirected to /artist/login
// before either page's own (correctly public) Server Component ever ran.
const ARTIST_PUBLIC_PATHS = new Set(["/artist/login", "/artist/forgot-password", "/artist/reset-password"]);

async function handleArtistRoute(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/artist/login";
  const isPublicPath = ARTIST_PUBLIC_PATHS.has(pathname);

  const raw = req.cookies.get(ARTIST_COOKIE_NAME)?.value;
  let isSignedIn = false;
  if (raw) {
    try {
      const payload = await decode({ token: raw, secret: process.env.AUTH_SECRET ?? "", salt: ARTIST_COOKIE_NAME });
      isSignedIn = Boolean(payload?.sub);
    } catch {
      isSignedIn = false;
    }
  }

  if (isLoginPage) {
    if (isSignedIn) {
      return NextResponse.redirect(new URL("/artist/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (isPublicPath) {
    // Forgot/reset-password: no redirect either way — a signed-in artist
    // can still legitimately want to reset their password, and the pages
    // themselves already redirect an authenticated visitor to the
    // dashboard (see app/artist/forgot-password/page.tsx and
    // app/artist/reset-password/page.tsx), so no need to duplicate that
    // logic here.
    return NextResponse.next();
  }

  if (!isSignedIn) {
    const loginUrl = new URL("/artist/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/artist")) {
    return handleArtistRoute(req);
  }

  const isLoginPage = pathname === "/admin/login";

  const isSecure = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  const token =
    (await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: isSecure })) ??
    (await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: false }));
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
  matcher: ["/admin/:path*", "/artist/:path*"],
};
