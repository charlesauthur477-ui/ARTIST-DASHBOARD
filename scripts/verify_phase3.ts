// ---------------------------------------------------------------------------
// Phase 3 activation verification.
//
// Run with: npm run db:verify (requires DATABASE_URL + BLOB_READ_WRITE_TOKEN
// in .env.local — this must be run from a machine with real network access
// to Neon and Vercel Blob; it will not work from a network-sandboxed
// environment).
//
// This does NOT call any mocked/simulated code path — every step below
// calls the same functions the real application uses (lib/media.ts's
// uploadMedia, lib/repositories/applications.ts's persistApplicationSubmission,
// lib/repositories/approvals.ts's approveApplication, lib/repositories/artists.ts's
// public read functions), so a pass here is a real end-to-end proof of the
// Phase 3 pipeline, not a synthetic test of separate logic.
//
// It creates one throwaway test application, uploads one real tiny JPEG to
// Blob, submits it, approves it into a draft artist, verifies visibility
// rules, then deletes everything it created (application, media, Blob
// objects, artist) so no test data is left in the database. Every ID and
// URL is printed before cleanup so the run's output is itself the evidence.
// ---------------------------------------------------------------------------

import { eq } from "drizzle-orm";
import { getDb, schema } from "../lib/db";
import { createDraftApplication, persistApplicationSubmission } from "../lib/repositories/applications";
import { validateArtistApplication } from "../lib/validation/application";
import { uploadMedia } from "../lib/media";
import { approveApplication } from "../lib/repositories/approvals";
import { getActiveArtists, getArtistBySlugDb, slugExists } from "../lib/repositories/artists";
import { createEmptyApplication } from "../lib/applicationDefaults";
import { del } from "@vercel/blob";

const EXPECTED_TABLES = [
  "artist_applications",
  "application_releases",
  "application_videos",
  "application_shows",
  "application_band_members",
  "application_collaborations",
  "application_testimonials",
  "application_press_quotes",
  "artists",
  "releases",
  "artist_videos",
  "gallery_images",
  "shows",
  "band_members",
  "performance_formats",
  "collaborations",
  "testimonials",
  "media",
];

// A real, valid, minimal 1x1 red-pixel JPEG — used to test a real image
// upload end-to-end (not a text file renamed .jpg).
const TEST_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

