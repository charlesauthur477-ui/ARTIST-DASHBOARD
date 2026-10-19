import { requireArtistSession } from "@/lib/artist/session";
import { listBookingsForArtist } from "@/lib/repositories/bookings";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { BookingListCard, type BookingListCardData } from "@/components/artist/BookingListCard";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Artist Portal → Bookings — Booking Operations sprint. Groups the flat list
// (previously a single desktop table) into what an artist actually wants at
// a glance on their phone: what's still coming up (split into Pending vs.
// already-Confirmed) and what's already happened. A plain server component —
// no tab state needed, both sections just stack on one scrollable page,
// which is the simplest thing that works well at phone width.
//
// "Past" catches anything no longer actionable: a terminal status
// (completed/rejected/cancelled) or an event date that has already passed,
// regardless of status. Everything else is "Upcoming", subdivided by status
// into Pending (new/contacted/negotiating) and Confirmed.
// ---------------------------------------------------------------------------

const PENDING_STATUSES = new Set(["new", "contacted", "negotiating"]);
const PAST_STATUSES = new Set(["completed", "rejected", "cancelled"]);

function parseEventDate(eventDate: string): Date | null {
  const d = new Date(eventDate);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isPastBooking(b: { status: string; eventDate: string }, todayStart: Date): boolean {
  if (PAST_STATUSES.has(b.status)) return true;
  const parsed = parseEventDate(b.eventDate);
  return parsed !== null && parsed < todayStart;
}

function Section({ title, hint, bookings }: { title: string; hint?: string; bookings: BookingListCardData[] }) {
  if (bookings.length === 0) return null;
  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-muted)]">{title}</h2>
        {hint ? <p className="text-xs text-[var(--admin-muted)]">{hint}</p> : null}
      </div>
      <div className="space-y-2">
        {bookings.map((b) => (
          <BookingListCard key={b.id} booking={b} />
        ))}
      </div>
    </div>
  );
}

export default async function ArtistPortalBookingsPage() {
  const user = await requireArtistSession();
  const bookings = await listBookingsForArtist(user.artistId);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const past = bookings.filter((b) => isPastBooking(b, todayStart));
  const upcoming = bookings.filter((b) => !isPastBooking(b, todayStart));
  const pending = upcoming.filter((b) => PENDING_STATUSES.has(b.status));
  const confirmed = upcoming.filter((b) => b.status === "confirmed");
  const otherUpcoming = upcoming.filter((b) => !PENDING_STATUSES.has(b.status) && b.status !== "confirmed");

  const byEventDateAsc = (a: BookingListCardData, b: BookingListCardData) => {
    const da = parseEventDate(a.eventDate);
    const db_ = parseEventDate(b.eventDate);
    if (da && db_) return da.getTime() - db_.getTime();
    if (da) return -1;
    if (db_) return 1;
    return 0;
  };
  const byEventDateDesc = (a: BookingListCardData, b: BookingListCardData) => -byEventDateAsc(a, b);

  pending.sort(byEventDateAsc);
  confirmed.sort(byEventDateAsc);
  otherUpcoming.sort(byEventDateAsc);
  past.sort(byEventDateDesc);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--admin-text)]">Bookings</h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">Booking enquiries received through your public profile.</p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState title="No booking requests yet" />
      ) : (
        <div className="space-y-6">
          {pending.length === 0 && confirmed.length === 0 && otherUpcoming.length === 0 && past.length > 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">Nothing upcoming right now.</p>
          ) : null}
          <Section title="Pending" hint="Awaiting a response from the Wavelength team." bookings={pending} />
          <Section title="Confirmed" hint="Booked and on your calendar." bookings={confirmed} />
          <Section title="Other" bookings={otherUpcoming} />
          <Section title="Past" bookings={past} />
        </div>
      )}
    </div>
  );
}
