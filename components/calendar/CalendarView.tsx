"use client";

import { useMemo, useState, useTransition } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/admin/ui/Button";
import { Input, Label, Select, Textarea, FieldError, FieldHint } from "@/components/admin/ui/FormField";
import {
  addDays,
  addMonths,
  eventOverlapsDay,
  formatDayLabel,
  formatMonthLabel,
  formatWeekRangeLabel,
  getMonthGridDays,
  getWeekDays,
  isSameDay,
  startOfDay,
} from "@/lib/calendar/calendarMath";
import {
  BLOCK_REASONS,
  TYPE_COLOR,
  TYPE_LABEL,
  type CalendarActionResult,
  type CalendarEventFormValues,
  type CalendarEventType,
  type CalendarEventVM,
} from "@/components/calendar/types";

// ---------------------------------------------------------------------------
// The internal Wavelength Calendar — shared renderer for both the Artist
// Portal (/artist/availability) and Admin (an artist's Booking tab). Every
// read/write goes through the onAdd/onUpdate/onDelete callbacks the caller
// supplies, which close over the real Server Actions
// (lib/artist/calendarActions.ts or lib/admin/calendarActions.ts) — this
// component has no idea which one it's talking to, and creates no new
// database access of its own. See ArtistAvailabilityTab.tsx /
// AvailabilityTab.tsx for the two thin wrappers that provide those
// callbacks plus which event types the current viewer may create.
//
// Mobile-first: month view is a touch-sized 7-column grid; week/day are
// simple chronological agenda lists rather than an hour-by-hour grid — see
// KNOWN_ISSUES.md for why that scope call was made. Every tappable element
// is a full-width or generously-padded button, no hover-only affordances.
// ---------------------------------------------------------------------------

type ViewMode = "month" | "week" | "day";

function toLocalDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalDateTimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${toLocalDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface CalendarViewProps {
  events: CalendarEventVM[];
  addableTypes: { value: CalendarEventType; label: string }[];
  onAdd: (input: CalendarEventFormValues) => Promise<CalendarActionResult>;
  onUpdate: (id: string, patch: Partial<CalendarEventFormValues>) => Promise<CalendarActionResult>;
  onDelete: (id: string) => Promise<CalendarActionResult>;
  onOpenBooking?: (bookingId: string) => void;
}

export function CalendarView({ events, addableTypes, onAdd, onUpdate, onDelete, onOpenBooking }: CalendarViewProps) {
  const [view, setView] = useState<ViewMode>("month");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEventVM | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEventVM | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showBlockDate, setShowBlockDate] = useState(false);

  const parsedEvents = useMemo(
    () => events.map((e) => ({ ...e, startAtDate: new Date(e.startAt), endAtDate: new Date(e.endAt) })),
    [events]
  );

  function eventsOnDay(day: Date) {
    return parsedEvents
      .filter((e) => eventOverlapsDay({ startAt: e.startAtDate, endAt: e.endAtDate }, day))
      .sort((a, b) => a.startAtDate.getTime() - b.startAtDate.getTime());
  }

  function step(direction: -1 | 1) {
    if (view === "month") setAnchor((d) => addMonths(d, direction));
    else if (view === "week") setAnchor((d) => addDays(d, direction * 7));
    else setAnchor((d) => addDays(d, direction));
  }

  function openDay(day: Date) {
    setSelectedDate(day);
  }

  const headerLabel =
    view === "month" ? formatMonthLabel(anchor) : view === "week" ? formatWeekRangeLabel(getWeekDays(anchor)) : formatDayLabel(anchor);

  return (
    <div className="space-y-4">
      {/* View switch + navigation — large touch targets, no hover-only controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-[var(--admin-border)] p-0.5">
          {(["month", "week", "day"] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={clsx(
                "rounded px-3 py-1.5 text-sm font-medium capitalize",
                view === v ? "bg-[var(--admin-primary)] text-white" : "text-[var(--admin-text)] hover:bg-slate-100"
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--admin-border)] text-lg hover:bg-slate-50"
          >
            ‹
          </button>
          <p className="min-w-[9rem] text-center text-sm font-medium sm:min-w-[12rem]">{headerLabel}</p>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--admin-border)] text-lg hover:bg-slate-50"
          >
            ›
          </button>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => {
            setSelectedDate(anchor);
            setShowAddEvent(true);
          }}
        >
          + Add Event
        </Button>
      </div>

      <CalendarLegend />

      {view === "month" ? (
        <MonthGrid anchor={anchor} eventsOnDay={eventsOnDay} onDayClick={openDay} today={new Date()} />
      ) : view === "week" ? (
        <AgendaDays days={getWeekDays(anchor)} eventsOnDay={eventsOnDay} onDayClick={openDay} onEventClick={setViewingEvent} today={new Date()} />
      ) : (
        <AgendaDays days={[anchor]} eventsOnDay={eventsOnDay} onDayClick={openDay} onEventClick={setViewingEvent} today={new Date()} />
      )}

      {selectedDate ? (
        <DayDetailPanel
          date={selectedDate}
          events={eventsOnDay(selectedDate)}
          onClose={() => setSelectedDate(null)}
          onEventClick={setViewingEvent}
          onAddEvent={() => setShowAddEvent(true)}
          onBlockDate={() => setShowBlockDate(true)}
        />
      ) : null}

      {viewingEvent ? (
        <EventDetailModal
          event={viewingEvent}
          onClose={() => setViewingEvent(null)}
          onEdit={() => {
            setEditingEvent(viewingEvent);
            setViewingEvent(null);
          }}
          onDelete={async () => {
            const result = await onDelete(viewingEvent.id);
            if (!result.error) setViewingEvent(null);
            return result;
          }}
          onOpenBooking={onOpenBooking}
        />
      ) : null}

      {showAddEvent ? (
        <EventFormModal
          title="Add Event"
          addableTypes={addableTypes}
          initialDate={selectedDate ?? anchor}
          onCancel={() => setShowAddEvent(false)}
          onSubmit={async (values) => {
            const result = await onAdd(values);
            if (!result.error) setShowAddEvent(false);
            return result;
          }}
        />
      ) : null}

      {editingEvent ? (
        <EventFormModal
          title="Edit Event"
          addableTypes={addableTypes}
          initialDate={new Date(editingEvent.startAt)}
          existing={editingEvent}
          onCancel={() => setEditingEvent(null)}
          onSubmit={async (values) => {
            const result = await onUpdate(editingEvent.id, values);
            if (!result.error) setEditingEvent(null);
            return result;
          }}
        />
      ) : null}

      {showBlockDate ? (
        <BlockDateModal
          initialDate={selectedDate ?? anchor}
          onCancel={() => setShowBlockDate(false)}
          onSubmit={async (values) => {
            const result = await onAdd(values);
            if (!result.error) setShowBlockDate(false);
            return result;
          }}
        />
      ) : null}
    </div>
  );
}

function CalendarLegend() {
  const items: CalendarEventType[] = ["available", "booked_platform", "booked_external", "tentative", "unavailable"];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--admin-muted)]">
      {items.map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[t] }} />
          {TYPE_LABEL[t]}
        </span>
      ))}
    </div>
  );
}

function MonthGrid({
  anchor,
  eventsOnDay,
  onDayClick,
  today,
}: {
  anchor: Date;
  eventsOnDay: (d: Date) => Array<CalendarEventVM & { startAtDate: Date; endAtDate: Date }>;
  onDayClick: (d: Date) => void;
  today: Date;
}) {
  const days = getMonthGridDays(anchor);
  const weekdayLabels = days.slice(0, 7).map((d) => d.toLocaleDateString(undefined, { weekday: "short" }));

  return (
    <div className="overflow-hidden rounded-md border border-[var(--admin-border)]">
      <div className="grid grid-cols-7 border-b border-[var(--admin-border)] bg-slate-50 text-center text-xs font-medium text-[var(--admin-muted)]">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = eventsOnDay(day);
          const inMonth = day.getMonth() === anchor.getMonth();
          const isToday = isSameDay(day, today);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick(day)}
              className={clsx(
                "flex min-h-[4.5rem] flex-col items-start gap-1 border-b border-r border-[var(--admin-border)] p-1.5 text-left align-top sm:min-h-[6rem] sm:p-2",
                i % 7 === 6 && "border-r-0",
                !inMonth && "bg-slate-50/60 text-slate-400",
                "hover:bg-slate-50"
              )}
            >
              <span className={clsx("flex h-6 w-6 items-center justify-center rounded-full text-xs", isToday && "bg-[var(--admin-primary)] text-white")}>
                {day.getDate()}
              </span>
              <div className="flex w-full flex-1 flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white sm:text-xs"
                    style={{ backgroundColor: TYPE_COLOR[e.type] }}
                  >
                    {e.title || TYPE_LABEL[e.type]}
                  </span>
                ))}
                {dayEvents.length > 3 ? <span className="text-[10px] text-[var(--admin-muted)]">+{dayEvents.length - 3} more</span> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AgendaDays({
  days,
  eventsOnDay,
  onDayClick,
  onEventClick,
  today,
}: {
  days: Date[];
  eventsOnDay: (d: Date) => Array<CalendarEventVM & { startAtDate: Date; endAtDate: Date }>;
  onDayClick: (d: Date) => void;
  onEventClick: (e: CalendarEventVM) => void;
  today: Date;
}) {
  return (
    <div className="space-y-3">
      {days.map((day) => {
        const dayEvents = eventsOnDay(day);
        return (
          <div key={day.toISOString()} className="rounded-md border border-[var(--admin-border)]">
            <button
              type="button"
              onClick={() => onDayClick(day)}
              className="flex w-full items-center justify-between border-b border-[var(--admin-border)] bg-slate-50 px-3 py-2 text-left text-sm font-medium hover:bg-slate-100"
            >
              <span className={clsx(isSameDay(day, today) && "text-[var(--admin-primary)]")}>
                {day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              </span>
              <span className="text-xs font-normal text-[var(--admin-muted)]">+ Add</span>
            </button>
            <div className="divide-y divide-[var(--admin-border)]">
              {dayEvents.length === 0 ? (
                <p className="px-3 py-3 text-sm text-[var(--admin-muted)]">Nothing scheduled.</p>
              ) : (
                dayEvents.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onEventClick(e)}
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: TYPE_COLOR[e.type] }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--admin-text)]">{e.title || TYPE_LABEL[e.type]}</span>
                      <span className="block text-xs text-[var(--admin-muted)]">
                        {e.startAtDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} –{" "}
                        {e.endAtDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {TYPE_LABEL[e.type]}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayDetailPanel({
  date,
  events,
  onClose,
  onEventClick,
  onAddEvent,
  onBlockDate,
}: {
  date: Date;
  events: Array<CalendarEventVM & { startAtDate: Date; endAtDate: Date }>;
  onClose: () => void;
  onEventClick: (e: CalendarEventVM) => void;
  onAddEvent: () => void;
  onBlockDate: () => void;
}) {
  return (
    <div className="rounded-md border border-[var(--admin-border)] bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--admin-text)]">{formatDayLabel(date)}</p>
        <button type="button" onClick={onClose} className="text-sm text-[var(--admin-muted)] hover:text-[var(--admin-text)]">
          Close
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {events.length === 0 ? (
          <p className="text-sm text-[var(--admin-muted)]">Nothing scheduled on this date.</p>
        ) : (
          events.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onEventClick(e)}
              className="flex w-full items-start gap-3 rounded-md border border-[var(--admin-border)] bg-white px-3 py-2.5 text-left hover:bg-slate-50"
            >
              <span className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: TYPE_COLOR[e.type] }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[var(--admin-text)]">{e.title || TYPE_LABEL[e.type]}</span>
                <span className="block text-xs text-[var(--admin-muted)]">
                  {e.startAtDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} –{" "}
                  {e.endAtDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {TYPE_LABEL[e.type]}
                </span>
              </span>
            </button>
          ))
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onAddEvent}>
          + Add Event
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onBlockDate}>
          + Block Date
        </Button>
      </div>
    </div>
  );
}

function ModalShell({ title, children, onCancel }: { title: string; children: React.ReactNode; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-lg bg-white p-5 shadow-lg sm:max-w-lg sm:rounded-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--admin-text)]">{title}</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-xl leading-none text-[var(--admin-muted)] hover:text-[var(--admin-text)]">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EventDetailModal({
  event,
  onClose,
  onEdit,
  onDelete,
  onOpenBooking,
}: {
  event: CalendarEventVM;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => Promise<CalendarActionResult>;
  onOpenBooking?: (bookingId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);

  return (
    <ModalShell title={event.title || TYPE_LABEL[event.type]} onCancel={onClose}>
      <div className="space-y-3 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: TYPE_COLOR[event.type] }}>
          {TYPE_LABEL[event.type]}
        </span>
        <p>
          <span className="text-[var(--admin-muted)]">When:</span> {start.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} –{" "}
          {end.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </p>
        {[event.venue, event.city, event.country].filter(Boolean).length > 0 ? (
          <p>
            <span className="text-[var(--admin-muted)]">Location:</span> {[event.venue, event.city, event.country].filter(Boolean).join(", ")}
          </p>
        ) : null}
        {event.notes ? (
          <p>
            <span className="text-[var(--admin-muted)]">Notes:</span> {event.notes}
          </p>
        ) : null}
        {event.bookingId ? <p className="text-xs italic text-[var(--admin-muted)]">Generated from a confirmed booking.</p> : null}
        <FieldError>{error}</FieldError>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        {event.bookingId && onOpenBooking ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => onOpenBooking(event.bookingId as string)}>
            Open booking
          </Button>
        ) : null}
        {event.editable ? (
          <>
            <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await onDelete();
                  if (result.error) setError(result.error);
                });
              }}
            >
              {isPending ? "Removing…" : "Delete"}
            </Button>
          </>
        ) : null}
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </ModalShell>
  );
}

function EventFormModal({
  title,
  addableTypes,
  initialDate,
  existing,
  onCancel,
  onSubmit,
}: {
  title: string;
  addableTypes: { value: CalendarEventType; label: string }[];
  initialDate: Date;
  existing?: CalendarEventVM;
  onCancel: () => void;
  onSubmit: (values: CalendarEventFormValues) => Promise<CalendarActionResult>;
}) {
  const defaultStart = existing
    ? new Date(existing.startAt)
    : (() => {
        const d = new Date(initialDate);
        d.setHours(new Date().getHours() + 1, 0, 0, 0);
        return d;
      })();
  const defaultEnd = existing ? new Date(existing.endAt) : new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);

  const [type, setType] = useState<CalendarEventType>(existing?.type ?? addableTypes[0]?.value ?? "booked_external");
  const [eventTitle, setEventTitle] = useState(existing?.title ?? "");
  const [startAt, setStartAt] = useState(toLocalDateTimeInput(defaultStart));
  const [endAt, setEndAt] = useState(toLocalDateTimeInput(defaultEnd));
  const [venue, setVenue] = useState(existing?.venue ?? "");
  const [city, setCity] = useState(existing?.city ?? "");
  const [country, setCountry] = useState(existing?.country ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await onSubmit({
        type,
        title: eventTitle,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        venue,
        city,
        country,
        notes,
      });
      if (result.error) setError(result.error);
    });
  }

  return (
    <ModalShell title={title} onCancel={onCancel}>
      <div className="space-y-3">
        <div>
          <Label htmlFor="evType">Type</Label>
          <Select id="evType" value={type} onChange={(e) => setType(e.target.value as CalendarEventType)}>
            {addableTypes.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="evTitle">Title (client / event name)</Label>
          <Input id="evTitle" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g. Private Event" required />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="evStart">Start</Label>
            <Input id="evStart" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="evEnd">End</Label>
            <Input id="evEnd" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="evVenue">Venue</Label>
            <Input id="evVenue" value={venue} onChange={(e) => setVenue(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="evCity">City</Label>
            <Input id="evCity" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="evCountry">Country</Label>
            <Input id="evCountry" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="evNotes">Notes</Label>
          <Textarea id="evNotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <FieldError>{error}</FieldError>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={submit} disabled={isPending || !eventTitle.trim()}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </ModalShell>
  );
}

function BlockDateModal({
  initialDate,
  onCancel,
  onSubmit,
}: {
  initialDate: Date;
  onCancel: () => void;
  onSubmit: (values: CalendarEventFormValues) => Promise<CalendarActionResult>;
}) {
  const [startDate, setStartDate] = useState(toLocalDateInput(initialDate));
  const [endDate, setEndDate] = useState(toLocalDateInput(initialDate));
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState<(typeof BLOCK_REASONS)[number]["value"]>("Unavailable");
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (!allDay && endDate !== startDate) {
      setError("A specific time range can only be set for a single date — turn on \"All day\" to block a range of dates.");
      return;
    }
    const title = reason === "Other" ? customReason.trim() || "Blocked" : reason;
    const start = allDay ? `${startDate}T00:00` : `${startDate}T${startTime}`;
    const end = allDay ? `${endDate}T23:59` : `${startDate}T${endTime}`;

    startTransition(async () => {
      const result = await onSubmit({
        type: "unavailable",
        title,
        startAt: new Date(start).toISOString(),
        endAt: new Date(end).toISOString(),
        notes: reason === "Other" ? customReason.trim() : reason,
      });
      if (result.error) setError(result.error);
    });
  }

  return (
    <ModalShell title="Block Date" onCancel={onCancel}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="blockStart">Date</Label>
            <Input id="blockStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="blockEnd">Through (for a multi-day block)</Label>
            <Input id="blockEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="h-5 w-5 rounded border-[var(--admin-border)]" />
          All day
        </label>

        {!allDay ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="blockStartTime">Start time</Label>
              <Input id="blockStartTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="blockEndTime">End time</Label>
              <Input id="blockEndTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        ) : null}

        <div>
          <Label htmlFor="blockReason">Reason</Label>
          <Select id="blockReason" value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>
            {BLOCK_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
        {reason === "Other" ? (
          <div>
            <Label htmlFor="blockCustomReason">Details</Label>
            <Input id="blockCustomReason" value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Optional" />
          </div>
        ) : null}
        <FieldHint>This immediately makes these dates unavailable to public booking.</FieldHint>
        <FieldError>{error}</FieldError>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={submit} disabled={isPending}>
          {isPending ? "Blocking…" : "Block Date"}
        </Button>
      </div>
    </ModalShell>
  );
}