const results: { step: string; pass: boolean; detail: string }[] = [];
function record(step: string, pass: boolean, detail: string) {
  results.push({ step, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} — ${step}: ${detail}`);
}

async function main() {
  const db = getDb();

  // --- Step 3: verify expected tables exist ---------------------------------
  const tableRows = await db.execute<{ table_name: string }>(
    `select table_name from information_schema.tables where table_schema = 'public'`
  );
  const existingTables = new Set(tableRows.rows.map((r) => r.table_name));
  const missing = EXPECTED_TABLES.filter((t) => !existingTables.has(t));
  record(
    "3. Expected tables exist",
    missing.length === 0,
    missing.length === 0
      ? `all ${EXPECTED_TABLES.length} expected tables found`
      : `missing: ${missing.join(", ")} (found: ${[...existingTables].join(", ")})`
  );

  // --- Step 4: verify Aurora Noir and Nova Vale are seeded ------------------
  for (const slug of ["aurora-noir", "nova-vale"]) {
    const artist = await getArtistBySlugDb(slug);
    if (!artist) {
      record(`4. ${slug} seeded`, false, "no active artist row found for this slug");
      continue;
    }
    record(
      `4. ${slug} seeded`,
      true,
      `id=${artist.id ?? "(n/a)"} name="${artist.name}" releases=${artist.albums.length + artist.eps.length + artist.singles.length} shows=${artist.shows.length} gallery=${artist.gallery.length} bandMembers=${artist.bandMembers.length} profileImage=${artist.profileImage ? "set" : "MISSING"} heroImage=${artist.heroImage ? "set" : "MISSING"}`
    );
  }

  // --- Steps 7–12: submit a real test application with a real image upload -
  const testApplicationId = await createDraftApplication();
  record("7. Draft application created", true, `application id=${testApplicationId}`);

  const jpegBuffer = Buffer.from(TEST_JPEG_BASE64, "base64");
  const testFile = new File([jpegBuffer], "phase3-verify-test.jpg", { type: "image/jpeg" });
  const formData = new FormData();
  formData.append("file", testFile);
  formData.append("ownerType", "application");
  formData.append("ownerId", testApplicationId);
  formData.append("role", "profile_photo");
  const uploadResult = await uploadMedia(formData);
  record(
    "9. Real image uploaded via uploadMedia()",
    uploadResult.success,
    uploadResult.success ? `media id=${uploadResult.media!.id} url=${uploadResult.media!.url}` : `error: ${uploadResult.error}`
  );

  let blobFetchOk = false;
  let uploadedBlobUrl: string | null = null;
  if (uploadResult.success && uploadResult.media) {
    uploadedBlobUrl = uploadResult.media.url;
    try {
      const resp = await fetch(uploadedBlobUrl);
      blobFetchOk = resp.ok;
      record("10. Image actually retrievable from Vercel Blob", blobFetchOk, `GET ${uploadedBlobUrl} -> HTTP ${resp.status}`);
    } catch (err) {
      record("10. Image actually retrievable from Vercel Blob", false, `fetch failed: ${(err as Error).message}`);
    }

    const [mediaRow] = await db.select().from(schema.media).where(eq(schema.media.id, uploadResult.media.id));
    record(
      "11. Media record exists in Neon",
      Boolean(mediaRow),
      mediaRow
        ? `media row id=${mediaRow.id} ownerType=${mediaRow.ownerType} ownerId=${mediaRow.ownerId} role=${mediaRow.role} sizeBytes=${mediaRow.sizeBytes}`
        : "no media row found"
    );
  } else {
    record("10. Image actually retrievable from Vercel Blob", false, "skipped — upload failed");
    record("11. Media record exists in Neon", false, "skipped — upload failed");
  }

  const testData = {
    ...createEmptyApplication(),
    stageName: "Phase 3 Verification Test Artist",
    realName: "Test Runner",
    city: "Testville",
    country: "Testland",
    primaryGenre: "Test",
    shortBio: "Automated Phase 3 verification run — safe to ignore/delete.",
    fullBio: "This application was created automatically by scripts/verify_phase3.ts to verify the Phase 3 pipeline end-to-end, and is deleted by the same script after verification completes.",
    profilePhoto:
      uploadResult.success && uploadResult.media
        ? {
            id: uploadResult.media.id,
            fileName: "phase3-verify-test.jpg",
            fileSizeBytes: jpegBuffer.byteLength,
            mimeType: "image/jpeg",
            previewUrl: uploadResult.media.url,
            mediaId: uploadResult.media.id,
          }
        : null,
    heroPhoto:
      uploadResult.success && uploadResult.media
        ? {
            id: uploadResult.media.id,
            fileName: "phase3-verify-test.jpg",
            fileSizeBytes: jpegBuffer.byteLength,
            mimeType: "image/jpeg",
            previewUrl: uploadResult.media.url,
            mediaId: uploadResult.media.id,
          }
        : null,
    preferredContactEmail: "phase3-verify@example.com",
    consentContentUse: true as const,
    consentMediaRights: true as const,
  };

  const validation = validateArtistApplication(testData);
  record(
    "8a. Test submission passes server-side Zod validation",
    validation.success,
    validation.success ? "valid" : `errors: ${JSON.stringify(validation.errors)}`
  );

  if (validation.success && validation.data) {
    await persistApplicationSubmission(testApplicationId, validation.data);
    const [appRow] = await db
      .select()
      .from(schema.artistApplications)
      .where(eq(schema.artistApplications.id, testApplicationId));
    record(
      "8. Application persisted in Neon",
      Boolean(appRow) && appRow.status === "submitted",
      appRow ? `status=${appRow.status} stageName="${appRow.stageName}" submittedAt=${appRow.submittedAt}` : "no row found"
    );
  } else {
    record("8. Application persisted in Neon", false, "skipped — validation failed");
  }

  // --- Step 12: confirm submitting does NOT create a public artist ---------
  const testSlug = "phase3-verify-test-artist";
  const preApprovalSlugTaken = await slugExists(testSlug);
  const preApprovalActiveArtists = await getActiveArtists();
  const leakedIntoActiveList = preApprovalActiveArtists.some((a) => a.name === testData.stageName);
  record(
    "12. Submitted application is NOT a public artist",
    !preApprovalSlugTaken && !leakedIntoActiveList,
    `slug "${testSlug}" exists before approval: ${preApprovalSlugTaken}; appears in getActiveArtists(): ${leakedIntoActiveList}`
  );

  // --- Steps 13–15: approval flow -------------------------------------------
  const approval = await approveApplication(testApplicationId, testSlug);
  record("13. approveApplication() succeeds", approval.success, approval.success ? `artist id=${approval.artistId}` : `error: ${approval.error}`);

  let createdArtistId: string | null = null;
  if (approval.success && approval.artistId) {
    createdArtistId = approval.artistId;
    const [artistRow] = await db.select().from(schema.artists).where(eq(schema.artists.id, approval.artistId));
    record(
      "14. Approval creates artist with status=draft",
      Boolean(artistRow) && artistRow.status === "draft",
      artistRow ? `status=${artistRow.status} slug=${artistRow.slug} sourceApplicationId=${artistRow.sourceApplicationId}` : "no row found"
    );

    const draftArtistPublic = await getArtistBySlugDb(testSlug);
    const draftArtistInActiveList = (await getActiveArtists()).some((a) => a.slug === testSlug);
    record(
      "15. Draft artist is NOT publicly visible",
      !draftArtistPublic && !draftArtistInActiveList,
      `getArtistBySlugDb("${testSlug}") returned: ${draftArtistPublic ? "an artist (WRONG)" : "undefined (correct)"}; present in getActiveArtists(): ${draftArtistInActiveList}`
    );
  } else {
    record("14. Approval creates artist with status=draft", false, "skipped — approval failed");
    record("15. Draft artist is NOT publicly visible", false, "skipped — approval failed");
  }

  // --- Cleanup: remove every row/object this script created -----------------
  console.log("\nCleaning up test data created by this run...");
  if (createdArtistId) {
    await db.delete(schema.media).where(eq(schema.media.ownerId, createdArtistId)).catch(() => {});
    for (const table of [
      schema.releases,
      schema.artistVideos,
      schema.galleryImages,
      schema.shows,
      schema.bandMembers,
      schema.performanceFormats,
      schema.collaborations,
      schema.testimonials,
    ] as const) {
      await db.delete(table).where(eq((table as typeof schema.releases).artistId, createdArtistId)).catch(() => {});
    }
    await db.delete(schema.artists).where(eq(schema.artists.id, createdArtistId));
    console.log(`  deleted test artist ${createdArtistId}`);
  }
  if (uploadedBlobUrl) {
    await del(uploadedBlobUrl).catch(() => {});
    console.log(`  deleted test Blob object ${uploadedBlobUrl}`);
  }
  await db.delete(schema.media).where(eq(schema.media.ownerId, testApplicationId)).catch(() => {});
  for (const table of [
    schema.applicationReleases,
    schema.applicationVideos,
    schema.applicationShows,
    schema.applicationBandMembers,
    schema.applicationCollaborations,
    schema.applicationTestimonials,
    schema.applicationPressQuotes,
  ] as const) {
    await db.delete(table).where(eq((table as typeof schema.applicationReleases).applicationId, testApplicationId)).catch(() => {});
  }
  await db.delete(schema.artistApplications).where(eq(schema.artistApplications.id, testApplicationId));
  console.log(`  deleted test application ${testApplicationId}`);

  // --- Summary ---------------------------------------------------------------
  console.log("\n=== SUMMARY ===");
  const failed = results.filter((r) => !r.pass);
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.step}`);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) {
    console.log("FAILED CHECKS:");
    failed.forEach((f) => console.log(`  - ${f.step}: ${f.detail}`));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Verification script crashed:", err);
  process.exitCode = 1;
});
