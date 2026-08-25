# Phase 4 — Admin / Management Dashboard: Architecture Plan

**Status:** Planning only. No files modified, no dependencies installed, no code written. This document is for review and approval before any implementation begins.

**Scope reviewed:** current repository at commit `3fd9114` — the full Phase 3 database/service layer (`db/schema.ts`, `lib/repositories/*`, `lib/media.ts`, `lib/application.ts`, `lib/applications.ts`, `lib/approvals.ts`, `lib/artists.ts`, `lib/slug.ts`, `lib/validation/application.ts`), confirmed live and verified per `PHASE_3_ACTIVATION_REPORT.md`. No `middleware.ts` exists yet; no authentication package is installed yet — this is a clean slate for Phase 4.

---

## 1. Recommended authentication solution

**Auth.js (NextAuth) v5, Credentials provider, database-backed sessions via the Drizzle adapter, against a new `admin_users` table.**

Reasoning specific to this project:

- Auth.js v5 is built for the Next.js App Router (Route Handlers + Server Components + Middleware all work with it natively) and ships an official `@auth/drizzle-adapter`, so session/account storage lives in the same Neon database as everything else — no third vendor account, consistent with how Phase 3's provider choices were made (fewest new vendors that still fit the stack cleanly).
- **Database sessions, not JWT sessions.** A JWT session can't be revoked before it expires — if an admin's laptop is compromised, there's no way to kill that session short of rotating a global secret (which logs everyone out). A database session is a row that can be deleted, which matters a lot for "this is the most sensitive part of the application." Concretely: Auth.js's `session` strategy: `"database"`.
- **Credentials provider, not OAuth.** This is a single organization's private admin tool, not a product with third-party sign-in — there's no reason to depend on Google/GitHub OAuth here, and a Credentials provider (email + password, checked against a bcrypt hash in `admin_users`) keeps the whole login flow self-contained and auditable. No public sign-up route exists or ever will — admin accounts are created directly in the database (a one-off `scripts/create_admin_user.ts`, analogous to `scripts/seed_demo_artists.ts`), not through any UI, exactly like the "no self-service signup" note already in `PHASE_3_PLAN.md` Section 7.
- **Middleware + server-side re-check, not middleware alone.** `middleware.ts` matches `/admin/:path*` and redirects unauthenticated requests to `/admin/login` — this is the first gate and covers the common case cheaply (runs on Vercel's Edge Runtime before any page code executes). But per the explicit requirement ("Authorization must be enforced server-side... No client-side authorization as the only protection"), every Server Action that mutates admin data independently re-verifies the session and role via a `requireAdmin()` helper (`lib/admin/auth.ts`) at its own top line — middleware can be misconfigured or bypassed by a direct Server Action call in a way a defense-in-depth check catches. This mirrors the exact reasoning already written into `PHASE_3_PLAN.md` Section 7 for the (not-yet-built) admin auth, now made concrete.
- **No secrets in client code**: `AUTH_SECRET` (session encryption key) and the database connection are read only in `lib/auth.ts` (the Auth.js config, a server-only module) and Route Handlers under `app/api/auth/[...nextauth]/route.ts` — never in a `"use client"` file, never returned from a Server Action.

Alternative considered and rejected for V1: **Clerk** or a similar hosted auth product. Genuinely fine engineering choices, and worth reconsidering if this ever needs SSO/2FA/magic-links out of the box — but they add a vendor account and monthly cost for what is, at this stage, one to a handful of trusted staff logging in with a password. Auth.js costs nothing beyond what's already provisioned and keeps everything in Neon.

## 2. Admin route structure

```
/admin/login                          public (redirects to /admin if already authenticated)
/admin                                dashboard home
/admin/applications                   application list (filter by status)
/admin/applications/[id]              application detail + review actions
/admin/artists                        artist list (search, filter by status/genre)
/admin/artists/new                    manual artist creation
/admin/artists/[id]                   artist editor (tabbed — see Section 6)
/admin/artists/[id]/preview           enters Next.js Draft Mode, redirects to the real public page (see Section 8)
/admin/media                          global media browser across all artists (search/filter by owner, role, unused)
/admin/settings                       admin user list (V1: read-only list + "create user" for SUPER_ADMIN; see Section 3)
/admin/activity                       audit/activity log viewer (can ship after V1 — see Section 16)
```

This matches your suggested structure closely, with two additions: `/admin/login` (has to exist somewhere) and `/admin/artists/[id]/preview` (the secure preview entry point, Section 8). `/admin/media` as a *global* browser (not just per-artist) is useful once the roster grows — finding "which artists still have a placeholder gallery photo" is hard from inside each artist's editor alone.

Every route under `/admin/*` (except `/admin/login`) is covered by `middleware.ts`'s matcher and independently re-checked server-side per Section 1.

## 3. Admin role model

New table `admin_users`:

| column | type | notes |
|---|---|---|
| `id` | uuid, PK | |
| `email` | text, unique, not null | login identifier |
| `password_hash` | text, not null | bcrypt, never the plain password |
| `name` | text | display name for the activity log ("approved by ...") |
| `role` | enum: `super_admin`, `manager`, `editor` | |
| `is_active` | boolean, default true | disable an account without deleting it (preserves audit-log attribution) |
| `created_at`, `updated_at` | timestamptz | |

Plus Auth.js's own adapter tables (`session`, and a minimal `account`/`verification_token` pair the Drizzle adapter expects even though Credentials-only auth won't populate `account` rows — these are small, standard, and not worth fighting the adapter's schema shape over).

**Role semantics for V1** (only `super_admin` is actually needed to operate the dashboard per your instructions, but the enum and every permission check are written in terms of roles from day one so adding `manager`/`editor` later is a config change, not a schema change):

- `super_admin`: everything, including creating/disabling other admin users.
- `manager` (future): applications, artists, media, publishing — everything except managing admin users.
- `editor` (future): artist content edits, media — but not approve/reject applications or publish/unpublish (those stay manager+).

Implementation: a single `lib/admin/permissions.ts` with a small capability table (`canApprove(role)`, `canPublish(role)`, `canManageAdmins(role)`, etc.) that every Server Action and every conditionally-rendered admin UI element calls — so turning on `manager`/`editor` later means changing this one file's truth table, not hunting through every route for hardcoded `role === "super_admin"` checks.

## 4. Dashboard information architecture

Single-screen overview, six cards max (per "do not overload the dashboard"):

**Top row (counts, each a link to the filtered list):** Total Artists · Published Artists · Draft Artists · Pending Applications (`submitted` + `under_review`, combined into one actionable number — this is the one that should visually demand attention, e.g. a distinct color when > 0).

**Below that, three lists, five items each:**
- **Recent Applications** — last 5 by `submitted_at`, with stage name, city, genre, status badge, submitted date; click-through to `/admin/applications/[id]`.
- **Recently Updated Artists** — last 5 by `updated_at`, with name, status badge, "updated 2 hours ago."
- **Upcoming Shows** — next 5 shows across all *published* artists sorted by date (a genuinely useful "what's coming up" glance, and cheap to compute since `shows` already has a `date` column and an `is_past` flag).

**Deliberately left off the V1 home screen**, per "do not overload": a raw activity/audit feed (has its own page, Section 16), genre/location breakdowns, any chart. If the dashboard earns its keep at this scope, richer widgets are easy to add later; a cluttered first version is harder to walk back.

## 5. Application review architecture

`/admin/applications` — table view (name, artist/stage name, submitted date, status badge, city, genre — exactly as specified), status filter as a segmented control, powered by `lib/applications.ts#listArtistApplications(status?)` (already implemented, currently unused by any UI — this is precisely what it was built for in Phase 3).

`/admin/applications/[id]` — full detail, powered by `lib/applications.ts#getArtistApplication(id)` (already implemented, returns the application plus every child collection). Rendered in the exact section order you specified (Basic Information, Profile, Photos, Music, Videos, Socials, Shows, Band, Performance, Press/EPK, Booking, Collaborations, Testimonials, Technical Information) — this is a straight display mapping of `types/application.ts`'s `ArtistApplication` shape, no new data modeling needed.

**Actions, each a Server Action calling the existing Phase 3 service — never reimplemented in a component:**

- **Start Review** → `lib/approvals.ts#markUnderReview(applicationId, reviewedBy)` (already implemented; `reviewedBy` now becomes the logged-in admin's id instead of the placeholder it's never been called with yet).
- **Approve** → a small form (just the slug field, pre-filled with a suggested slugified stage name) submitting to `lib/approvals.ts#approveApplication(applicationId, slug)` (already implemented — the transaction, the media reassignment, the "leaves the artist in draft" guarantee, all reused as-is). On a slug collision, the existing `validateSlugForApproval` error surfaces directly in the form — no new slug logic.
- **Reject** → a reason textarea submitting to `lib/approvals.ts#rejectApplication(applicationId, reason)` (already implemented).
- **Return to Review** → sets status back to `under_review` from `approved`/`rejected` — this is a small addition to `lib/repositories/applications.ts` (a `returnToReview()` wrapping the existing `setApplicationReviewStatus`, since that function already supports arbitrary status transitions; "return to review" was simply never exposed as its own named action). Not a new subsystem, one new thin export.

No new business logic is being invented here — this section is almost entirely "build the UI that finally calls the services Phase 3 already shipped."

## 6. Artist CMS architecture

`/admin/artists/[id]` as a tabbed editor: **Overview · Profile · Photos · Music · Videos · Shows · Band · Performance · Press · Social · Booking · SEO · Publishing** (your list, adopted as-is — it maps cleanly onto the existing schema's table boundaries from `PHASE_3_PLAN.md` Section 3).

Each tab is its own Server Component (loads that slice of data) + a client form component that submits to a tab-scoped Server Action. This keeps any single tab's save small and fast rather than one giant "save the whole artist" mutation, and means a mistake in the Shows tab can't accidentally corrupt the Press tab's data.

**This requires new repository functions that do not exist yet** — Phase 3's `lib/repositories/artists.ts` only has *read* functions (`getActiveArtists`, `getArtistBySlugDb`, `setArtistStatus`) because nothing before Phase 4 needed to write to an existing artist. New file `lib/repositories/artistAdmin.ts` (kept separate from `artists.ts`'s public-read surface, so it's obvious at a glance which functions are safe to call from public pages and which are admin-only) adding, per section:

- `updateArtistProfile(id, patch)` — scalar/jsonb fields (name, tagline, genre, location, bio, socialLinks, streamingLinks, pressKit, bookingSettings, contactInformation, instagramHandle).
- `replaceArtistReleases/Videos/Shows/BandMembers/PerformanceFormats/Collaborations/Testimonials(artistId, items[])` — full-replace-by-artist-id, following the exact same pattern `lib/repositories/applications.ts#persistApplicationSubmission`'s `replaceChildren` already established for the application side (delete-then-reinsert, ordered by `sortOrder`). Reusing a proven pattern rather than inventing per-row CRUD (add/edit/delete-one) keeps the editor's save semantics simple: each tab's form holds the full list client-side (add/remove/reorder rows in memory, exactly like `MusicStep.tsx`/`BandStep.tsx` already do in the `/apply` wizard) and submits the whole list on save.
- `updateArtistSeo(id, {seoTitle, seoDescription, ogImageMediaId, canonicalUrl})` — see Section 10 for the three new columns this needs.

**Works for both approval-created and manually-created artists identically** — by the time an artist row exists (via `approveApplication` or the new manual-creation path in Section 7), the editor doesn't know or care which path created it; it just reads/writes the `artists` table and its children the same way either way. This was true by construction the moment Phase 3 kept applications and artists as separate tables with only a nullable, informational back-reference.

## 7. Media management architecture

Reuses `lib/media.ts`'s `uploadMedia`/`deleteMedia` Server Actions exactly as built for `/apply` — **no new upload code path**, per the explicit instruction not to upload from random client code. The admin `MediaUploader` component is the same `FileInput`/`MultiFileInput` pattern from `components/application/fields/*`, generalized to accept `ownerType: "artist"` and any of the eight `MediaRole` values instead of being hardcoded to the application wizard's four.

New capabilities needed beyond what exists:

- **Replace**: delete the old media row/Blob object, upload the new one, and update whichever `*_media_id` column pointed at it (or the `gallery_images`/child-table row, for a gallery/release/band-member photo). A small orchestration function, `lib/repositories/media.ts#replaceMedia(oldMediaId, newFile, ...)`, calling the existing `deleteMedia`/`uploadMedia` in sequence rather than a new upload mechanism.
- **Reorder**: `gallery_images.sortOrder` (and every other child table's `sortOrder`) already exists in the Phase 3 schema specifically for this — reordering is just a batch `UPDATE ... SET sort_order = ...` in `lib/repositories/media.ts`, no schema change.
- **Archive vs. delete**: per "do not permanently delete artists... unless carefully designed soft-delete," the same caution applies to media that's still referenced (e.g. an artist's current profile photo). `deleteMedia` stays a hard delete for the case that's always been safe (an application photo, or a gallery photo nobody references elsewhere), but the admin UI's "Delete" on a currently-in-use image (profile/hero/about/og) is disabled with a "replace it instead, or unset it first" message — this avoids adding an `is_archived` column to `media` for a case that's really a referential-integrity question, not a lifecycle one.

`/admin/media` (the global browser) is a straightforward query across `media` joined to whichever artist/application owns each row, filterable by role and "orphaned" (a media row whose id isn't referenced by any `*_media_id` column or child row — worth surfacing since Phase 3's media model doesn't cascade-delete media when, say, a gallery row is removed without also calling `deleteMedia`).

## 8. Publishing/preview architecture

**Publishing** — a new `lib/repositories/artistAdmin.ts#publishArtist(id)`:

1. Loads the artist and validates the fields a public page actually depends on (profile image, hero image, stage name, short bio, at least one contact email) — reusing the same "what's actually required" reasoning as the application's own required-field validation, not a separate ad hoc list.
2. Re-validates slug uniqueness via `lib/slug.ts#validateSlugForApproval`, generalized to accept an "exclude this artist's own current row" parameter (today it's only ever called for a brand-new artist during approval; publishing an *existing* draft artist needs to check "is this slug taken by someone else," not "is this slug taken at all," since the artist already owns it).
3. Sets `status: "active"`, `publishedAt: now()`, `updatedAt: now()`.
4. Calls Next.js's `revalidatePath` for `/`, `/artists/[slug]` and all eight sub-routes, and `/sitemap.xml` — so the change is visible immediately rather than waiting for the next natural rebuild/ISR window. (`unpublishArtist(id)` is the same shape in reverse: `status: "inactive"` — or `"archived"`, a separate explicit action — plus the same revalidation calls, so a public visitor stops seeing the artist within the same request cycle, not eventually.)

**Preview** — recommend **Next.js Draft Mode** (`next/headers`'s `draftMode()`), which is the framework's own built-in mechanism for exactly this problem, rather than a bespoke signed-URL scheme:

1. `/admin/artists/[id]/preview` is itself behind the admin auth check (Section 1) — only a logged-in admin can ever reach it.
2. It calls `draftMode().enable()` (sets an httpOnly, encrypted Next.js cookie scoped to the browser making the request) and redirects to the real public URL, `/artists/[slug]`.
3. `lib/artists.ts`'s public read functions gain one additional check: if `draftMode().isEnabled` is true for the current request, the `status = 'active'` filter is skipped for that one lookup — so the *same* public page component renders the *same* draft data, with zero component-level duplication between "preview" and "real" rendering (this directly satisfies "Preview should show the actual public artist page using draft data").
4. Because the draft-mode cookie only exists in the admin's own browser (never issued to anyone else, never part of a shareable link), a draft artist is not publicly discoverable by URL-guessing or search engines — satisfying "Do NOT make draft artists publicly discoverable" without needing a separate secret-token system to manage/expire.

## 9. Audit log architecture

One table, `activity_log` (deliberately one table, not separate "audit log" and "activity feed" tables — every audit event *is* an activity event; splitting them would just mean writing to two tables on every mutation for no benefit):

| column | type | notes |
|---|---|---|
| `id` | uuid, PK | |
| `actor_admin_user_id` | uuid, nullable FK → `admin_users.id` | null for system-originated events (none exist yet, but keeps the column honest for later) |
| `action` | text | e.g. `application.approved`, `artist.published` — see Section 10 for the fixed vocabulary |
| `entity_type` | text | `application` \| `artist` \| `media` \| `admin_user` |
| `entity_id` | uuid | |
| `summary` | text | human-readable one-liner for the activity feed ("Approved application for Nova Vale") — precomputed at write time so the feed never needs to re-derive prose from a diff at render time |
| `metadata` | jsonb | structured detail — e.g. `{ before: {...}, after: {...} }` for an edit, or `{ slug: "..." }` for a publish. Not a full field-by-field diff engine for V1 (see Section 17) — just whatever the calling code already has in hand. |
| `created_at` | timestamptz | |

Written from one place per mutation type — a thin `lib/admin/activity.ts#logActivity(...)` called at the end of each admin Server Action (`approveApplication`'s admin-facing wrapper, `publishArtist`, `updateArtistProfile`, etc.), not scattered `INSERT` calls duplicated across every route. This keeps "what counts as loggable" a single decision point instead of something each new feature has to remember to do correctly.

Per your note, this does not need a UI in the first admin version — `/admin/activity` (a simple filterable table) can ship in a later Phase 4 sub-step (Section 16) once the log actually has data worth looking at.

## 10. Required database changes

Everything below is **additive** — no existing Phase 3 table's columns change shape, nothing existing is renamed or dropped, consistent with "do not unnecessarily redesign it."

- **New table `admin_users`** (Section 3) — needed because there is currently no representation of a human operator anywhere in the schema.
- **New tables from the Auth.js Drizzle adapter** (`session`, `account`, `verification_token`, and the adapter's own `user` table or a mapping to `admin_users` — Auth.js v5's adapter is configurable enough to map onto `admin_users` directly rather than requiring a redundant parallel `user` table; this needs to be worked out precisely at implementation time, but the shape is standard and small) — needed for secure, revocable sessions (Section 1).
- **New table `activity_log`** (Section 9) — needed for audit/activity; doesn't exist in any form today.
- **Three new nullable columns on `artists`**: `seo_title text`, `seo_description text`, `canonical_url text` — needed for the SEO tab (Section 6); today SEO metadata is derived automatically from `name`/`shortBio`/slug in each page's `generateMetadata` (see `app/artists/[slug]/page.tsx` etc.), which stays the *fallback* when these are unset, so nothing breaks for artists that never touch the SEO tab.
- **One new nullable column on `artists`**: `updated_by uuid` (references `admin_users.id`, no DB-level FK for the same polymorphic-simplicity reasoning as `media.owner_id` — actually this one *can* be a real FK since it only ever points at one table; recommend making it a real foreign key, unlike `media.owner_id`) — needed so "who last edited this artist" is answerable without joining through `activity_log` for the common case.
- **One new column on `artist_applications`**: none needed — `reviewed_by` already exists (`text`, currently unused) and can now be populated with the real admin's name/email once Section 5's actions are wired to a real session; recommend changing its type from `text` to `uuid` referencing `admin_users.id` for referential integrity now that a real admin-user table will exist, with the display name looked up at render time instead of duplicated into the column.

Not added, and why: no `permissions` table (Section 3 explains the role-truth-table approach is sufficient until `manager`/`editor` are real), no `artist_versions`/full revision-history table (out of scope — `activity_log`'s `metadata.before/after` gives a lightweight trail without the storage/complexity cost of true versioning), no soft-delete column on `artists` beyond the existing `archived` status (which already *is* the soft-delete mechanism — "archived" and "not deleted, just hidden" are the same thing here, so a separate `deleted_at` column would be redundant).

## 11. Server action/API architecture

Continues the Phase 3 pattern exactly — **Server Actions, not a REST/GraphQL layer**, maintaining `UI → Server Action → Service/Repository → Neon/Blob`:

- `lib/admin/auth.ts` — `requireAdmin()` / `requireRole(minRole)` helpers, called as the first line of every admin Server Action. Throws (caught by the calling form's error state) if there's no valid session or the role is insufficient. This is the one new cross-cutting concern Phase 4 introduces; every other new module composes with it rather than reimplementing auth checks.
- `lib/repositories/artistAdmin.ts` (Section 6), `lib/repositories/media.ts` additions (Section 7), `lib/repositories/applications.ts#returnToReview` (Section 5), `lib/repositories/artists.ts#publishArtist/unpublishArtist` (Section 8) — all repository-layer, imported only by the thin `"use server"` action modules above them, exactly mirroring how `lib/repositories/*` is only ever imported by `lib/application.ts`/`lib/media.ts`/`lib/approvals.ts` today.
- One new `"use server"` module per admin feature area (`lib/admin/applicationActions.ts`, `lib/admin/artistActions.ts`, `lib/admin/mediaActions.ts`) rather than growing the existing Phase 3 files — keeps "public-facing submission logic" and "admin management logic" in clearly separate files even though they call into the same repositories, so it's always obvious from the import which surface a function belongs to.
- No page or Server Component ever imports `lib/db.ts` or a repository directly — only the `"use server"` action layer does, preserving the architecture diagram in your request exactly.

`app/api/auth/[...nextauth]/route.ts` is the one necessary Route Handler (Auth.js requires this exact convention) — everything else stays Server Actions.

## 12. Security model

Mapped to each stated requirement:

- **Admin routes must NOT be public / unauthenticated users redirected**: `middleware.ts` matcher on `/admin/:path*` (excluding `/admin/login`), checking the Auth.js session cookie and redirecting to `/admin/login?callbackUrl=...` if absent.
- **No authentication secrets in client code**: `AUTH_SECRET`, `DATABASE_URL` read only in server-only modules, per Section 1.
- **Sessions must be secure**: database-backed sessions (Section 1), httpOnly + `Secure` + `SameSite=Lax` cookies (Auth.js defaults on Vercel/HTTPS), configurable session lifetime (recommend a short-ish absolute lifetime for an admin tool — e.g. 12 hours — over the framework's longer default, given the sensitivity).
- **Authorization must be enforced server-side**: `requireAdmin()`/`requireRole()` at the top of every admin Server Action (Section 11), not just middleware or client-side route guards — a client-side "hide this button if not super_admin" is a UX nicety here, never the actual gate.
- **CSRF protection**: Next.js Server Actions already enforce same-origin request checks by default (this is built into the framework, not something Phase 4 needs to add) — the one Route Handler (`/api/auth/[...nextauth]`) inherits Auth.js's own CSRF token handling for the credentials sign-in POST.
- **Input validation**: every admin form's Server Action validates with a Zod schema before touching the repository layer, following the exact pattern `lib/validation/application.ts` already established — new schemas live in `lib/validation/artistAdmin.ts`, `lib/validation/adminUser.ts`.
- **File validation**: unchanged — Section 7 explicitly reuses `lib/media.ts`'s existing server-side type/size checks rather than adding a parallel path.
- **Rate limiting**: recommend limiting *login attempts specifically* (the realistic brute-force target), via a small counter — either an in-memory-per-instance limiter (cheap, imperfect across multiple serverless instances, fine as a first pass) or, if this needs to be robust immediately, Vercel's KV/Upstash Redis-backed rate limiter (`@upstash/ratelimit`), which is the standard Vercel-ecosystem answer and would be the one new infrastructure dependency this phase might add — flagged as a decision to make explicitly at implementation time rather than assumed.
- **Secure upload handling / no secret exposure**: unchanged from Phase 3 (Section 7).

## 13. Responsive strategy

Desktop-first, as specified — the admin shell is a fixed left sidebar (nav: Dashboard, Applications, Artists, Media, Settings) plus a content area, designed against a ~1280px+ viewport first. Tablet: sidebar collapses to icons-only or a toggleable drawer; multi-column forms (e.g. the artist editor's Profile tab) stack to single-column. Mobile: usable but not optimized — the sidebar becomes a slide-over menu, tables scroll horizontally inside their own `overflow-x` container rather than breaking layout, and every form remains operable (native inputs stack fine), but data-dense views like the applications table are acknowledged as "workable in a pinch, not pleasant" on a phone, which is an acceptable and explicitly requested tradeoff versus the public site's mobile-first mandate.

## 14. Error/loading strategy

- **Loading**: `loading.tsx` per admin route segment (Next.js's built-in convention — instant skeleton/spinner while a Server Component fetches), plus per-form pending states (`useFormStatus`/`useTransition`) on every submit button, matching the existing pattern already used in `ApplicationWizard.tsx`'s submit button.
- **Empty**: every list view (applications, artists, media) has an explicit empty state with the relevant next action ("No applications yet" / "No artists yet — [+ Add Artist]"), not a bare empty table.
- **Error**: `error.tsx` per route segment for unexpected failures; form-level errors render inline next to the relevant field (reusing the `ApplicationFieldErrors`-style pattern already established) rather than a generic toast for validation failures specifically — toasts are reserved for action *results* (saved / published / deleted), not field validation.
- **Success**: a lightweight toast/banner pattern (one shared `lib/admin/useToast` or a small context, not a new dependency unless the team wants one — `sonner` is the common lightweight choice if a library is preferred over hand-rolling this).
- **Confirmation**: every destructive/high-consequence action (Reject application, Archive artist, Unpublish artist, Delete media currently unused, Disable admin user) requires an explicit confirm step — a real modal with the consequence spelled out ("This artist will no longer be visible at /artists/nova-vale"), not a bare `window.confirm()`, given how much more consequential these actions are than the public site's booking form.
- **Unsaved changes**: each tab's form tracks a dirty flag; navigating away (tab switch or route change) with unsaved changes prompts confirmation. Flagging this as a nice-to-have worth deferring to a later Phase 4 sub-step if it threatens the timeline (Section 16) — it's real polish, not core safety, since nothing is lost silently (there's no autosave to conflict with).

## 15. Migration strategy

1. Write `db/schema.ts` additions for every new/changed table in Section 10, generate the migration via `npm run db:generate` (additive-only migration, reviewed before applying — exactly the same low-risk process Phase 3 already used successfully).
2. Apply via `npm run db:migrate` against the now-live production database — this is the first time a Phase 3-style migration runs against data that actually matters (the two seeded demo artists), so: back up via Neon's branching/point-in-time-restore (Neon supports this natively — worth confirming as a safety net) before applying, even though the migration is purely additive and should be a no-op risk to existing data.
3. `scripts/create_admin_user.ts` (new, one-off, analogous to `seed_demo_artists.ts`) creates the first `super_admin` account interactively or from env-provided credentials — never through a public form, matching the "no self-service signup" rule.
4. No changes to `USE_DATABASE`/static-fallback behavior — the admin dashboard only ever operates against the live database (there is no "admin dashboard for the static demo data" concept), so this flag is orthogonal to Phase 4 entirely.

## 16. Implementation phases

Recommend splitting Phase 4 itself into sub-phases, both to keep each reviewable PR-sized and because several pieces (auth, then everything else) are strictly sequential dependencies:

- **4a — Foundation**: `admin_users` + Auth.js wiring + `middleware.ts` + `/admin/login` + empty authenticated `/admin` shell (sidebar, no real content yet). Nothing else in Phase 4 can be built or meaningfully tested without this.
- **4b — Applications**: `/admin/applications` + `/admin/applications/[id]` + the four review actions (Section 5). Highest-value slice — this alone lets you stop needing me to run `db:verify`-style scripts to approve a real application.
- **4c — Artist list + publishing**: `/admin/artists` (search/filter) + publish/unpublish/archive actions + Draft Mode preview (Section 8), operating on artists that already exist (seeded or approved) before the full editor exists.
- **4d — Artist editor**: the tabbed CMS (Section 6) + manual artist creation (`/admin/artists/new`).
- **4e — Media management**: replace/reorder/global browser (Section 7) — natural to build after 4d since the editor's Photos/Music/Band tabs are where most media actions are triggered from.
- **4f — Activity/audit**: `activity_log` writes threaded through every action above (can actually start in 4a as a foundation piece so nothing needs retrofitting later) + the `/admin/activity` viewer UI (can genuinely wait until last, per your note that it doesn't need to be visible in V1).

## 17. What should NOT be built in Phase 4

Per your explicit list — Booking CRM, availability/calendar, client management, Instagram OAuth, AI receptionist, WhatsApp/Telegram notifications, advanced analytics — none of these are touched.

Also deliberately out of scope for Phase 4 specifically (not because they're bad ideas, but to keep this phase reviewable and matched to what's actually needed to operate the platform today):

- A granular per-action permissions system beyond the three-role truth table (Section 3) — roles, not row-level ACLs.
- Full field-by-field version history / revert-to-previous-version UI — `activity_log`'s before/after snapshots give a trail; a true versioning system is a much bigger feature.
- Multi-admin edit locking (two admins editing the same artist simultaneously) — `updated_at`/`updated_by` make conflicting edits visible after the fact (last write wins, but attributable), which is proportionate for a small admin team; optimistic locking or real-time collaboration would be over-engineering at this stage.
- Bulk actions (approve 10 applications at once, bulk-publish) — one-at-a-time is fine until volume proves otherwise.
- CSV/data export, or an API for external tools to read admin data — nothing asked for this.

## 18. Risks and recommendations

- **This is the first schema change applied to a database with real (seeded) production data**, not an empty one — recommend explicitly confirming Neon's branching/backup story before running `db:migrate` against production for Phase 4, even though every change here is additive. Cheap insurance for a low-probability but high-cost mistake.
- **Rate limiting the login route is a real gap until it's built** (Section 12) — a single `super_admin` password is a meaningful target the moment `/admin/login` is public-reachable (it has to be, so unauthenticated users can be *redirected* there). Recommend treating basic login rate limiting as part of 4a, not deferred, even though it wasn't called out as its own numbered item in your request.
- **Draft Mode's interaction with static generation deserves a short spike before committing to it fully**: Phase 3's public artist pages are statically generated (`generateStaticParams`) when `USE_DATABASE` is on and slugs are known at build time. Next.js Draft Mode is designed to work alongside this (it forces dynamic rendering for the duration of the preview), but this project hasn't yet exercised that combination — recommend a small proof-of-concept as the first task in Section 8/4c, rather than discovering an incompatibility mid-build.
- **`activity_log` will grow indefinitely with no retention policy** — not a problem at current scale, worth a one-line note in the eventual `/admin/activity` UI rather than solving now (e.g., a future scheduled cleanup job, out of scope today).
- **The `media.owner_id` polymorphic-without-DB-FK design (flagged as a risk in `PHASE_3_PLAN.md` already) gets more exercise in Phase 4** than it did in Phase 3 — replace/reorder/delete all touch it directly from admin-triggered code paths now, not just the one approval-flow re-pointing operation. Worth the same test-coverage-over-DB-constraint mitigation already noted, just flagging that Phase 4 is where a bug here would first surface in practice.
- **Recommend the first admin account be created via the one-off script (Section 15), not a "seed a default admin with a known password" shortcut** — even for a demo/staging pass, a hardcoded default admin credential is the kind of thing that accidentally ends up in production.

---

**Nothing above has been implemented.** Waiting for approval before writing any schema, installing any package, or touching any existing file.
