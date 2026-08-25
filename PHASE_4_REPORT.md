# Phase 4 — Admin / Management Dashboard: Implementation Report

Companion to `PHASE_4_PLAN.md` (the approved architecture, approved verbatim on this date) and `PHASE_4_ACTIVATION_REPORT.md` (to be written after you run `scripts/run_phase4_activation.sh` in your own Terminal — this environment cannot reach Neon directly, exactly as documented in `PHASE_3_ACTIVATION_REPORT.md`; see "What's verified here vs. what needs your Terminal" below).

All 6 sub-phases (4a–4f) were implemented in the order you specified, and no future-phase features (booking CRM, calendar, Instagram OAuth, AI receptionist, WhatsApp/Telegram, advanced analytics) were touched.

## 1. Authentication implementation

Auth.js v5 (`next-auth@5.0.0-beta.32`) with the Credentials provider only — no OAuth, no public sign-up. Sessions use the **database** strategy (`@auth/drizzle-adapter`), not JWT, so a session can be genuinely revoked. Session lifetime is 12 hours (`auth.ts`).

`authorize()` in `auth.ts` is the only place a password is ever compared — via `bcryptjs`, against `admin_users.password_hash` — and it independently re-checks `admin_users.is_active` on every login attempt, not just at account creation. The `session` callback re-reads `admin_users` on every session read (not just at login), so a role change or deactivation takes effect on the very next request, not on next login.

No default/seeded admin account with a known password exists anywhere in the code — the only way an `admin_users` row is created is the interactive `scripts/create_admin_user.ts` (`npm run admin:create`), which requires a password of at least 12 characters and refuses to create a duplicate.

## 2. Admin roles

Three roles as specified: `super_admin`, `manager`, `editor`, stored in a new `admin_role` Postgres enum and `admin_users.role`. `lib/admin/permissions.ts` is a single capability table (`canReviewApplications`, `canPublish`, `canEditArtists`, `canManageMedia`, `canArchiveArtists`, `canManageAdmins`, `canViewActivity`) — every authorization check in the codebase calls one of these rather than comparing role strings inline.

## 3. Protected routes

`proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`; functionally identical, matcher `/admin/:path*`) is the first gate: it calls `auth()` and redirects anonymous visitors to `/admin/login`. This is deliberately cheap and not the only check — every page under `app/admin/(dashboard)/*` and every mutating Server Action independently calls `requireAdmin()` or `requireRole([...])` (`lib/admin/auth.ts`), which re-reads the session fresh each time. `/admin/login` lives in a sibling route (outside the `(dashboard)` route group) specifically so it is never wrapped by the auth-requiring layout — that would otherwise be an infinite redirect loop.

Routes built: `/admin/login`, `/admin` (dashboard home), `/admin/applications`, `/admin/applications/[id]`, `/admin/artists`, `/admin/artists/new`, `/admin/artists/[id]` (13-tab editor), `/admin/artists/[id]/preview`, `/admin/media`, `/admin/activity`.

## 4. Database changes

One migration, `db/migrations/0001_sloppy_cardiac.sql`, already generated and committed to the repo (not yet applied to your live database — see Activation below). Entirely additive, exactly as scoped in the plan:

- New tables: `admin_users`, `activity_log`, plus Auth.js's own standard adapter tables `user`, `account`, `session`, `verificationToken`.
- New nullable columns on `artists`: `seo_title`, `seo_description`, `canonical_url`, `updated_by` (a real FK to `admin_users.id`).
- `artist_applications.reviewed_by` retyped from `text` to `uuid` (FK to `admin_users.id`) — it existed since Phase 3 but no code path had ever written to it, so this is safe.

Nothing was deleted, redesigned, or renamed. `npm run db:generate` was re-run after finishing all code changes and reports "No schema changes, nothing to migrate" — confirming `db/schema.ts` and the migration file are in sync.

## 5. Application management

`/admin/applications` lists every application (status filter tabs: All/Submitted/Under Review/Approved/Rejected), reading through the existing `lib/repositories/applications.ts#listApplications`. `/admin/applications/[id]` shows the full application (all Phase 3 form sections, uploaded photos, releases, shows, band members) plus a review panel.

Every review action calls straight into the existing Phase 3 approval service — **no approval logic was reimplemented**:
- Start Review → `markUnderReview()`
- Approve → `approveApplication()` (slug pre-filled from stage name, editable; collisions surface as a form error from the existing `validateSlugForApproval`)
- Reject → `rejectApplication()` (behind a real confirmation dialog, not `window.confirm()`)
- Return to Review → the one new function the plan called out, `returnApplicationToReview()` — a thin wrapper over the same `setApplicationReviewStatus()` every other review action already uses.

All four now also record which admin performed the action (`reviewedBy`), which Phase 3 had the column for but never populated.

## 6. Artist management

`/admin/artists` lists every artist regardless of status, with status filter tabs and a search box (name/stage name/slug/genre/location). Each artist opens a 13-tab editor (`/admin/artists/[id]/{profile,photos,music,videos,shows,band,performance,press,social,booking,seo,publishing}` plus an Overview tab at the base route), sharing one layout that fetches the artist once and independently re-verifies `requireAdmin()`.

