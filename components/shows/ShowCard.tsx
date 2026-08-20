import { MapPin, Ticket } from "lucide-react";
import type { Show } from "@/types/artist";
import { formatShowDate, SHOW_STATUS_LABEL, SHOW_STATUS_STYLE } from "@/lib/format";
import { cn } from "@/lib/cn";

export function ShowCard({ show }: { show: Show }) {
  const { day, month } = formatShowDate(show.date);
  const link = show.status === "tickets" ? show.ticketUrl : show.detailsUrl;

  return (
    <div className="flex items-center gap-4 border-b border-border-subtle py-5 sm:gap-6 sm:py-6">
      <div className="flex w-14 flex-shrink-0 flex-col items-center leading-none sm:w-16">
        <span className="font-display text-2xl text-foreground sm:text-3xl">{day}</span>
        <span className="mt-1 text-xs font-medium tracking-[0.2em] text-bronze-300">{month}</span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-foreground sm:text-lg">{show.venue}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">
            {show.city}
            {show.country ? `, ${show.country}` : ""} · {show.eventType}
          </span>
        </p>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide whitespace-nowrap",
            SHOW_STATUS_STYLE[show.status]
          )}
        >
          {SHOW_STATUS_LABEL[show.status]}
        </span>
        {link && !show.isPast ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-bronze-300 hover:text-bronze-200"
          >
            <Ticket className="h-3.5 w-3.5" />
            {show.status === "tickets" ? "Tickets" : "Details"}
          </a>
        ) : null}
      </div>
    </div>
  );
}
