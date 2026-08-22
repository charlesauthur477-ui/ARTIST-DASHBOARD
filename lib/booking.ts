"use server";

import type { BookingFieldErrors, BookingInquiryInput, BookingSubmissionResult } from "@/types/booking";
import { getArtistBySlug } from "@/lib/artists";

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
 * V1: validates input server-side and simulates a successful submission
 * (no external system is called). The abstraction is deliberate: replacing
 * the body of this function with `await fetch("/api/bookings", ...)` or a
 * direct database write is the only change needed to wire this up to a real
 * booking CRM in a future phase — no component or page needs to change.
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

  // Simulate network latency for a realistic loading state in the UI.
  await new Promise((resolve) => setTimeout(resolve, 600));

  const referenceId = `BK-${Date.now().toString(36).toUpperCase()}`;

  return {
    success: true,
    message: `Thank you, ${input.fullName.split(" ")[0]}. Your enquiry for ${artist.name} has been received — the team typically responds within 1–2 business days.`,
    referenceId,
  };
}
