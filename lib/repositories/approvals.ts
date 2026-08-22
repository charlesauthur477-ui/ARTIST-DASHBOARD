import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { getApplicationById, setApplicationReviewStatus } from "@/lib/repositories/applications";
import { validateSlugForApproval } from "@/lib/slug";

// ---------------------------------------------------------------------------
// The approval service — the one place `artist_applications` data becomes an
// `artists` record. See PHASE_3_PLAN.md Section 5 for the full design
// rationale; this file is the literal implementation of that flow.
//
// Uses a pooled/WebSocket Neon connection (drizzle-orm/neon-serverless)
// rather than the HTTP driver used everywhere else in this codebase (see
// lib/db.ts), because this is the one operation in the whole app that needs
// a genuine multi-statement, all-or-nothing transaction: the Neon HTTP
// driver does not support interactive transactions at all. The pool is
// created for the duration of this single call and closed afterward — this
// is not a long-lived connection held across requests, which matters for a
// serverless deployment.
// ---------------------------------------------------------------------------

function getTransactionalDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — the approval flow requires the database.");
  }
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });
  return { db, pool };
}

export interface ApproveApplicationResult {
  success: boolean;
  artistId?: string;
  error?: string;
}

/**
 * Approves a submitted/under-review application:
 *   1. validates the requested slug is available (never silently changes it
 *      — a collision is returned as an error for a human to resolve, per
 *      the "SLUG COLLISIONS" requirement)
 *   2. in a single transaction: creates a new `artists` row (status: draft),
 *      copies scalar fields, re-parents every child collection
 *      (releases/videos/shows/band members/collaborations/testimonials)
 *      from the application to the new artist, re-points every `media` row
 *      from owner_type='application' to owner_type='artist', and marks the
 *      source application status='approved' with linked_artist_id set
 *   3. the new artist is left in `draft` status — publishing (draft →
 *      active) is a separate, explicit step a manager takes later (not part
 *      of this function), matching "Do NOT create an automatically public
 *      artist."
 *
 * This function is intentionally NOT wired into any UI yet (no /admin
 * exists this phase) — it exists so the approval flow is fully implemented
 * and independently testable (e.g. from a script) ahead of the admin phase
 * that will call it from a real "Approve" button.
 */
