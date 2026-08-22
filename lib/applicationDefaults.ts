import type { ApplicationPerformanceFormat, ArtistApplication } from "@/types/application";

let counter = 0;
export function createLocalId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export const PERFORMANCE_FORMAT_DEFAULTS: ApplicationPerformanceFormat[] = [
  { id: "solo", label: "Solo", selected: false, description: "" },
  { id: "duo", label: "Duo", selected: false, description: "" },
  { id: "acoustic", label: "Acoustic", selected: false, description: "" },
  { id: "full-band", label: "Full Band", selected: false, description: "" },
  { id: "dj-live", label: "DJ + Live", selected: false, description: "" },
  { id: "full-concert", label: "Full Concert", selected: false, description: "" },
  { id: "custom", label: "Custom / Other", selected: false, description: "" },
];

export function createEmptyApplication(): ArtistApplication {
  return {
    stageName: "",
    realName: "",
    pronunciation: "",
    city: "",
    country: "",
    primaryGenre: "",
    secondaryGenres: "",
    tagline: "",
    shortBio: "",
    fullBio: "",

    artistType: "",
    primaryRole: "",
    yearsActive: "",
    languagesPerformed: "",
    styleDescription: "",
    careerHighlights: "",
    awards: "",
    notablePerformances: "",
    festivalsPlayed: "",
    mediaFeatures: "",

    profilePhoto: null,
    heroPhoto: null,
    additionalPhotos: [],

    releases: [],
    videos: [],

    socialLinks: {},

    hasNoUpcomingShows: false,
    shows: [],

    isSoloNoBand: false,
    bandMembers: [],

    performanceFormats: PERFORMANCE_FORMAT_DEFAULTS.map((f) => ({ ...f })),
    budgetRange: "",

    typicalSetDuration: "",
    numberOfSets: "",
    technicalRequirements: "",
    stageRequirements: "",
    hospitalityNotes: "",

    artistStatement: "",
    pressQuotes: [],
    collaborations: [],
    testimonials: [],
    pressKitUrl: "",
    websiteUrl: "",

    preferredContactEmail: "",
    bookingContactName: "",
    bookingContactEmail: "",
    bookingPhone: "",
    managementEmail: "",
    managementPhone: "",
    availableEventTypes: [],
    domesticTravel: false,
    internationalTravel: false,
    bookingNotes: "",

    consentContentUse: false,
    consentMediaRights: false,
  };
}

export function createEmptyRelease() {
  return {
    id: createLocalId("release"),
    type: "single" as const,
    title: "",
    releaseDate: "",
    artwork: null,
    description: "",
    spotifyUrl: "",
    appleMusicUrl: "",
    youtubeUrl: "",
    otherUrl: "",
  };
}

export function createEmptyVideo() {
  return { id: createLocalId("video"), title: "", description: "", url: "" };
}

export function createEmptyShow() {
  return {
    id: createLocalId("show"),
    date: "",
    city: "",
    country: "",
    venue: "",
    eventName: "",
    eventType: "",
    ticketUrl: "",
    isPublic: true,
  };
}

export function createEmptyBandMember() {
  return { id: createLocalId("band"), name: "", role: "", bio: "", instagram: "", photo: null };
}

export function createEmptyCollaboration() {
  return { id: createLocalId("collab"), brand: "", type: "", year: "", description: "", link: "" };
}

export function createEmptyTestimonial() {
  return { id: createLocalId("testimonial"), clientName: "", company: "", event: "", testimonial: "" };
}

export function createEmptyPressQuote() {
  return { id: createLocalId("quote"), quote: "", source: "" };
}
