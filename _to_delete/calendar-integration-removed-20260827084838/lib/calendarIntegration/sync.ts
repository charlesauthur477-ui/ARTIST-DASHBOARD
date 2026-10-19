import "server-only";
import { decryptToken, encryptToken } from "@/lib/calendarIntegration/tokenCrypto";
import { GoogleAuthError, getGoogleFreeBusy, refreshGoogleAccessToken } from "@/lib/calendarIntegration/google";
import { parseIcsBusyPeriods } from "@/lib/calendarIntegration/ics";
import { replaceSyncedCalendarEvents } from "@/lib/repositories/calendar";
import { setConnectionSyncResult, setConnectionTokens } from "@/lib/repositories/calendarConnections";
import type { schema } from "@/lib/db";

type CalendarConnectionRow = typeof schema.calendarConnections.$inferSelect;

// ---------------------------------------------------------------------------
// Sync orchestration — Calendar Integration Phase 1.
//
// One entry point, syncConnection(), dispatches by provider and always
// ends by writing a result (lastSyncedAt/lastSyncStatus/lastSyncError) back
// onto the connection row — every caller (the OAuth callback's initial
// sync, the artist's "Sync now" button, and the cron route in
// app/api/cron/sync-calendars/route.ts) goes through this same function,
// so sync behavior/error handling only lives in one place. See "H. SYNC" in
// CALENDAR_INTEGRATION.md for the on-demand vs. scheduled design.
//
// SYNC_WINDOW_DAYS bounds how far ahead we ask Google/ICS for busy periods
// — matches the horizon the public booking form realistically needs
// (artists booking further than ~6 months out is rare for this platform,
// and a shorter window keeps each sync cheap).
// ---------------------------------------------------------------------------

const SYNC_WINDOW_DAYS = 180;

export class CalendarReconnectRequiredError extends Error {}

/**
 * Decrypts the connection's stored access token, transparently refreshing
 * (and persisting the new token) if it's expired or about to expire.
 * Shared by the sync path and by "list my Google calendars" (the picker
 * shown when an artist has more than one calendar) so token-refresh logic
 * only lives in one place.
 */
export async function getValidGoogleAccessToken(connection: CalendarConnectionRow): Promise<string> {
  if (!connection.accessTokenEnc) {
    throw new CalendarReconnectRequiredError("This Google Calendar connection is missing its access token — please reconnect.");
  }
  const expiresAt = connection.tokenExpiresAt ? new Date(connection.tokenExpiresAt) : null;
  const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 60_000;
  if (!needsRefresh) return decryptToken(connection.accessTokenEnc);

  if (!connection.refreshTokenEnc) {
    throw new CalendarReconnectRequiredError("This Google Calendar connection has expired — please reconnect.");
  }
  try {
    const refreshed = await refreshGoogleAccessToken(decryptToken(connection.refreshTokenEnc));
    await setConnectionTokens(connection.id, {
      accessTokenEnc: encryptToken(refreshed.access_token),
      tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      // Google does not always re-issue a refresh_token on refresh — only overwrite if it did.
      refreshTokenEnc: refreshed.refresh_token ? encryptToken(refreshed.refresh_token) : undefined,
    });
    return refreshed.access_token;
  } catch (err) {
    if (err instanceof GoogleAuthError) {
      throw new CalendarReconnectRequiredError("Google access was revoked or expired — please reconnect.");
    }
    throw err;
  }
}

async function syncGoogleConnection(connection: CalendarConnectionRow): Promise<void> {
  if (!connection.externalCalendarId) {
    throw new Error("This Google Calendar connection is missing required data — please reconnect.");
  }

  const accessToken = await getValidGoogleAccessToken(connection);
  const timeMin = new Date();
  const timeMax = new Date(Date.now() + SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const busy = await getGoogleFreeBusy(accessToken, connection.externalCalendarId, timeMin, timeMax);

  await replaceSyncedCalendarEvents(
    connection.artistId,
    connection.id,
    "google_calendar",
    busy.map((period) => ({
      startAt: new Date(period.start),
      endAt: new Date(period.end),
      // freeBusy periods carry no provider event id — synthesize a stable
      // dedup key from the calendar + range so repeat syncs are idempotent.
      externalEventUid: `google:${connection.externalCalendarId}:${period.start}:${period.end}`,
    }))
  );
}

async function syncIcsConnection(connection: CalendarConnectionRow): Promise<void> {
  if (!connection.icsSubscriptionUrl) {
    throw new Error("This calendar subscription is missing its URL — please reconnect.");
  }

  const res = await fetch(connection.icsSubscriptionUrl, { headers: { Accept: "text/calendar" } });
  if (!res.ok) throw new Error(`Could not fetch the calendar subscription (HTTP ${res.status}).`);
  const raw = await res.text();

  let parsed;
  try {
    parsed = parseIcsBusyPeriods(raw);
  } catch {
    throw new Error("That calendar subscription returned a file we couldn't read (malformed ICS).");
  }
  if (parsed.events.length === 0 && !raw.includes("BEGIN:VCALENDAR")) {
    throw new Error("That URL did not return a valid calendar (ICS) file.");
  }

  const windowEnd = new Date(Date.now() + SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const inWindow = parsed.events.filter((e) => e.end >= new Date() && e.start <= windowEnd);

  await replaceSyncedCalendarEvents(
    connection.artistId,
    connection.id,
    "apple_ics",
    inWindow.map((period, i) => ({
      startAt: period.start,
      endAt: period.end,
      externalEventUid: `ics:${connection.id}:${period.start.toISOString()}:${i}`,
    }))
  );
}

export async function syncConnection(connection: CalendarConnectionRow): Promise<{ success: boolean; error: string | null }> {
  try {
    if (connection.provider === "google") await syncGoogleConnection(connection);
    else await syncIcsConnection(connection);

    await setConnectionSyncResult(connection.id, { status: "connected", error: null });
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed for an unknown reason.";
    const status = err instanceof CalendarReconnectRequiredError ? "error" : connection.status === "connected" ? "connected" : "error";
    await setConnectionSyncResult(connection.id, { status, error: message });
    return { success: false, error: message };
  }
}
