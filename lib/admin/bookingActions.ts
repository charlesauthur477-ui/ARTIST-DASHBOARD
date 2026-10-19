"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/admin/auth";
import { canManageBookings } from "@/lib/admin/permissions";
import { logActivity } from "@/lib/admin/activity";
import { getBookingById, updateBookingStatus, type BookingStatus } from "@/lib/repositories/bookings";
import {
  createCalendarEvent,
  deleteCalendarEventsForBooking,
  getCalendarEventByBookingId,
  isArtistAvailableOn,
} from "@/lib/repositories/calendar";
import { notifyBookingStatusChange } from "@/lib/email/bookingNotifications";

// ---------------------------------------------------------------------------
// Booking review Server Actions — RAPID BUILD MODE Sprint 3.
//
// Status transitions are the whole workflow here: NEW -> CONTACTED ->
// NEGOTIATING -> CONFIRMED -> COMPLETED, or REJECTED/CANCELLED at any point
// (Booking Operations sprint). Moving a booking to CONFIRMED creates a
// linked calendar event (type: booked_platform) so the unified availability
// calendar (Sprint 4) reflects it immediately; moving a booking OFF
// confirmed to anything other than COMPLETED (rejected/cancelled, or
// manually reverted to an earlier stage) removes that generated event
// again, so a stale block never survives a status change made by mistake.
// COMPLETED keeps whatever calendar block already exists untouched — the
// event already happened, so there is nothing to create or clean up.
// ---------------------------------------------------------------------------

export interface BookingActionState {
  error: string | null;
}

export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatus,
  internalNotes?: string
): Promise<BookingActionState> {
  const user = await requireRole(["super_admin", "manager"]);
  if (!canManageBookings(user.role)) return { error: "You do not have permission to manage bookings." };

  const record = await getBookingById(bookingId);
  if (!record) return { error: "Booking not found." };

  // Production-readiness audit finding: confirming a booking used to never
  // re-check availability, so two enquiries for the same artist/date could
  // both be confirmed (the public form's isArtistAvailableOn check only
  // ever ran once, at submission time, while both were still "new"). Guard
  // this BEFORE writing the status change, so a conflict leaves the
  // booking's status untouched rather than flipping it to "confirmed" with
  // no calendar block (or worse, two overlapping blocks) behind it. Only
  // applies when this booking doesn't already own the block for its own
  // date (re-saving/re-confirming an already-confirmed booking must not
  // reject against its own existing event).
  const existingEventForThisBooking = status === "confirmed" ? await getCalendarEventByBookingId(bookingId) : null;
  if (status === "confirmed" && !existingEventForThisBooking) {
    const available = await isArtistAvailableOn(record.booking.artistId, record.booking.eventDate);
    if (!available) {
      return {
        error: `${record.artistStageName || record.artistName} already has a confirmed booking or block on ${record.booking.eventDate}. Resolve the conflict before confirming this one.`,
      };
    }
  }

  await updateBookingStatus(bookingId, status, user.id, internalNotes);

  if (status === "confirmed") {
    if (!existingEventForThisBooking) {
      const date = new Date(record.booking.eventDate);
      if (!Number.isNaN(date.getTime())) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        await createCalendarEvent(record.booking.artistId, {
          type: "booked_platform",
          title: `${record.booking.clientName} — ${record.booking.eventType || "Booking"}`,
          startAt: start,
          endAt: end,
          venue: record.booking.location,
          notes: record.booking.message,
          bookingId,
          createdByAdminUserId: user.id,
        });
      }
    }
  } else if (status !== "completed") {
    // Any status other than confirmed/completed (including moving back to an
    // earlier stage, or rejecting/cancelling) must not leave a stale
    // availability block behind. "completed" intentionally falls through to
    // here-not-taken: a completed booking's event already happened, so its
    // calendar block is left exactly as-is rather than deleted or recreated.
    await deleteCalendarEventsForBooking(bookingId);
  }

  await logActivity({
    actorAdminUserId: user.id,
    action: "booking.status_changed",
    entityType: "booking",
    entityId: bookingId,
    summary: `${user.name} moved the booking from "${record.booking.clientName}" (${record.artistStageName || record.artistName}) to ${status}.`,
    metadata: { previousStatus: record.booking.status, newStatus: status },
  });

  // Best-effort notification — never throws, never blocks/undoes the status
  // change already committed above. See lib/email/bookingNotifications.ts.
  await notifyBookingStatusChange({
    bookingId,
    artistId: record.booking.artistId,
    artistName: record.artistStageName || record.artistName,
    status,
    clientName: record.booking.clientName,
    clientEmail: record.booking.email,
    clientPhone: record.booking.phone,
    eventDate: record.booking.eventDate,
    location: record.booking.location,
    eventType: record.booking.eventType,
  });

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath(`/admin/artists/${record.booking.artistId}/booking`);
  return { error: null };
}
