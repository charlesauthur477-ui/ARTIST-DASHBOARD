# Phase 3 — Activation & Verification Report

Companion to `PHASE_3_PLAN.md` (approved architecture) and `PHASE_3_REPORT.md` (implementation report, written before Neon/Blob were provisioned). This document records the actual activation run against the real, now-connected Neon Postgres database and Vercel Blob store, executed via `scripts/run_phase3_activation.sh` in the project owner's own Terminal (this environment cannot reach Neon or Vercel Blob directly — see "Why activation ran on your machine, not here" below).

Every result below is copied from real terminal output, not inferred or assumed.

## Two bugs found and fixed during activation

Before getting to a clean run, two issues surfaced and were fixed:

1. **`npx tsc --noEmit` failed with 20 "Cannot find name 'PageProps'/'LayoutProps'" errors on a fresh checkout.** Root cause: this project uses Next.js 16's typed-route helpers, which are generated into `.next/types` by a build — running `tsc` alone before any build has ever run fails for this reason alone, unrelated to Phase 3 code correctness. Reproduced the identical 20 errors in a clean environment to confirm, then fixed by reordering `scripts/run_phase3_activation.sh` so `npm run build` runs before the standalone `tsc` check (`next build` already runs its own internal TypeScript check first regardless, so this also gives the real signal earlier).
2. **`npm run db:seed` failed with a duplicate-key error on `aurora-noir`** on a second run, because an earlier partial run (before Node.js was installed, then after) had already inserted it and the script wasn't idempotent. Fixed `scripts/seed_demo_artists.ts` to delete any existing artist (and its media rows/Blob objects) by slug before re-inserting, so the seed script is now safe to run any number of times.

Both fixes were type-checked, linted, and build-tested in the development environment before being sent to be re-run for real.

## Why activation ran on your machine, not here

This environment's outbound network is restricted to an allowlist that covers package registries (npm, GitHub) but not Neon's or Vercel Blob's APIs — confirmed directly: `curl` to `api.<region>.aws.neon.tech` and `blob.vercel-storage.com` both failed to connect from here, while `registry.npmjs.org` succeeded. The Claude↔device bridge used to write files to your Mac is separately documented as having no network access at all. Real database/storage activity could only happen from your own Terminal, which has normal internet access — hence the runbook script and the back-and-forth to get it running (missing Node.js, then the two bugs above).

## 1. Database migration

`npm run db:migrate` — **passed**: "Migrations applied successfully." Confirmed idempotent on the second run too (no errors re-applying).

## 2. Seed

`npm run db:seed` — **passed** on the fixed script: both Aurora Noir and Nova Vale seeded successfully, including the idempotent "remove existing artist before re-seeding" path being exercised and working correctly on the second run:

```
Seeding Aurora Noir (aurora-noir)...
  existing artist found for slug "aurora-noir" — removing before re-seeding...
  done — artist id 551009c2-ea33-48fb-88d5-89c45049c7cc
Seeding Nova Vale (nova-vale)...
  existing artist found for slug "nova-vale" — removing before re-seeding...
  done — artist id fdfa5a8f-ca2f-4479-944e-dcc5a1cc4f16
```

## 3. Database tables

**Verified — all 18 expected tables exist** in Neon: `PASS — 3. Expected tables exist: all 18 expected tables found` (checked programmatically against `information_schema.tables`, not assumed from the migration having run).

## 4. Aurora Noir and Nova Vale seeded

**Verified**, read back directly from the database via the same public data-access path the live site uses (`getArtistBySlugDb`):

```
PASS — 4. aurora-noir seeded: id=551009c2-ea33-48fb-88d5-89c45049c7cc name="Aurora Noir" releases=6 shows=10 gallery=12 bandMembers=5 profileImage=set heroImage=set
PASS — 4. nova-vale seeded: id=fdfa5a8f-ca2f-4479-944e-dcc5a1cc4f16 name="Nova Vale" releases=2 shows=3 gallery=6 bandMembers=1 profileImage=set heroImage=set
```

Both have real profile/hero images (not empty), and their release/show/gallery/band-member counts match the static demo data's shape.

## 5–6. USE_DATABASE=true — routes verified

With `.env.local`'s `DATABASE_URL` present (which makes the database path the default, per `isDatabaseEnabled()`), `npm run build` succeeded and generated genuine database-backed static pages for both artists. A local production server then returned:

```
-- / --                       HTTP 200
-- /artists/aurora-noir --    HTTP 200
-- /artists/nova-vale --      HTTP 200
-- /apply --                  HTTP 200
-- content check (should print artist names) --
Aurora Noir
Nova Vale
```

All four required routes confirmed working, and the homepage's HTML body was confirmed to actually contain both artist names (not just a 200 status with empty/error content).

## 7. Test artist application submitted

**Verified**: `PASS — 7. Draft application created: application id=ee46a601-c3cb-4499-9beb-6ca77c639b92`, followed by a full submission through the real `persistApplicationSubmission` path (the same code `submitArtistApplication` calls), validated against the real Zod schema (`PASS — 8a. Test submission passes server-side Zod validation: valid`).

