# Phase 3 — Database + Media Storage: Architecture Plan

**Status:** Planning only. No files modified, no dependencies installed, no tables created, nothing deployed. This document is for review and approval before any implementation begins.

**Scope reviewed:** current repo at commit `52098a2` — Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Zod already a dependency, Tailwind v4, deployed on Vercel. Existing data model in `types/artist.ts` and `types/application.ts`, data access layer in `lib/artists.ts`, Server Actions in `lib/application.ts` and `lib/booking.ts`, static demo data in `data/artists/*.ts`, client-only file staging in `lib/uploads.ts`.

---

## 1. Recommended database provider

**Neon Postgres via the Vercel Marketplace** (Vercel's native "Vercel Postgres" offering is Neon under the hood as of 2024).

Reasoning specific to this project:

- The app is already on Vercel. Provisioning through the Vercel dashboard wires `POSTGRES_URL` / `DATABASE_URL` into the project's environment variables automatically, for both Production and Preview environments, with zero manual secret-copying.
- Every Vercel Preview Deployment (one per pull request) can get its own branched Postgres database via Neon's branching feature. That matters here because Phase 3 introduces an approval workflow — being able to test "submit → review → approve → publish" end-to-end on a PR preview without touching production data is worth having from day one.
- Serverless-friendly connection handling (pooled HTTP/WebSocket driver) matches Next.js Server Actions and Route Handlers running as serverless/edge functions, which don't hold long-lived TCP connections well.
- Zod is already a dependency and pairs naturally with **Drizzle ORM** (recommended over Prisma here) for schema definition and type-safe queries — Drizzle's schema files are plain TypeScript, generate migrations via `drizzle-kit`, and add a much smaller cold-start footprint than Prisma's generated client, which matters on Vercel's serverless functions.
- Alternative considered: **Supabase Postgres**. Supabase is a fine choice and bundles storage + auth + Postgres in one product, which is relevant below. It's ruled out only as the *primary* recommendation because it introduces a second vendor dashboard/account separate from Vercel, and its row-level-security model is most valuable when the browser talks to the database directly — this app's design (all writes go through Server Actions, never client-side) doesn't need that. If the team later wants a single Supabase account for everything (DB + storage + future auth), that's a reasonable alternative bundle — see the Storage section below for how that tradeoff plays out.

## 2. Recommended storage provider

**Vercel Blob.**

Evaluated against the four options requested:

- **Vercel Blob** — same account/dashboard as the database and deploys, environment variables auto-injected the same way, a simple `put()`/`del()` SDK, built on top of S3-compatible infrastructure so nothing exotic. Public-read URLs with unguessable random suffixes by default, or explicit access control. Cost model (storage + bandwidth) is fine at this project's scale (artist photos, EPK PDFs — not video hosting at volume). **Recommended.**
- **Supabase Storage** — good option, and the natural pairing if the database recommendation above were Supabase instead of Neon. Since we're recommending Neon (via Vercel) for the database, adding Supabase only for storage would mean managing two vendor accounts and two sets of credentials for no functional gain.
- **Cloudinary** — the strongest option specifically *if* on-the-fly image transformation (responsive resizing, format negotiation, cropping presets) becomes a real requirement. Next.js's built-in `<Image>` component (already used throughout this codebase, e.g. `app/page.tsx`) already handles resizing/optimization for images served from any host once that host is allow-listed in `next.config.ts`, so Cloudinary's main advantage is substantially covered already. Worth revisiting only if the artist gallery grows large enough that source-image bandwidth becomes a cost concern.
- **S3-compatible (raw AWS S3, or Cloudflare R2)** — most control, most portable, but requires standing up IAM policies, bucket CORS config, and a signing flow by hand, and a separate AWS/Cloudflare account. Right call for a project that expects to outgrow Vercel; overkill for this phase.

Net: Vercel Blob keeps everything (deploys, database, storage, secrets) in one dashboard and one set of environment variables, with an upgrade path to S3-compatible storage later if the project ever needs to leave Vercel — Blob's underlying protocol is S3-compatible, so that migration would not require re-architecting the upload flow, only swapping the client.

## 3. Entity / schema design

All tables below are described logically (columns + types + constraints); the actual Drizzle schema file would live at `db/schema.ts` when implementation begins.

### `artist_applications`
The raw incoming submission — effectively `ArtistApplication` from `types/application.ts`, persisted.

| column | type | notes |
|---|---|---|
| `id` | uuid, PK | |
| `status` | enum: `draft`, `submitted`, `under_review`, `approved`, `rejected` | default `draft` |
| `stage_name`, `real_name`, `pronunciation`, `city`, `country`, `primary_genre`, `secondary_genres`, `tagline`, `short_bio`, `full_bio` | text | section 1 |
| `artist_type`, `primary_role`, `years_active`, `languages_performed`, `style_description`, `career_highlights`, `awards`, `notable_performances`, `festivals_played`, `media_features` | text | section 2 |
| `social_links` | jsonb | section 6, matches `ApplicationSocialLinks` |
| `has_no_upcoming_shows`, `is_solo_no_band` | boolean | |
| `performance_formats` | jsonb | array of `{id, label, selected, description}` |
| `budget_range`, `typical_set_duration`, `number_of_sets`, `technical_requirements`, `stage_requirements`, `hospitality_notes` | text | |
| `artist_statement`, `press_kit_url`, `website_url` | text | |
| `preferred_contact_email`, `booking_contact_name`, `booking_contact_email`, `booking_phone`, `management_email`, `management_phone` | text | |
| `available_event_types` | jsonb (string array) | |
| `domestic_travel`, `international_travel` | boolean | |
| `booking_notes` | text | |
| `consent_content_use`, `consent_media_rights` | boolean, not null | required true before `submitted` |
| `submitted_at`, `reviewed_at` | timestamptz, nullable | |
| `reviewed_by` | text, nullable | admin identifier once auth exists (Section 7) |
| `rejection_reason` | text, nullable | shown back to applicant on `rejected` |
| `linked_artist_id` | uuid, nullable, FK → `artists.id` | set once approved and converted |
| `created_at`, `updated_at` | timestamptz | |

Repeatable sub-sections of the application (releases, videos, shows, band members, collaborations, testimonials, press quotes) are **not** flattened into `artist_applications` — see the child tables below, all keyed by `application_id`. This mirrors the eventual `artists`-side tables and makes the approval-time copy step (Section 5) a straightforward table-to-table map instead of a JSON-unpacking exercise.

- `application_releases` (`id`, `application_id` FK, `type`, `title`, `release_date`, `artwork_media_id` FK → `media.id` nullable, `description`, `spotify_url`, `apple_music_url`, `youtube_url`, `other_url`, `sort_order`)
- `application_videos` (`id`, `application_id` FK, `title`, `description`, `url`, `sort_order`)
- `application_shows` (`id`, `application_id` FK, `date`, `city`, `country`, `venue`, `event_name`, `event_type`, `ticket_url`, `is_public`, `sort_order`)
- `application_band_members` (`id`, `application_id` FK, `name`, `role`, `bio`, `instagram`, `photo_media_id` FK → `media.id` nullable, `sort_order`)
- `application_collaborations` (`id`, `application_id` FK, `brand`, `type`, `year`, `description`, `link`, `sort_order`)
- `application_testimonials` (`id`, `application_id` FK, `client_name`, `company`, `event`, `testimonial`, `sort_order`)
- `application_press_quotes` (`id`, `application_id` FK, `quote`, `source`, `sort_order`)

`profile_photo`, `hero_photo`, and `additional_photos` on the application are represented as rows in `media` with `owner_type = 'application'` and `owner_id = application_id` (see `media` below), rather than separate columns — one media model serves both applications and published artists.

### `artists`
The public-facing record. Roughly `Artist` from `types/artist.ts`, minus large repeatable collections (moved to child tables, matching the pattern above) and minus raw image paths (moved to `media`).

| column | type | notes |
|---|---|---|
| `id` | uuid, PK | |
| `slug` | text, unique, not null | URL segment, e.g. `aurora-noir` |
| `status` | enum: `draft`, `active`, `inactive`, `archived` | default `draft` |
| `source_application_id` | uuid, nullable, FK → `artist_applications.id` | traceability back to the original submission; nullable because an artist could in principle be created directly by an admin without an application |
| `name`, `stage_name`, `tagline`, `genre`, `location` | text | |
| `bio`, `short_bio` | text | |
| `career_highlights` | jsonb | `{id, label}[]` — low-cardinality, no need for its own table |
| `social_links` | jsonb | `SocialLinks` shape |
| `streaming_links` | jsonb | `StreamingLinks` shape |
| `instagram_handle` | text, nullable | placeholder for Phase — Future Instagram; no token stored here |
| `press_kit` | jsonb | `PressKit` minus file URLs, which live in `media`/`press_kit_files` |
| `booking_settings` | jsonb | `BookingSettings` shape |
| `contact_information` | jsonb | `ContactInformation` shape |
| `og_image_media_id` | uuid, nullable, FK → `media.id` | |
| `profile_image_media_id`, `hero_image_media_id`, `about_image_media_id` | uuid, nullable, FK → `media.id` | |
| `published_at` | timestamptz, nullable | set when `status` moves to `active` |
| `created_at`, `updated_at` | timestamptz | |

Child tables, same shape as the application-side ones and populated at approval time: `releases`, `release_streaming_links` (or just a `jsonb` column on `releases`, since `StreamingLinks` is already a nested object with an `other[]` array — jsonb is simpler here and avoids a fourth-level table), `artist_videos`, `gallery_images`, `shows`, `band_members`, `performance_formats`, `collaborations`, `testimonials`, `instagram_feed` (cached posts once Phase — Future Instagram exists; empty for now).

Each of these mirrors its `types/artist.ts` interface with `artist_id` as the FK and image/photo columns replaced by `*_media_id` FKs into `media`. Given the request's entity list called out `releases`, `shows`, `band_members`, `performance_formats`, `social_links`, `collaborations`, `testimonials`, `press_kits`, `booking_profiles` explicitly: `social_links`, `press_kits`, and `booking_profiles` (`booking_settings` here) are modeled as **jsonb columns on `artists`**, not separate tables, because they are single nested objects per artist (not repeatable lists) and their internal shape is already stable, well-typed by the existing TypeScript interfaces, and never queried independently of their parent artist. `releases`, `shows`, `band_members`, `performance_formats`, `collaborations`, and `testimonials` *are* separate tables because they're one-to-many, need independent sort order, and (for `shows`) need to be queried and filtered on their own (upcoming vs. past, exactly as `lib/artists.ts#getArtistShows` already does).

### `media`
Single table for all uploaded files, shared by applications and artists.

| column | type | notes |
|---|---|---|
| `id` | uuid, PK | |
| `owner_type` | enum: `application`, `artist` | which table `owner_id` points into |
| `owner_id` | uuid, not null | not a DB-level FK (it targets one of two tables) — enforced in the application layer; a `CHECK`-based polymorphic FK is possible in Postgres but adds complexity not justified yet |
| `role` | enum: `profile_photo`, `hero_photo`, `about_photo`, `gallery_photo`, `release_artwork`, `band_member_photo`, `press_kit_file`, `og_image` | what this file is used for |
| `blob_url` | text, not null | the public (or signed) Vercel Blob URL |
| `blob_pathname` | text, not null | Blob's internal pathname, needed to call `del()` |
| `file_name` | text | original filename, for display |
| `mime_type` | text, not null | |
| `size_bytes` | integer, not null | |
| `width`, `height` | integer, nullable | populated for images |
| `sort_order` | integer, default 0 | for gallery ordering |
| `uploaded_at` | timestamptz | |

This directly replaces the client-only `StagedAsset` shape from `types/application.ts` for anything that becomes real. `StagedAsset.previewUrl` (a `blob:` object URL) never gets written to the database — it's a browser-session-only value; the server-side upload flow (Section 6) produces the real `media` row from the uploaded `File`, not from the client's preview URL.

### `press_kits`
Called out explicitly in the request as its own entity. In practice `PressKit` (from `types/artist.ts`) is one nested object per artist — bio text fields plus a handful of file links (`downloadUrl`, `technicalRiderUrl`, `hospitalityRiderUrl`, `stagePlotUrl`, `inputListUrl`). Recommendation: keep the text fields as part of the `artists.press_kit` jsonb column (as above), and represent each file as a `media` row with `role = 'press_kit_file'` and a `label` sub-field (technical rider / hospitality rider / stage plot / input list) inside a small `metadata jsonb` column on `media`, rather than a fully separate `press_kits` table with five nullable file-URL columns. This keeps the file-handling logic (validate, upload, delete) identical across every kind of upload instead of press-kit files having their own bespoke path.

### `booking_profiles`
Same reasoning as `press_kits`: `BookingSettings` is a single nested object per artist today, so it lives as the `artists.booking_settings` jsonb column. It is deliberately *not* the same thing as a future `booking_inquiries` table (Future Booking phase, not built now) — `booking_profiles`/`booking_settings` describes what an artist offers (event types, formats, budget ranges); `booking_inquiries` will describe requests coming in from the public "Book Now" form, and is out of scope for this phase per the request.

### Why jsonb for some fields and normalized tables for others
The rule applied throughout: if the request's entity list item is a *repeatable, independently-orderable, sometimes-independently-queried* collection (releases, shows, band members, performance formats, collaborations, testimonials, media), it gets a real table with a foreign key. If it's a *single nested object* per parent row that's always read and written together with its parent and never queried on its own (social links, press kit text, booking settings, contact information), it stays as a `jsonb` column. This keeps the schema close to the existing TypeScript interfaces (minimizing mapping-layer complexity when this replaces `lib/artists.ts`) while still giving relational integrity and independent querying where it actually matters (e.g., "all upcoming shows across all artists" is a real query the public site or a future admin dashboard will want; "artists whose booking settings mention weddings" is not).

## 4. Entity relationships

```
artist_applications (1) ──< application_releases
                     (1) ──< application_videos
                     (1) ──< application_shows
                     (1) ──< application_band_members
                     (1) ──< application_collaborations
                     (1) ──< application_testimonials
                     (1) ──< application_press_quotes
                     (1) ──< media (owner_type = 'application')
                     (1) ──1 artists   [via artists.source_application_id, set on approval]

artists (1) ──< releases
        (1) ──< artist_videos
        (1) ──< gallery_images
        (1) ──< shows
        (1) ──< band_members
        (1) ──< performance_formats
        (1) ──< collaborations
        (1) ──< testimonials
        (1) ──< media (owner_type = 'artist')
        (1) ──1 artist_applications   [source_application_id, nullable, informational back-reference]
```

Nothing in this design lets a public artist page read from `artist_applications` directly, and nothing lets an application row be queried by `slug` — they are deliberately separate tables with a one-directional, nullable link (`artists.source_application_id`), not a shared table with a `type` discriminator. That separation is what makes "applications are never immediately public" structurally true rather than just enforced by application code (Section 5 and Section 10 expand on this).

## 5. Application → artist approval flow

```
1. Artist visits /apply, fills the wizard (client-side, as today)
     → status: draft (if we add save-as-draft persistence; V1 today only
       autosaves to localStorage, not the DB — see Section 9)

2. Artist clicks Submit
     → Server Action re-validates (as lib/application.ts already does)
     → INSERT into artist_applications + child tables, status: submitted
     → uploaded files go through the media upload flow (Section 6) with
       owner_type = 'application', owner_id = the new application's id
     → applicant sees the existing confirmation screen; referenceId is now
       the real application id instead of a Date.now()-derived string

3. (Future /admin, not built this phase) Manager opens the application list,
   filtered to status = submitted
     → opening one sets status: under_review, reviewed_by: <admin id>
       (optimistic-lock style; prevents two managers silently double-working
       the same application — a second open just shows who has it)

4. Manager approves
     → within a single DB transaction:
         a. INSERT a new artists row, status: draft,
            source_application_id: <application id>
         b. copy scalar fields application → artist 1:1 by name
            (stage_name → stage_name, full_bio → bio, etc. — a documented
            field-mapping table, not a schema-identical copy, since a few
            names differ deliberately, e.g. application.full_bio → artist.bio)
         c. re-point each application_releases / _videos / _shows / _band_members
            / _collaborations / _testimonials row into the equivalent
            artist-side table with the new artist_id
         d. re-point each media row from owner_type='application' to
            owner_type='artist', owner_id = new artist id (no file is
            re-uploaded — same Blob object, only the DB ownership row changes)
         e. UPDATE artist_applications SET status='approved',
            linked_artist_id=<new artist id>, reviewed_at=now()
     → manager still needs to set a `slug` (auto-suggest from stage_name,
       but require manual confirmation — slugs are permanent URLs) and
       explicitly move status draft → active to publish (step 6)

   Manager rejects
     → UPDATE status='rejected', rejection_reason=<text>, reviewed_at=now()
     → no artists row is created; the applicant can, in a later iteration,
       be notified by email (out of scope this phase — no email provider
       is wired up yet, matching "do NOT implement notifications now"
       being consistent with the rest of the deferred-scope list, though
       the request didn't explicitly ask for email — flagging as a gap
       in Section 13)

5. Artist record now exists with status: draft — editable in the future
   /admin, not yet publicly visible (public queries only ever select
   status = 'active', see Section 10)

6. Manager reviews the draft artist page (a preview route, unauthenticated
   preview via a signed token, or simply the same /admin UI rendering the
   public components with draft data — implementation detail for the admin
   phase) and flips status: draft → active
     → published_at set → artist now appears in getAllArtists()-equivalent
       queries and at /artists/<slug>
```

This avoids duplicating data long-term: after approval, the `artist_applications` row and its children become a **read-only historical record** (what was originally submitted), while the `artists` row and its children become the **live, editable record** a manager can change independently going forward (correcting a typo in the artist's bio post-launch must not mutate the original submission). The two are linked for audit/traceability (`source_application_id` / `linked_artist_id`) but never kept in sync after the copy — that is an intentional one-time fork, not a live mirror, because "editable going forward" and "immutable record of what was submitted" are different requirements that a live sync would conflict with.

## 6. Media upload flow

```
Client (ApplicationWizard / a future admin editor)
  │  user selects a file in a <FileInput>/<MultiFileInput>
  ▼
Client-side validation (lib/uploads.ts#validateImageFile — reused as-is:
  type/size checks stay identical, this logic doesn't change)
  │
  ▼
Client calls a new Server Action, e.g. `uploadApplicationMedia(formData)`
  (NOT client-side direct-to-Blob upload for this phase — simplest and
  most consistent with the fact every other write in this app already
  goes through a Server Action; Vercel Blob's client-upload mode, which
  needs a signed-token handshake, is a reasonable future optimization for
  large files but adds complexity not needed at this project's file sizes)
  │
  ▼
Server Action (runs on Vercel, has access to BLOB_READ_WRITE_TOKEN):
  1. re-validate mime type + size server-side (never trust the client
     check alone — same principle already documented in lib/application.ts)
  2. call Vercel Blob's `put()` with a namespaced path, e.g.
     `applications/<application-id>/profile-photo-<uuid>.jpg`
     (or `artists/<artist-id>/gallery/<uuid>.jpg` from the future admin editor)
  3. INSERT a `media` row (owner_type, owner_id, role, blob_url,
     blob_pathname, file_name, mime_type, size_bytes, dimensions)
  4. return the media row's id + public URL to the client
  │
  ▼
Client replaces the StagedAsset placeholder (blob: object URL, used only
  for instant local preview) with the real uploaded media id + permanent
  URL once the Server Action resolves — the wizard's UI/UX doesn't
  otherwise change; it already shows a "staged" preview immediately and
  can now show an "uploaded" state once the Server Action confirms
```

Deletion (an artist removing a gallery photo, or a rejected application being purged) is symmetric: delete the `media` row and call Blob's `del(blob_pathname)` in the same transaction/action, so orphaned files in Blob storage don't accumulate. A scheduled cleanup job (Vercel Cron, out of scope to build this phase) is worth planning for regardless, to catch any file that gets uploaded but whose `media` row insert fails (e.g., DB hiccup right after a successful Blob `put()`).

## 7. Authentication / authorization strategy for future admin

Not building `/admin` this phase, but the schema and API above are designed so it can be added without rework:

- **Recommended approach:** Auth.js (NextAuth) v5, using its Credentials or a magic-link/email provider restricted to a manually-maintained allowlist of manager email addresses — no self-service signup. Auth.js integrates natively with Next.js App Router Route Handlers/Middleware and works cleanly with Neon Postgres as its session/user store via the Drizzle adapter, keeping everything in the same database rather than adding a third auth-specific vendor.
- Alternative: **Clerk** or **Vercel's own upcoming/д current auth offerings** — viable, but adds a dedicated auth vendor/dashboard; reasonable if the team wants a polished admin login UI without building one, otherwise Auth.js keeps the vendor count lower, matching the Section 1–2 reasoning.
- **Authorization model:** a single `managers` table (`id`, `email`, `role` — e.g. `admin` / `reviewer`, `created_at`) checked by Next.js Middleware on every `/admin/*` route and re-checked inside every Server Action that touches `artist_applications` or mutates `artists` (defense in depth — middleware alone is not sufficient if a Server Action can be invoked directly). No public self-serve roles are needed yet since there's no artist-facing login this phase (artists don't get accounts in Phase 3 — they only get the public `/apply` form; an artist-facing login to edit their own profile is a reasonable *future* phase but isn't in this request's scope).
- Every admin mutation (approve/reject/publish/edit) should be attributable — hence `reviewed_by` on `artist_applications` and an eventual `updated_by` on `artists` — so there's an audit trail from day one of the admin phase, even though building the audit *UI* is out of scope now.

## 8. API / service architecture

Keep the existing pattern: **Server Actions, not a separate REST/GraphQL API layer**, for the same reasons the current `lib/application.ts` and `lib/booking.ts` already use them — they colocate with the Next.js app, get automatic CSRF protection, and avoid hand-rolling request/response typing that Zod + TypeScript already give for free between a Server Action and its caller.

Concretely:

- `lib/db.ts` (new) — single Drizzle client instance, instantiated once per serverless invocation from `process.env.DATABASE_URL`, imported by every data-access function. Never imported by any Client Component.
- `db/schema.ts` (new) — the Drizzle table definitions described in Section 3, the single source of truth migrations are generated from.
- `lib/artists.ts` — **same exported function signatures as today** (`getAllArtists`, `getArtistBySlug`, `getArtistShows`, etc.), bodies rewritten to query the database via Drizzle instead of reading the static array. This is the seam the original code comments in that file already called out ("When a real backend exists, only this file needs to change"), and it holds up — no page or component under `app/artists/[slug]/` needs to change at all.
- `lib/applications.ts` (new, distinct from the existing `lib/application.ts` which becomes the submission-side Server Action) — admin-facing read/query functions: `listApplications(status?)`, `getApplicationById(id)`, used by the future `/admin` UI.
- `lib/application.ts` — `submitArtistApplication` body changes from "validate + console.log" to "validate + insert into DB + insert media rows," same exported signature, same return type, so `ApplicationWizard.tsx` needs zero changes to its call site.
- `lib/media.ts` (new) — `uploadMedia(file, ownerType, ownerId, role)` Server Action wrapping the Blob `put()` + `media` row insert from Section 6; `deleteMedia(mediaId)` for the symmetric case.
- `lib/approvals.ts` (new, admin-only, used once `/admin` exists) — `approveApplication(applicationId)`, `rejectApplication(applicationId, reason)`, implementing the transaction in Section 5.

No public REST endpoints (`app/api/**/route.ts`) are needed for anything the current UI does. The one place a Route Handler may eventually be worth adding is a Vercel Cron-triggered cleanup job (orphaned Blob files, per Section 6) — not needed for this phase's approval.

## 9. Migration strategy from current static demo data

The request is explicit: don't remove the demo data until the database implementation is ready. Concretely, staged as follows:

1. **Build the schema and data layer alongside the static data**, not instead of it. `data/artists/aurora-noir.ts` and `data/artists/nova-vale.ts` stay exactly as they are through the whole implementation.
2. **Add a feature flag / environment check** in `lib/artists.ts` — e.g. `const USE_DATABASE = Boolean(process.env.DATABASE_URL)`. When false (local dev with no DB configured yet, or if something goes wrong with the DB in production), every function falls back to reading `data/artists/*.ts` exactly as today. This means Phase 3 can be deployed to production incrementally without any risk of the public site breaking if the database isn't fully ready.
3. **Write a one-time seed script** (`scripts/seed_demo_artists.ts`, run manually via `tsx` or `next.config`'s node runtime, not part of the build) that inserts Aurora Noir and Nova Vale's existing static data into the new tables — including downloading their current `public/artists/**` images and re-uploading them through the real Blob upload path (Section 6) so the demo artists end up as fully real `media` rows, not a special-cased hybrid. This also doubles as the first real test of the whole insert → media → publish pipeline before any real applicant goes through it.
4. **Cut over** `lib/artists.ts` to read from the database as the default once the seed is verified (screenshot-diff the two demo artist pages against their current static-data rendering — pixel-for-pixel unchanged is the acceptance bar, since the whole point of the data-access-layer seam is that no visual change should occur).
5. **Only after that cutover is confirmed stable in production** does removing `data/artists/*.ts` become a candidate for a later cleanup commit — and even then, keeping it around as a fallback/fixture for local development without a database connection (per the flag in step 2) is reasonable to keep indefinitely rather than delete.

This keeps `/`, `/artists/aurora-noir`, and `/artists/nova-vale` continuously working throughout, per the request's explicit requirement.

## 10. Security model

Mapped directly to each requirement in the request:

- **Public users cannot access private application data.** Structurally enforced by Section 3/4's design: there is no public route or public-facing data-access function that ever queries `artist_applications` or its child tables. `lib/artists.ts` (the only data layer the public site imports) only ever queries `artists` filtered to `status = 'active'`. The admin-only `lib/applications.ts` module is never imported by anything under the public `app/` routes, and once `/admin` exists, its Server Actions re-check the manager session (Section 7) on every call rather than trusting that only authenticated users can reach the code path.
- **Artists cannot access other artists' private data.** No artist-facing authenticated area exists in this phase (artists don't get login accounts — only the public `/apply` form and the fully public artist pages). So there is no cross-artist data-access surface to secure yet; this becomes relevant only if a future phase adds artist self-service editing, at which point every artist-scoped query needs a `WHERE artist_id = <session artist id>` guard the same way manager-scoped queries need a role check.
- **Storage permissions are controlled.** Vercel Blob objects are written with explicit `access` settings per file — public artist-facing images (profile photos, gallery, hero images) as `public`, since they're rendered on public pages anyway; anything that shouldn't be broadly link-shareable (raw press-kit source files before approval, if that distinction matters) can use Blob's private/signed-URL mode instead. The `BLOB_READ_WRITE_TOKEN` that authorizes writes is a server-only environment variable, never exposed to the client (see next point).
- **Service credentials never reach the browser.** `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` are read only inside Server Actions / server-only modules (`lib/db.ts`, `lib/media.ts`) — never inside a `"use client"` file, never returned in a Server Action's response payload, and never prefixed `NEXT_PUBLIC_` (which is the one thing in Next.js that would leak a variable into client bundles). This matches how the codebase already handles the one credential it has today implicitly (none yet — this phase introduces the first real secrets).
- **Uploaded files are validated.** Client-side validation (`lib/uploads.ts`, unchanged) is UX-only; the Section 6 flow re-validates mime type and size **server-side inside the Server Action**, before ever calling Blob's `put()`, exactly mirroring how `lib/application.ts` already re-validates form fields server-side rather than trusting the client.
- **File sizes/types are restricted.** Same 15MB / JPG-PNG-WEBP constants already defined in `lib/uploads.ts` become the server-side-enforced limits too (single source of truth, imported by both the client component and the new server upload action) — plus a hard cap enforced by Vercel Blob itself as a second layer.
- **Application submissions are validated server-side.** Already true today (`lib/application.ts`'s `validate()` function) and carries forward unchanged; the only addition is that a Zod schema (Zod is already a dependency) should formalize this validation instead of the current hand-written `validate()` function, since Zod schemas can be shared between the client-side wizard's inline validation and the server's re-validation without duplicating the rules by hand — worth doing as part of this phase's implementation since the shapes are being touched anyway.

## 11. Environment variables required

| variable | purpose | where set |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection string | auto-injected by Vercel when the Postgres integration is added to the project; also needed in `.env.local` for local dev (pointing at a dev branch) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob write access | auto-injected by Vercel when the Blob store is added to the project |
| `AUTH_SECRET` | Auth.js session encryption (Section 7, future) | generated once, set in Vercel + `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | already scaffolded (currently commented out in `.env.example`) | uncomment and set — used for absolute URLs, e.g. in JSON-LD / sitemap, and useful for constructing correct redirect/callback URLs once auth exists |

No Instagram, no booking-CRM, no payment credentials — none of those are in scope this phase, consistent with the request.

## 12. Estimated implementation steps

Rough sequencing, assuming this plan is approved as-is:

1. Provision Neon Postgres + Vercel Blob through the Vercel dashboard; pull env vars into local `.env.local`.
2. Add `drizzle-orm`, `drizzle-kit`, `@vercel/postgres` (or `@neondatabase/serverless`), `@vercel/blob` as dependencies.
3. Write `db/schema.ts` for every table in Section 3; run `drizzle-kit generate` + apply the first migration against the dev database branch.
4. Build `lib/db.ts`, `lib/media.ts` (upload/delete), and Zod schemas shared between client + server validation.
5. Rewrite `lib/application.ts#submitArtistApplication` to persist to the database + wire `ApplicationWizard.tsx`'s file inputs to the new upload Server Action instead of only `stageLocalFile`.
6. Rewrite `lib/artists.ts` to query the database, gated behind the `USE_DATABASE` flag (Section 9).
7. Write and run the demo-data seed script; verify `/`, `/artists/aurora-noir`, `/artists/nova-vale` render identically to today.
8. Build the approval-flow transaction (`lib/approvals.ts`) and exercise it with a manual script or a minimal internal test route (no `/admin` UI yet — that's explicitly deferred) to prove the application → artist copy works end-to-end.
9. Flip `USE_DATABASE` on in production once step 7's visual parity is confirmed; monitor.
10. (Explicitly future, not part of this estimate): build `/admin` UI, artist self-service editing, booking CRM, Instagram OAuth.

Steps 1–9 are the actual Phase 3 scope. This is meaningfully more work than the onboarding-form phase — introducing a database and a file-storage provider touches the data layer, the submission flow, and adds a migration/seed step that has to be verified for visual parity — but it's still incremental: nothing in `app/artists/[slug]/**` or any component needs to change, because the whole point of the existing `lib/artists.ts` seam was to make exactly this swap low-risk.

## 13. Risks / architectural concerns

- **No admin UI means no way to actually approve anything yet.** This plan makes the approval *flow* (Section 5) implementable and testable via a script, but a real manager can't use it without `/admin` existing. That's explicitly out of scope for this phase per the request, but worth flagging plainly: after Phase 3 ships, submitted applications will accumulate in the database with no one able to act on them through a UI until the admin phase follows. If there's urgency to actually onboard real artists soon after this phase, the admin phase should follow immediately rather than being an indefinite "someday."
- **No applicant-facing notification when reviewed.** Neither this request nor the current codebase has an email/notification provider. Once real applications are being reviewed, an approved/rejected applicant currently has no way to find out except someone manually emailing them. Not a blocker for this phase, but worth deciding on before real-world use, not as an afterthought.
- **Slug collisions and permanence.** `artists.slug` is the public URL. The approval flow (Section 5) auto-suggests a slug from `stage_name` but a manager must confirm it — two artists submitting as "Nova" needs a human tiebreaker, and changing a slug after an artist's page has been shared/indexed has real SEO/link-rot cost. Worth a `slug_history` table or at least a documented "slugs are not changed lightly" policy once the admin phase adds slug editing.
- **`owner_type`/`owner_id` polymorphism on `media` is an application-enforced foreign key, not a database-enforced one.** Postgres can't natively FK a column to "whichever of two tables `owner_type` names." This is a deliberate simplicity tradeoff (avoids either duplicating the media table per owner type, or a more complex partitioned/check-constraint scheme) but it does mean a bug in application code could theoretically insert a `media` row pointing at a nonexistent id with no database-level error. Mitigation: cover this with tests around `lib/media.ts` rather than trying to enforce it at the schema level — the complexity cost of a DB-level polymorphic FK isn't worth it at this project's scale.
- **Draft-application persistence isn't addressed.** Section 3's `draft` status exists in the enum because the request specified it, but the current wizard only autosaves to `localStorage`, never to the server, until final submit. Whether "draft" should mean a server-persisted in-progress application (so an artist can resume from a different device) or just documents the *possible* status for completeness is a product decision this plan doesn't resolve — flagging it rather than guessing, since it changes whether every wizard step needs its own Server Action (autosave-to-DB per step) versus one submission action at the end (current behavior, kept as-is).
- **Vercel Blob + Neon both have usage-based pricing.** At demo/early scale this is likely free-tier, but real artist media (dozens of high-res gallery photos and press kit PDFs per artist, multiplied across a growing roster) should be sanity-checked against current Vercel pricing before onboarding many real artists, not assumed indefinitely free.
- **`AGENTS.md`'s standing instruction** ("read the relevant Next.js docs guide in `node_modules/next/dist/docs/` before writing any code, this Next.js version has breaking changes vs. training data") applies directly once implementation starts — Server Actions, Route Handlers, and environment-variable handling are exactly the kind of API surface that file is warning about, so the implementation phase should re-read the relevant local docs rather than relying on general Next.js familiarity, before writing `lib/db.ts` and the upload Server Action.

---

**Nothing above has been implemented.** Waiting for approval before writing any schema, installing any package, or touching any existing file.
