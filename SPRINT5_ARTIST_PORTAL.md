# Sprint 5 — Artist Portal + Artist Authentication

## Artist authentication architecture

Completely separate from the admin auth system (`auth.ts`, Auth.js/NextAuth,
`admin_users`/`user`/`session` tables). Nothing in that file, its Credentials
provider, or its DrizzleAdapter tables was touched.

- **New table**: `artist_users` (`db/schema.ts`) — `id`, `artist_id` (unique
  FK → `artists.id`, cascade delete), `email` (unique), `password_hash`
  (bcryptjs, same library/cost-factor convention as `admin_users`),
  `is_active`, timestamps. Exactly one row per artist — "an artist account
  must belong to exactly one artist profile" is enforced at the DB level via
  the unique constraint, not just in application code.
- **Session mechanism** (`lib/artist/session.ts`): a custom, independently
  signed cookie (`artist-session-token`) built directly with
  `next-auth/jwt`'s `encode()`/`decode()` — the same primitive Auth.js uses
  internally for JWT sessions — keyed by its own cookie-name `salt`, so an
  artist token and an admin token are cryptographically unrelated even
  though both may read `AUTH_SECRET`. This was a deliberate choice over
  adding a second NextAuth `Credentials` provider to the existing instance:
  it keeps the two systems fully decoupled with zero changes to `auth.ts`.
- **Defense in depth**, mirroring the admin pattern exactly:
  `proxy.ts` gates `/artist/*` with a cheap, database-free cookie
  signature check (new `handleArtistRoute()` branch, added without touching
  the existing `/admin/*` logic or `matcher` behavior for `/admin`).
  `requireArtistSession()` (Server Components) and
  `requireArtistSessionForAction()` (Server Actions) re-verify
  `artist_users.is_active` against the database on every call — a
  deactivated artist account loses access immediately, not at next login.
- **Password hashing**: bcryptjs, cost 12. Hashes are never sent to the
  client — `lib/repositories/artistUsers.ts` is the only module that reads
  or writes `password_hash`, and no Server Action or page ever returns it.
- **Account creation**: admin-only, from a new "Artist Portal Access" card
  on each artist's Admin Overview page (`PortalAccessCard.tsx` →
  `lib/admin/artistUserActions.ts`). There is no public sign-up. An admin
  sets the artist's login email/password once; the artist changes their own
  password afterward from Artist Portal → Account
  (`lib/artist/authActions.ts#changeArtistPasswordAction`).

## Routes

`/artist/login` — public, own page, not wrapped by the portal layout (same
reasoning as `/admin/login` — avoids a redirect loop).