## 8. Application persisted in Neon

**Verified** by reading the row back from the database after submission: `PASS — 8. Application persisted in Neon: status=submitted stageName="Phase 3 Verification Test Artist" submittedAt=Sun Aug 23 2026 03:14:20 GMT+0530`.

## 9. Real image uploaded

**Verified**: a real, valid 1×1 JPEG was uploaded through the actual `uploadMedia` Server Action (the same one `FileInput.tsx` calls): `PASS — 9. Real image uploaded via uploadMedia(): media id=685f7103-0786-4317-b3c3-eca1781e0290 url=https://ub7jlvupaay6cxyh.public.blob.vercel-storage.com/applications/.../profile_photo/....jpg`.

## 10. Image confirmed stored in Vercel Blob

**Verified two ways**, not just assumed from a 200 during upload: the script made a separate, independent `GET` request to the returned Blob URL afterward and confirmed it was actually retrievable: `PASS — 10. Image actually retrievable from Vercel Blob: GET ... -> HTTP 200`.

## 11. Media record confirmed in Neon

**Verified**: `PASS — 11. Media record exists in Neon: media row id=685f7103-... ownerType=application ownerId=ee46a601-... role=profile_photo sizeBytes=287` — read back directly from the `media` table, not inferred from the upload call succeeding.

## 12. Submitted application does NOT automatically become a public artist

**Verified**: before running the approval step, the script confirmed the test artist's intended slug did not exist yet and that the submitted application's name did not appear anywhere in `getActiveArtists()` (the exact function every public page uses): `PASS — 12. Submitted application is NOT a public artist: slug "phase3-verify-test-artist" exists before approval: false; appears in getActiveArtists(): false`.

## 13. Approval service tested

**Verified**: `approveApplication()` was called against the real submitted test application: `PASS — 13. approveApplication() succeeds: artist id=797a73c1-2ae9-46c9-b7dc-a34490ab48f7` — the full transaction (new artist row, re-parented children, re-pointed media ownership, application marked approved) ran for real against Neon.

## 14. Approval creates a draft artist

**Verified** by reading the newly created artist row back from the database: `PASS — 14. Approval creates artist with status=draft: status=draft slug=phase3-verify-test-artist sourceApplicationId=ee46a601-...`.

## 15. Draft artist not publicly visible until published

**Verified**: immediately after approval (and before any publish step), the script confirmed the new draft artist could not be fetched via `getArtistBySlugDb` (the exact function the public artist pages use) and did not appear in `getActiveArtists()`: `PASS — 15. Draft artist is NOT publicly visible: getArtistBySlugDb("phase3-verify-test-artist") returned: undefined (correct); present in getActiveArtists(): false`.

All test data (the test artist, its media row, its Blob object, and the test application) was deleted by the same script run immediately after — confirmed in the output ("Cleaning up test data created by this run... deleted test artist / deleted test Blob object / deleted test application"). Neon and Blob are left exactly as they were before this test, aside from the two seeded demo artists.

**13/13 automated checks passed** (`db:verify` summary: "13/13 checks passed").

## 16. USE_DATABASE=false fallback verified

With `USE_DATABASE=false` forced explicitly (overriding the database default even though `DATABASE_URL` is present), `npm run build` succeeded on the static demo data path and a local production server returned HTTP 200 for all four routes again:

```
-- / --                       HTTP 200
-- /artists/aurora-noir --    HTTP 200
-- /artists/nova-vale --      HTTP 200
-- /apply --                  HTTP 200
```

Confirms the static fallback still works correctly even with a live database connected — the flag genuinely controls which data source is used, not just whether one is configured.

## 17. Lint, TypeScript, build

- `npm run lint` — **passed**, no output (no errors or warnings).
- `npx tsc --noEmit` — **passed**, no output (after the ordering fix described above).
- `npm run build` — **passed twice**: once with the database enabled (25/25 pages generated, all database-backed for the two seeded artists) and once with `USE_DATABASE=false` (25/25 pages generated from static data).

## Git / deployment

Not yet done as of this report — per your instruction, activation stops here for your review before committing. Once you confirm this report looks right, the commit/push commands are:

```bash
cd ~/Documents/"ARTIST DASHBOARD"/artist-dashboard
git add -A
git commit -m "Activate Neon database and Vercel Blob storage"
git push
```

Note: `.env.local` is git-ignored and will not be committed — that's correct and expected; it stays local to your machine only.

After you push, Vercel will redeploy automatically. Since `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` are already connected to the Vercel project, and `USE_DATABASE` is not explicitly set there, the new deployment will read from the (now-seeded) database by default — meaning the live site should start serving Aurora Noir and Nova Vale from Neon/Blob instead of the static files, with no visible difference to a visitor since the seed reproduces the same content. Let me know once you've pushed and I'll check the live deployment to confirm.
