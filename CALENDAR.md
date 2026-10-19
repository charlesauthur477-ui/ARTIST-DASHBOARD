# Wavelength Calendar

Wavelength has its own internal calendar. Artists and admins never connect
a personal Google/Apple calendar, sign in to a third-party account, or
configure anything technical — the calendar an artist sees in the Artist
Portal, the calendar an admin manages for that artist, and the calendar
the public booking form checks are all reading and writing the exact same
data.

```
                    WAVELENGTH APP
                         |
                 Artist Calendar (artist_calendar_events)
                         |
          +--------------+--------------+
          v              v              v
     Confirmed       External         Manual
      Bookings       Bookings          Blocks
          |              |              |
          +--------------+--------------+
                         |
                  isArtistAvailableOn()
                         |
                 Public Booking Form
```

## What was reused vs. what's new

Nothing about the underlying data model changed. `artist_calendar_events`
was already the single source of truth for a confirmed booking, an
admin/artist-entered external booking, and a manual tentative/unavailable
hold — that table, `lib/repositories/calendar.ts`'s
CRUD functions, `lib/admin/calendarActions.ts`, `lib/artist/calendarActions.ts`,
and the public availability check (`isArtistAvailableOn`) are **completely
unchanged**. What was missing was the UI: both the Artist Portal and Admin
only ever showed a flat list of events with a single add-form — no
month/week/day view, no click-to-see-details, no quick "block a date"
flow, and admin had no "open the booking from here" shortcut. This pass
adds exactly that layer, wired to the same Server Actions that already
existed.

- **`components/calendar/CalendarView.tsx`** (new) — the shared calendar
  renderer. Month grid, week/day agenda views, day-detail panel,
  add/edit-event modal, and the quick "Block Date" modal. Takes
  `onAdd`/`onUpdate`/`onDelete` callbacks and has no idea whether it's
  being used by an artist or an admin — it creates no database access of
  its own.
- **`components/calendar/calendarMath.ts` / `types.ts`** (new) — pure date-grid
  math and shared view-model types, no React, no server code.
- **`components/artist/ArtistAvailabilityTab.tsx`** (rewritten) — now a
  thin wrapper that renders `CalendarView`, closing over
  `lib/artist/calendarActions.ts`'s existing `artistAddCalendarEventAction`
  / `artistUpdateCalendarEventAction` / `artistDeleteCalendarEventAction`
  (all pre-existing — nothing added to that file).
- **`components/admin/artists/AvailabilityTab.tsx`** (rewritten) — same
  pattern, closing over `lib/admin/calendarActions.ts`'s existing
  `addCalendarEventAction` / `updateCalendarEventAction` /
  `deleteCalendarEventAction`, plus a new `onOpenBooking` callback that
  navigates to `/admin/bookings/[id]` when a confirmed-booking event is
  clicked.

No new Server Actions, no new repository functions, no new database
columns or tables were required for the calendar itself — everything it
needed already existed.

## Artist calendar (`/artist/availability`)

- **Month / Week / Day** view switch at the top, with previous/next
  navigation and a current-period label (e.g. "September 2026").
- Every event is color-coded by category — Available, Confirmed Booking,
  External Booking, Tentative Hold, Unavailable/Blocked — with a legend
  always visible.
- **Click a date** (month view) to open a day-detail panel listing that
  day's events, with "+ Add Event" and "+ Block Date" shortcuts
  pre-filled to that date.
- **Click an event** (any view) to open its detail — times, venue, notes,
  status — with Edit/Delete if the artist created it themselves.
  System-generated confirmed-booking blocks and admin-entered blocks are
  view-only for the artist (unchanged rule — enforced server-side in
  `lib/artist/calendarActions.ts`, not just hidden in the UI).
- **"+ Add Event"** opens the full form: type (External Booking /
  Tentative Hold / Unavailable), title, start/end date-time, venue/city/
  country, notes. Saving it immediately affects public booking
  availability, exactly as before.
- **"+ Block Date"** opens the quick flow: a date (and an optional "through"
  date for a multi-day block), an "All day" toggle, and a Reason dropdown
  (Personal / Already Booked / Unavailable / Other). A multi-day block is
  still just one `artist_calendar_events` row spanning
  `[startDate 00:00, endDate 23:59]` — no schema change was needed for
  this, since `isArtistAvailableOn` already checks whether a date falls
  anywhere inside an event's `[startAt, endAt]` range.
- Clicking a confirmed-booking event opens that booking's detail page
  (`/artist/bookings/[id]`) — the artist's own existing bookings view,
  unchanged.

## Admin calendar

