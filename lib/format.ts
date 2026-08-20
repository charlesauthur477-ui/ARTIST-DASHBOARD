import type { ShowStatus } from "@/types/artist";

export function formatShowDate(iso: string): { day: string; month: string; year: string; full: string } {
  const date = new Date(`${iso}T00:00:00`);
  const day = date.toLocaleDateString("en-US", { day: "2-digit" });
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const year = date.toLocaleDateString("en-US", { year: "numeric" });
  const full = date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  return { day, month, year, full };
}

export function formatReleaseDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const SHOW_STATUS_LABEL: Record<ShowStatus, string> = {
  available: "Available",
  tickets: "Tickets",
  "sold-out": "Sold Out",
  "private-event": "Private Event",
  booked: "Booked",
};

export const SHOW_STATUS_STYLE: Record<ShowStatus, string> = {
  available: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  tickets: "text-bronze-300 border-bronze-400/30 bg-bronze-400/10",
  "sold-out": "text-neutral-400 border-neutral-500/30 bg-neutral-500/10",
  "private-event": "text-neutral-300 border-neutral-400/30 bg-neutral-400/10",
  booked: "text-neutral-400 border-neutral-500/30 bg-neutral-500/10",
};
