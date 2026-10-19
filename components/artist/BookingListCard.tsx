import Link from "next/link";
import { BookingStatusBadge } from "@/components/admin/ui/Badge";

// ---------------------------------------------------------------------------
// Mobile-first booking card — Booking Operations sprint. Replaces the
// horizontal-scroll <table> the artist bookings list used before with a
// single-column stacked card that reads cleanly at phone width (the primary
// surface for the Artist Portal PWA) and still scales up fine on larger
// screens as a simple list. Only client-facing fields — never internalNotes
// or reviewedBy, which listBookingsForArtist doesn't even fetch anymore.
// ---------------------------------------------------------------------------

export interface BookingListCardData {
  id: string;
  clientName: string;
  company: string;
  eventType: string;
  eventDate: string;
  location: string;
  status: string;
}

export function BookingListCard({ booking }: { booking: BookingListCardData }) {
  return (
    <Link
      href={`/artist/bookings/${booking.id}`}
      className="block rounded-md border border-[var(--admin-border)] bg-white p-3.5 transition hover:border-[var(--admin-primary)] hover:shadow-sm active:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-[var(--admin-text)]">{booking.clientName || "Unknown client"}</p>
          {booking.company ? <p className="truncate text-xs text-[var(--admin-muted)]">{booking.company}</p> : null}
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--admin-muted)]">
        <span>{booking.eventDate || "Date TBD"}</span>
        {booking.eventType ? <span>{booking.eventType}</span> : null}
        {booking.location ? <span className="truncate">{booking.location}</span> : null}
      </div>
    </Link>
  );
}