`/artist/(portal)/*` — a route group wrapped by
`app/artist/(portal)/layout.tsx`, which calls `requireArtistSession()` and
renders `ArtistShell` (mirrors `AdminShell`'s look/behavior). Subroutes:
`dashboard`, `profile`, `photos`, `music`, `videos`, `shows`, `band`,
`performance`, `press`, `social`, `availability`, `bookings` (+
`bookings/[id]`), `account`. None of these routes take an artist id as a URL
param — there is no `/artist/artists/[id]` shape at all, so there is no
parameter to tamper with in the first place. Every page derives its artist
identity from `requireArtistSession()`'s return value.

## Authorization model — "never trust a client-supplied artistId"

Every artist-side Server Action (`lib/artist/cmsActions.ts`,
`lib/artist/calendarActions.ts`) takes NO `artistId` parameter from its
caller. Each one starts by calling `requireArtistSessionForAction()` and
uses `user.artistId` (or, for the CMS actions, `withArtistSelfAuth()`'s
`row.id` from `getArtistRowById(user.artistId)`) for every subsequent read
or write. There is structurally no way for a compromised client to pass a
different artist's id into these — it's just not an argument.

Bookings and calendar events, which have their OWN id (not the artist's),
are scoped by an ownership check baked into the query/mutation itself:
- `getBookingByIdForArtist(id, artistId)` — the WHERE clause requires BOTH;
  a booking belonging to another artist simply isn't returned (404, not a
  403 that would leak whether the booking exists).
- `artistUpdateCalendarEventAction` / `artistDeleteCalendarEventAction` —
  fetch the event, verify `existing.artistId === user.artistId` AND
  `existing.createdByArtistUserId === user.artistUserId` before allowing any
  change. The same ownership check was added retroactively to the ADMIN
  calendar actions too (`lib/admin/calendarActions.ts`), which previously
  trusted the `artistId` argument without cross-checking the event actually
  belonged to it.

## Media upload/delete authorization (hardening — not new to Sprint 5, but closed now)

`AdminImagePicker` (reused as-is in the Artist Portal) calls
`uploadMedia()`/`deleteMedia()` (`lib/media.ts`) directly from the browser.
Before this sprint, neither had ANY authorization check — any caller could
upload or delete media for any `ownerId`, admin or artist context alike.
Reusing this exact component for the Artist Portal would have let an
authenticated artist tamper with another artist's media by calling the
action directly (bypassing the UI, which only ever sends the signed-in
artist's own id). Fixed centrally in `lib/media.ts`: any write where
`ownerType === "artist"` now requires either an admin session or an artist
session whose `artistId` matches the target `ownerId`.
`ownerType === "application"` intentionally stays unauthenticated — the
public `/apply` wizard has no session at all, by design.

## Artist ↔ CMS reuse — no duplicated business logic

Every `/artist/(portal)/*` CMS page reads data with the exact same
`db.select().from(schema.X).where(eq(schema.X.artistId, id))` queries the
admin pages already use (just with `id = user.artistId` from the session
instead of a route param), and renders the exact same Tab components
(`BandTab`, `MusicTab`, `VideosTab`, `ShowsTab`, `PerformanceTab`,
`PressTab`, `GalleryTab`, `PhotosTabForm`, `ProfileTabForm`,
`SocialTabForm` — all in `components/admin/artists/`). Each of those
components gained one new optional prop, `saveAction` (or, for `PressTab`,
an `actions` object covering its three independent save paths), which
defaults to the existing admin Server Action so every admin usage is
byte-for-byt behaviorally unchanged. The Artist Portal passes its own
session-scoped action instead. The mapping from each Tab's UI item shape to
the DB insert shape (e.g. splitting `suitableFor` on commas, filtering
gallery items with no uploaded photo) was copied once into
`lib/artist/cmsActionAdapters.ts` rather than re-derived per page.

`lib/artist/cmsActions.ts` itself is a thin authorization wrapper around the
SAME `lib/repositories/artistAdmin.ts` functions
(`updateArtistProfile`, `replaceBandMembers`, `replaceReleases`, etc.) the
admin actions call — zero duplicated database logic.

**Not built this sprint**: an ARTIST EDIT → ADMIN REVIEW → PUBLISH staging
flow. Given the time constraint, artist edits write directly to the same
`artists`/child tables admin edits do, and take effect on the public site
under the exact same rule admin edits already follow (only once
`artists.status = 'active'`). This is the same simplification called out for
the Booking tab's settings — the "smallest safe architecture that fits the
existing codebase" tradeoff. If review-before-publish is wanted, the
natural place to add it is a `pending_changes` jsonb column or a lightweight
`artist_edit_queue` table, gating `revalidatePublicIfActive()` in
`lib/artist/cmsActions.ts` on admin approval instead of firing immediately.

## Booking visibility (artist-facing)

`/artist/bookings` and `/artist/bookings/[id]` show event details and
client contact info (name, company, email, phone, event type/date/
location, expected audience, performance format, budget range, message) —
everything the public booking form itself collects. They deliberately omit
`internalNotes` and `reviewedBy` (admin-only fields) — there is currently no
"admin-only vs artist-visible" flag on individual fields in the schema, so
the split was made by hand at the query/page level (`getBookingByIdForArtist`
and `listBookingsForArtist` still return the full row from `bookings`, but
the artist-facing pages simply don't render `internalNotes`/`reviewedBy`).
Artists cannot change a booking's status — that stays admin-only
(`lib/admin/bookingActions.ts`), per "admin stays authoritative."

## Calendar/availability behavior (reusing Sprint 4's architecture, unchanged)

No changes to the `artist_calendar_events` table's core columns or to how a
confirmed booking auto-generates/removes its linked calendar block
(`lib/admin/bookingActions.ts#updateBookingStatusAction`) or how the public
booking form checks availability (`lib/repositories/calendar.ts
#isArtistAvailableOn`) — all of that is exactly as it was after Sprint 4.

One additive column: `artist_calendar_events.created_by_artist_user_id`
(nullable FK → `artist_users.id`), set only when an artist creates a block
via the portal. This is what lets the system tell apart:
- a block from a **confirmed booking** (`booking_id` set) — visible, never
  editable by the artist;
- a block an **admin** entered manually (`created_by_admin_user_id` set,
  `created_by_artist_user_id` null) — visible, never editable by the artist;
- a block the **artist themselves** entered
  (`created_by_artist_user_id` set) — visible AND editable/deletable by
  that artist.

The artist-facing "Add External Booking / Block Dates" form restricts the
event `type` to `booked_external` / `tentative` / `unavailable` (the exact
three types the task asked for) — it cannot create `booked_platform` or
`available` rows, both of which are system/admin concepts.

## Files created

- `db/schema.ts` — `artistUsers` table, `artistCalendarEvents.createdByArtistUserId` column (migration `0003_illegal_maverick.sql`)
- `lib/artist/session.ts`, `lib/artist/authActions.ts`
- `lib/repositories/artistUsers.ts`
- `lib/artist/cmsActions.ts`, `lib/artist/cmsActionAdapters.ts`
- `lib/artist/calendarActions.ts`, `lib/artist/calendarTypes.ts`
- `lib/admin/artistUserActions.ts`
- `components/admin/artists/PortalAccessCard.tsx`
- `components/artist/ArtistShell.tsx`, `ArtistLoginForm.tsx`, `ArtistAvailabilityTab.tsx`, `ChangePasswordForm.tsx`
- `app/artist/login/page.tsx`
- `app/artist/(portal)/layout.tsx` + `dashboard`, `profile`, `photos`, `music`, `videos`, `shows`, `band`, `performance`, `press`, `social`, `availability`, `bookings`, `bookings/[id]`, `account` pages

## Files changed

- `proxy.ts` — added an `/artist/*` branch (matcher extended); `/admin/*` branch untouched
- `lib/media.ts` — added ownership check for `ownerType: "artist"` uploads/deletes (see hardening note above)
- `lib/repositories/artistAdmin.ts` — `updateArtistProfile`'s `updatedBy` param widened to `string | null` (artist self-edits pass `null`)
- `lib/repositories/bookings.ts` — added `listBookingsForArtist`, `getBookingByIdForArtist`
- `lib/repositories/calendar.ts` — added `getCalendarEventById`, `createdByArtistUserId` support
- `lib/admin/calendarActions.ts` — added ownership check (event.artistId === artistId) before update/delete; `CalendarEventFormInput` moved to `lib/artist/calendarTypes.ts` and re-exported
- `lib/admin/activity.ts` — new `ActivityAction` values (`artist.portal_signed_in`, `artist.portal_access_created`, `artist.portal_access_updated`), `listActivityForEntity()` helper
- `lib/admin/permissions.ts` — (from Sprint 3/4, unchanged this sprint)
- `app/admin/(dashboard)/artists/[id]/page.tsx` — added the Portal Access card
- `components/admin/artists/{BandTab,MusicTab,VideosTab,ShowsTab,PerformanceTab,PressTab,GalleryTab,PhotosTabForm,ProfileTabForm,SocialTabForm}.tsx` — each gained an optional `saveAction` prop (default = existing admin action, so admin behavior is unchanged)
