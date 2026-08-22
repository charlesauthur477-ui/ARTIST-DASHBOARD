"use server";

import type { ApplicationSubmissionResult, ArtistApplication } from "@/types/application";
import { validateArtistApplication } from "@/lib/validation/application";
import { createDraftApplication as createDraftApplicationRow, persistApplicationSubmission } from "@/lib/repositories/applications";

/**
 * createDraftApplication — called once when the onboarding wizard mounts
 * (see ApplicationWizard.tsx), before the applicant can upload any photo.
 * Every uploaded file needs a real application_id to attach to (see
 * PHASE_3_PLAN.md Section 6) — this is where that id comes from. The row
 * this creates starts life with status='draft' and mostly-empty fields;
 * submitArtistApplication below fills it in and flips it to 'submitted'.
 */
export async function createDraftApplication(): Promise<string> {
  return createDraftApplicationRow();
}

/**
 * submitArtistApplication — the single entry point the onboarding wizard
 * calls on final submit.
 *
 * Phase 3: this is now a real, persistent write. Re-validates the
 * submission server-side with the same Zod schema used to type the data
 * (lib/validation/application.ts) — never trust client-only validation —
 * and, once valid, updates the existing draft application row (created by
 * createDraftApplication above) with the full submitted content, replaces
 * its child collections (releases, shows, band members, etc.), and marks
 * status='submitted'. A returned `success: true` means the application and
 * every photo attached to it are durably stored in the database and Vercel
 * Blob — nothing here is a simulation.
 *
 * `applicationId` is the id returned by createDraftApplication (persisted
 * client-side alongside the wizard's draft state) — every photo the
 * applicant already uploaded during the wizard is already attached to this
 * same row, so no re-upload happens here.
 */
export async function submitArtistApplication(
  applicationId: string,
  data: ArtistApplication
): Promise<ApplicationSubmissionResult> {
  const result = validateArtistApplication(data);
  if (!result.success || !result.data) {
    return { success: false, message: "Please correct the highlighted fields.", errors: result.errors };
  }

  try {
    await persistApplicationSubmission(applicationId, result.data);
  } catch (err) {
    console.error(`[artist-application] failed to persist submission for ${applicationId}`, err);
    return {
      success: false,
      message: "We couldn't save your submission just now. Please try again in a moment.",
    };
  }

  console.log(`[artist-application] ${applicationId} submitted`, {
    stageName: data.stageName,
    contactEmail: data.preferredContactEmail,
    releases: data.releases.length,
    videos: data.videos.length,
    shows: data.hasNoUpcomingShows ? 0 : data.shows.length,
    bandMembers: data.isSoloNoBand ? 0 : data.bandMembers.length,
    performanceFormatsSelected: data.performanceFormats.filter((f) => f.selected).map((f) => f.label),
    hasProfilePhoto: Boolean(data.profilePhoto),
    hasHeroPhoto: Boolean(data.heroPhoto),
    additionalPhotos: data.additionalPhotos.length,
  });

  return {
    success: true,
    message:
      "Thank you — we've received your submission. Our team will review your profile and follow up by email before your artist website goes live.",
    referenceId: applicationId,
  };
}