export async function approveApplication(applicationId: string, requestedSlug: string): Promise<ApproveApplicationResult> {
  const slug = requestedSlug.trim().toLowerCase();
  const slugCheck = await validateSlugForApproval(slug);
  if (!slugCheck.valid) {
    return { success: false, error: slugCheck.error };
  }

  const record = await getApplicationById(applicationId);
  if (!record) {
    return { success: false, error: "Application not found." };
  }
  const { application, releases, videos, shows, bandMembers, collaborations, testimonials } = record;

  if (application.status !== "submitted" && application.status !== "under_review") {
    return { success: false, error: `Application status is "${application.status}" — only submitted or under_review applications can be approved.` };
  }

  const { db, pool } = getTransactionalDb();
  try {
    const artistId = await db.transaction(async (tx) => {
      const [artist] = await tx
        .insert(schema.artists)
        .values({
          slug,
          status: "draft",
          sourceApplicationId: application.id,
          name: application.realName || application.stageName,
          stageName: application.stageName,
          tagline: application.tagline,
          genre: application.primaryGenre,
          location: [application.city, application.country].filter(Boolean).join(", "),
          bio: application.fullBio,
          shortBio: application.shortBio,
          careerHighlights: [],
          socialLinks: application.socialLinks,
          streamingLinks: {},
          instagramHandle: null,
          pressKit: { bio: application.fullBio, shortBio: application.shortBio, downloadUrl: application.pressKitUrl },
          bookingSettings: {
            eventTypes: application.availableEventTypes,
            performanceFormats: application.performanceFormats.filter((f) => f.selected).map((f) => f.label),
            budgetRanges: application.budgetRange ? [application.budgetRange] : [],
            enquiryNote: application.bookingNotes,
          },
          contactInformation: {
            bookings: { label: "Bookings", email: application.bookingContactEmail || application.preferredContactEmail, phone: application.bookingPhone || undefined },
            management: { label: "Management", email: application.managementEmail || undefined, phone: application.managementPhone || undefined },
            press: { label: "Press", email: application.preferredContactEmail },
            general: { label: "General", email: application.preferredContactEmail },
          },
        })
        .returning();

      // Re-parent child collections from application_* tables to their
      // artist-side equivalents.
      if (releases.length) {
        await tx.insert(schema.releases).values(
          releases.map((r) => ({
            artistId: artist.id,
            type: r.type,
            title: r.title,
            releaseDate: r.releaseDate,
            coverImageMediaId: r.artworkMediaId,
            description: r.description,
            streamingLinks: {
              spotify: r.spotifyUrl || undefined,
              appleMusic: r.appleMusicUrl || undefined,
              youtube: r.youtubeUrl || undefined,
              other: r.otherUrl ? [{ label: "Listen", url: r.otherUrl }] : undefined,
            },
            sortOrder: r.sortOrder,
          }))
        );
      }
      if (videos.length) {
        await tx.insert(schema.artistVideos).values(
          videos.map((v) => ({
            artistId: artist.id,
            title: v.title,
            description: v.description,
            platform: "youtube",
            videoId: v.url,
            sortOrder: v.sortOrder,
          }))
        );
      }
      if (shows.length) {
        await tx.insert(schema.shows).values(
          shows
            .filter((s) => s.isPublic)
            .map((s) => ({
              artistId: artist.id,
              date: s.date,
              city: s.city,
              venue: s.venue,
              country: s.country,
              eventType: s.eventType,
              status: "available",
              ticketUrl: s.ticketUrl || null,
              isPast: false,
              sortOrder: s.sortOrder,
            }))
        );
      }
      if (bandMembers.length) {
        await tx.insert(schema.bandMembers).values(
          bandMembers.map((m) => ({
            artistId: artist.id,
            name: m.name,
            role: m.role,
            photoMediaId: m.photoMediaId,
            bio: m.bio,
            instagram: m.instagram || null,
            sortOrder: m.sortOrder,
          }))
        );
      }
      if (collaborations.length) {
        await tx.insert(schema.collaborations).values(
          collaborations.map((c) => ({
            artistId: artist.id,
            name: c.brand,
            type: c.type,
            description: c.description || null,
            sortOrder: c.sortOrder,
          }))
        );
      }
      if (testimonials.length) {
        await tx.insert(schema.testimonials).values(
          testimonials.map((t) => ({
            artistId: artist.id,
            quote: t.testimonial,
            clientName: t.clientName,
            eventType: t.event,
            sortOrder: t.sortOrder,
          }))
        );
      }

      // Re-point every media row owned by this application to the new
      // artist. No file is re-uploaded — only the ownership columns change.
      const applicationMedia = await tx
        .select()
        .from(schema.media)
        .where(eq(schema.media.ownerType, "application"));
      const ownedByThisApplication = applicationMedia.filter((m) => m.ownerId === application.id);

      for (const m of ownedByThisApplication) {
        await tx.update(schema.media).set({ ownerType: "artist", ownerId: artist.id }).where(eq(schema.media.id, m.id));
      }

      // Wire up the artist's top-level image slots from the reassigned
      // media, matched by role.
      const findMediaId = (role: string) => ownedByThisApplication.find((m) => m.role === role)?.id ?? null;
      await tx
        .update(schema.artists)
        .set({
          profileImageMediaId: findMediaId("profile_photo"),
          heroImageMediaId: findMediaId("hero_photo"),
          aboutImageMediaId: findMediaId("hero_photo"),
          ogImageMediaId: findMediaId("hero_photo"),
        })
        .where(eq(schema.artists.id, artist.id));

      // Any additional photos become gallery rows pointing at the same
      // reassigned media.
      const additionalPhotos = ownedByThisApplication.filter((m) => m.role === "gallery_photo");
      if (additionalPhotos.length) {
        await tx.insert(schema.galleryImages).values(
          additionalPhotos.map((m, i) => ({
            artistId: artist.id,
            mediaId: m.id,
            alt: `${application.stageName} photo`,
            category: "editorial",
            sortOrder: i,
          }))
        );
      }

      await tx
        .update(schema.artistApplications)
        .set({ status: "approved", reviewedAt: new Date(), linkedArtistId: artist.id, updatedAt: new Date() })
        .where(eq(schema.artistApplications.id, application.id));

      return artist.id;
    });

    return { success: true, artistId };
  } catch (err) {
    console.error("[approvals] approveApplication transaction failed", err);
    return { success: false, error: "Approval failed due to a database error. No changes were made." };
  } finally {
    await pool.end();
  }
}

export async function rejectApplication(applicationId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const record = await getApplicationById(applicationId);
  if (!record) return { success: false, error: "Application not found." };
  await setApplicationReviewStatus(applicationId, { status: "rejected", rejectionReason: reason });
  return { success: true };
}

export async function markUnderReview(applicationId: string, reviewedBy?: string): Promise<{ success: boolean }> {
  await setApplicationReviewStatus(applicationId, { status: "under_review", reviewedBy });
  return { success: true };
}
