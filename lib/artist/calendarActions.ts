"use server";

import { revalidatePath } from "next/cache";
import { requireArtistSessionForAction } from "@/lib/artist/session";
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
// Artist Portal availability actions — Sprint 5.
//
// Reuses the same lib/repositories/calendar.ts functions the admin
// calendar actions use — no duplicated calendar logic. What's different
// here is authorization: the artist's own id (from the session, never a
// client-supplied value) is the only artistId these can ever act on, and an
// artist may only edit/delete a block if THEY created it
// (createdByArtistUserId matches their own artist_users id). A
// system-generated event (bookingId set, from a confirmed booking) or a
// block an admin entered manually can be viewed here but never
// edited/deleted by the artist — "do not allow an artist to modify a
// confirmed booking created by admin".
// ---------------------------------------------------------------------------

const ARTIST_ALLOWED_TYPES: CalendarEventInput["type"][] = ["booked_external", "tentative", "unavailable"];

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

export interface ArtistCalendarActionState {
  error: string | null;
}

export async function artistAddCalendarEventAction(input: CalendarEventFormInput): Promise<ArtistCalendarActionState> {
  const user = await requireArtistSessionForAction();
  const artist = await getArtistRowById(user.artistId);
  if (!artist) return { error: "Artist profile not found." };

  if (!ARTIST_ALLOWED_TYPES.includes(input.type)) {
    return { error: "Artists can only add external bookings, tentative holds, or unavailable blocks." };
  }
  const range = parseRange(input.startAt, input.endAt);
  if (!range) return { error: "Please provide a valid start and end date/time (end must not be before start)." };
  if (!input.title.trim()) return { error: "Please provide a title or client/event name." };

  if (BLOCKING_TYPES.includes(input.type)) {
    const conflicts = await getOverlappingBlockingEvents(user.artistId, range.start, range.end);
    if (conflicts.length > 0) return { error: formatConflictError(conflicts) };
  }

  await createCalendarEvent(user.artistId, {
    type: input.type,
    title: input.title.trim(),
    startAt: range.start,
    endAt: range.end,
    venue: input.venue,
    city: input.city,
    country: input.country,
    eventType: input.eventType ?? (input.type === "booked_external" ? "EXTERNAL BOOKING" : ""),
    notes: input.notes,
    createdByArtistUserId: user.artistUserId,
  });

  await logActivity({
    actorAdminUserId: null,
    action: "availability.added",
    entityType: "artist",
    entityId: user.artistId,
    summary: `${artist.stageName || artist.name} added a ${input.type.replace("_", " ")} block ("${input.title}") via the artist portal.`,
    metadata: { artistUserId: user.artistUserId },
  });

  revalidatePath("/artist/availability");
  revalidatePath("/admin");
  return { error: null };
}

export async function artistUpdateCalendarEventAction(
  eventId: string,
  patch: Partial<CalendarEventFormInput>
): Promise<ArtistCalendarActionState> {
  const user = await requireArtistSessionForAction();
  const artist = await getArtistRowById(user.artistId);
  if (!artist) return { error: "Artist profile not found." };

  const existing = await getCalendarEventById(eventId);
  if (!existing || existing.artistId !== user.artistId) return { error: "Availability block not found." };
  if (existing.bookingId || existing.createdByArtistUserId !== user.artistUserId) {
    return { error: "You can only edit availability blocks you created yourself." };
  }

  const updatePatch: Partial<CalendarEventInput> = {};
  if (patch.type !== undefined) {
    if (!ARTIST_ALLOWED_TYPES.includes(patch.type)) return { error: "Invalid block type." };
    updatePatch.type = patch.type;
  }
  if (patch.title !== undefined) updatePatch.title = patch.title;
  if (patch.venue !== undefined) updatePatch.venue = patch.venue;
  if (patch.city !== undefined) updatePatch.city = patch.city;
  if (patch.country !== undefined) updatePatch.country = patch.country;
  if (patch.notes !== undefined) updatePatch.notes = patch.notes;
  if (patch.startAt !== undefined || patch.endAt !== undefined) {
    const range = parseRange(patch.startAt ?? existing.startAt.toISOString(), patch.endAt ?? existing.endAt.toISOString());
    if (!range) return { error: "Please provide a valid start and end date/time." };
    updatePatch.startAt = range.start;
    updatePatch.endAt = range.end;
  }

  const resolvedType = updatePatch.type ?? existing.type;
  if (BLOCKING_TYPES.includes(resolvedType)) {
    const resolvedStart = updatePatch.startAt ?? existing.startAt;
    const resolvedEnd = updatePatch.endAt ?? existing.endAt;
    const conflicts = await getOverlappingBlockingEvents(user.artistId, resolvedStart, resolvedEnd, eventId);
    if (conflicts.length > 0) return { error: formatConflictError(conflicts) };
  }

  await updateCalendarEvent(eventId, updatePatch);

  await logActivity({
    actorAdminUserId: null,
    action: "availability.updated",
    entityType: "artist",
    entityId: user.artistId,
    summary: `${artist.stageName || artist.name} updated an availability block via the artist portal.`,
  });

  revalidatePath("/artist/availability");
  return { error: null };
}

export async function artistDeleteCalendarEventAction(eventId: string): Promise<ArtistCalendarActionState> {
  const user = await requireArtistSessionForAction();
  const artist = await getArtistRowById(user.artistId);
  if (!artist) return { error: "Artist profile not found." };

  const existing = await getCalendarEventById(eventId);
  if (!existing || existing.artistId !== user.artistId) return { error: "Availability block not found." };
  if (existing.bookingId || existing.createdByArtistUserId !== user.artistUserId) {
    return { error: "You can only remove availability blocks you created yourself." };
  }

  await deleteCalendarEvent(eventId);

  await logActivity({
    actorAdminUserId: null,
    action: "availability.removed",
    entityType: "artist",
    entityId: user.artistId,
    summary: `${artist.stageName || artist.name} removed an availability block via the artist portal.`,
  });

  revalidatePath("/artist/availability");
  revalidatePath("/admin");
  return { error: null };
}
