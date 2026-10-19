import "server-only";
import { getSiteOrigin } from "@/lib/calendarIntegration/siteUrl";

// ---------------------------------------------------------------------------
// Google Calendar integration — plain fetch() against Google's REST/OAuth
// endpoints rather than the `googleapis` SDK. This project has zero Google
// dependencies today; for the narrow set of calls Phase 1 needs (token
// exchange/refresh/revoke, list calendars, freeBusy query), a small
// hand-written client is far less surface area than pulling in the full
// SDK, and keeps every request explicit and auditable.
//
// Scope is deliberately read-only (calendar.freebusy + calendar.readonly):
// Phase 1 only needs to KNOW when the artist is busy, never event details,
// and never needs to write to their calendar (see CALENDAR_INTEGRATION.md
// for why "push confirmed bookings to Google" is ICS-first in Phase 1).
// Least-privilege on purpose — an artist reviewing the Google consent
// screen sees "view your calendars", not "manage your calendar".
// ---------------------------------------------------------------------------

const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "openid",
  "email",
].join(" ");

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
}

/** Returns null (never throws) when Google OAuth isn't configured — callers use this to hide the UI/no-op gracefully. */
export function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export async function getGoogleRedirectUri(): Promise<string> {
  const configured = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (configured) return configured;
  const origin = await getSiteOrigin();
  return `${origin}/api/artist/calendar/google/callback`;
}

export async function buildGoogleAuthUrl(state: string): Promise<string | null> {
  const config = getGoogleOAuthConfig();
  if (!config) return null;
  const redirectUri = await getGoogleRedirectUri();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES,
    access_type: "offline", // required to receive a refresh_token
    prompt: "consent select_account", // "consent" ensures a refresh_token is issued even on a repeat connect
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export class GoogleAuthError extends Error {}

export async function exchangeGoogleAuthCode(code: string): Promise<GoogleTokenResponse> {
  const config = getGoogleOAuthConfig();
  if (!config) throw new Error("Google Calendar is not configured on this server.");
  const redirectUri = await getGoogleRedirectUri();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new GoogleAuthError(`Google token exchange failed (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const config = getGoogleOAuthConfig();
  if (!config) throw new Error("Google Calendar is not configured on this server.");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    // invalid_grant means the refresh token was revoked/expired — the
    // caller (sync.ts) treats this specially: mark the connection as
    // needing reconnection rather than a transient sync error.
    throw new GoogleAuthError(`Google token refresh failed (${res.status}): ${body}`);
  }
  return res.json();
}

export async function revokeGoogleToken(token: string): Promise<void> {
  // Best-effort — a disconnect must succeed locally even if Google's revoke
  // endpoint is unreachable or the token was already invalid.
  try {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });
  } catch (err) {
    console.error("[calendarIntegration/google] revoke failed (continuing with local disconnect)", err);
  }
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
}

export async function listGoogleCalendars(accessToken: string): Promise<GoogleCalendarListEntry[]> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=freeBusyReader", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to list Google calendars (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return (data.items ?? []).map((item: { id: string; summary?: string; primary?: boolean }) => ({
    id: item.id,
    summary: item.summary ?? item.id,
    primary: item.primary,
  }));
}

/** For display only ("Connected as name@gmail.com") — never used as an identifier for authorization. */
export async function getGoogleAccountEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.email === "string" ? data.email : null;
  } catch {
    return null;
  }
}

export interface BusyPeriod {
  start: string; // ISO
  end: string; // ISO
}

/**
 * Google's freeBusy endpoint by construction never returns event titles or
 * any other details — only busy time ranges. This is what makes
 * "busy_only" the privacy-safe default with zero extra filtering logic on
 * our side: we simply never ask Google for anything more than this.
 */
export async function getGoogleFreeBusy(accessToken: string, calendarId: string, timeMin: Date, timeMax: Date): Promise<BusyPeriod[]> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    }),
  });
  if (!res.ok) throw new Error(`Google freeBusy query failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const calendar = data.calendars?.[calendarId];
  if (calendar?.errors?.length) {
    throw new Error(`Google freeBusy returned an error for this calendar: ${JSON.stringify(calendar.errors)}`);
  }
  return (calendar?.busy ?? []) as BusyPeriod[];
}
