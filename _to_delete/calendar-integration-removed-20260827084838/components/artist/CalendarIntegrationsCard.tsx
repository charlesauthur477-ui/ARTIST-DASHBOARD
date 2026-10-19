"use client";

import { useState, useTransition } from "react";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Input, Label, FieldError, FieldHint } from "@/components/admin/ui/FormField";
import {
  artistConnectIcsAction,
  artistDisconnectCalendarAction,
  artistListGoogleCalendarsAction,
  artistRegenerateCalendarFeedTokenAction,
  artistSetGoogleCalendarAction,
  artistSyncCalendarNowAction,
  type GoogleCalendarOption,
} from "@/lib/artist/calendarIntegrationActions";

// ---------------------------------------------------------------------------
// Artist Portal → Availability → "Calendar Integrations" — Calendar
// Integration Phase 1. This component only ever imports Server Actions
// directly (never receives one as a prop from a Server Component) — same
// pattern as ChangePasswordForm/ArtistAvailabilityTab, which sidesteps the
// "function can't cross the Server->Client boundary" class of bug found and
// fixed in the earlier Artist Portal navigation audit.
//
// Mobile/PWA-ready per spec section J: single-column stacked provider
// cards, buttons sized for touch, no hover-only affordances required to
// use anything here.
// ---------------------------------------------------------------------------

export interface ConnectionSummary {
  id: string;
  provider: "google" | "apple_ics";
  status: "connected" | "disconnected" | "error";
  externalAccountEmail: string | null;
  externalCalendarLabel: string | null;
  lastSyncedAt: string | null;
  lastSyncStatus: string;
  lastSyncError: string | null;
}

const CALENDAR_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google Calendar isn't set up on this server yet — an admin needs to add Google API credentials.",
  google_denied: "Google Calendar connection was cancelled.",
  google_oauth_error: "Google reported an error during sign-in. Please try again.",
  google_invalid_state: "That connection attempt expired or was invalid. Please try again.",
  google_no_calendars: "We couldn't find any calendars on that Google account.",
  google_connect_failed: "Something went wrong connecting Google Calendar. Please try again.",
  artist_not_found: "Your artist profile could not be found.",
};

function formatLastSynced(iso: string | null): string {
  if (!iso) return "Never synced";
  const date = new Date(iso);
  return `Last synced ${date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`;
}

function StatusBadge({ status }: { status: ConnectionSummary["status"] }) {
  if (status === "connected") return <Badge tone="success">Connected</Badge>;
  if (status === "error") return <Badge tone="danger">Needs attention</Badge>;
  return <Badge tone="neutral">Not connected</Badge>;
}

export function CalendarIntegrationsCard({
  googleConfigured,
  connections,
  feedUrl,
  calendarError,
  calendarConnected,
}: {
  googleConfigured: boolean;
  connections: ConnectionSummary[];
  feedUrl: string;
  calendarError?: string;
  calendarConnected?: string;
}) {
  const google = connections.find((c) => c.provider === "google") ?? null;
  const ics = connections.find((c) => c.provider === "apple_ics") ?? null;

  return (
    <Card>
      <CardHeader>
        <p className="font-medium">Calendar Integrations</p>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Connect your personal calendar to automatically detect dates and times when you&rsquo;re already busy.
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        {calendarError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {CALENDAR_ERROR_MESSAGES[calendarError] ?? "Something went wrong connecting your calendar."}
          </div>
        ) : null}
        {calendarConnected ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            Calendar connected — we&rsquo;ve started syncing your busy times.
          </div>
        ) : null}

        <div className="rounded-md border border-[var(--admin-border)] bg-slate-50 px-3 py-2 text-xs text-[var(--admin-muted)]">
          By default we only import <span className="font-medium text-[var(--admin-text)]">Busy / Available</span> — never
          event titles, locations, or attendees from your personal calendar. A detailed sync mode is planned for later.
        </div>

        <GoogleCalendarSection connection={google} configured={googleConfigured} />
        <IcsCalendarSection connection={ics} />
        <WavelengthFeedSection feedUrl={feedUrl} />
      </CardBody>
    </Card>
  );
}