All write paths live in `lib/repositories/artistAdmin.ts`, kept separate from the public read-only `lib/repositories/artists.ts` per the plan, so nothing here can affect the public data path by accident. Repeatable collections (releases, videos, shows, band members, performance formats, collaborations, testimonials, gallery images) all use the same delete-then-reinsert `replaceX()` pattern Phase 3 already established for application child tables — no new persistence pattern was invented.

## 7. Manual artist creation

`/admin/artists/new` collects the minimum required fields (stage name, slug, genre, short bio), validates the slug the same way approval does, and inserts via `createDraftArtist()` — which hard-codes `status: "draft"`. There is no code path anywhere from manual creation to `active`; publishing is always a separate, later, explicit action.

## 8. Publishing

`publishArtist()` (`lib/repositories/artistAdmin.ts`) checks five required fields (stage name, short bio, profile photo, hero photo, at least one contact email) and re-validates slug uniqueness (excluding the artist's own row) before flipping `status` to `active`, stamping `publishedAt`, and recording who did it. The Publishing tab shows this checklist live and disables the Publish button until every item passes. Unpublish moves an artist to `inactive` (immediately stops public serving); Archive moves it to `archived` (a soft-delete — the row is never deleted, matching the explicit "do not permanently delete artists" instruction). Both are behind real confirmation dialogs.

Every publish/unpublish/archive action calls `revalidatePath` for `/`, `/artists/[slug]` and its 8 sub-routes, and `/sitemap.xml` — so the change takes effect immediately rather than waiting for the next deploy or ISR window.

## 9. Preview

Implemented with Next.js Draft Mode, exactly as the plan proposed, and validated against the official Next.js 16 documentation shipped in this repo's own `node_modules` (`node_modules/next/dist/docs/01-app/02-guides/draft-mode.md`) rather than assumed:

- `/admin/artists/[id]/preview` is a **Route Handler** (not a page) — Draft Mode's cookie can only be mutated from a Route Handler or Server Action, not a plain page component. It re-checks `requireAdmin()`, enables Draft Mode, and redirects to the real public URL (`/artists/{slug}`) — there is no separate preview template.
- `lib/artists.ts#getArtistBySlug` (the one function every public artist page already calls) now checks `draftMode().isEnabled`; when true it bypasses the `status='active'` filter via a new `getArtistBySlugAnyStatus()` — same component, draft data, zero duplicated rendering logic.
- The flagged risk — could an enabled-Draft-Mode render accidentally get cached and served to a real visitor? — resolves in our favor per Next's own docs: *"the page is excluded from the ISR response cache and is served with `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`... applies whether the page is statically generated, served from cache, or revalidated through ISR."* This was the proof-of-concept spike the plan called for; it did not surface an architectural conflict, so no workaround was needed.
- A small amber "Preview mode" banner with an Exit link appears on every public page while enabled (`components/PreviewBanner.tsx`), added to the public root layout — the only change made to the existing public site.

## 10. Media management

`/admin/media` lists every media row across the whole platform with owner, role, size, upload date, and an "In use / Unused" badge computed by checking every column that can reference a media id (both artist-side and application-side). Delete is only offered for unused rows — server-re-verified at the moment of the click, not just trusted from what the page last rendered — matching the plan's "delete disabled for currently-referenced media, replace instead" policy.

Per-artist image management reuses the exact same `uploadMedia`/`deleteMedia` Server Actions the applicant wizard already used (`lib/media.ts` — untouched) through one new generalized control, `components/admin/media/AdminImagePicker.tsx`, used for the artist's four top-level image slots (Photos tab) and for each repeatable item's image (release artwork, video poster, band member photo, collaboration logo). No second upload system was built. Gallery photos support reorder via the same Move up/down affordance used across every repeatable-collection tab, backed by the existing `sortOrder` columns.

## 11. Activity logging

One unified `activity_log` table, written exclusively through `lib/admin/activity.ts#logActivity()` — no scattered inserts. Every mutating action in this phase (application review/approve/reject/return, artist create/update/publish/unpublish/archive, media delete, admin sign-in) logs through it. `/admin/activity` (restricted to `super_admin`/`manager` per the capability table) shows the most recent 100 events with actor name and timestamp.

## 12. Security measures

- **Authentication**: real, database-backed, bcrypt-hashed. No fake/stubbed auth anywhere.
- **Authorization**: every protected page and every mutating Server Action independently calls `requireAdmin()`/`requireRole()` — confirmed by grep, there is no admin mutation that skips this. Middleware (`proxy.ts`) is a first-pass redirect only.
- **Secrets**: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, and the new `AUTH_SECRET` are read only in server-only modules (`lib/db.ts`, `auth.ts`) — never imported by a `"use client"` file, never sent to the browser.
- **CSRF**: handled natively by Next.js Server Actions (same-origin enforcement built into the framework) and by Auth.js's own CSRF token on the credentials sign-in flow.
- **Input validation**: every Server Action validates its inputs server-side before touching the database (required fields, slug format, role membership) — this is in addition to, not instead of, the existing Zod validation Phase 3 already had on the public application form.
- **File validation**: unchanged — every admin upload goes through the exact same `lib/media.ts#uploadMedia`, which still enforces MIME type and the 15MB size cap server-side.
- **Rate limiting**: the login action (`app/admin/login/actions.ts`) is throttled by IP+email (5 attempts / 15 minutes) via `lib/admin/rateLimit.ts`. This is an in-memory limiter — **a known, documented limitation**: it only limits attempts seen by a single serverless instance, so it doesn't hold up against a distributed attack across many Vercel instances. Upgrading to a shared store (Vercel KV / `@upstash/ratelimit`) is a same-shaped follow-up that only touches this one file.
- **Runtime**: confirmed via Next.js 16's own docs that `proxy.ts` defaults to the **Node.js runtime** (not edge) as of this Next version, so `bcryptjs` and the Drizzle/Neon client used inside `auth()` run in an environment they're actually built for — this wasn't something earlier Next versions guaranteed.

## 13. Tests performed (in this environment)

This sandbox cannot reach Neon or Vercel Blob directly (same restriction documented in `PHASE_3_ACTIVATION_REPORT.md`), so nothing here touched your live database. What *was* run repeatedly against the real code, with no `.env.local` / `DATABASE_URL` present (so every admin route legitimately renders with no data, and the public site falls back to static demo data, exercising the same code paths a real deploy will hit):

- `npm run lint` — clean, no errors or warnings, after every phase.
- `npx tsc` (via `next build`'s internal check) — clean, no type errors, after every phase.
- `npm run build` — succeeds from a clean `.next/` — all 27 admin/public routes listed and correctly categorized (dynamic for every `/admin/*` route, since they depend on a live session; static/SSG unchanged for the public site).
- `npm run db:generate` — confirms `db/schema.ts` and the committed migration are in sync (no drift).

## 14. Lint result

Clean — `npm run lint` reports no errors or warnings.

## 15. TypeScript result

Clean — no type errors across the full project, including every new admin file and every touched Phase 3 file.

## 16. Production build result

Succeeds. 27 routes total: 19 new `/admin/*` routes (all dynamic, as expected — they read the session), the existing public routes unchanged (static/SSG), and the one new `/api/auth/[...nextauth]` route handler Auth.js requires.

## 17. Git commits

**Not yet done** — this environment has no git repository connected (same as Phase 3's actual commit/push, which happened from your Terminal). Once you've run the activation script below and are happy with the result, the commit is:

```bash
cd ~/Documents/"ARTIST DASHBOARD"/artist-dashboard
git add -A
git commit -m "Add Phase 4 admin dashboard (auth, applications, artists, media, activity)"
git push
```

## 18. Vercel deployment status

Not yet deployed — happens automatically on push, same as every prior phase. **Before you push**, add `AUTH_SECRET` to your Vercel project's environment variables (Production and Preview) — without it, Auth.js will fail at runtime on the deployed site even though it's not needed for `npm run build` to succeed locally.

## 19. Known limitations

- **Login rate limiting is single-instance** (see Security above) — real, but not resilient to a distributed attack. Documented as a deliberate first-pass tradeoff, not an oversight.
- **This migration runs against your real, already-seeded production data** (not an empty database like Phase 3's first migration). Please take a Neon backup or open a Neon branch before running `scripts/run_phase4_activation.sh` — the runbook script reminds you of this but does not create the backup for you.
- **The preview link is a plain anchor tag**, not wrapped in extra prefetch-prevention beyond avoiding Next's `<Link>` (which *does* prefetch and would be wrong here) — a browser's own speculative prefetching is a theoretical edge case worth knowing about, not something this implementation can fully rule out.
- **No bulk actions, CSV/API export, or multi-admin edit locking** — explicitly out of scope per your list of what not to build yet, and per the additional Phase-4-specific deferrals identified in the plan (granular per-action permissions beyond the 3-role table, version history/revert, bulk actions).
- **Activity log has no retention policy** — noted in the plan as fine for now, not a bug.

---

## What's verified here vs. what needs your Terminal

Verified in this environment: every line of code compiles, type-checks, and lints cleanly, and the schema/migration are confirmed in sync. **Not yet verified**: an actual login, an actual application review end-to-end, an actual publish/preview against live data — because this sandbox has no path to your Neon database or Vercel Blob store, exactly as was true for Phase 3.

`scripts/run_phase4_activation.sh` is the runbook for your Terminal — it applies the migration, re-runs lint/build/tsc against your real environment, smoke-tests that `/admin` correctly redirects to `/admin/login`, and walks you through creating your first `super_admin` account interactively (`npm run admin:create`). Run it, then send back the full output and I'll write `PHASE_4_ACTIVATION_REPORT.md` the same way I did for Phase 3 — after that, the commit/push above, and I'll check the live deployment once you've pushed.
