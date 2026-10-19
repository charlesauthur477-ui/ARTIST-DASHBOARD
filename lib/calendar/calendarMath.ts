// ---------------------------------------------------------------------------
// Pure date-grid math for the internal Wavelength Calendar (month/week/day
// views in the Artist Portal and Admin). No React, no server-only imports —
// safe to use from any "use client" calendar component. Deliberately
// hand-rolled rather than a calendar library: the only things needed are
// "which days belong in this month's grid" and "which events land on a
// given day," both a few lines each.
//
// Weeks start on Sunday throughout, matching the rest of this codebase's
// date formatting (toLocaleDateString with no locale override, which is
// Sunday-first in en-US — the assumed primary locale per the existing admin
// UI's date displays).
// ---------------------------------------------------------------------------

export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function addMonths(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + n);
  return copy;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** 42 days (6 full weeks) covering the month containing `anchor`, padded with the trailing/leading days of adjacent months so every week row is complete. */
export function getMonthGridDays(anchor: Date): Date[] {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

/** The 7 days (Sun–Sat) of the week containing `anchor`. */
export function getWeekDays(anchor: Date): Date[] {
  const weekStart = addDays(anchor, -anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatMonthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatDayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function formatWeekRangeLabel(days: Date[]): string {
  const first = days[0];
  const last = days[days.length - 1];
  const sameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();
  const firstLabel = first.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const lastLabel = last.toLocaleDateString(undefined, sameMonth ? { day: "numeric", year: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
  return `${firstLabel} – ${lastLabel}`;
}

/** An event "occupies" a day if any part of [startAt, endAt] falls within that day — the same overlap rule lib/repositories/calendar.ts#isArtistAvailableOn uses, so the calendar UI and the actual availability check always agree on which days an event covers. */
export function eventOverlapsDay(event: { startAt: Date; endAt: Date }, day: Date): boolean {
  return event.startAt <= endOfDay(day) && event.endAt >= startOfDay(day);
}
