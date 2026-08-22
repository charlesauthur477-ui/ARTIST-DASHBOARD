"use server";

import type { ApplicationFieldErrors, ApplicationSubmissionResult, ArtistApplication } from "@/types/application";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(data: ArtistApplication): ApplicationFieldErrors {
  const errors: ApplicationFieldErrors = {};

  if (!data.stageName || data.stageName.trim().length < 2) {
    errors.stageName = "Please enter an artist / stage name.";
  }
  if (!data.profilePhoto) {
    errors.profilePhoto = "A profile photo is required.";
  }
  if (!data.heroPhoto) {
    errors.heroPhoto = "A hero / cover photo is required.";
  }
  if (!data.preferredContactEmail || !EMAIL_RE.test(data.preferredContactEmail)) {
    errors.preferredContactEmail = "Please enter a valid contact email.";
  }
  if (!data.consentContentUse) {
    errors.consentContentUse = "Please confirm this to submit your profile.";
  }
  if (!data.consentMediaRights) {
    errors.consentMediaRights = "Please confirm this to submit your profile.";
  }

  return errors;
}

/**
 * submitArtistApplication — the single entry point the onboarding wizard
 * calls on final submit.
 *
 * IMPORTANT — persistence status (V1): there is no database or CMS
 * connected yet. This function re-validates the submission server-side
 * (never trust client-only validation) and logs a structured summary to the
 * server console — visible in Vercel's function logs — so nothing submitted
 * is silently dropped. It does NOT durably store the submission or any
 * uploaded media anywhere. A returned `success: true` means "we received
 * and logged this," not "this is saved in a database."
 *
 * When a real datastore exists, replace the body below (from the comment
 * marker down) with a write to it — e.g.
 *   await db.artistApplications.create({ data })
 * or
 *   await fetch(process.env.APPLICATIONS_WEBHOOK_URL, { method: "POST", body: JSON.stringify(data) })
 * No caller/UI code needs to change; this function's signature is the seam.
 */
export async function submitArtistApplication(
  data: ArtistApplication
): Promise<ApplicationSubmissionResult> {
  const errors = validate(data);
  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Please correct the highlighted fields.", errors };
  }

  const referenceId = `APP-${Date.now().toString(36).toUpperCase()}`;

  // --- NOT PERSISTENT — see function doc comment above ---------------------
  console.log(`[artist-application] ${referenceId} received`, {
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
  // ---------------------------------------------------------------------

  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    success: true,
    message:
      "Thank you — we've received your submission. Our team will review your profile and follow up by email before your artist website goes live.",
    referenceId,
  };
}
