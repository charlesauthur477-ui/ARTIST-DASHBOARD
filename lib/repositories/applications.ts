import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { ArtistApplicationInput } from "@/lib/validation/application";

// ---------------------------------------------------------------------------
// artist_applications repository.
//
// Two write paths:
//   - createDraftApplication(): called once when the onboarding wizard
//     mounts, so every uploaded file (Section 6 of PHASE_3_PLAN.md) has a
//     real application_id to attach to before the applicant ever clicks
//     Submit.
//   - persistApplicationSubmission(): called from lib/application.ts's
//     submitArtistApplication on final submit. Full-replaces the row's
//     scalar/jsonb fields and all child collections from the wizard's
//     current state, then marks status='submitted'. A full replace (delete
//     + re-insert children) rather than a diff is deliberate: the wizard
//     already holds the complete, authoritative current state in memory
//     (same pattern as the pre-Phase-3 client-only version), so there is no
//     partial-update case to reconcile — every submit is "this is the whole
//     application now."
// ---------------------------------------------------------------------------

export type ApplicationStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected";

export async function createDraftApplication(): Promise<string> {
  const db = getDb();
  const [row] = await db.insert(schema.artistApplications).values({}).returning({ id: schema.artistApplications.id });
  return row.id;
}

export async function getApplicationById(id: string) {
  const db = getDb();
  const [application] = await db
    .select()
    .from(schema.artistApplications)
    .where(eq(schema.artistApplications.id, id))
    .limit(1);
  if (!application) return null;

  const [releases, videos, shows, bandMembers, collaborations, testimonials, pressQuotes] = await Promise.all([
    db.select().from(schema.applicationReleases).where(eq(schema.applicationReleases.applicationId, id)),
    db.select().from(schema.applicationVideos).where(eq(schema.applicationVideos.applicationId, id)),
    db.select().from(schema.applicationShows).where(eq(schema.applicationShows.applicationId, id)),
    db.select().from(schema.applicationBandMembers).where(eq(schema.applicationBandMembers.applicationId, id)),
    db.select().from(schema.applicationCollaborations).where(eq(schema.applicationCollaborations.applicationId, id)),
    db.select().from(schema.applicationTestimonials).where(eq(schema.applicationTestimonials.applicationId, id)),
    db.select().from(schema.applicationPressQuotes).where(eq(schema.applicationPressQuotes.applicationId, id)),
  ]);

  return { application, releases, videos, shows, bandMembers, collaborations, testimonials, pressQuotes };
}

/** Admin-facing listing (used by a future /admin — not built this phase). */
export async function listApplications(status?: ApplicationStatus) {
  const db = getDb();
  const query = db.select().from(schema.artistApplications).orderBy(desc(schema.artistApplications.createdAt));
  if (status) {
    return db
      .select()
      .from(schema.artistApplications)
      .where(eq(schema.artistApplications.status, status))
      .orderBy(desc(schema.artistApplications.createdAt));
  }
  return query;
}

async function replaceChildren(applicationId: string, data: ArtistApplicationInput) {
  const db = getDb();

  await Promise.all([
    db.delete(schema.applicationReleases).where(eq(schema.applicationReleases.applicationId, applicationId)),
    db.delete(schema.applicationVideos).where(eq(schema.applicationVideos.applicationId, applicationId)),
    db.delete(schema.applicationShows).where(eq(schema.applicationShows.applicationId, applicationId)),
    db.delete(schema.applicationBandMembers).where(eq(schema.applicationBandMembers.applicationId, applicationId)),
    db.delete(schema.applicationCollaborations).where(eq(schema.applicationCollaborations.applicationId, applicationId)),
    db.delete(schema.applicationTestimonials).where(eq(schema.applicationTestimonials.applicationId, applicationId)),
    db.delete(schema.applicationPressQuotes).where(eq(schema.applicationPressQuotes.applicationId, applicationId)),
  ]);

  if (data.releases.length) {
    await db.insert(schema.applicationReleases).values(
      data.releases.map((r, i) => ({
        applicationId,
        type: r.type,
        title: r.title,
        releaseDate: r.releaseDate,
        artworkMediaId: r.artwork?.mediaId ?? null,
        description: r.description,
        spotifyUrl: r.spotifyUrl,
        appleMusicUrl: r.appleMusicUrl,
        youtubeUrl: r.youtubeUrl,
        otherUrl: r.otherUrl,
        sortOrder: i,
      }))
    );
  }
  if (data.videos.length) {
    await db.insert(schema.applicationVideos).values(
      data.videos.map((v, i) => ({ applicationId, title: v.title, description: v.description, url: v.url, sortOrder: i }))
    );
  }
  if (data.shows.length) {
    await db.insert(schema.applicationShows).values(
      data.shows.map((s, i) => ({
        applicationId,
        date: s.date,
        city: s.city,
        country: s.country,
        venue: s.venue,
        eventName: s.eventName,
        eventType: s.eventType,
        ticketUrl: s.ticketUrl,
        isPublic: s.isPublic,
        sortOrder: i,
      }))
    );
  }
  if (data.bandMembers.length) {
    await db.insert(schema.applicationBandMembers).values(
      data.bandMembers.map((m, i) => ({
        applicationId,
        name: m.name,
        role: m.role,
        bio: m.bio,
        instagram: m.instagram,
        photoMediaId: m.photo?.mediaId ?? null,
        sortOrder: i,
      }))
    );
  }
  if (data.collaborations.length) {
    await db.insert(schema.applicationCollaborations).values(
      data.collaborations.map((c, i) => ({
        applicationId,
        brand: c.brand,
        type: c.type,
        year: c.year,
        description: c.description,
        link: c.link,
        sortOrder: i,
      }))
    );
  }
  if (data.testimonials.length) {
    await db.insert(schema.applicationTestimonials).values(
      data.testimonials.map((t, i) => ({
        applicationId,
        clientName: t.clientName,
        company: t.company,
        event: t.event,
        testimonial: t.testimonial,
        sortOrder: i,
      }))
    );
  }
  if (data.pressQuotes.length) {
    await db.insert(schema.applicationPressQuotes).values(
      data.pressQuotes.map((q, i) => ({ applicationId, quote: q.quote, source: q.source, sortOrder: i }))
    );
  }
}

