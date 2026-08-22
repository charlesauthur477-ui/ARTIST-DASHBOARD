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
npm run build   # production build
npm run start   # run the production build locally
npm run lint    # ESLint
npx tsc --noEmit # TypeScript check
```

`npm run build` produces a fully static export of every artist route
(`generateStaticParams` prerenders each artist × each sub-page at build
time), so hosting is simple and fast.

## Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the repo in Vercel — it auto-detects Next.js, no configuration needed.
3. No environment variables are required for V1 (see `.env.example`).
4. Deploy. Every artist route is statically prerendered, so first paint is fast globally.

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
  artists/   One file per artist (aurora-noir.ts, nova-vale.ts) + index.ts registry
  platform.ts  Management company copy for the landing page
types/
  artist.ts   The Artist data model (single source of truth)
  booking.ts  Booking form input/validation types
lib/
  artists.ts  Data access layer (getArtistBySlug, getArtistShows, etc.)
  booking.ts  submitBookingInquiry() — server action, validates + simulates submission
  nav.ts, format.ts, cn.ts
public/artists/<slug>/  Per-artist image assets (gallery, music, band, press)
scripts/
  gen_placeholders.py       Regenerates the procedural demo photography
  gen_press_kit_pdfs.py     Regenerates the demo EPK PDFs
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

**Submission** (`lib/application.ts`) — `submitArtistApplication()` is a
Server Action that re-validates everything server-side and logs a
structured summary to the server console (visible in Vercel's function
logs), returning a reference ID. **There is no database connected yet** —
a successful response means "received and logged," not "permanently
stored." Replace the body of this one function with a real datastore write
when one exists; no other code needs to change.

**File uploads** (`lib/uploads.ts`) — photos are staged as local
browser-object-URL previews only (`stageLocalFile()`); nothing is uploaded
to any server or storage bucket in V1. Every photo field in the wizard
visibly labels itself "Attached — not yet uploaded to storage" so nobody
mistakes a preview for a real upload. `stageLocalFile()` is the single
function to replace when a provider (Vercel Blob, Cloudinary, S3, Supabase
Storage, etc.) is connected — the wizard and its field components don't
change.

**Draft autosave** — in-progress answers are mirrored to `localStorage` on
this device only (cleared automatically on successful submission) so a long
form isn't lost if an artist's browser closes mid-way. This is a UX
convenience, not a substitute for the submission itself.

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

## V1 limitations

- Data is static TypeScript, not a database — content changes require a
  code change + redeploy.
- Booking submissions are simulated (validated + a fake success state);
  nothing is emailed or persisted yet.
- Instagram feed is static demo data, not a live connection.
- No authentication, admin dashboard, or CMS — artists/managers cannot
  self-serve edits yet.
- No availability/calendar system behind the booking form yet.

## Future architecture — V2+

Roadmap, in order:

- **V2 — Artist/Manager CMS**: authenticated dashboard to edit everything
  currently in `data/artists/*.ts` (profile, releases, shows, band, gallery,
  press, social links) without a code deploy.
- **V3 — Booking CRM**: `submitBookingInquiry()` starts writing to a real
  backend; leads flow into a manager-facing pipeline.
- **V4 — AI booking receptionist**: automated first-response triage for
  inbound enquiries/calls.
- **V5 — Availability + calendar**: real available/tentative/booked dates
  feeding the booking form and show status.
- **V6 — Official Instagram integration**: Meta/Instagram OAuth, server-side
  token storage, sync worker — see [Instagram](#instagram--v1-vs-future).
- **V7 — Full multi-artist management platform**: the public sites built
  here become the front door to the complete system.

None of these require rewriting the public website — that is the point of
keeping data, data-access, and UI strictly separated from day one.

---

*All artist content (Aurora Noir, Nova Vale, and everything in their
profiles) is fictional demo content created for development purposes.*
