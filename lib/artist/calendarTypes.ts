import type { CalendarEventInput } from "@/lib/repositories/calendar";

// Plain type module (no "use server") so both the admin and artist calendar
// action files — each a Server Actions module — can share this shape
// without importing values across "use server" boundaries.
export interface CalendarEventFormInput {
  type: CalendarEventInput["type"];
  title: string;
  startAt: string; // ISO date or datetime-local value
  endAt: string;
  venue?: string;
  city?: string;
  country?: string;
  eventType?: string;
  notes?: string;
}
