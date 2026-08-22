import type { PerformanceFormatId, SocialLinks } from "./artist";

// ---------------------------------------------------------------------------
// Artist Onboarding / Press Kit application data model
//
// Deliberately built as a close cousin of the public Artist model in
// types/artist.ts, reusing shared sub-types (SocialLinks, PerformanceFormatId)
// rather than inventing an incompatible shape. The intended future pipeline:
//
//   Artist fills out /apply → ArtistApplication (this file)
//     → management reviews the submission
//     → approved fields are copied into a new Artist record in data/artists/
//     → the same public components (already artist-agnostic) render it
//
// A few fields differ from Artist on purpose: releases/photos hold a
// StagedAsset (a browser-local file reference — see lib/uploads.ts) instead
// of a public URL, because there is no media storage provider connected
// yet. Shows/band members carry a couple of extra fields the artist needs
// to tell us but the public site doesn't render (e.g. isPublic on a show).
// ---------------------------------------------------------------------------

/**
 * A file the artist has selected in their browser. `previewUrl` is a
 * browser-local object URL (see lib/uploads.ts) — it is NOT a permanent,
 * publicly reachable file. Nothing in this codebase should treat a
 * StagedAsset as if it were already uploaded to real storage.
 */
export interface StagedAsset {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  previewUrl: string;
}

export const ARTIST_TYPES = ["solo", "band", "duo", "dj", "singer", "instrumentalist", "other"] as const;
export type ArtistType = (typeof ARTIST_TYPES)[number];

export const PRIMARY_ROLES = [
  "vocalist",
  "singer",
  "songwriter",
  "musician",
  "producer",
  "dj",
  "band",
  "other",
] as const;
export type PrimaryRole = (typeof PRIMARY_ROLES)[number];

export const RELEASE_TYPES = ["album", "ep", "single"] as const;
export type ApplicationReleaseType = (typeof RELEASE_TYPES)[number];

export interface ApplicationRelease {
  id: string;
  type: ApplicationReleaseType;
  title: string;
  releaseDate: string;
  artwork: StagedAsset | null;
  description: string;
  spotifyUrl: string;
  appleMusicUrl: string;
  youtubeUrl: string;
  otherUrl: string;
}

export interface ApplicationVideo {
  id: string;
  title: string;
  description: string;
  url: string;
}

export interface ApplicationShow {
  id: string;
  date: string;
  city: string;
  country: string;
  venue: string;
  eventName: string;
  eventType: string;
  ticketUrl: string;
  isPublic: boolean;
}

export interface ApplicationBandMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  instagram: string;
  photo: StagedAsset | null;
}

export type ApplicationPerformanceFormatId = PerformanceFormatId | "dj-live" | "custom";

export interface ApplicationPerformanceFormat {
  id: ApplicationPerformanceFormatId;
  label: string;
  selected: boolean;
  description: string;
}

export interface ApplicationCollaboration {
  id: string;
  brand: string;
  type: string;
  year: string;
  description: string;
  link: string;
}

export interface ApplicationTestimonial {
  id: string;
  clientName: string;
  company: string;
  event: string;
  testimonial: string;
}

export interface ApplicationPressQuote {
  id: string;
  quote: string;
  source: string;
}

export const EVENT_TYPE_OPTIONS = [
  "Wedding",
  "Corporate",
  "Festival",
  "College",
  "Club",
  "Concert",
  "Private Event",
  "Brand Event",
  "Other",
] as const;

export interface ApplicationSocialLinks extends SocialLinks {
  website?: string;
  other?: string;
}

export interface ArtistApplication {
  // Section 1 — basic information
  stageName: string;
  realName: string;
  pronunciation: string;
  city: string;
  country: string;
  primaryGenre: string;
  secondaryGenres: string;
  tagline: string;
  shortBio: string;
  fullBio: string;

  // Section 2 — artist profile
  artistType: ArtistType | "";
  primaryRole: PrimaryRole | "";
  yearsActive: string;
  languagesPerformed: string;
  styleDescription: string;
  careerHighlights: string;
  awards: string;
  notablePerformances: string;
  festivalsPlayed: string;
  mediaFeatures: string;

  // Section 3 — photos
  profilePhoto: StagedAsset | null;
  heroPhoto: StagedAsset | null;
  additionalPhotos: StagedAsset[];

  // Section 4 — music
  releases: ApplicationRelease[];

  // Section 5 — videos
  videos: ApplicationVideo[];

  // Section 6 — social media
  socialLinks: ApplicationSocialLinks;

  // Section 7 — upcoming shows
  hasNoUpcomingShows: boolean;
  shows: ApplicationShow[];

  // Section 8 — band members
  isSoloNoBand: boolean;
  bandMembers: ApplicationBandMember[];

  // Section 9 — performance formats
  performanceFormats: ApplicationPerformanceFormat[];
  budgetRange: string;

  // Section 10 — technical / performance info (optional)
  typicalSetDuration: string;
  numberOfSets: string;
  technicalRequirements: string;
  stageRequirements: string;
  hospitalityNotes: string;

  // Section 11 — press / EPK
  artistStatement: string;
  pressQuotes: ApplicationPressQuote[];
  collaborations: ApplicationCollaboration[];
  testimonials: ApplicationTestimonial[];
  pressKitUrl: string;
  websiteUrl: string;

  // Section 12 — booking information
  preferredContactEmail: string;
  bookingContactName: string;
  bookingContactEmail: string;
  bookingPhone: string;
  managementEmail: string;
  managementPhone: string;
  availableEventTypes: string[];
  domesticTravel: boolean;
  internationalTravel: boolean;
  bookingNotes: string;

  // Section 13 — consent (required)
  consentContentUse: boolean;
  consentMediaRights: boolean;
}

export type ApplicationFieldErrors = Partial<Record<string, string>>;

export interface ApplicationSubmissionResult {
  success: boolean;
  message: string;
  referenceId?: string;
  errors?: ApplicationFieldErrors;
}
