"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, MapPin, Clock, User, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/admin/ui/Button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/admin/ui/FormField";
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
  TYPE_COLOR,
  TYPE_LABEL,
  type CalendarEventType,
} from "@/components/calendar/types";
import {
  addCalendarEventAction,
  deleteCalendarEventAction,
} from "@/lib/admin/calendarActions";

export interface MasterEventVM {
  id: string;
  artistId: string;
  artistName: string;
  artistStageName: string;
  artistSlug: string;
  type: CalendarEventType;
  title: string;
  startAt: string; // ISO
  endAt: string; // ISO
  venue: string;
  city: string;
  country: string;
  eventType: string;
  notes: string;
  bookingId: string | null;
}

export interface ArtistOption {
  id: string;
  name: string;
  stageName: string;
  slug: string;
}

interface MasterCalendarClientProps {
  events: MasterEventVM[];
  artists: ArtistOption[];
  canManage: boolean;
}

type ViewMode = "month" | "week" | "day";

function toLocalDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalDateTimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${toLocalDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRange(start: Date, end: Date): string {
  const sameDay = isSameDay(start, end);
  const timeOpts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const dateOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  if (sameDay) {
    return `${start.toLocaleDateString(undefined, dateOpts)} · ${start.toLocaleTimeString([], timeOpts)} – ${end.toLocaleTimeString([], timeOpts)}`;
  }
  return `${start.toLocaleDateString(undefined, dateOpts)} – ${end.toLocaleDateString(undefined, dateOpts)}`;
}

// Generate consistent soft badge colors per artist
const ARTIST_BADGE_COLORS = [
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-violet-50 text-violet-700 border-violet-200",
];

function getArtistBadgeStyle(artistId: string): string {
  let hash = 0;
  for (let i = 0; i < artistId.length; i++) hash = (hash * 31 + artistId.charCodeAt(i)) >>> 0;
  return ARTIST_BADGE_COLORS[hash % ARTIST_BADGE_COLORS.length];
}

export function MasterCalendarClient({ events, artists, canManage }: MasterCalendarClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedArtistId, setSelectedArtistId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("month");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));

  const [activeModalEvent, setActiveModalEvent] = useState<MasterEventVM | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form state for Add modal
  const [formArtistId, setFormArtistId] = useState<string>(artists[0]?.id ?? "");
  const [formType, setFormType] = useState<CalendarEventType>("booked_external");
  const [formTitle, setFormTitle] = useState("");
  const [formStartAt, setFormStartAt] = useState(() => toLocalDateTimeInput(new Date()));
  const [formEndAt, setFormEndAt] = useState(() => {
    const end = new Date();
    end.setHours(end.getHours() + 3);
    return toLocalDateTimeInput(end);
  });
  const [formVenue, setFormVenue] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const parsedEvents = useMemo(() => {
    return events
      .filter((e) => {
        if (selectedArtistId !== "all" && e.artistId !== selectedArtistId) return false;
        if (selectedType !== "all" && e.type !== selectedType) return false;
        return true;
      })
      .map((e) => ({
        ...e,
        startAtDate: new Date(e.startAt),
        endAtDate: new Date(e.endAt),
      }));
  }, [events, selectedArtistId, selectedType]);

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

  const headerLabel =
    view === "month"
      ? formatMonthLabel(anchor)
      : view === "week"
      ? formatWeekRangeLabel(getWeekDays(anchor))
      : formatDayLabel(anchor);

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!formArtistId) {
      setFormError("Please select an artist.");
      return;
    }
    if (!formTitle.trim()) {
      setFormError("Please enter a title or event name.");
      return;
    }

    startTransition(async () => {
      const result = await addCalendarEventAction(formArtistId, {
        type: formType,
        title: formTitle.trim(),
        startAt: new Date(formStartAt).toISOString(),
        endAt: new Date(formEndAt).toISOString(),
        venue: formVenue.trim() || undefined,
        city: formCity.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });

      if (result.error) {
        setFormError(result.error);
      } else {
        setShowAddModal(false);
        setFormTitle("");
        setFormVenue("");
        setFormCity("");
        setFormNotes("");
        router.refresh();
      }
    });
  }

  async function handleDeleteEvent(event: MasterEventVM) {
    if (!confirm(`Are you sure you want to delete this event ("${event.title}")?`)) return;
    setDeleteError(null);

    startTransition(async () => {
      const result = await deleteCalendarEventAction(event.artistId, event.id);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        setActiveModalEvent(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[180px]">
            <Select
              value={selectedArtistId}
              onChange={(e) => setSelectedArtistId(e.target.value)}
              className="text-sm font-medium"
            >
              <option value="all">All Artists ({artists.length})</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.stageName || a.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="min-w-[180px]">
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-sm font-medium"
            >
              <option value="all">All Event Types</option>
              <option value="booked_platform">Confirmed Platform Bookings</option>
              <option value="booked_external">External Bookings</option>
              <option value="tentative">Tentative Holds</option>
              <option value="unavailable">Blocked / Unavailable</option>
              <option value="available">Explicitly Available</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFormError(null);
                setShowAddModal(true);
              }}
            >
              <Plus size={16} />
              Add Event / Block
            </Button>
          )}

          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setView("month")}
              className={clsx(
                "rounded-md px-3 py-1.5 transition-colors",
                view === "month" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              className={clsx(
                "rounded-md px-3 py-1.5 transition-colors",
                view === "week" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setView("day")}
              className={clsx(
                "rounded-md px-3 py-1.5 transition-colors",
                view === "day" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Day
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={() => setAnchor(startOfDay(new Date()))}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => step(-1)}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50"
              aria-label="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50"
              aria-label="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Date Header Title */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{headerLabel}</h2>
        <span className="text-xs text-slate-500">
          Showing {parsedEvents.length} {parsedEvents.length === 1 ? "event" : "events"}
        </span>
      </div>

      {/* Calendar Views */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {/* MONTH VIEW */}
        {view === "month" && (
          <div>
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2.5">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
              {getMonthGridDays(anchor).map((day, idx) => {
                const dayEvents = eventsOnDay(day);
                const isCurrentMonth = day.getMonth() === anchor.getMonth();
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={idx}
                    className={clsx(
                      "min-h-[110px] p-1.5 transition-colors",
                      !isCurrentMonth ? "bg-slate-50/60 text-slate-400" : "bg-white",
                      isToday && "bg-amber-50/30 ring-1 ring-amber-400/50 inset-0"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1 px-1">
                      <span
                        className={clsx(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                          isToday
                            ? "bg-[var(--admin-primary,#2563eb)] text-white"
                            : isCurrentMonth
                            ? "text-slate-800"
                            : "text-slate-400"
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-medium text-slate-400">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      {dayEvents.slice(0, 3).map((event) => {
                        const artistName = event.artistStageName || event.artistName;
                        return (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => setActiveModalEvent(event)}
                            className="group flex flex-col items-start rounded border border-slate-200/80 bg-slate-50 px-1.5 py-1 text-left text-[11px] leading-tight transition-all hover:border-slate-300 hover:bg-slate-100 shadow-2xs"
                          >
                            <div className="flex w-full items-center justify-between gap-1">
                              <span
                                className="inline-block h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: TYPE_COLOR[event.type] }}
                              />
                              <span className="truncate font-semibold text-slate-800 max-w-[90px]">
                                {artistName}
                              </span>
                            </div>
                            <span className="truncate text-[10px] text-slate-500 w-full mt-0.5">
                              {event.title}
                            </span>
                          </button>
                        );
                      })}

                      {dayEvents.length > 3 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAnchor(day);
                            setView("day");
                          }}
                          className="rounded px-1.5 py-0.5 text-left text-[10px] font-medium text-[var(--admin-primary,#2563eb)] hover:underline"
                        >
                          +{dayEvents.length - 3} more...
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {view === "week" && (
          <div className="divide-y divide-slate-200">
            {getWeekDays(anchor).map((day, idx) => {
              const dayEvents = eventsOnDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  className={clsx(
                    "flex flex-col gap-3 p-4 md:flex-row md:items-start",
                    isToday ? "bg-amber-50/20" : "bg-white"
                  )}
                >
                  <div className="w-40 shrink-0">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-sm font-semibold",
                        isToday ? "bg-[var(--admin-primary,#2563eb)] text-white" : "text-slate-800"
                      )}
                    >
                      {day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <p className="mt-1 text-xs text-slate-400">
                      {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
                    </p>
                  </div>

                  <div className="flex-1">
                    {dayEvents.length === 0 ? (
                      <p className="py-2 text-xs italic text-slate-400">No events scheduled.</p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => setActiveModalEvent(event)}
                            className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-slate-300 hover:bg-slate-100"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={clsx(
                                  "rounded px-2 py-0.5 text-[10px] font-semibold border",
                                  getArtistBadgeStyle(event.artistId)
                                )}
                              >
                                {event.artistStageName || event.artistName}
                              </span>
                              <span
                                className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                                style={{ backgroundColor: TYPE_COLOR[event.type] }}
                              >
                                {TYPE_LABEL[event.type]}
                              </span>
                            </div>
                            <h4 className="mt-2 text-xs font-semibold text-slate-900 truncate">{event.title}</h4>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {formatRange(event.startAtDate, event.endAtDate)}
                            </p>
                            {(event.venue || event.city) && (
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                                <MapPin size={12} className="shrink-0" />
                                <span className="truncate">{[event.venue, event.city].filter(Boolean).join(", ")}</span>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DAY VIEW */}
        {view === "day" && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">{formatDayLabel(anchor)}</h3>
            </div>

            {(() => {
              const dayEvents = eventsOnDay(anchor);
              if (dayEvents.length === 0) {
                return (
                  <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-slate-400">
                    <CalendarIcon size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">No events on this date</p>
                    <p className="mt-1 text-xs text-slate-400">All roster artists are free on this date.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setActiveModalEvent(event)}
                      className="flex cursor-pointer flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-slate-100/80 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={clsx(
                              "rounded px-2.5 py-0.5 text-xs font-semibold border",
                              getArtistBadgeStyle(event.artistId)
                            )}
                          >
                            {event.artistStageName || event.artistName}
                          </span>
                          <span
                            className="rounded px-2 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: TYPE_COLOR[event.type] }}
                          >
                            {TYPE_LABEL[event.type]}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900">{event.title}</h4>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={13} />
                            {formatRange(event.startAtDate, event.endAtDate)}
                          </span>
                          {(event.venue || event.city) && (
                            <span className="flex items-center gap-1">
                              <MapPin size={13} />
                              {[event.venue, event.city].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setActiveModalEvent(event)}>
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* EVENT DETAILS MODAL */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span
                  className="inline-block rounded px-2 py-0.5 text-xs font-medium text-white mb-2"
                  style={{ backgroundColor: TYPE_COLOR[activeModalEvent.type] }}
                >
                  {TYPE_LABEL[activeModalEvent.type]}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{activeModalEvent.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalEvent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <User size={16} className="text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-900">Artist:</span>
                <span>{activeModalEvent.artistStageName || activeModalEvent.artistName}</span>
                <Link
                  href={`/admin/artists/${activeModalEvent.artistId}/booking`}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-[var(--admin-primary,#2563eb)] hover:underline"
                >
                  Artist Booking Tab <ExternalLink size={12} />
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-900">Timing:</span>
                <span>
                  {formatRange(new Date(activeModalEvent.startAt), new Date(activeModalEvent.endAt))}
                </span>
              </div>

              {(activeModalEvent.venue || activeModalEvent.city) && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-900">Location:</span>
                  <span>
                    {[activeModalEvent.venue, activeModalEvent.city, activeModalEvent.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}

              {activeModalEvent.notes && (
                <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                  <strong className="block text-slate-700 mb-1">Notes / Instructions:</strong>
                  {activeModalEvent.notes}
                </div>
              )}

              {activeModalEvent.bookingId && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3">
                  <p className="text-xs font-semibold text-blue-900">Linked Platform Booking</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    This block was automatically generated from a confirmed client booking.
                  </p>
                  <Link
                    href={`/admin/bookings/${activeModalEvent.bookingId}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 hover:underline"
                  >
                    Open Booking Page <ExternalLink size={13} />
                  </Link>
                </div>
              )}

              {deleteError && <FieldError>{deleteError}</FieldError>}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                {canManage && !activeModalEvent.bookingId && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteEvent(activeModalEvent)}
                    disabled={isPending}
                  >
                    <Trash2 size={14} />
                    Delete Event
                  </Button>
                )}
              </div>

              <Button variant="secondary" size="sm" onClick={() => setActiveModalEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADD EVENT / BLOCK DATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add Calendar Event / Block</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="add-artist">Artist *</Label>
                <Select
                  id="add-artist"
                  value={formArtistId}
                  onChange={(e) => setFormArtistId(e.target.value)}
                  required
                >
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.stageName || a.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="add-type">Event Type *</Label>
                  <Select
                    id="add-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CalendarEventType)}
                  >
                    <option value="booked_external">External Booking</option>
                    <option value="tentative">Tentative Hold</option>
                    <option value="unavailable">Unavailable / Blocked</option>
                    <option value="available">Explicitly Available</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="add-title">Title / Name *</Label>
                  <Input
                    id="add-title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Festival Headliner, Studio"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="add-start">Start Date & Time *</Label>
                  <Input
                    id="add-start"
                    type="datetime-local"
                    value={formStartAt}
                    onChange={(e) => setFormStartAt(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="add-end">End Date & Time *</Label>
                  <Input
                    id="add-end"
                    type="datetime-local"
                    value={formEndAt}
                    onChange={(e) => setFormEndAt(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="add-venue">Venue</Label>
                  <Input
                    id="add-venue"
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder="e.g. Royal Arena"
                  />
                </div>

                <div>
                  <Label htmlFor="add-city">City</Label>
                  <Input
                    id="add-city"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. London"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="add-notes">Internal Notes</Label>
                <Textarea
                  id="add-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notes for management team..."
                  rows={2}
                />
              </div>

              {formError && <FieldError>{formError}</FieldError>}

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Create Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
