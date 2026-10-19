import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

// ---------------------------------------------------------------------------
// calendar_connections repository — Calendar Integration Phase 1. Mirrors
// the shape of lib/repositories/artistUsers.ts / lib/repositories/calendar.ts:
// a thin data-access layer, all authorization happens one level up in
// lib/artist/calendarIntegrationActions.ts (never here, never trusting a
// caller-supplied artistId beyond what that layer already verified).
// ---------------------------------------------------------------------------

export type CalendarConnectionProvider = (typeof schema.calendarConnectionProviderEnum.enumValues)[number];
export type CalendarConnectionStatus = (typeof schema.calendarConnectionStatusEnum.enumValues)[number];

export async function listConnectionsForArtist(artistId: string) {
  const db = getDb();
  return db.select().from(schema.calendarConnections).where(eq(schema.calendarConnections.artistId, artistId));
}

export async function getConnection(artistId: string, provider: CalendarConnectionProvider) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.calendarConnections)
    .where(and(eq(schema.calendarConnections.artistId, artistId), eq(schema.calendarConnections.provider, provider)))
    .limit(1);
  return row ?? null;
}

/** Ownership check for any connection-id-scoped action (sync now, disconnect, etc.) — returns null rather than someone else's row. */
export async function getConnectionForArtist(connectionId: string, artistId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.calendarConnections)
    .where(and(eq(schema.calendarConnections.id, connectionId), eq(schema.calendarConnections.artistId, artistId)))
    .limit(1);
  return row ?? null;
}

export interface UpsertGoogleConnectionInput {
  artistId: string;
  accessTokenEnc: string;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date;
  scope: string;
  externalAccountEmail: string | null;
  externalCalendarId: string;
  externalCalendarLabel: string;
}

/**
 * One artist may only ever have one "google" row (enforced by the DB's
 * unique (artist_id, provider) index too) — reconnecting replaces the
 * previous tokens rather than creating a second row.
 */
export async function upsertGoogleConnection(input: UpsertGoogleConnectionInput) {
  const db = getDb();
  const existing = await getConnection(input.artistId, "google");
  const values = {
    artistId: input.artistId,
    provider: "google" as const,
    status: "connected" as const,
    accessTokenEnc: input.accessTokenEnc,
    // A refresh token is only issued on first consent (or when prompt=consent
    // forces re-consent) — if Google didn't send a new one this time, keep
    // the previously stored one rather than clobbering it with null.
    refreshTokenEnc: input.refreshTokenEnc ?? existing?.refreshTokenEnc ?? null,
    tokenExpiresAt: input.tokenExpiresAt,
    scope: input.scope,
    externalAccountEmail: input.externalAccountEmail,
    externalCalendarId: input.externalCalendarId,
    externalCalendarLabel: input.externalCalendarLabel,
    lastSyncStatus: "never" as const,
    lastSyncError: null,
    updatedAt: new Date(),
  };
  if (existing) {
    await db.update(schema.calendarConnections).set(values).where(eq(schema.calendarConnections.id, existing.id));
    return { ...existing, ...values };
  }
  const [row] = await db.insert(schema.calendarConnections).values(values).returning();
  return row;
}

export async function upsertIcsConnection(artistId: string, icsSubscriptionUrl: string) {
  const db = getDb();
  const existing = await getConnection(artistId, "apple_ics");
  const values = {
    artistId,
    provider: "apple_ics" as const,
    status: "connected" as const,
    icsSubscriptionUrl,
    lastSyncStatus: "never" as const,
    lastSyncError: null,
    updatedAt: new Date(),
  };
  if (existing) {
    await db.update(schema.calendarConnections).set(values).where(eq(schema.calendarConnections.id, existing.id));
    return { ...existing, ...values };
  }
  const [row] = await db.insert(schema.calendarConnections).values(values).returning();
  return row;
}

export async function setConnectionTokens(
  connectionId: string,
  patch: { accessTokenEnc: string; tokenExpiresAt: Date; refreshTokenEnc?: string | null }
) {
  const db = getDb();
  const values: Partial<typeof schema.calendarConnections.$inferInsert> = {
    accessTokenEnc: patch.accessTokenEnc,
    tokenExpiresAt: patch.tokenExpiresAt,
    updatedAt: new Date(),
  };
  if (patch.refreshTokenEnc !== undefined) values.refreshTokenEnc = patch.refreshTokenEnc;
  await db.update(schema.calendarConnections).set(values).where(eq(schema.calendarConnections.id, connectionId));
}

export async function setConnectionSyncResult(connectionId: string, result: { status: CalendarConnectionStatus; error?: string | null }) {
  const db = getDb();
  await db
    .update(schema.calendarConnections)
    .set({
      status: result.status,
      lastSyncedAt: new Date(),
      lastSyncStatus: result.error ? "error" : "success",
      lastSyncError: result.error ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.calendarConnections.id, connectionId));
}

export async function setConnectionPrivacyMode(connectionId: string, privacyMode: "busy_only" | "detailed") {
  const db = getDb();
  await db.update(schema.calendarConnections).set({ privacyMode, updatedAt: new Date() }).where(eq(schema.calendarConnections.id, connectionId));
}

export async function disconnectConnection(connectionId: string) {
  const db = getDb();
  await db
    .update(schema.calendarConnections)
    .set({
      status: "disconnected",
      accessTokenEnc: null,
      refreshTokenEnc: null,
      tokenExpiresAt: null,
      icsSubscriptionUrl: null,
      lastSyncStatus: "never",
      lastSyncError: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.calendarConnections.id, connectionId));
}
