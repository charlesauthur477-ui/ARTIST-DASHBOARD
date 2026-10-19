import "server-only";

// ---------------------------------------------------------------------------
// Minimal ICS (iCalendar, RFC 5545) support — Calendar Integration Phase 1.
//
// Hand-written rather than a new npm dependency: the surface area we
// actually need is narrow (read DTSTART/DTEND for inbound Apple/iCloud
// subscription import; write simple VEVENTs for the outbound Wavelength
// feed), and it keeps this project's dependency list unchanged.
//
// KNOWN LIMITATION (documented in KNOWN_ISSUES.md): parseIcsBusyPeriods
// does not expand RRULE (recurring events). A recurring personal event
// (e.g. a weekly rehearsal) will only be read from any single VEVENT block
// that literally contains its own DTSTART/DTEND — most calendar exports
// emit one VEVENT per occurrence within the requested export window, which
// covers the common case, but a bare RRULE without expanded instances will
// be skipped rather than guessed at. Fine for Phase 1's "reduce obviously
// double-booked dates" goal; flagged as a follow-up if it proves to matter.
// ---------------------------------------------------------------------------

function unfoldIcsLines(raw: string): string[] {
  // RFC 5545 line folding: a continuation line starts with a single space
  // or tab and should be joined to the previous line.
  const rawLines = raw.split(/\r\n|\n|\r/);
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function parseIcsDate(value: string, params: string): Date | null {
  // All-day (VALUE=DATE): "20260914"
  if (params.includes("VALUE=DATE") || /^\d{8}$/.test(value)) {
    const y = Number(value.slice(0, 4));
    const m = Number(value.slice(4, 6));
    const d = Number(value.slice(6, 8));
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m - 1, d));
  }
  // "20260914T140000Z" or "20260914T140000"
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi, s, z] = match;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${z ? "Z" : ""}`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export interface ParsedBusyPeriod {
  start: Date;
  end: Date;
}

export interface IcsParseResult {
  events: ParsedBusyPeriod[];
  skippedRecurring: number;
}

/**
 * Extracts busy [start, end) periods from raw ICS text. Deliberately
 * discards SUMMARY/DESCRIPTION/LOCATION — Phase 1's privacy-first default
 * only ever needs to know an artist is busy, never what the event is, so
 * we never even keep the title in memory past this parse step.
 */
export function parseIcsBusyPeriods(raw: string): IcsParseResult {
  const lines = unfoldIcsLines(raw);
  const events: ParsedBusyPeriod[] = [];
  let skippedRecurring = 0;

  let inEvent = false;
  let start: Date | null = null;
  let end: Date | null = null;
  let hasRRule = false;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      start = null;
      end = null;
      hasRRule = false;
      continue;
    }
    if (line === "END:VEVENT") {
      if (inEvent && start && end && !hasRRule) {
        events.push({ start, end });
      } else if (inEvent && hasRRule) {
        skippedRecurring++;
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx);
    const value = line.slice(colonIdx + 1);
    const [name, ...paramParts] = key.split(";");
    const params = paramParts.join(";");

    if (name === "DTSTART") start = parseIcsDate(value, params);
    else if (name === "DTEND") end = parseIcsDate(value, params);
    else if (name === "RRULE") hasRRule = true;
  }

  return { events, skippedRecurring };
}

function formatIcsDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export interface IcsOutboundEvent {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
}

/**
 * Builds a simple, valid ICS document — used both for the outbound
 * per-artist "Wavelength Calendar" subscription feed and for a single
 * confirmed booking's "Add to Calendar" download.
 */
export function generateIcsFeed(calendarName: string, events: IcsOutboundEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wavelength//Artist Calendar//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
  ];
  const now = formatIcsDateTime(new Date());
  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatIcsDateTime(event.start)}`,
      `DTEND:${formatIcsDateTime(event.end)}`,
      `SUMMARY:${escapeIcsText(event.summary)}`
    );
    if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
