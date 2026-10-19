import { requireArtistSession } from "@/lib/artist/session";
import { getBookingByIdForArtist } from "@/lib/repositories/bookings";
import { generateIcsFeed } from "@/lib/calendarIntegration/ics";

// ---------------------------------------------------------------------------
// "Add to Calendar" for a single confirmed booking — Calendar Integration
// Phase 1, section F's ICS-first fallback (automatic Google Calendar event
// creation on confirm is the documented next step; see
// CALENDAR_INTEGRATION.md). Authenticated (unlike the subscription feed —
// this is a one-off download the signed-in artist triggers themselves, not
// something a calendar app polls unattended), and ownership-checked the
// same way every other artist booking route is: getBookingByIdForArtist
// returns null (404) rather than another artist's booking.
// ---------------------------------------------------------------------------

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await requireArtistSession();
  const booking = await getBookingByIdForArtist(id, user.artistId);
  if (!booking) return new Response("Not found", { status: 404 });

  const start = new Date(`${booking.eventDate}T00:00:00Z`);
  const ics = generateIcsFeed(`${booking.eventType || "Booking"}`, [
    {
      uid: `wavelength-booking-${booking.id}@wavelength`,
      start,
      end: new Date(start.getTime() + 24 * 60 * 60 * 1000),
      summary: `${booking.eventType || "Booking"} — ${booking.clientName || "Confirmed booking"}`,
      location: booking.location || undefined,
      description: [booking.company && `Client: ${booking.company}`, booking.budgetRange && `Budget: ${booking.budgetRange}`]
        .filter(Boolean)
        .join("\n"),
    },
  ]);

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="booking-${booking.id}.ics"`,
    },
  });
}
