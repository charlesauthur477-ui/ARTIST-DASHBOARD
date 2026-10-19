import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { generateIcsFeed } from "@/lib/calendarIntegration/ics";

// ---------------------------------------------------------------------------
// The "Wavelength Calendar" outbound ICS subscription feed (Calendar
// Integration Phase 1, section A.3 / F). Public route — deliberately NOT
// gated by requireArtistSession(), because a phone's calendar app cannot
// carry the artist's login cookie when it polls this URL in the
// background. Instead the unguessable calendarFeedToken segment IS the
// authorization: only someone with the exact URL (shown once, inside the
// authenticated Artist Portal, with a "regenerate if it leaks" control) can
// read it, and the token->artistId lookup below is the only thing that
// decides whose bookings come back — there is no other input to this route
// an attacker could use to reach a different artist's data.
//
// Content is confirmed bookings only (the same "booked_platform" calendar
// rows the artist already sees in their own Availability/Bookings pages) —
// nothing here is new exposure beyond what the artist can already see
// signed in, and nothing from another artist is ever reachable through this
// route regardless of what token value is guessed (a non-matching token
// just 404s).
// ---------------------------------------------------------------------------

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  const db = getDb();
  const [artistUser] = await db.select().from(schema.artistUsers).where(eq(schema.artistUsers.calendarFeedToken, token)).limit(1);
  if (!artistUser || !artistUser.isActive) {
    return new Response("Not found", { status: 404 });
  }

  const [artist] = await db.select().from(schema.artists).where(eq(schema.artists.id, artistUser.artistId)).limit(1);
  if (!artist) return new Response("Not found", { status: 404 });

  const bookingRows = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.artistId, artistUser.artistId));

  const confirmed = bookingRows.filter((b) => b.status === "confirmed");

  const ics = generateIcsFeed(
    `${artist.stageName || artist.name} — Wavelength Bookings`,
    confirmed.map((b) => ({
      uid: `wavelength-booking-${b.id}@wavelength`,
      // eventDate is a plain "YYYY-MM-DD" string collected by the public
      // booking form (see lib/booking.ts) — treated as an all-day block,
      // same convention the auto-generated booked_platform calendar event
      // already uses (lib/admin/bookingActions.ts).
      start: new Date(`${b.eventDate}T00:00:00Z`),
      end: new Date(new Date(`${b.eventDate}T00:00:00Z`).getTime() + 24 * 60 * 60 * 1000),
      summary: `${b.eventType || "Booking"} — ${b.clientName || "Confirmed booking"}`,
      location: b.location || undefined,
      // Deliberately no `message`/internalNotes here — same admin-only
      // field boundary already enforced on /artist/bookings pages.
    }))
  );

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="wavelength-${artist.slug || "artist"}.ics"`,
      "Cache-Control": "private, max-age=900", // 15 min — calendar apps poll subscription URLs on their own schedule anyway
    },
  });
}
