# Known Issues — RAPID BUILD MODE

Non-blocking issues found or deliberately deferred during the Sprint 1–8 push.
None of these prevent core flows (create/save data, create bookings, publish
artists, public pages loading). Documented here per the "don't debug minor
issues now — log and move on" instruction, to revisit after the deadline.

## Carried over from the pre-existing codebase (Sprint 1 audit)

- **Media association after approval**: `lib/repositories/approvals.ts` was
  hardened (SQL-scoped `ownerId` match instead of a JS-side cross-driver
  comparison) in the session before RAPID BUILD MODE started, but this was
  never confirmed against a live "Application → Approve → Artist → Photos"
  run. If "0 files uploaded" reappears after approving a new application,
  start here.
- **Videos tab reorder bug**: `RepeatableListEditor` keys rows by array
  index. Moving a video up/down can leave typed text "stuck" on the wrong
  row until Save, because React reuses DOM nodes by index. No data loss —
  purely a client-side display glitch, fixed by keying on a stable per-item
  id instead of index.
- **Music tab**: only the Spotify streaming link is editable in the admin
  UI, even though the schema/type supports Apple Music, YouTube, and
  SoundCloud too.
- **SEO tab**: `ogImageMediaId` has no image picker in the admin UI — it can
  only ever be set indirectly (it's auto-populated from the hero photo at
  application-approval time).
- **Profile tab**: `careerHighlights` (jsonb) has no editor anywhere in the
  admin UI — it's populated once at application intake and can't be edited
  afterward.
- **Booking tab (artist settings)**: `bookingSettings.performanceFormats`
  (drives the public booking form's format dropdown) isn't editable from
  admin — the booking settings form only exposes eventTypes/budgetRanges/
  enquiryNote.
- **Gallery/photo picker**: `AdminImagePicker` deletes the previous media
  blob immediately on replace/remove, before the parent tab's Save runs. If
  a user replaces a photo and then navigates away without saving, the old
  media row is left pointing at a deleted blob. Rare, not destructive to any
  currently-referenced media.

## New in this sprint (Booking + Availability system)

- **Booking form fields not expanded**: the public "Book This Artist" form
  (`components/booking/BookingForm.tsx`) was intentionally left as-is (per
  "don't redesign the application unnecessarily") rather than adding
  separate venue/city/country/sets/duration fields. The new `bookings` table
  persists exactly what the existing form already collects (`location` as a
  single combined field, `message` as free-text notes); city/country/venue/
  sets/duration are available for an admin to note manually in "Internal
  notes" on a booking's detail page, or the public form can be split into
  separate fields in a follow-up pass.
- **Availability tab UX**: the new "Availability & Calendar" panel on each
  artist's Booking tab is a flat list with a single add-block form — no
  month/week calendar grid view yet. Functionally complete (create real,
  DB-backed blocks that immediately affect public booking availability) but
  not a visual calendar.
- **Artist Portal (Sprint 5) not built this pass**: `/artist/dashboard` and
  the artist-side availability/edit-review-publish flow were not
  implemented in this session due to time constraints. All admin-side
  functionality (bookings, availability, CMS tabs) is real and working;
  artist self-service access is the next major gap.
  **Update: built in the following sprint** — see SPRINT5_ARTIST_PORTAL.md.

## New in Sprint 5 (Artist Portal + Artist Authentication)

- **No ARTIST EDIT → ADMIN REVIEW → PUBLISH staging**: artist edits write
  directly to the live `artists`/child tables, same as admin edits, and take
  effect on the public site under the same "only if status = active" rule
  admin already follows. There is no approval queue — see
  SPRINT5_ARTIST_PORTAL.md's "Artist ↔ CMS reuse" section for the reasoning
  and a suggested follow-up design if this is wanted.
- **Media upload/delete authorization was a real pre-existing gap, now
  closed**: `lib/media.ts`'s `uploadMedia`/`deleteMedia` had NO ownership
  check at all before this sprint (any caller could upload/delete media for
  any `ownerId`). Fixed as part of this sprint since the Artist Portal
  reuses the same upload component and the gap was directly exploitable by
  an artist targeting another artist's media. If anything media-related
  breaks after this change, start here — the fix requires either an admin
  session or an artist session whose `artistId` matches the media's
  `ownerId`.
- **Availability UX**: the artist-side "Add External Booking / Block Dates"
  panel is the same flat-list-plus-form UI as the admin version — no visual
  calendar grid.
- **Booking detail field visibility is hand-picked, not schema-driven**:
  artist-facing booking pages omit `internalNotes`/`reviewedBy` by simply
  not rendering them, since there's no per-field "admin-only" flag in the
  schema. Fine for now; would need a real flag if the field list grows.
- **No email verification / password reset flow for artist accounts**:
  admin sets/resets the artist's password directly from the Portal Access
  card. There's no "forgot password" self-service flow for artists yet.

## Removed: external Google/Apple calendar integration

An earlier pass briefly added a "Calendar Integrations" section (Google
OAuth connect, Apple/iCloud ICS subscription import, an outbound ICS feed)
to the Artist Portal. Product direction changed before this went live:
Wavelength's own calendar (`artist_calendar_events`) is the product —
artists are not asked to connect a personal Google/Apple calendar. All of
that code (`lib/calendarIntegration/*`, `lib/repositories/calendarConnections.ts`,
`lib/artist/calendarIntegrationActions.ts`,
`components/artist/CalendarIntegrationsCard.tsx`, the
`app/api/artist/calendar/*`, `app/api/calendar/*`, `app/api/cron/*` route
handlers, and `vercel.json`'s cron entry) has been deleted. The additive
database leftovers from that attempt — the unused `calendar_connections`
table and three unused columns on `artist_calendar_events`
(`source`/`externalConnectionId`/`externalEventUid`) and `artist_users`
(`calendarFeedToken`) — were deliberately left in place rather than
reverted with a destructive migration, since it wasn't known whether
`db:migrate` had already been run against the real database; they are
inert (nothing reads or writes them anymore). See CALENDAR.md for the
current internal-calendar architecture, and ask if you'd like a follow-up
migration to drop that leftover table/columns once you've confirmed
whether migration 0004 was ever applied.

## New in the internal Wavelength Calendar (month/week/day UI)

- **Week/day views are simple day-agenda lists, not an hour-by-hour time
  grid**: deliberate scope call per "no complicated calendar software UI
  unless genuinely necessary" — an artist/admin sees each day's events in
  chronological order rather than positioned against a clock axis. Month
  view is the main visual grid.
- **No recurring events**: every calendar event (including a multi-day
  block) is one row with a single start/end range — there's no "repeat
  weekly" concept, consistent with how `artist_calendar_events` has always
  worked.