Lives where availability management already lived: an artist's Admin
overview → Booking tab (`/admin/artists/[id]/booking`), now rendering the
same `CalendarView` instead of a flat list. Admin can add external
bookings, tentative holds, unavailable blocks, and (admin-only) explicit
"Available" marks; remove any block they or the artist created; see
system-generated confirmed-booking blocks (view-only, exactly as before —
"change the booking's status to remove it" is still the rule); and click a
confirmed-booking event to jump straight to `/admin/bookings/[id]`. A
top-level cross-artist `/admin/calendar` aggregating every artist at once
was not built in this pass (out of scope — this delivers "admin sees the
same calendar data, per artist," which is what was asked) but would be a
natural next step reusing this same `CalendarView` component.

## Public booking availability

Unchanged. The public "Book This Artist" form still calls
`lib/booking.ts` → `isArtistAvailableOn(artistId, eventDate)`, which still
reads `artist_calendar_events` and blocks on `booked_platform` /
`booked_external` / `unavailable` rows. Whether a block was created
through the new calendar UI's "Add Event" form or the "Block Date" quick
flow makes no difference — both just insert a normal row into the same
table. Confirming a booking still auto-creates its `booked_platform`
block (`lib/admin/bookingActions.ts#updateBookingStatusAction`); cancelling
or rejecting it still removes that block. None of this logic was touched.

## What was removed

An earlier pass had added a "Calendar Integrations" section (Google
Calendar OAuth connect, an Apple/iCloud ICS subscription import, an
outbound ICS feed) before product direction changed. All of that has been
deleted: `lib/calendarIntegration/*`,
`lib/repositories/calendarConnections.ts`,
`lib/artist/calendarIntegrationActions.ts`,
`components/artist/CalendarIntegrationsCard.tsx`, the
`app/api/artist/calendar/*` / `app/api/calendar/*` / `app/api/cron/*`
route handlers, and `vercel.json`'s cron entry. No `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, or `CRON_SECRET` are required, and none of that
configuration is asked of an artist anywhere in the product now.

The additive-but-now-unused database leftovers from that attempt — the
`calendar_connections` table, and three unused columns
(`artist_calendar_events.source` / `.externalConnectionId` /
`.externalEventUid`, `artist_users.calendarFeedToken`) — were
**deliberately left in the schema** rather than reverted with a
destructive migration, since it wasn't confirmed whether that migration
had already been run against the real database. They're inert: nothing
reads or writes them. Say the word if you'd like a follow-up migration to
actually drop them once you've confirmed migration `0004` was or wasn't
applied.

## Mobile-first / PWA

- Every control in the new calendar UI is sized and laid out for touch
  first: the month grid's day cells, the view-switch pills, and every
  modal's buttons are full-size tap targets, and week/day views are
  simple scrollable agenda lists rather than a dense hour-by-hour grid
  (a deliberate "no complicated calendar software UI unless genuinely
  necessary" scope call).
- The Artist Portal is now installable: `app/artist/layout.tsx` (new,
  wraps `/artist/*` including the login page, adds no auth logic of its
  own) links a scoped web app manifest
  (`public/manifest-artist.webmanifest`) and sets
  `apple-mobile-web-app` metadata, so "Add to Home Screen" on iOS/Android
  gives a standalone, app-like window with a real icon
  (`public/icons/artist-icon-*.png`) instead of a browser tab.
- The Admin Portal is now installable too, the identical way:
  `app/admin/layout.tsx` (new, wraps `/admin/*` including `/admin/login`,
  adds no auth logic — `(dashboard)/layout.tsx`'s `requireAdmin()` remains
  the sole gate) links `public/manifest-admin.webmanifest`
  (`start_url: "/admin"`) and its own icons
  (`public/icons/admin-icon-*.png`). This manifest is never linked from
  the public root `app/layout.tsx`, so the admin app is never offered as
  the default install target to a public visitor.
- A minimal, dependency-free service worker (`public/sw.js`) was added,
  registered only from the Artist and Admin root layouts (never the
  public site) via `lib/pwa/RegisterServiceWorker.tsx`. It caches
  **only** `/_next/static/*`, the icon files, the two manifests, and the
  offline fallback page — it never intercepts or caches `/api/*`, any
  `/admin/*` or `/artist/*` page, or anything that could carry private
  data; page navigations always hit the network first. If the network
  fails on a navigation, it serves `public/offline.html`, a static
  "You are offline. Reconnect to continue." page with no cached private
  data of any kind.
- The "Good morning, Aurora / 3 upcoming bookings / Next show: Friday"
  home-screen summary described as the eventual mobile app experience was
  not built in this pass — it wasn't part of what was asked for here
  (calendar + PWA-readiness only) and is a natural addition to
  `/artist/dashboard` later.
