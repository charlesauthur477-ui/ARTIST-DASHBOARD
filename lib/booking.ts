"use server";

import type { BookingFieldErrors, BookingInquiryInput, BookingSubmissionResult } from "@/types/booking";
import { getArtistBySlug } from "@/lib/artists";
import { createBooking } from "@/lib/repositories/bookings";
import { isArtistAvailableOn } from "@/lib/repositories/calendar";
import { logActivity } from "@/lib/admin/activity";
import { notifyNewBooking } from "@/lib/email/bookingNotifications";
import { findOrCreateClientByEmail } from "@/lib/repositories/clients";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(input: BookingInquiryInput): BookingFieldErrors {
  const errors: BookingFieldErrors = {};

  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.fullName = "Please enter your full name.";
  }
  if (!input.email || !EMAIL_RE.test(input.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!input.phone || input.phone.trim().length < 6) {
    errors.phone = "Please enter a valid phone number.";
  }
  if (!input.eventType) {
    errors.eventType = "Please select an event type.";
  }
  if (!input.eventDate) {
    errors.eventDate = "Please select an event date.";
  } else {
    const date = new Date(input.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(date.getTime())) {
      errors.eventDate = "Please enter a valid date.";
    } else if (date < today) {
      errors.eventDate = "Event date must be in the future.";
    }
  }
  if (!input.location || input.location.trim().length < 2) {
    errors.location = "Please enter an event location.";
  }
  if (!input.performanceFormat) {
    errors.performanceFormat = "Please select a performance format.";
  }

  return errors;
}

/**
 * submitBookingInquiry — the single entry point the booking form calls.
 *
 * RAPID BUILD MODE Sprint 3: validates input server-side, checks the
 * artist's unified availability calendar (lib/repositories/calendar.ts) for
 * the requested date, and — if free — persists a real `bookings` row
 * (lib/repositories/bookings.ts) rather than discarding the submission.
 * Admins manage it from /admin/bookings from that point on.
 */
export async function submitBookingInquiry(
  input: BookingInquiryInput
): Promise<BookingSubmissionResult> {
  // Honeypot — if a hidden field got filled, silently "succeed" without
  // actually processing anything, which is the standard anti-spam pattern.
  if (input.companyWebsite) {
    return { success: true, message: "Thank you — your enquiry has been received.", referenceId: "SPAM-IGNORED" };
  }

  const artist = await getArtistBySlug(input.artistSlug);
  if (!artist) {
    return { success: false, message: "We couldn't find that artist. Please refresh and try again." };
  }

  const errors = validate(input);
  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Please correct the highlighted fields.", errors };
  }

  const available = await isArtistAvailableOn(artist.id, input.eventDate);
  if (!available) {
    return {
      success: false,
      message: `${artist.name} is already booked or unavailable on that date. Please choose a different date.`,
      errors: { eventDate: "Not available on this date." },
    };
  }

  // CRM Phase 1: resolve (or create) a client record for this enquiry
  // before writing the booking, so the booking can be inserted with its
  // clientId already set in one shot — never a separate follow-up write
  // that could leave a booking linked-then-unlinked, or vice versa. This is
  // best-effort like the notification/activity calls below it: a failure
  // here must never block or corrupt the booking itself, so any error just
  // means the booking is created with no client link (clientId stays null),
  // same as it always could before this sprint.
  let clientId: string | null = null;
  try {
    const client = await findOrCreateClientByEmail(input.email, {
      name: input.fullName,
      phone: input.phone,
      company: input.organization,
    });
    clientId = client.id;
  } catch (err) {
    console.error("[booking] failed to resolve/create client record — continuing without a client link", err);
  }

  const booking = await createBooking(artist.id, input, clientId);

  await logActivity({
    actorAdminUserId: null,
    action: "booking.created",
    entityType: "booking",
    entityId: booking.id,
    summary: `New booking enquiry from ${input.fullName} for ${artist.name} (${input.eventDate}).`,
    metadata: { artistId: artist.id, eventDate: input.eventDate, eventType: input.eventType },
  });

  // Best-effort notification — never throws, never blocks/undoes the
  // booking already committed above. See lib/email/bookingNotifications.ts.
  await notifyNewBooking({
    bookingId: booking.id,
    artistName: artist.name,
    clientName: input.fullName,
    company: input.organization,
    email: input.email,
    phone: input.phone,
    eventType: input.eventType,
    eventDate: input.eventDate,
    location: input.location,
    expectedAudience: input.expectedAudience,
    performanceFormat: input.performanceFormat,
    budgetRange: input.budgetRange,
    message: input.message,
  });

  return {
    success: true,
    message: `Thank you, ${input.fullName.split(" ")[0]}. Your enquiry for ${artist.name} has been received — the team typically responds within 1–2 business days.`,
    referenceId: booking.id,
  };
}