function ProviderShell({ title, subtitle, status, children }: { title: string; subtitle: string; status?: ConnectionSummary["status"]; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-[var(--admin-border)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--admin-text)]">{title}</p>
          <p className="text-xs text-[var(--admin-muted)]">{subtitle}</p>
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function GoogleCalendarSection({ connection, configured }: { connection: ConnectionSummary | null; configured: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendarOption[] | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  function sync() {
    if (!connection) return;
    setError(null);
    startTransition(async () => {
      const result = await artistSyncCalendarNowAction(connection.id);
      if (result.error) setError(result.error);
    });
  }

  function disconnect() {
    if (!connection) return;
    if (!window.confirm("Disconnect Google Calendar? Your synced busy times will be removed.")) return;
    setError(null);
    startTransition(async () => {
      const result = await artistDisconnectCalendarAction(connection.id);
      if (result.error) setError(result.error);
    });
  }

  function openPicker() {
    setError(null);
    setShowPicker(true);
    startTransition(async () => {
      const result = await artistListGoogleCalendarsAction();
      if (result.error) setError(result.error);
      setCalendars(result.calendars);
    });
  }

  function chooseCalendar(option: GoogleCalendarOption) {
    setError(null);
    startTransition(async () => {
      const result = await artistSetGoogleCalendarAction(option.id, option.label);
      if (result.error) setError(result.error);
      else setShowPicker(false);
    });
  }

  return (
    <ProviderShell title="Google Calendar" subtitle="Two-way awareness of your Google Calendar busy times." status={connection?.status}>
      {!configured ? (
        <p className="text-sm text-[var(--admin-muted)]">Not available yet — this server hasn&rsquo;t been set up for Google Calendar.</p>
      ) : !connection || connection.status === "disconnected" ? (
        <a href="/api/artist/calendar/google/connect">
          <Button type="button" variant="primary" size="sm">
            Connect Google Calendar
          </Button>
        </a>
      ) : (
        <>
          <div className="text-sm text-[var(--admin-text)]">
            {connection.externalAccountEmail ? <p>Connected as {connection.externalAccountEmail}</p> : null}
            <p className="text-[var(--admin-muted)]">Using calendar: {connection.externalCalendarLabel || "Primary"}</p>
            <p className="text-[var(--admin-muted)]">{formatLastSynced(connection.lastSyncedAt)}</p>
            {connection.status === "error" ? (
              <p className="mt-1 text-red-700">{connection.lastSyncError || "This connection needs attention — try reconnecting."}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={sync} disabled={isPending}>
              {isPending ? "Syncing…" : "Sync now"}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={openPicker} disabled={isPending}>
              Choose calendar
            </Button>
            <Button type="button" variant="danger" size="sm" onClick={disconnect} disabled={isPending}>
              Disconnect
            </Button>
          </div>
          {connection.status === "error" ? (
            <a href="/api/artist/calendar/google/connect">
              <Button type="button" variant="primary" size="sm">
                Reconnect Google Calendar
              </Button>
            </a>
          ) : null}
          {showPicker ? (
            <div className="rounded-md border border-[var(--admin-border)] p-3">
              {calendars === null ? (
                <p className="text-sm text-[var(--admin-muted)]">Loading your calendars…</p>
              ) : calendars.length === 0 ? (
                <p className="text-sm text-[var(--admin-muted)]">No calendars found.</p>
              ) : (
                <ul className="space-y-1">
                  {calendars.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => chooseCalendar(c)}
                        disabled={isPending}
                        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100 disabled:opacity-50"
                      >
                        {c.label} {c.primary ? <span className="text-xs text-[var(--admin-muted)]">(primary)</span> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setShowPicker(false)}>
                Close
              </Button>
            </div>
          ) : null}
        </>
      )}
      {error ? <FieldError>{error}</FieldError> : null}
    </ProviderShell>
  );
}

function IcsCalendarSection({ connection }: { connection: ConnectionSummary | null }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  function connect() {
    setError(null);
    startTransition(async () => {
      const result = await artistConnectIcsAction(url);
      if (result.error) setError(result.error);
      else setUrl("");
    });
  }

  function sync() {
    if (!connection) return;
    setError(null);
    startTransition(async () => {
      const result = await artistSyncCalendarNowAction(connection.id);
      if (result.error) setError(result.error);
    });
  }

  function disconnect() {
    if (!connection) return;
    if (!window.confirm("Disconnect this calendar subscription? Your synced busy times will be removed.")) return;
    setError(null);
    startTransition(async () => {
      const result = await artistDisconnectCalendarAction(connection.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <ProviderShell
      title="Apple / iCloud Calendar"
      subtitle="Supported now via an ICS calendar subscription link. Direct Apple sign-in is planned for later."
      status={connection?.status}
    >
      {!connection || connection.status === "disconnected" ? (
        <div className="space-y-2">
          <Label htmlFor="icsUrl">iCloud calendar subscription link</Label>
          <Input
            id="icsUrl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="webcal://p12-caldav.icloud.com/published/2/..."
          />
          <FieldHint>
            On iCloud.com: Calendar → hover your calendar → &ldquo;Public Calendar&rdquo; → Share → copy the link. Only busy/free
            times are read from it.
          </FieldHint>
          <Button type="button" variant="primary" size="sm" onClick={connect} disabled={isPending || !url.trim()}>
            {isPending ? "Connecting…" : "Connect calendar"}
          </Button>
        </div>
      ) : (
        <>
          <div className="text-sm text-[var(--admin-text)]">
            <p className="text-[var(--admin-muted)]">{formatLastSynced(connection.lastSyncedAt)}</p>
            {connection.status === "error" ? (
              <p className="mt-1 text-red-700">{connection.lastSyncError || "This subscription needs attention."}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={sync} disabled={isPending}>
              {isPending ? "Syncing…" : "Sync now"}
            </Button>
            <Button type="button" variant="danger" size="sm" onClick={disconnect} disabled={isPending}>
              Disconnect
            </Button>
          </div>
        </>
      )}
      {error ? <FieldError>{error}</FieldError> : null}
    </ProviderShell>
  );
}

function WavelengthFeedSection({ feedUrl }: { feedUrl: string }) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(feedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function regenerate() {
    if (!window.confirm("Generate a new subscription link? Any calendar app already subscribed with the old link will stop receiving updates.")) return;
    startTransition(async () => {
      await artistRegenerateCalendarFeedTokenAction();
    });
  }

  return (
    <ProviderShell title="Wavelength Calendar" subtitle="Subscribe to your confirmed Wavelength bookings from your phone's calendar app.">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input readOnly value={feedUrl} onFocus={(e) => e.target.select()} className="font-mono text-xs" />
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={copy}>
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={regenerate} disabled={isPending}>
            Regenerate
          </Button>
        </div>
      </div>
      <FieldHint>
        Add this link as a calendar subscription (not an import) on your phone so it stays up to date. This link is unique to
        you — only your own confirmed bookings appear in it.
      </FieldHint>
    </ProviderShell>
  );
}
