import { z } from "zod";
import { ARTIST_TYPES, EVENT_TYPE_OPTIONS, PRIMARY_ROLES, RELEASE_TYPES } from "@/types/application";

// ---------------------------------------------------------------------------
// Zod schemas for the artist application — the single source of truth for
// server-side validation. Mirrors ArtistApplication in types/application.ts.
//
// This is deliberately more lenient on free-text fields than a "real" review
// tool would be (most fields optional) — the wizard already gates step
// progression client-side (see ApplicationWizard.tsx#validateStep), and a
// long onboarding form's server-side check exists to guard against missing
// *required* fields and malformed data reaching the database, not to
// re-implement every UX-level nicety. Required fields below match exactly
// what lib/application.ts's previous hand-written validate() function
// checked, so behavior does not regress.
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const stagedAssetSchema = z
  .object({
    id: z.string().min(1),
    fileName: z.string(),
    fileSizeBytes: z.number().nonnegative(),
    mimeType: z.string(),
    previewUrl: z.string(),
    mediaId: z.string().uuid().optional(),
  })
  .nullable();

const applicationReleaseSchema = z.object({
  id: z.string(),
  type: z.enum(RELEASE_TYPES),
  title: z.string(),
  releaseDate: z.string(),
  artwork: stagedAssetSchema,
  description: z.string(),
  spotifyUrl: z.string(),
  appleMusicUrl: z.string(),
  youtubeUrl: z.string(),
  otherUrl: z.string(),
});

const applicationVideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  url: z.string(),
});

const applicationShowSchema = z.object({
  id: z.string(),
  date: z.string(),
  city: z.string(),
  country: z.string(),
  venue: z.string(),
  eventName: z.string(),
  eventType: z.string(),
  ticketUrl: z.string(),
  isPublic: z.boolean(),
});

const applicationBandMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  bio: z.string(),
  instagram: z.string(),
  photo: stagedAssetSchema,
});

const applicationPerformanceFormatSchema = z.object({
  id: z.string(),
  label: z.string(),
  selected: z.boolean(),
  description: z.string(),
});

const applicationCollaborationSchema = z.object({
  id: z.string(),
  brand: z.string(),
  type: z.string(),
  year: z.string(),
  description: z.string(),
  link: z.string(),
});

const applicationTestimonialSchema = z.object({
  id: z.string(),
  clientName: z.string(),
  company: z.string(),
  event: z.string(),
  testimonial: z.string(),
});

const applicationPressQuoteSchema = z.object({
  id: z.string(),
  quote: z.string(),
  source: z.string(),
});

export const artistApplicationSchema = z.object({
  stageName: z.string().min(2, "Please enter an artist / stage name."),
  realName: z.string(),
  pronunciation: z.string(),
  city: z.string(),
  country: z.string(),
  primaryGenre: z.string(),
  secondaryGenres: z.string(),
  tagline: z.string(),
  shortBio: z.string(),
  fullBio: z.string(),

  artistType: z.union([z.enum(ARTIST_TYPES), z.literal("")]),
  primaryRole: z.union([z.enum(PRIMARY_ROLES), z.literal("")]),
  yearsActive: z.string(),
  languagesPerformed: z.string(),
  styleDescription: z.string(),
  careerHighlights: z.string(),
  awards: z.string(),
  notablePerformances: z.string(),
  festivalsPlayed: z.string(),
  mediaFeatures: z.string(),

  profilePhoto: stagedAssetSchema.refine((v) => v !== null, { message: "A profile photo is required." }),
  heroPhoto: stagedAssetSchema.refine((v) => v !== null, { message: "A hero / cover photo is required." }),
  additionalPhotos: z.array(stagedAssetSchema),

  releases: z.array(applicationReleaseSchema),
  videos: z.array(applicationVideoSchema),

  socialLinks: z.record(z.string(), z.string()).and(z.object({ website: z.string().optional(), other: z.string().optional() })),

  hasNoUpcomingShows: z.boolean(),
  shows: z.array(applicationShowSchema),

  isSoloNoBand: z.boolean(),
  bandMembers: z.array(applicationBandMemberSchema),

  performanceFormats: z.array(applicationPerformanceFormatSchema),
  budgetRange: z.string(),

  typicalSetDuration: z.string(),
  numberOfSets: z.string(),
  technicalRequirements: z.string(),
  stageRequirements: z.string(),
  hospitalityNotes: z.string(),

  artistStatement: z.string(),
  pressQuotes: z.array(applicationPressQuoteSchema),
  collaborations: z.array(applicationCollaborationSchema),
  testimonials: z.array(applicationTestimonialSchema),
  pressKitUrl: z.string(),
  websiteUrl: z.string(),

  preferredContactEmail: z.string().regex(EMAIL_RE, "Please enter a valid contact email."),
  bookingContactName: z.string(),
  bookingContactEmail: z.string(),
  bookingPhone: z.string(),
  managementEmail: z.string(),
  managementPhone: z.string(),
  availableEventTypes: z.array(z.string()),
  domesticTravel: z.boolean(),
  internationalTravel: z.boolean(),
  bookingNotes: z.string(),

  consentContentUse: z.literal(true, { message: "Please confirm this to submit your profile." }),
  consentMediaRights: z.literal(true, { message: "Please confirm this to submit your profile." }),
});

export type ArtistApplicationInput = z.infer<typeof artistApplicationSchema>;

/** Re-exported for convenience where only the event-type list is needed. */
export const eventTypeOptions = EVENT_TYPE_OPTIONS;

/**
 * Runs the schema and converts Zod's error shape into the flat
 * `{fieldName: message}` shape the wizard's `errors` state already expects
 * (ApplicationFieldErrors in types/application.ts) — no UI changes needed.
 */
export function validateArtistApplication(data: unknown): {
  success: boolean;
  data?: ArtistApplicationInput;
  errors?: Record<string, string>;
} {
  const result = artistApplicationSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}
