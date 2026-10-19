import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { BookingInquiryInput } from "@/types/booking";

// ---------------------------------------------------------------------------
// Real booking requests — RAPID BUILD MODE Sprint 3. Replaces the old
// lib/booking.ts behavior of validating and then discarding every public
// enquiry: every field the public form already collects (BookingInquiryInput)
// is persisted as-is, plus admin-only status/notes fields.
// ---------------------------------------------------------------------------

export type BookingStatus = (typeof schema.bookingStatusEnum.enumValues)[number];

/**
 * `clientId` (CRM Phase 1) is optional and additive: the booking's own
 * clientName/company/email/phone columns below are set exactly as before
 * regardless of whether a client link was resolved — they are the
 * historical snapshot, `clientId` is just an optional pointer on top of it.
 * Callers that fail to resolve a client (see lib/booking.ts) simply omit
 * clientId; the booking is created either way.
 */
export async function createBooking(artistId: string, input: BookingInquiryInput, clientId?: string | null) {
  const db = getDb();
  const [row] = await db
    .insert(schema.bookings)
    .values({
      artistId,
      status: "new",
      clientId: clientId ?? null,
      clientName: input.fullName,
      company: input.organization ?? "",
      email: input.email,
      phone: input.phone,
      eventType: input.eventType,
      eventDate: input.eventDate,
      location: input.location,
      expectedAudience: input.expectedAudience ?? "",
      performanceFormat: input.performanceFormat,
      budgetRange: input.budgetRange ?? "",
      message: input.message ?? "",
    })
    .returning();
  return row;
}

export async function listBookings(status?: BookingStatus) {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.bookings.id,
      status: schema.bookings.status,
      clientName: schema.bookings.clientName,
      company: schema.bookings.company,
      email: schema.bookings.email,
      eventType: schema.bookings.eventType,
      eventDate: schema.bookings.eventDate,
      location: schema.bookings.location,
      budgetRange: schema.bookings.budgetRange,
      createdAt: schema.bookings.createdAt,
      artistId: schema.bookings.artistId,
      artistName: schema.artists.name,
      artistStageName: schema.artists.stageName,
      artistSlug: schema.artists.slug,
    })
    .from(schema.bookings)
    .innerJoin(schema.artists, eq(schema.bookings.artistId, schema.artists.id))
    .orderBy(desc(schema.bookings.createdAt));
  return status ? rows.filter((r) => r.status === status) : rows;
}

/**
 * Artist Portal: bookings for exactly one artist, never joined/filterable by
 * any other artistId. Explicit column list (rather than a bare select()) so
 * admin-only fields — internalNotes, reviewedBy — are never fetched for this
 * path in the first place, not merely left unrendered by the page. That
 * matters because a Server Component's fetched data is serialized to the
 * client for any part of the tree that isn't itself server-only, so keeping
 * these columns out of the query is the real boundary, not just UI omission.
 */
export async function listBookingsForArtist(artistId: string, status?: BookingStatus) {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.bookings.id,
      status: schema.bookings.status,
      clientName: schema.bookings.clientName,
      company: schema.bookings.company,
      email: schema.bookings.email,
      phone: schema.bookings.phone,
      eventType: schema.bookings.eventType,
      eventDate: schema.bookings.eventDate,
      location: schema.bookings.location,
      expectedAudience: schema.bookings.expectedAudience,
      performanceFormat: schema.bookings.performanceFormat,
      budgetRange: schema.bookings.budgetRange,
      message: schema.bookings.message,
      createdAt: schema.bookings.createdAt,
      updatedAt: schema.bookings.updatedAt,
    })
    .from(schema.bookings)
    .where(eq(schema.bookings.artistId, artistId))
    .orderBy(desc(schema.bookings.createdAt));
  return status ? rows.filter((r) => r.status === status) : rows;
}

/**
 * Artist Portal: returns null (not the booking) if the booking belongs to a
 * different artist — the ownership check IS the query. Explicit column list
 * excludes internalNotes/reviewedBy — see listBookingsForArtist above for why.
 */
export async function getBookingByIdForArtist(id: string, artistId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: schema.bookings.id,
      artistId: schema.bookings.artistId,
      status: schema.bookings.status,
      clientName: schema.bookings.clientName,
      company: schema.bookings.company,
      email: schema.bookings.email,
      phone: schema.bookings.phone,
      eventType: schema.bookings.eventType,
      eventDate: schema.bookings.eventDate,
      location: schema.bookings.location,
      expectedAudience: schema.bookings.expectedAudience,
      performanceFormat: schema.bookings.performanceFormat,
      budgetRange: schema.bookings.budgetRange,
      message: schema.bookings.message,
      createdAt: schema.bookings.createdAt,
      updatedAt: schema.bookings.updatedAt,
    })
    .from(schema.bookings)
    .where(and(eq(schema.bookings.id, id), eq(schema.bookings.artistId, artistId)))
    .limit(1);
  return row ?? null;
}

export async function getBookingById(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      booking: schema.bookings,
      artistName: schema.artists.name,
      artistStageName: schema.artists.stageName,
      artistSlug: schema.artists.slug,
    })
    .from(schema.bookings)
    .innerJoin(schema.artists, eq(schema.bookings.artistId, schema.artists.id))
    .where(eq(schema.bookings.id, id))
    .limit(1);
  return row ?? null;
}

export async function updateBookingStatus(id: string, status: BookingStatus, reviewedBy: string, internalNotes?: string) {
  const db = getDb();
  const values: Partial<typeof schema.bookings.$inferInsert> = {
    status,
    reviewedBy,
    updatedAt: new Date(),
  };
  if (internalNotes !== undefined) values.internalNotes = internalNotes;
  await db.update(schema.bookings).set(values).where(eq(schema.bookings.id, id));
}

export async function countBookingsByStatus() {
  const db = getDb();
  const rows = await db.select({ status: schema.bookings.status }).from(schema.bookings);
  return {
    total: rows.length,
    new: rows.filter((r) => r.status === "new").length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
  };
}
