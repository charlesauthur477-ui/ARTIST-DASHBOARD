import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireArtistSession } from "@/lib/artist/session";
import { logActivity } from "@/lib/admin/activity";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { exchangeGoogleAuthCode, getGoogleAccountEmail, listGoogleCalendars } from "@/lib/calendarIntegration/google";
import { encryptToken } from "@/lib/calendarIntegration/tokenCrypto";
import { upsertGoogleConnection } from "@/lib/repositories/calendarConnections";
import { syncConnection } from "@/lib/calendarIntegration/sync";

const STATE_COOKIE = "artist-google-oauth-state";

// ---------------------------------------------------------------------------
// Google OAuth callback. requireArtistSession() re-derives the artist
// identity from the session cookie set at connect-time — the flow only
// ever writes a calendar_connections row for the artist who initiated it,
// never anything read from the OAuth response itself.
// ---------------------------------------------------------------------------

function errorRedirect(request: Request, code: string) {
  return NextResponse.redirect(new URL(`/artist/availability?calendarError=${code}`, request.url));
}

export async function GET(request: Request) {
  const user = await requireArtistSession();
  const artist = await getArtistRowById(user.artistId);
  if (!artist) return errorRedirect(request, "artist_not_found");

  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const expectedState = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE);

  if (oauthError) {
    // "access_denied" is Google's code for the artist clicking Cancel on the consent screen.
    return errorRedirect(request, oauthError === "access_denied" ? "google_denied" : "google_oauth_error");
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return errorRedirect(request, "google_invalid_state");
  }

  try {
    const tokens = await exchangeGoogleAuthCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const [calendars, email] = await Promise.all([
      listGoogleCalendars(tokens.access_token),
      getGoogleAccountEmail(tokens.access_token),
    ]);
    const primary = calendars.find((c) => c.primary) ?? calendars[0];
    if (!primary) return errorRedirect(request, "google_no_calendars");

    const connection = await upsertGoogleConnection({
      artistId: user.artistId,
      accessTokenEnc: encryptToken(tokens.access_token),
      refreshTokenEnc: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
      tokenExpiresAt: expiresAt,
      scope: tokens.scope,
      externalAccountEmail: email,
      externalCalendarId: primary.id,
      externalCalendarLabel: primary.summary,
    });

    await syncConnection(connection);

    await logActivity({
      actorAdminUserId: null,
      action: "calendar.connected",
      entityType: "artist",
      entityId: user.artistId,
      summary: `${artist.stageName || artist.name} connected Google Calendar via the artist portal.`,
    });

    return NextResponse.redirect(new URL("/artist/availability?calendarConnected=google", request.url));
  } catch (err) {
    console.error("[calendar/google/callback] connect failed", err);
    return errorRedirect(request, "google_connect_failed");
  }
}
