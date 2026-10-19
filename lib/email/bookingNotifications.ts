import "server-only";
import { sendEmail } from "@/lib/email/send";
import { getAdminNotificationRecipients } from "@/lib/email/recipients";
import {
  newBookingAdminEmail,
  bookingReceivedEnquirerEmail,
  bookingConfirmedEnquirerEmail,
  bookingConfirmedArtistEmail,
  bookingDeclinedEnquirerEmail,
} from "@/lib/email/templates";
import { logActivity } from "@/lib/admin/activity";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { getArtistUserByArtistId } from "@/lib/repositories/artistUsers";
import type { BookingStatus } from "@/lib/repositories/bookings";

// ---------------------------------------------------------------------------
// Booking notification orchestration — 3-day sprint, item 2.
//
// EVERY exported function here is a "best effort, never throws" wrapper:
// the booking (or the status change) has already been committed to the
// database by the caller before either of these runs, so an email failure
// can only ever fail to notify someone — it can never fail, roll back, or
// duplicate the underlying booking record. Each function catches its own
// errors and always writes exactly one activity-log entry summarizing what
// happened, so a notification failure is visible in /admin/activity without
// ever surfacing as an error to the person submitting or reviewing the
// booking.
// ---------------------------------------------------------------------------

interface NotifyResult {
  target: string;
  ok: boolean;
  error?: string;
}

async function recordNotificationOutcome(bookingId: string, summaryPrefix: string, results: NotifyResult[]) {
  const anyFailed = results.some((r) => !r.ok);
  await logActivity({
    actorAdminUserId: null,
    action: anyFailed ? "booking.notification_failed" : "booking.notified",
    entityType: "booking",
    entityId: bookingId,
    summary: anyFailed
      ? `${summaryPrefix} — one or more notification emails failed to send.`
      : `${summaryPrefix} — notification email(s) sent.`,
    metadata: { results },
  });
}

export interface NewBookingNotificationInput {
  bookingId: string;
  artistName: string;
  clientName: string;
  company?: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  location: string;
  expectedAudience?: string;
  performanceFormat: string;
  budgetRange?: string;
  message?: string;
}

/** New public booking enquiry: notify admins, acknowledge the enquirer. */
export async function notifyNewBooking(input: NewBookingNotificationInput): Promise<void> {
  const results: NotifyResult[] = [];

  try {
    const adminRecipients = await getAdminNotificationRecipients();
    if (adminRecipients.length > 0) {
      const admin = newBookingAdminEmail(input);
      const r = await sendEmail({ to: adminRecipients, subject: admin.subject, html: admin.html, text: admin.text, replyTo: input.email });
      results.push({ target: "admin", ok: r.success, error: r.error });
    } else {
      results.push({ target: "admin", ok: false, error: "No admin recipients configured." });
    }
  } catch (err) {
    results.push({ target: "admin", ok: false, error: err instanceof Error ? err.message : "Unknown error" });
  }

  try {
    const ack = bookingReceivedEnquirerEmail({
      firstName: input.clientName.split(" ")[0] || input.clientName,
      artistName: input.artistName,
      eventDate: input.eventDate,
      referenceId: input.bookingId,
    });
    const r = await sendEmail({ to: input.email, subject: ack.subject, html: ack.html, text: ack.text });
    results.push({ target: "enquirer", ok: r.success, error: r.error });
  } catch (err) {
    results.push({ target: "enquirer", ok: false, error: err instanceof Error ? err.message : "Unknown error" });
  }

  await recordNotificationOutcome(input.bookingId, `New booking enquiry from ${input.clientName}`, results).catch((err) =>
    console.error("[email] failed to record notification activity log entry", err)
  );
}

export interface BookingStatusNotificationInput {
  bookingId: string;
  artistId: string;
  artistName: string;
  status: BookingStatus;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string;
  location: string;
  eventType: string;
}

/**
 * Booking status changed. Only "confirmed", "rejected", and "cancelled" are
 * notification-worthy transitions ("where useful", per spec) — "contacted"
 * and "negotiating" are internal working states an admin sets while still
 * corresponding with the enquirer directly, so no email is sent for those.
 */
export async function notifyBookingStatusChange(input: BookingStatusNotificationInput): Promise<void> {
  if (input.status !== "confirmed" && input.status !== "rejected" && input.status !== "cancelled") return;

  const results: NotifyResult[] = [];
  const firstName = input.clientName.split(" ")[0] || input.clientName;

  if (input.status === "confirmed") {
    try {
      const artist = await getArtistRowById(input.artistId);
      const contact = artist?.contactInformation?.bookings;
      const enquirerEmail = bookingConfirmedEnquirerEmail({
        firstName,
        artistName: input.artistName,
        eventDate: input.eventDate,
        location: input.location,
        eventType: input.eventType,
        contactLabel: contact?.label || "Bookings",
        contactEmail: contact?.email,
        contactPhone: contact?.phone,
      });
      const r = await sendEmail({ to: input.clientEmail, subject: enquirerEmail.subject, html: enquirerEmail.html, text: enquirerEmail.text });
      results.push({ target: "enquirer", ok: r.success, error: r.error });
    } catch (err) {
      results.push({ target: "enquirer", ok: false, error: err instanceof Error ? err.message : "Unknown error" });
    }

    try {
      const artistUser = await getArtistUserByArtistId(input.artistId);
      if (artistUser?.email) {
        const artistEmail = bookingConfirmedArtistEmail({
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          clientPhone: input.clientPhone,
          eventDate: input.eventDate,
          location: input.location,
          eventType: input.eventType,
          bookingId: input.bookingId,
        });
        const r = await sendEmail({ to: artistUser.email, subject: artistEmail.subject, html: artistEmail.html, text: artistEmail.text });
        results.push({ target: "artist", ok: r.success, error: r.error });
      } else {
        results.push({ target: "artist", ok: false, error: "No artist portal login/email on file." });
      }
    } catch (err) {
      results.push({ target: "artist", ok: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  } else {
    try {
      const declined = bookingDeclinedEnquirerEmail({
        firstName,
        artistName: input.artistName,
        eventDate: input.eventDate,
        status: input.status,
      });
      const r = await sendEmail({ to: input.clientEmail, subject: declined.subject, html: declined.html, text: declined.text });
      results.push({ target: "enquirer", ok: r.success, error: r.error });
    } catch (err) {
      results.push({ target: "enquirer", ok: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  await recordNotificationOutcome(input.bookingId, `Booking status changed to "${input.status}"`, results).catch((err) =>
    console.error("[email] failed to record notification activity log entry", err)
  );
}
