// ---------------------------------------------------------------------------
// Core artist data model
//
// This is the single source of truth for an artist's public website content.
// Nothing artist-specific should be hard-coded inside components — every
// component reads from an Artist (or a slice of it) passed in as data.
//
// V1 data is static (see /data). The shape below is intentionally close to
// what a future CMS / database record would look like, so the data layer in
// /lib can be swapped for real API calls later without changing this file
// or any component that consumes it.
// ---------------------------------------------------------------------------

export type SocialPlatform =
  | "instagram"
  | "youtube"
  | "spotify"
  | "appleMusic"
  | "tiktok"
  | "facebook"
  | "x";

export type SocialLinks = Partial<Record<SocialPlatform, string>>;

export interface StreamingLinks {
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  soundcloud?: string;
  other?: { label: string; url: string }[];
}

export type ReleaseType = "album" | "ep" | "single";

export interface Release {
  id: string;
  type: ReleaseType;
  title: string;
  releaseDate: string; // ISO date
  coverImage: string;
  description: string;
  trackCount?: number;
  streamingLinks: StreamingLinks;
}

export type VideoPlatform = "youtube" | "vimeo" | "local";

export interface ArtistVideo {
  id: string;
  title: string;
  description?: string;
  platform: VideoPlatform;
  /** YouTube/Vimeo video id, or a local file path when platform === "local" */
  videoId: string;
  posterImage: string;
  featured?: boolean;
}

export type GalleryCategory =
  | "live"
  | "editorial"
  | "studio"
  | "backstage"
  | "events";

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: GalleryCategory;
  width: number;
  height: number;
}

export type ShowStatus =
  | "available"
  | "tickets"
  | "sold-out"
  | "private-event"
  | "booked";

export interface Show {
  id: string;
  date: string; // ISO date
  city: string;
  venue: string;
  country?: string;
  eventType: string;
  status: ShowStatus;
  ticketUrl?: string;
  detailsUrl?: string;
  isPast?: boolean;
}

export interface BandMember {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio: string;
  instagram?: string;
}

export type PerformanceFormatId =
  | "solo"
  | "duo"
  | "acoustic"
  | "full-band"
  | "full-concert";

export interface PerformanceFormat {
  id: PerformanceFormatId;
  name: string;
  lineup: string;
  style: string;
  suitableFor: string[];
}

export interface Collaboration {
  id: string;
  name: string;
  type: string;
  logo?: string;
  description?: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  clientName: string;
  eventType: string;
}

export interface PressKit {
  heroImage: string;
  bio: string;
  shortBio: string;
  pressPhotos: string[];
  downloadUrl: string;
  technicalRiderUrl?: string;
  hospitalityRiderUrl?: string;
  stagePlotUrl?: string;
  inputListUrl?: string;
}

export interface BookingSettings {
  eventTypes: string[];
  performanceFormats: PerformanceFormatId[];
  budgetRanges: string[];
  enquiryNote: string;
}

export interface ContactChannel {
  label: string;
  email?: string;
  phone?: string;
}

export interface ContactInformation {
  bookings: ContactChannel;
  management: ContactChannel;
  press: ContactChannel;
  general: ContactChannel;
}

export interface InstagramPost {
  id: string;
  image: string;
  captionPreview: string;
  date: string;
  permalink: string;
}

export interface CareerHighlight {
  id: string;
  label: string;
}

export interface Artist {
  id: string;
  slug: string;
  name: string;
  stageName: string;
  tagline: string;
  genre: string;
  location: string;
  profileImage: string;
  heroImage: string;
  heroVideo?: string;
  aboutImage: string;
  bio: string;
  shortBio: string;
  careerHighlights: CareerHighlight[];
  socialLinks: SocialLinks;
  streamingLinks: StreamingLinks;
  albums: Release[];
  eps: Release[];
  singles: Release[];
  videos: ArtistVideo[];
  gallery: GalleryImage[];
  shows: Show[];
  bandMembers: BandMember[];
  performanceFormats: PerformanceFormat[];
  collaborations: Collaboration[];
  testimonials: Testimonial[];
  pressKit: PressKit;
  bookingSettings: BookingSettings;
  contactInformation: ContactInformation;
  instagramHandle?: string;
  instagramFeed: InstagramPost[];
  ogImage: string;
  isDemo?: boolean;
}
