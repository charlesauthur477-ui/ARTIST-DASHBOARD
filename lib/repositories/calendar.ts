import { and, eq, gte, lte, ne } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

// ---------------------------------------------------------------------------
// Unified artist availability/calendar repository — RAPID BUILD MODE
// Sprint 4. Every date block for an artist (a confirmed platform booking, an
// admin-entered external booking, or a manual tentative/unavailable mark)
// lives in one table (`artist_calendar_events`), so this is the single place
// both the admin calendar UI and the public booking-availability check read
// from. See db/schema.ts for the full column list and rationale.
// ---------------------------------------------------------------------------

export type CalendarEventType = (typeof schema.calendarEventTypeEnum.enumValues)[number];

export interface CalendarEventInput {
  type: CalendarEventType;
  title: string;
  startAt: Date;
  endAt: Date;
  venue?: string;
  city?: string;
  country?: string;
  eventType?: string;
  notes?: string;
  bookingId?: string | null;
  createdByAdminUserId?: string | null;
  createdByArtistUserId?: string | null;
}

export async function listCalendarEventsForArtist(artistId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.artistCalendarEvents)
    .where(eq(schema.artistCalendarEvents.artistId, artistId));
  return rows.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

export async function createCalendarEvent(artistId: string, input: CalendarEventInput) {
  const db = getDb();
  const [row] = await db
    .insert(schema.artistCalendarEvents)
    .values({
      artistId,
      type: input.type,
      title: input.title,
      startAt: input.startAt,
      endAt: input.endAt,
      venue: input.venue ?? "",
      city: input.city ?? "",
      country: input.country ?? "",
      eventType: input.eventType ?? "",
      notes: input.notes ?? "",
      bookingId: input.bookingId ?? null,
      createdByAdminUserId: input.createdByAdminUserId ?? null,
      createdByArtistUserId: input.createdByArtistUserId ?? null,
    })
    .returning();
  return row;
}

/** Returns null if no event with this id exists — used to verify ownership (artistId, and for artist-portal callers, createdByArtistUserId) before any mutation. */
export async function getCalendarEventById(eventId: string) {
  const db = getDb();
  const [row] = await db.select().from(schema.artistCalendarEvents).where(eq(schema.artistCalendarEvents.id, eventId)).limit(1);
  return row ?? null;
}

export async function updateCalendarEvent(eventId: string, patch: Partial<CalendarEventInput>) {
  const db = getDb();
  const values: Partial<typeof schema.artistCalendarEvents.$inferInsert> = { updatedAt: new Date() };
  if (patch.type !== undefined) values.type = patch.type;
  if (patch.title !== undefined) values.title = patch.title;
  if (patch.startAt !== undefined) values.startAt = patch.startAt;
  if (patch.endAt !== undefined) values.endAt = patch.endAt;
  if (patch.venue !== undefined) values.venue = patch.venue;
  if (patch.city !== undefined) values.city = patch.city;
  if (patch.country !== undefined) values.country = patch.country;
  if (patch.eventType !== undefined) values.eventType = patch.eventType;
  if (patch.notes !== undefined) values.notes = patch.notes;
  await db.update(schema.artistCalendarEvents).set(values).where(eq(schema.artistCalendarEvents.id, eventId));
}

export async function deleteCalendarEvent(eventId: string) {
  const db = getDb();
  await db.delete(schema.artistCalendarEvents).where(eq(schema.artistCalendarEvents.id, eventId));
}

export async function getCalendarEventByBookingId(bookingId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.artistCalendarEvents)
    .where(eq(schema.artistCalendarEvents.bookingId, bookingId))
    .limit(1);
  return row ?? null;
}

/**
 * Deletes every calendar event auto-generated for a given booking (used when
 * a booking moves out of "confirmed" — see bookingActions.ts). Deliberately
 * scoped to bookingId rather than a single row id, matching by the FK the
 * same way the event was originally created.
 */
export async function deleteCalendarEventsForBooking(bookingId: string) {
  const db = getDb();
  await db.delete(schema.artistCalendarEvents).where(eq(schema.artistCalendarEvents.bookingId, bookingId));
}

export const BLOCKING_TYPES: CalendarEventType[] = ["booked_platform", "booked_external", "unavailable"];

/**
 * Checks whether an artist is free on a single calendar date (the public
 * booking form only collects one event date, not a range — see
 * types/booking.ts). An artist is considered unavailable if any
 * booked_platform / booked_external / unavailable event's [startAt, endAt)
 * span covers that date. `tentative` and `available` never block a new
 * enquiry from being submitted — they're informational holds an admin
 * manages, not hard blocks.
 */
export async function isArtistAvailableOn(artistId: string, dateStr: string): Promise<boolean> {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return true; // don't block on an unparseable date — validation elsewhere handles the error
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.artistCalendarEvents)
    .where(
      and(
        eq(schema.artistCalendarEvents.artistId, artistId),
        lte(schema.artistCalendarEvents.startAt, dayEnd),
        gte(schema.artistCalendarEvents.endAt, dayStart)
      )
    );

  return !rows.some((r) => BLOCKING_TYPES.includes(r.type));
}

/**
 * Range-overlap conflict check for manually-created blocks — 3-day sprint
 * follow-up, "core booking and availability" gap identified in
 * PRODUCTION_READINESS.md. isArtistAvailableOn() above only ever checked a
 * single day (fine for the public form, which only collects one date), but
 * manual "Block Date" entries (admin AND artist) can span multiple days
 * (e.g. "Sept 20 -> Sept 24, all unavailable" — see CALENDAR.md), and
 * nothing previously stopped an admin or artist from creating a second
 * booked_external/unavailable block that overlaps an existing one. This
 * mirrors isArtistAvailableOn's exact overlap test
 * (start <= existing.endAt AND end >= existing.startAt) generalized to an
 * arbitrary [start, end) range instead of a single day, and to only the
 * BLOCKING_TYPES that should never coexist on the same date — `tentative`
 * and `available` are informational and never conflict with anything.
 *
 * `excludeEventId` lets an update-in-place (editing an event's own dates)
 * check for conflicts with OTHER events without always colliding with
 * itself.
 */
export async function getOverlappingBlockingEvents(
  artistId: string,
  startAt: Date,
  endAt: Date,
  excludeEventId?: string
) {
  const db = getDb();
  const conditions = [
    eq(schema.artistCalendarEvents.artistId, artistId),
    lte(schema.artistCalendarEvents.startAt, endAt),
    gte(schema.artistCalendarEvents.endAt, startAt),
  ];
  if (excludeEventId) conditions.push(ne(schema.artistCalendarEvents.id, excludeEventId));

  const rows = await db
    .select()
    .from(schema.artistCalendarEvents)
    .where(and(...conditions));

  return rows.filter((r) => BLOCKING_TYPES.includes(r.type));
}
