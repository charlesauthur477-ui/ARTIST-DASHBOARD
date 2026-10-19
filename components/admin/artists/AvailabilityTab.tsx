"use client";

import { useRouter } from "next/navigation";
import { addCalendarEventAction, deleteCalendarEventAction, updateCalendarEventAction } from "@/lib/admin/calendarActions";
import { CalendarView } from "@/components/calendar/CalendarView";
import type { CalendarEventVM } from "@/components/calendar/types";

// ---------------------------------------------------------------------------
// Admin → an artist's Booking tab → "Availability & Calendar". Thin wrapper
// around the shared components/calendar/CalendarView, mirroring
// components/artist/ArtistAvailabilityTab.tsx — this file's only job is
// closing over the admin-scoped Server Actions (lib/admin/calendarActions.ts,
// which take artistId as an explicit argument, unlike the artist-scoped
// ones) and computing which events an admin may edit (everything except a
// system-generated confirmed-booking block).
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
  eventType: string;
  notes: string;
  bookingId: string | null;
}

const ADMIN_ADDABLE_TYPES = [
  { value: "booked_external" as const, label: "External Booking" },
  { value: "tentative" as const, label: "Tentative Hold" },
  { value: "unavailable" as const, label: "Unavailable / Blocked" },
  { value: "available" as const, label: "Explicitly Available" },
];

export function AvailabilityTab({ artistId, events }: { artistId: string; events: EventRow[] }) {
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
    editable: !(e.type === "booked_platform" && !!e.bookingId),
  }));

  return (
    <CalendarView
      events={vmEvents}
      addableTypes={ADMIN_ADDABLE_TYPES}
      onAdd={async (input) => {
        const result = await addCalendarEventAction(artistId, input);
        router.refresh();
        return result;
      }}
      onUpdate={async (id, patch) => {
        const result = await updateCalendarEventAction(artistId, id, patch);
        router.refresh();
        return result;
      }}
      onDelete={async (id) => {
        const result = await deleteCalendarEventAction(artistId, id);
        router.refresh();
        return result;
      }}
      onOpenBooking={(bookingId) => router.push(`/admin/bookings/${bookingId}`)}
    />
  );
}
