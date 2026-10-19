import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireArtistSession } from "@/lib/artist/session";
import { buildGoogleAuthUrl } from "@/lib/calendarIntegration/google";

// ---------------------------------------------------------------------------
// Kicks off the Google OAuth connect flow for the SIGNED-IN artist.
// requireArtistSession() both authenticates and is where the artistId this
// whole flow operates on comes from — it is never read from a query
// param, so there's no "connect calendar for artistId=..." to tamper with.
//
// The `state` value is a random nonce stored in a short-lived, httpOnly
// cookie and re-checked in the callback route — standard OAuth CSRF
// protection (an attacker who tricks an artist into visiting a forged
// callback URL can't complete a connection without also controlling this
// cookie).
// ---------------------------------------------------------------------------

const STATE_COOKIE = "artist-google-oauth-state";

export async function GET(request: Request) {
  await requireArtistSession(); // redirects to /artist/login if not signed in

  const state = crypto.randomUUID();
  const authUrl = await buildGoogleAuthUrl(state);
  if (!authUrl) {
    return NextResponse.redirect(new URL("/artist/availability?calendarError=google_not_configured", request.url));
  }

  const store = await cookies();
  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return NextResponse.redirect(authUrl);
}