export async function persistApplicationSubmission(applicationId: string, data: ArtistApplicationInput) {
  const db = getDb();

  await db
    .update(schema.artistApplications)
    .set({
      status: "submitted",
      stageName: data.stageName,
      realName: data.realName,
      pronunciation: data.pronunciation,
      city: data.city,
      country: data.country,
      primaryGenre: data.primaryGenre,
      secondaryGenres: data.secondaryGenres,
      tagline: data.tagline,
      shortBio: data.shortBio,
      fullBio: data.fullBio,
      artistType: data.artistType,
      primaryRole: data.primaryRole,
      yearsActive: data.yearsActive,
      languagesPerformed: data.languagesPerformed,
      styleDescription: data.styleDescription,
      careerHighlights: data.careerHighlights,
      awards: data.awards,
      notablePerformances: data.notablePerformances,
      festivalsPlayed: data.festivalsPlayed,
      mediaFeatures: data.mediaFeatures,
      socialLinks: data.socialLinks,
      hasNoUpcomingShows: data.hasNoUpcomingShows,
      isSoloNoBand: data.isSoloNoBand,
      performanceFormats: data.performanceFormats,
      budgetRange: data.budgetRange,
      typicalSetDuration: data.typicalSetDuration,
      numberOfSets: data.numberOfSets,
      technicalRequirements: data.technicalRequirements,
      stageRequirements: data.stageRequirements,
      hospitalityNotes: data.hospitalityNotes,
      artistStatement: data.artistStatement,
      pressKitUrl: data.pressKitUrl,
      websiteUrl: data.websiteUrl,
      preferredContactEmail: data.preferredContactEmail,
      bookingContactName: data.bookingContactName,
      bookingContactEmail: data.bookingContactEmail,
      bookingPhone: data.bookingPhone,
      managementEmail: data.managementEmail,
      managementPhone: data.managementPhone,
      availableEventTypes: data.availableEventTypes,
      domesticTravel: data.domesticTravel,
      internationalTravel: data.internationalTravel,
      bookingNotes: data.bookingNotes,
      consentContentUse: data.consentContentUse,
      consentMediaRights: data.consentMediaRights,
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.artistApplications.id, applicationId));

  await replaceChildren(applicationId, data);
}

export async function setApplicationReviewStatus(
  applicationId: string,
  update: { status: "under_review" | "approved" | "rejected"; reviewedBy?: string; rejectionReason?: string; linkedArtistId?: string }
) {
  const db = getDb();

  // linkedArtistId is intentionally omitted from the SET clause unless the
  // caller explicitly passes it. Previously this always wrote
  // `update.linkedArtistId ?? null`, which meant any call that didn't pass
  // linkedArtistId (e.g. returnApplicationToReview()) silently cleared an
  // already-approved application's link to the artist it created — even
  // though the artist record itself was correctly left untouched. Omitting
  // the key entirely when not provided preserves whatever value is already
  // in the row (including staying null if it was already null), so
  // "Return to Review" can no longer sever that relationship as a side
  // effect of an unrelated status change.
  const values: Partial<typeof schema.artistApplications.$inferInsert> = {
    status: update.status,
    reviewedAt: new Date(),
    reviewedBy: update.reviewedBy ?? null,
    rejectionReason: update.rejectionReason ?? null,
    updatedAt: new Date(),
  };
  if (update.linkedArtistId !== undefined) {
    values.linkedArtistId = update.linkedArtistId;
  }

  await db.update(schema.artistApplications).set(values).where(eq(schema.artistApplications.id, applicationId));
}
