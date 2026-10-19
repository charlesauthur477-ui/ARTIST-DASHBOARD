"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/admin/auth";
import { canManageAvailability } from "@/lib/admin/permissions";
import { logActivity } from "@/lib/admin/activity";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEventById,
  updateCalendarEvent,
  getOverlappingBlockingEvents,
  BLOCKING_TYPES,
  type CalendarEventInput,
} from "@/lib/repositories/calendar";
import type { CalendarEventFormInput } from "@/lib/artist/calendarTypes";

// ---------------------------------------------------------------------------
// Availability/calendar Server Actions — RAPID BUILD MODE Sprint 4.
//
// Covers both the "Add External Booking" flow (an event/client from outside
// the platform that must immediately block those dates) and general manual
// tentative/unavailable blocks. This is the ADMIN-side action set — Sprint 5
// added a separate, artist-scoped set (lib/artist/calendarActions.ts) with
// stricter authorization (an artist may only touch their own artist_id and
// only blocks they themselves created); both share the
// CalendarEventFormInput shape (lib/artist/calendarTypes.ts) but not the
// action implementations, since the authorization rules genuinely differ.
// ---------------------------------------------------------------------------

export interface CalendarActionState {
  error: string | null;
}

export type { CalendarEventFormInput };

function parseRange(startAt: string, endAt: string): { start: Date; end: Date } | null {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (end < start) return null;
  return { start, end };
}

function formatConflictError(conflicts: Awaited<ReturnType<typeof getOverlappingBlockingEvents>>): string {
  const first = conflicts[0];
  const dateLabel = first.startAt.toDateString() === first.endAt.toDateString()
    ? first.startAt.toLocaleDateString()
    : `${first.startAt.toLocaleDateString()} – ${first.endAt.toLocaleDateString()}`;
  const more = conflicts.length > 1 ? ` (and ${conflicts.length - 1} more)` : "";
  return `This overlaps an existing block: "${first.title || first.type.replace("_", " ")}" (${dateLabel})${more}. Adjust the dates or remove the existing block first.`;
}

export async function addCalendarEventAction(artistId: string, input: CalendarEventFormInput): Promise<CalendarActionState> {
  const user = await requireRole(["super_admin", "manager", "editor"]);
  if (!canManageAvailability(user.role)) return { error: "You do not have permission to manage availability." };

  const artist = await getArtistRowById(artistId);
  if (!artist) return { error: "Artist not found." };

  const range = parseRange(input.startAt, input.endAt);
  if (!range) return { error: "Please provide a valid start and end date/time (end must not be before start)." };
  if (!input.title.trim()) return { error: "Please provide a title or client/event name." };

  if (BLOCKING_TYPES.includes(input.type)) {
    const conflicts = await getOverlappingBlockingEvents(artistId, range.start, range.end);
    if (conflicts.length > 0) return { error: formatConflictError(conflicts) };
  }

  await createCalendarEvent(artistId, {
    type: input.type,
    title: input.title.trim(),
    startAt: range.start,
    endAt: range.end,
    venue: input.venue,
    city: input.city,
    country: input.country,
    eventType: input.eventType ?? "EXTERNAL BOOKING",
    notes: input.notes,
    createdByAdminUserId: user.id,
  });

  await logActivity({
    actorAdminUserId: user.id,
    action: "availability.added",
    entityType: "artist",
    entityId: artistId,
    summary: `${user.name} added a ${input.type.replace("_", " ")} block ("${input.title}") for "${artist.stageName || artist.name}".`,
  });

  revalidatePath(`/admin/artists/${artistId}/booking`);
  revalidatePath("/admin");
  return { error: null };
}

export async function updateCalendarEventAction(
  artistId: string,
  eventId: string,
  patch: Partial<CalendarEventFormInput>
): Promise<CalendarActionState> {
  const user = await requireRole(["super_admin", "manager", "editor"]);
  if (!canManageAvailability(user.role)) return { error: "You do not have permission to manage availability." };

  const artist = await getArtistRowById(artistId);
  if (!artist) return { error: "Artist not found." };

  const existing = await getCalendarEventById(eventId);
  if (!existing || existing.artistId !== artistId) return { error: "Availability block not found for this artist." };

  const updatePatch: Partial<CalendarEventInput> = {};
  if (patch.type !== undefined) updatePatch.type = patch.type;
  if (patch.title !== undefined) updatePatch.title = patch.title;
  if (patch.venue !== undefined) updatePatch.venue = patch.venue;
  if (patch.city !== undefined) updatePatch.city = patch.city;
  if (patch.country !== undefined) updatePatch.country = patch.country;
  if (patch.eventType !== undefined) updatePatch.eventType = patch.eventType;
  if (patch.notes !== undefined) updatePatch.notes = patch.notes;
  if (patch.startAt !== undefined || patch.endAt !== undefined) {
    // Falls back to the EXISTING event's own start/end when only one side
    // of the range was sent — previously defaulted a missing side to ""
    // (an unparseable date), which made "update just the start date"
    // always fail with "please provide a valid start and end date/time"
    // even though the caller only meant to change one field. Matches the
    // artist-side action's (already-correct) fallback behavior.
    const range = parseRange(patch.startAt ?? existing.startAt.toISOString(), patch.endAt ?? existing.endAt.toISOString());
    if (!range) return { error: "Please provide a valid start and end date/time." };
    updatePatch.startAt = range.start;
    updatePatch.endAt = range.end;
  }

  const resolvedType = updatePatch.type ?? existing.type;
  if (BLOCKING_TYPES.includes(resolvedType)) {
    const resolvedStart = updatePatch.startAt ?? existing.startAt;
    const resolvedEnd = updatePatch.endAt ?? existing.endAt;
    const conflicts = await getOverlappingBlockingEvents(artistId, resolvedStart, resolvedEnd, eventId);
    if (conflicts.length > 0) return { error: formatConflictError(conflicts) };
  }

  await updateCalendarEvent(eventId, updatePatch);

  await logActivity({
    actorAdminUserId: user.id,
    action: "availability.updated",
    entityType: "artist",
    entityId: artistId,
    summary: `${user.name} updated an availability block for "${artist.stageName || artist.name}".`,
  });

  revalidatePath(`/admin/artists/${artistId}/booking`);
  return { error: null };
}

export async function deleteCalendarEventAction(artistId: string, eventId: string): Promise<CalendarActionState> {
  const user = await requireRole(["super_admin", "manager", "editor"]);
  if (!canManageAvailability(user.role)) return { error: "You do not have permission to manage availability." };

  const artist = await getArtistRowById(artistId);
  if (!artist) return { error: "Artist not found." };

  const existing = await getCalendarEventById(eventId);
  if (!existing || existing.artistId !== artistId) return { error: "Availability block not found for this artist." };

  await deleteCalendarEvent(eventId);

  await logActivity({
    actorAdminUserId: user.id,
    action: "availability.removed",
    entityType: "artist",
    entityId: artistId,
    summary: `${user.name} removed an availability block for "${artist.stageName || artist.name}".`,
  });

  revalidatePath(`/admin/artists/${artistId}/booking`);
  return { error: null };
}
