"use server";

import { revalidatePath } from "next/cache";
import { requireArtistSessionForAction } from "@/lib/artist/session";
import { logActivity } from "@/lib/admin/activity";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import {
  disconnectConnection,
  getConnection,
  getConnectionForArtist,
  setConnectionPrivacyMode,
  upsertIcsConnection,
} from "@/lib/repositories/calendarConnections";
import { deleteCalendarEventsForConnection } from "@/lib/repositories/calendar";
import { syncConnection, getValidGoogleAccessToken } from "@/lib/calendarIntegration/sync";
import { listGoogleCalendars, revokeGoogleToken } from "@/lib/calendarIntegration/google";
import { decryptToken } from "@/lib/calendarIntegration/tokenCrypto";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Artist Portal Calendar Integration Server Actions — Phase 1.
//
// Same authorization shape as every other artist-scoped action in this
// codebase: requireArtistSessionForAction() first, and every subsequent
// lookup is scoped to that session's artistId (never a client-supplied
// one). A connectionId passed in from a form is always re-verified against
// the session's artistId via getConnectionForArtist() before use — an
// artist can never act on another artist's connection by guessing/tampering
// with an id, the same "getBookingByIdForArtist returns null, not another
// artist's row" pattern already used for bookings/calendar events.
// ---------------------------------------------------------------------------

export interface CalendarIntegrationActionState {
  error: string | null;
}

export async function artistSyncCalendarNowAction(connectionId: string): Promise<CalendarIntegrationActionState> {
  const user = await requireArtistSessionForAction();
  const connection = await getConnectionForArtist(connectionId, user.artistId);
  if (!connection) return { error: "Calendar connection not found." };

  const result = await syncConnection(connection);
  if (!result.success) {
    await logActivity({
      actorAdminUserId: null,
      action: "calendar.sync_failed",
      entityType: "artist",
      entityId: user.artistId,
      summary: `Calendar sync failed for connection ${connection.provider}: ${result.error}`,
    });
  }

  revalidatePath("/artist/availability");
  revalidatePath("/admin");
  return { error: result.error };
}

export async function artistDisconnectCalendarAction(connectionId: string): Promise<CalendarIntegrationActionState> {
  const user = await requireArtistSessionForAction();
  const artist = await getArtistRowById(user.artistId);
  if (!artist) return { error: "Artist profile not found." };
  const connection = await getConnectionForArtist(connectionId, user.artistId);
  if (!connection) return { error: "Calendar connection not found." };

  if (connection.provider === "google" && connection.accessTokenEnc) {
    await revokeGoogleToken(decryptToken(connection.accessTokenEnc));
  }
  await deleteCalendarEventsForConnection(connection.id);
  await disconnectConnection(connection.id);

  await logActivity({
    actorAdminUserId: null,
    action: "calendar.disconnected",
    entityType: "artist",
    entityId: user.artistId,
    summary: `${artist.stageName || artist.name} disconnected their ${connection.provider === "google" ? "Google" : "Apple/iCloud"} calendar via the artist portal.`,
  });

  revalidatePath("/artist/availability");
  revalidatePath("/admin");
  return { error: null };
}

export interface GoogleCalendarOption {
  id: string;
  label: string;
  primary?: boolean;
}

/** Powers the "which calendar should we use" picker — only meaningful once a Google connection already exists. */
export async function artistListGoogleCalendarsAction(): Promise<{ calendars: GoogleCalendarOption[]; error: string | null }> {
  const user = await requireArtistSessionForAction();
  const connection = await getConnection(user.artistId, "google");
  if (!connection) return { calendars: [], error: "Google Calendar is not connected." };

  try {
    const accessToken = await getValidGoogleAccessToken(connection);
    const calendars = await listGoogleCalendars(accessToken);
    return { calendars: calendars.map((c) => ({ id: c.id, label: c.summary, primary: c.primary })), error: null };
  } catch (err) {
    return { calendars: [], error: err instanceof Error ? err.message : "Could not load your Google calendars." };
  }
}

export async function artistSetGoogleCalendarAction(calendarId: string, calendarLabel: string): Promise<CalendarIntegrationActionState> {
  const user = await requireArtistSessionForAction();
  const connection = await getConnection(user.artistId, "google");
  if (!connection) return { error: "Google Calendar is not connected." };

  const db = getDb();
  await db
    .update(schema.calendarConnections)
    .set({ externalCalendarId: calendarId, externalCalendarLabel: calendarLabel, updatedAt: new Date() })
    .where(eq(schema.calendarConnections.id, connection.id));

  const result = await syncConnection({ ...connection, externalCalendarId: calendarId, externalCalendarLabel: calendarLabel });
  revalidatePath("/artist/availability");
  return { error: result.error };
}

export async function artistConnectIcsAction(url: string): Promise<CalendarIntegrationActionState> {
  const user = await requireArtistSessionForAction();
  const artist = await getArtistRowById(user.artistId);
  if (!artist) return { error: "Artist profile not found." };

  const trimmed = url.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { error: "Please enter a valid calendar subscription URL." };
  }
  if (!["http:", "https:", "webcal:"].includes(parsed.protocol)) {
    return { error: "That doesn't look like a calendar subscription URL." };
  }
  // webcal:// is the conventional scheme calendar apps hand out for ICS
  // subscriptions — functionally identical to https:// for a plain fetch.
  const fetchableUrl = parsed.protocol === "webcal:" ? trimmed.replace(/^webcal:/, "https:") : trimmed;

  const connection = await upsertIcsConnection(user.artistId, fetchableUrl);
  const result = await syncConnection(connection);

  if (result.success) {
    await logActivity({
      actorAdminUserId: null,
      action: "calendar.connected",
      entityType: "artist",
      entityId: user.artistId,
      summary: `${artist.stageName || artist.name} connected an Apple/iCloud calendar subscription via the artist portal.`,
    });
  }

  revalidatePath("/artist/availability");
  revalidatePath("/admin");
  return { error: result.error };
}

export async function artistSetCalendarPrivacyModeAction(connectionId: string, mode: "busy_only" | "detailed"): Promise<CalendarIntegrationActionState> {
  const user = await requireArtistSessionForAction();
  const connection = await getConnectionForArtist(connectionId, user.artistId);
  if (!connection) return { error: "Calendar connection not found." };
  // Phase 1 only ever syncs busy-only data (see sync.ts) — "detailed" is
  // stored as a preference for a future phase but has no effect yet.
  if (mode === "detailed") {
    return { error: "Detailed sync is planned for a future update — busy/available only is the only mode available right now." };
  }
  await setConnectionPrivacyMode(connectionId, mode);
  return { error: null };
}

export async function artistRegenerateCalendarFeedTokenAction(): Promise<CalendarIntegrationActionState> {
  const user = await requireArtistSessionForAction();
  const db = getDb();
  await db
    .update(schema.artistUsers)
    .set({ calendarFeedToken: crypto.randomUUID(), updatedAt: new Date() })
    .where(eq(schema.artistUsers.id, user.artistUserId));
  revalidatePath("/artist/availability");
  return { error: null };
}
