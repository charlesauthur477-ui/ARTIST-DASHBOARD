# Wavelength Artist Management — Multi-Artist Website Platform (V1)

A premium, mobile-first, multi-artist public website system. One reusable
Next.js application powers an official website, digital press kit, and
booking funnel for every artist on the roster — each artist gets their own
URL and content, all rendered through the same component library.

This is **V1**: public artist websites only. No admin dashboard, CRM,
database, or authentication is included yet — see [Future Architecture](#future-architecture--v2).

## Live demo routes

- `/` — platform landing page, lists all artists
- `/artists/aurora-noir` — fully populated demo artist (fictional)
- `/artists/nova-vale` — second, lighter demo artist, proving the multi-artist architecture
- `/apply` — artist onboarding / press kit intake form (see [Artist Onboarding](#artist-onboarding--press-kit-apply) below)

Every artist gets: `/`, `/about`, `/music`, `/shows`, `/gallery`, `/band`,
`/press`, `/booking`, `/contact`.

## Tech stack

- **Next.js 16** (App Router, Turbopack, React Server Components by default)
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **Framer Motion** for animation (respects `prefers-reduced-motion`)
- **Lucide React** for iconography (plus a few hand-rolled inline SVGs for
  brand glyphs — see [Icons](#icons) below)
- No database, no auth, no external APIs — V1 data is static TypeScript

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Visit `/` for the platform page, or jump
straight to `/artists/aurora-noir`.

### Other commands

```bash
npm run build      # production build
npm run start      # run the production build locally
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript check
npm run db:generate # generate a SQL migration from db/schema.ts (no DB connection needed)
npm run db:migrate  # apply pending migrations — requires DATABASE_URL
npm run db:seed     # seed Aurora Noir + Nova Vale into the database — requires DATABASE_URL + BLOB_READ_WRITE_TOKEN
```

`npm run build` produces a fully static export of every artist route
(`generateStaticParams` prerenders each artist × each sub-page at build
time) whenever `USE_DATABASE` is off — see `PHASE_3_REPORT.md` for what
changes once it's on.

## Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the repo in Vercel — it auto-detects Next.js, no configuration needed.
3. With no environment variables set, the site runs exactly as it did pre-Phase-3
   (static demo data, no database). To enable the database: add the Neon
   Postgres and Vercel Blob integrations from the project's Storage tab —
   this auto-populates `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` — then run
   `npm run db:migrate` and `npm run db:seed` locally (pointed at that same
   `DATABASE_URL`) before setting `USE_DATABASE=true` in Production. See
   `PHASE_3_REPORT.md` for the full walkthrough and current status.
4. Deploy.

Or from the CLI: `npx vercel`.

## Project structure

```
app/
  page.tsx                     Platform landing page ("Our Artists")
  artists/[slug]/              Reusable artist site (layout + 8 sub-pages)
    layout.tsx                 Header, footer, mobile Book Now bar
    page.tsx                   Homepage (hero, release, video, shows, about, gallery, band, collabs, testimonials, final CTA)
    about/ music/ shows/ gallery/ band/ press/ booking/ contact/
  sitemap.ts / robots.ts / not-found.tsx
components/
  layout/    ArtistHeader, ArtistFooter, MobileBookingBar
  artist/    ArtistHero
  music/     ReleaseCard, ReleaseGrid, ReleaseSection, StreamingLinks
  shows/     ShowCard, ShowsList
  gallery/   GalleryGrid, GalleryLightbox
  band/      BandMemberCard, PerformanceFormatCard
  booking/   BookingForm
  home/      VideoSection, CollaborationGrid, TestimonialCard, InstagramFeed
  ui/        Button, CTASection, SectionHeading, PageHero, SocialLinks, Reveal, BrandIcons
data/
  artists/   One file per artist (aurora-noir.ts, nova-vale.ts) + index.ts registry — static fallback (see USE_DATABASE)
  platform.ts  Management company copy for the landing page
types/
  artist.ts       The Artist data model (single source of truth)
  application.ts  The ArtistApplication data model (/apply)
  booking.ts      Booking form input/validation types
lib/
  artists.ts       Data access layer — static data or database, gated by USE_DATABASE
  application.ts   createDraftApplication() / submitArtistApplication() — server actions
  applications.ts  Admin-facing application read service (server actions, not yet used by any UI)
  approvals.ts     approveApplication() / rejectApplication() — server actions (not yet used by any UI)
  media.ts         uploadMedia() / deleteMedia() — Vercel Blob + media table (server actions)
  db.ts            Drizzle client (Neon HTTP driver)
  slug.ts          Slug validation for the approval flow
  booking.ts       submitBookingInquiry() — server action, validates + simulates submission
  validation/application.ts  Zod schema for ArtistApplication (server-side re-validation)
  repositories/    applications.ts, artists.ts, media.ts, approvals.ts — raw DB access, imported only by the files above
  uploads.ts, nav.ts, format.ts, cn.ts
db/
  schema.ts     Drizzle table definitions — source of truth for the database schema
  migrations/   Generated SQL migrations (npm run db:generate)
public/artists/<slug>/  Per-artist image assets (gallery, music, band, press) — seeded into Blob by db:seed
scripts/
  gen_placeholders.py       Regenerates the procedural demo photography
  gen_press_kit_pdfs.py     Regenerates the demo EPK PDFs
  migrate.ts                Applies pending migrations (npm run db:migrate)
  seed_demo_artists.ts      Seeds Aurora Noir + Nova Vale into the database (npm run db:seed)
drizzle.config.ts  drizzle-kit configuration
PHASE_3_PLAN.md    Approved Phase 3 architecture (database + media storage)
PHASE_3_REPORT.md  What was actually built, tested, and left incomplete
```

## The data model — one app, many artists

Every artist's entire public site is described by a single `Artist` object
(`types/artist.ts`): bio, releases, shows, band, gallery, performance
formats, collaborations, testimonials, press kit, booking settings, contact
info, social links. **No component ever hard-codes an artist's name, copy,
or image** — everything flows in as props sourced from this object.

The data access layer (`lib/artists.ts`) is the seam for a future backend:
`getArtistBySlug`, `getArtistShows`, `getArtistGallery`, etc. all read from
the static array in `data/artists/index.ts` today. Swap their bodies for
`fetch()`/database calls later and no page or component needs to change.

## Adding a new artist

No component duplication is required. To add artist #3 (or #4, #5, ...):

1. **Create the data file** — copy `data/artists/nova-vale.ts` to
   `data/artists/<new-slug>.ts` and fill in every field of the `Artist`
   type (TypeScript will flag anything missing).
2. **Add images** — create `public/artists/<new-slug>/` with `hero.jpg`,
   `profile.jpg`, `about.jpg`, `og.jpg`, and subfolders `music/`, `gallery/`,
   `band/`, `press/`. Reuse `scripts/gen_placeholders.py` as a reference if
   you want to generate temporary placeholder art before real photography
   is ready.
3. **Register the artist** — add one line to `data/artists/index.ts`:
   ```ts
   import { newArtist } from "./new-artist-slug";
   export const artists: Artist[] = [auroraNoir, novaVale, newArtist];
   ```
4. That's it. `/artists/<new-slug>` and all eight sub-pages render
   immediately, `generateStaticParams` picks it up for the production build,
   and it appears automatically on the platform landing page roster.

### Field-by-field guide

| Data | Where |
|---|---|
| Photos | `public/artists/<slug>/...`, referenced by path in the artist's data file |
| Music (albums/EPs/singles) | `albums` / `eps` / `singles` arrays — each needs a cover image + streaming links |
| Shows | `shows` array — set `isPast: true` for history, otherwise it's upcoming |
| Band members | `bandMembers` array |
| Social links | `socialLinks` — only platforms with a URL are rendered, nothing is hard-coded |
| Booking info | `bookingSettings` (event types, formats, budget ranges shown in the form) and `contactInformation` (bookings/management/press/general) |

## Booking flow

The booking page (`/artists/<slug>/booking`) posts to
`submitBookingInquiry()` in `lib/booking.ts` — a Next.js Server Action.
It validates every field server-side (required fields, email format,
future-dated event date), simulates network latency, and returns a
success/error result the form renders inline (loading, success, and error
states are all implemented, plus a honeypot field for basic bot resistance).

No pricing is ever exposed — every format and booking surface says
**"Enquire for availability & pricing."**

`submitBookingInquiry()` is intentionally the *only* place that "sends" a
booking. Replacing its body with `await fetch("/api/bookings", ...)` or a
direct write to a booking CRM is the entire integration point for a future
phase — no UI code changes.

## Artist Onboarding / Press Kit (`/apply`)

A public, no-account-required, 11-step mobile-first wizard for collecting a
real musician's full profile and media, so it can be turned into a new
`Artist` record. Send an artist the link `https://<your-domain>/apply` — they
can complete it entirely from their phone.

Steps: Basic Info → Photos → Music → Videos → Socials → Shows → Band →
Performance (+ optional technical info) → Press/EPK (+ collaborations +
testimonials) → Booking → Review & Submit. Each step validates before
allowing Next; Review shows an editable summary of every section plus the
two required consent checkboxes before the submit button is enabled.

**Data model** (`types/application.ts`) — `ArtistApplication` deliberately
reuses the same sub-types as the public `Artist` model (`SocialLinks`,
`PerformanceFormatId`) so an approved submission maps cleanly onto a new
artist data file later; see `data/artists/aurora-noir.ts` for the shape it
should become.

**Submission** (`lib/application.ts`) — as of Phase 3, `submitArtistApplication()`
is a real, persistent write: it re-validates everything server-side against
a Zod schema (`lib/validation/application.ts`), then saves the submission to
the `artist_applications` table (plus its child tables) in Postgres via
`lib/repositories/applications.ts`, and marks the row `status: "submitted"`.
See `PHASE_3_REPORT.md` for the full database design and the approval flow
that turns a submitted application into a public artist.

**File uploads** (`lib/uploads.ts`) — as of Phase 3, photos are uploaded for
real the moment they're selected, via the `uploadMedia` Server Action
(`lib/media.ts`) to Vercel Blob, with a `media` row recorded in Postgres for
each one. Every photo field shows a green "Uploaded" state once that
completes — there is no more "Attached — not yet uploaded to storage"
placeholder.

**Draft autosave** — in-progress form answers are still mirrored to
`localStorage` on this device only (a UX convenience for a long form, not a
substitute for the real submission), but as of Phase 3 the *application
record itself* (with an id every uploaded photo is attached to) is created
in the database the moment the wizard is opened — see `PHASE_3_REPORT.md`
Section 5.

## Instagram — V1 vs. future

`components/home/InstagramFeed.tsx` renders static demo posts from each
artist's `instagramFeed` array. It never talks to Instagram, stores no
tokens, and needs no credentials. The planned V6 integration (see roadmap)
is official Meta/Instagram OAuth: artist connects their account from a
future manager dashboard → token stored server-side → a sync worker caches
recent posts → this same component renders live data instead of demo data.
No component change needed when that ships.

## Design system

- Palette: near-black background, off-white foreground, muted gray, and a
  restrained bronze/gold accent (`app/globals.css` → `@theme` block —
  change `--bronze` there to retheme every artist site at once).
- Typography: a serif display face for headings, clean sans-serif for body
  text (see [Restoring Google Fonts](#restoring-google-fonts) below).
- Motion: Framer Motion fade-ups/reveals throughout, all gated by
  `prefers-reduced-motion` in `globals.css`.

### Restoring Google Fonts

This project was built in a sandboxed environment that blocks outbound
requests to `fonts.googleapis.com`, so `app/layout.tsx` ships with a
high-quality **system font stack** instead of `next/font/google` to keep
`npm run build` reliable everywhere. On a machine with normal internet
access you can restore the original Playfair Display + Inter pairing:

```tsx
// app/layout.tsx
import { Playfair_Display, Inter } from "next/font/google";

const display = Playfair_Display({ variable: "--font-display", subsets: ["latin"], weight: ["500","600","700"] });
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });

// add `${display.variable} ${sans.variable}` to the <html> className
```
Then remove the two hard-coded `--font-display` / `--font-sans` stacks in
`app/globals.css`'s `@theme` block (next/font will supply those CSS
variables instead).

## Icons

`lucide-react`'s current major version no longer ships trademarked platform
logos (Instagram, YouTube, Facebook, TikTok, X, Apple Music). Those few
glyphs are small hand-drawn inline SVGs in `components/ui/BrandIcons.tsx`
and `components/ui/SocialLinks.tsx` — everything else uses `lucide-react`
directly. No external icon CDN is used anywhere.

## Accessibility & performance notes

- Semantic headings, labeled form fields with inline error messages, visible
  focus states, keyboard-operable mobile menu and gallery lightbox
  (Escape/Arrow keys), `aria-live` region on the booking form's error banner.
- Mobile-first layout, 44px+ tap targets, no horizontal scroll, fixed
  "Book Now" bar on mobile (hidden automatically on the booking page itself).
- Images use `next/image` throughout for responsive sizing/lazy-loading;
  videos never autoplay with sound (click-to-play poster pattern).
- Almost every interactive piece (menu, lightbox, gallery filters, booking
  form) is an isolated Client Component; every page and layout is a Server
  Component by default.

## Database + media storage (Phase 3)

As of Phase 3, `artist_applications` and their media are persisted for real
in Neon Postgres and Vercel Blob, and the public site can optionally read
`artists` from the same database instead of the static files in
`data/artists/*.ts`. See **`PHASE_3_PLAN.md`** (the approved architecture)
and **`PHASE_3_REPORT.md`** (what was actually built, tested, and left
incomplete) for the full picture — schema, approval flow, media upload
flow, security model, and the `USE_DATABASE` migration flag. The static
demo data is still present and is what the site falls back to whenever the
database isn't configured.

## V1/V2 limitations (pre-admin)

- Booking submissions are simulated (validated + a fake success state);
  nothing is emailed or persisted yet.
- Instagram feed is static demo data, not a live connection.
- No authentication, admin dashboard, or CMS yet — applications can be
  submitted and stored, and the approval service (application → artist) is
  implemented and independently callable, but there is no UI for a manager
  to actually review/approve/reject one. See `PHASE_3_REPORT.md` → "What
  remains intentionally incomplete."
- No availability/calendar system behind the booking form yet.

## Future architecture — V4+

Roadmap, in order:

- **V4 — Admin / Management Dashboard**: authenticated `/admin` for
  reviewing and approving applications, editing artists, managing photos,
  music, shows, band members, and press kits, and publishing/unpublishing —
  built directly on top of the Phase 3 database and services
  (`lib/applications.ts`, `lib/approvals.ts`, `lib/repositories/*`).
- **V5 — Booking CRM**: `submitBookingInquiry()` starts writing to the
  database; leads flow into a manager-facing pipeline; availability/calendar
  system feeds the booking form and show status.
- **V6 — AI booking receptionist**: automated first-response triage for
  inbound enquiries/calls.
- **V7 — Official Instagram integration**: Meta/Instagram OAuth, server-side
  token storage, sync worker — see [Instagram](#instagram--v1-vs-future).

None of these require rewriting the public website — that is the point of
keeping data, data-access, and UI strictly separated from day one.

---

*All artist content (Aurora Noir, Nova Vale, and everything in their
profiles) is fictional demo content created for development purposes.*
