"use client";

import { useRouter } from "next/navigation";
import {
  artistAddCalendarEventAction,
  artistDeleteCalendarEventAction,
  artistUpdateCalendarEventAction,
} from "@/lib/artist/calendarActions";
import { CalendarView } from "@/components/calendar/CalendarView";
import type { CalendarEventVM } from "@/components/calendar/types";

// ---------------------------------------------------------------------------
// Artist Portal → Availability. Thin wrapper around the shared
// components/calendar/CalendarView — this file's only job is closing over
// the artist-scoped Server Actions (lib/artist/calendarActions.ts, which
// already derive the artist strictly from the signed-in session — no
// artistId is ever passed from here) and computing which events THIS
// artist may edit. CalendarView itself has no idea it's talking to the
// artist API rather than the admin one.
//
// Only imports real Server Actions directly (same safe pattern as
// ChangePasswordForm) — never receives one as a prop from a Server
// Component, which is what caused the earlier "Functions cannot be passed
// directly to Client Components" bug fixed in the Artist Portal navigation
// audit.
// ---------------------------------------------------------------------------

interface EventRow {
  id: string;
  type: string;
  title: string;
  startAt: string;
  endAt: string;
  venue: string;
  city: string;
  country: string;
  notes: string;
  bookingId: string | null;
  createdByArtistUserId: string | null;
}

const ARTIST_ADDABLE_TYPES = [
  { value: "booked_external" as const, label: "External Booking" },
  { value: "tentative" as const, label: "Tentative Hold" },
  { value: "unavailable" as const, label: "Unavailable / Blocked" },
];

export function ArtistAvailabilityTab({ events, currentArtistUserId }: { events: EventRow[]; currentArtistUserId: string }) {
  const router = useRouter();

  const vmEvents: CalendarEventVM[] = events.map((e) => ({
    id: e.id,
    type: e.type as CalendarEventVM["type"],
    title: e.title,
    startAt: e.startAt,
    endAt: e.endAt,
    venue: e.venue,
    city: e.city,
    country: e.country,
    notes: e.notes,
    bookingId: e.bookingId,
    editable: e.createdByArtistUserId === currentArtistUserId && !e.bookingId,
  }));

  return (
    <CalendarView
      events={vmEvents}
      addableTypes={ARTIST_ADDABLE_TYPES}
      onAdd={async (input) => {
        const result = await artistAddCalendarEventAction(input);
        router.refresh();
        return result;
      }}
      onUpdate={async (id, patch) => {
        const result = await artistUpdateCalendarEventAction(id, patch);
        router.refresh();
        return result;
      }}
      onDelete={async (id) => {
        const result = await artistDeleteCalendarEventAction(id);
        router.refresh();
        return result;
      }}
      onOpenBooking={(bookingId) => router.push(`/artist/bookings/${bookingId}`)}
    />
  );
}
