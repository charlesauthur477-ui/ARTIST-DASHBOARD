// ---------------------------------------------------------------------------
// Shared view-model types for the internal Wavelength Calendar, used by
// both the Artist Portal and Admin calendar wrappers
// (components/artist/ArtistAvailabilityTab.tsx,
// components/admin/artists/AvailabilityTab.tsx) and the shared
// components/calendar/CalendarView.tsx renderer. Deliberately a thin,
// UI-only shape — not the Drizzle row shape — so CalendarView never needs
// to know whether it's looking at admin or artist data.
// ---------------------------------------------------------------------------

export type CalendarEventType = "available" | "tentative" | "booked_platform" | "booked_external" | "unavailable";

export interface CalendarEventVM {
  id: string;
  type: CalendarEventType;
  title: string;
  startAt: string; // ISO
  endAt: string; // ISO
  venue: string;
  city: string;
  country: string;
  notes: string;
  bookingId: string | null;
  /** Whether the CURRENT viewer (this artist, or this admin) may edit/delete this specific event. Computed by the caller — CalendarView never re-derives ownership rules itself. */
  editable: boolean;
}

export interface CalendarEventFormValues {
  type: CalendarEventType;
  title: string;
  startAt: string; // ISO
  endAt: string; // ISO
  venue?: string;
  city?: string;
  country?: string;
  notes?: string;
}

export interface CalendarActionResult {
  error: string | null;
}

export const TYPE_LABEL: Record<CalendarEventType, string> = {
  available: "Available",
  tentative: "Tentative Hold",
  booked_platform: "Confirmed Booking",
  booked_external: "External Booking",
  unavailable: "Unavailable / Blocked",
};

export const TYPE_COLOR: Record<CalendarEventType, string> = {
  available: "#16a34a",
  tentative: "#d97706",
  booked_platform: "#2563eb",
  booked_external: "#ea580c",
  unavailable: "#dc2626",
};

export const BLOCK_REASONS = [
  { value: "Personal", label: "Personal" },
  { value: "Already Booked", label: "Already Booked" },
  { value: "Unavailable", label: "Unavailable" },
  { value: "Other", label: "Other" },
] as const;
