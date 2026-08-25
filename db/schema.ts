// ---------------------------------------------------------------------------
// Phase 3 — Drizzle schema (Postgres / Neon)
//
// Source of truth for the persistent data model. See PHASE_3_PLAN.md for the
// architectural reasoning behind every choice below (why some things are
// relational tables vs. jsonb columns, why applications and artists are
// separate tables, etc.) — this file is the literal implementation of that
// plan's Section 3/4.
//
// Naming convention: snake_case column names (Postgres convention), mapped
// to camelCase field names on the TypeScript side via Drizzle's second
// argument to each column helper.
// ---------------------------------------------------------------------------

import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
]);

export const artistStatusEnum = pgEnum("artist_status", ["draft", "active", "inactive", "archived"]);

export const mediaOwnerTypeEnum = pgEnum("media_owner_type", ["application", "artist"]);

export const mediaRoleEnum = pgEnum("media_role", [
  "profile_photo",
  "hero_photo",
  "about_photo",
  "gallery_photo",
  "release_artwork",
  "band_member_photo",
  "press_kit_file",
  "og_image",
]);

export const releaseTypeEnum = pgEnum("release_type", ["album", "ep", "single"]);

// Phase 4 — admin dashboard. See PHASE_4_PLAN.md Section 10 for the full
// rationale; every change below is additive to the Phase 3 schema.
export const adminRoleEnum = pgEnum("admin_role", ["super_admin", "manager", "editor"]);

// ---------------------------------------------------------------------------
// artist_applications + children
// ---------------------------------------------------------------------------

export const artistApplications = pgTable("artist_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: applicationStatusEnum("status").notNull().default("draft"),

  // Section 1 — basic information
  stageName: text("stage_name").notNull().default(""),
  realName: text("real_name").notNull().default(""),
  pronunciation: text("pronunciation").notNull().default(""),
  city: text("city").notNull().default(""),
  country: text("country").notNull().default(""),
  primaryGenre: text("primary_genre").notNull().default(""),
  secondaryGenres: text("secondary_genres").notNull().default(""),
  tagline: text("tagline").notNull().default(""),
  shortBio: text("short_bio").notNull().default(""),
  fullBio: text("full_bio").notNull().default(""),

  // Section 2 — artist profile
  artistType: text("artist_type").notNull().default(""),
  primaryRole: text("primary_role").notNull().default(""),
  yearsActive: text("years_active").notNull().default(""),
  languagesPerformed: text("languages_performed").notNull().default(""),
  styleDescription: text("style_description").notNull().default(""),
  careerHighlights: text("career_highlights").notNull().default(""),
  awards: text("awards").notNull().default(""),
  notablePerformances: text("notable_performances").notNull().default(""),
  festivalsPlayed: text("festivals_played").notNull().default(""),
  mediaFeatures: text("media_features").notNull().default(""),

  // Section 6 — social links (single nested object, jsonb per PHASE_3_PLAN.md)
  socialLinks: jsonb("social_links").$type<Record<string, string>>().notNull().default({}),

  // Section 7 / 8 flags
  hasNoUpcomingShows: boolean("has_no_upcoming_shows").notNull().default(false),
  isSoloNoBand: boolean("is_solo_no_band").notNull().default(false),

  // Section 9 — performance formats (kept as jsonb here: a fixed checklist of
  // known options plus free-text, not an independently queried collection)
  performanceFormats: jsonb("performance_formats")
    .$type<{ id: string; label: string; selected: boolean; description: string }[]>()
    .notNull()
    .default([]),
  budgetRange: text("budget_range").notNull().default(""),

  // Section 10 — technical / performance info
  typicalSetDuration: text("typical_set_duration").notNull().default(""),
  numberOfSets: text("number_of_sets").notNull().default(""),
  technicalRequirements: text("technical_requirements").notNull().default(""),
  stageRequirements: text("stage_requirements").notNull().default(""),
  hospitalityNotes: text("hospitality_notes").notNull().default(""),

  // Section 11 — press / EPK
  artistStatement: text("artist_statement").notNull().default(""),
  pressKitUrl: text("press_kit_url").notNull().default(""),
  websiteUrl: text("website_url").notNull().default(""),

  // Section 12 — booking information
  preferredContactEmail: text("preferred_contact_email").notNull().default(""),
  bookingContactName: text("booking_contact_name").notNull().default(""),
  bookingContactEmail: text("booking_contact_email").notNull().default(""),
  bookingPhone: text("booking_phone").notNull().default(""),
  managementEmail: text("management_email").notNull().default(""),
  managementPhone: text("management_phone").notNull().default(""),
  availableEventTypes: jsonb("available_event_types").$type<string[]>().notNull().default([]),
  domesticTravel: boolean("domestic_travel").notNull().default(false),
  internationalTravel: boolean("international_travel").notNull().default(false),
  bookingNotes: text("booking_notes").notNull().default(""),

  // Section 13 — consent
  consentContentUse: boolean("consent_content_use").notNull().default(false),
  consentMediaRights: boolean("consent_media_rights").notNull().default(false),

  // Lifecycle
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  // Phase 4: was `text("reviewed_by")` in Phase 3 and never actually
  // written to by any code path — retyped to a real FK now that an
  // `admin_users` table exists to point at. See PHASE_4_PLAN.md Section 10.
  reviewedBy: uuid("reviewed_by").references(() => adminUsers.id),
  rejectionReason: text("rejection_reason"),
  linkedArtistId: uuid("linked_artist_id"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const applicationReleases = pgTable("application_releases", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => artistApplications.id, { onDelete: "cascade" }),
  type: releaseTypeEnum("type").notNull().default("single"),
  title: text("title").notNull().default(""),
  releaseDate: text("release_date").notNull().default(""),
  artworkMediaId: uuid("artwork_media_id"),
  description: text("description").notNull().default(""),
  spotifyUrl: text("spotify_url").notNull().default(""),
  appleMusicUrl: text("apple_music_url").notNull().default(""),
  youtubeUrl: text("youtube_url").notNull().default(""),
  otherUrl: text("other_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const applicationVideos = pgTable("application_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => artistApplications.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  url: text("url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const applicationShows = pgTable("application_shows", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => artistApplications.id, { onDelete: "cascade" }),
  date: text("date").notNull().default(""),
  city: text("city").notNull().default(""),
  country: text("country").notNull().default(""),
  venue: text("venue").notNull().default(""),
  eventName: text("event_name").notNull().default(""),
  eventType: text("event_type").notNull().default(""),
  ticketUrl: text("ticket_url").notNull().default(""),
  isPublic: boolean("is_public").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const applicationBandMembers = pgTable("application_band_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => artistApplications.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default(""),
  bio: text("bio").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  photoMediaId: uuid("photo_media_id"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const applicationCollaborations = pgTable("application_collaborations", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => artistApplications.id, { onDelete: "cascade" }),
  brand: text("brand").notNull().default(""),
  type: text("type").notNull().default(""),
  year: text("year").notNull().default(""),
  description: text("description").notNull().default(""),
  link: text("link").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const applicationTestimonials = pgTable("application_testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => artistApplications.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull().default(""),
  company: text("company").notNull().default(""),
  event: text("event").notNull().default(""),
  testimonial: text("testimonial").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const applicationPressQuotes = pgTable("application_press_quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => artistApplications.id, { onDelete: "cascade" }),
  quote: text("quote").notNull().default(""),
  source: text("source").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---------------------------------------------------------------------------
// artists + children
// ---------------------------------------------------------------------------

export const artists = pgTable("artists", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  status: artistStatusEnum("status").notNull().default("draft"),
  sourceApplicationId: uuid("source_application_id"),

  name: text("name").notNull().default(""),
  stageName: text("stage_name").notNull().default(""),
  tagline: text("tagline").notNull().default(""),
  genre: text("genre").notNull().default(""),
  location: text("location").notNull().default(""),

  bio: text("bio").notNull().default(""),
  shortBio: text("short_bio").notNull().default(""),

  careerHighlights: jsonb("career_highlights").$type<{ id: string; label: string }[]>().notNull().default([]),
  socialLinks: jsonb("social_links").$type<Record<string, string>>().notNull().default({}),
  streamingLinks: jsonb("streaming_links")
    .$type<{
      spotify?: string;
      appleMusic?: string;
      youtube?: string;
      soundcloud?: string;
      other?: { label: string; url: string }[];
    }>()
    .notNull()
    .default({}),

  instagramHandle: text("instagram_handle"),

  // Single nested objects — jsonb, per PHASE_3_PLAN.md Section 3.
  pressKit: jsonb("press_kit")
    .$type<{ bio: string; shortBio: string; downloadUrl: string }>()
    .notNull()
    .default({ bio: "", shortBio: "", downloadUrl: "" }),
  bookingSettings: jsonb("booking_settings")
    .$type<{ eventTypes: string[]; performanceFormats: string[]; budgetRanges: string[]; enquiryNote: string }>()
    .notNull()
    .default({ eventTypes: [], performanceFormats: [], budgetRanges: [], enquiryNote: "" }),
  contactInformation: jsonb("contact_information")
    .$type<{
      bookings: { label: string; email?: string; phone?: string };
      management: { label: string; email?: string; phone?: string };
      press: { label: string; email?: string; phone?: string };
      general: { label: string; email?: string; phone?: string };
    }>()
    .notNull()
    .default({
      bookings: { label: "Bookings" },
      management: { label: "Management" },
      press: { label: "Press" },
      general: { label: "General" },
    }),

  profileImageMediaId: uuid("profile_image_media_id"),
  heroImageMediaId: uuid("hero_image_media_id"),
  aboutImageMediaId: uuid("about_image_media_id"),
  ogImageMediaId: uuid("og_image_media_id"),

  // Phase 4 — SEO tab (Section 8/10). Nullable: existing generateMetadata
  // logic remains the fallback whenever these are unset, so no existing
  // artist page changes behavior until an admin explicitly fills them in.
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  canonicalUrl: text("canonical_url"),

  // Phase 4 — "who last changed this artist," a real FK (unlike media's
  // deliberately non-FK owner_id) since there's exactly one target table.
  updatedBy: uuid("updated_by").references(() => adminUsers.id),

  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const releases = pgTable("releases", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  type: releaseTypeEnum("type").notNull().default("single"),
  title: text("title").notNull().default(""),
  releaseDate: text("release_date").notNull().default(""),
  coverImageMediaId: uuid("cover_image_media_id"),
  description: text("description").notNull().default(""),
  trackCount: integer("track_count"),
  streamingLinks: jsonb("streaming_links")
    .$type<{
      spotify?: string;
      appleMusic?: string;
      youtube?: string;
      soundcloud?: string;
      other?: { label: string; url: string }[];
    }>()
    .notNull()
    .default({}),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const artistVideos = pgTable("artist_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  platform: text("platform").notNull().default("youtube"),
  videoId: text("video_id").notNull().default(""),
  posterImageMediaId: uuid("poster_image_media_id"),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const galleryImages = pgTable("gallery_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  mediaId: uuid("media_id").notNull(),
  alt: text("alt").notNull().default(""),
  category: text("category").notNull().default("live"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const shows = pgTable("shows", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  date: text("date").notNull().default(""),
  city: text("city").notNull().default(""),
  venue: text("venue").notNull().default(""),
  country: text("country").notNull().default(""),
  eventType: text("event_type").notNull().default(""),
  status: text("status").notNull().default("available"),
  ticketUrl: text("ticket_url"),
  detailsUrl: text("details_url"),
  isPast: boolean("is_past").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const bandMembers = pgTable("band_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default(""),
  photoMediaId: uuid("photo_media_id"),
  bio: text("bio").notNull().default(""),
  instagram: text("instagram"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const performanceFormats = pgTable("performance_formats", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  formatId: text("format_id").notNull().default(""),
  name: text("name").notNull().default(""),
  lineup: text("lineup").notNull().default(""),
  style: text("style").notNull().default(""),
  suitableFor: jsonb("suitable_for").$type<string[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const collaborations = pgTable("collaborations", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  type: text("type").notNull().default(""),
  logoMediaId: uuid("logo_media_id"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  quote: text("quote").notNull().default(""),
  clientName: text("client_name").notNull().default(""),
  eventType: text("event_type").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---------------------------------------------------------------------------
// media — shared by artist_applications and artists (Section 3/6)
// ---------------------------------------------------------------------------

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerType: mediaOwnerTypeEnum("owner_type").notNull(),
  // Not a DB-level FK: owner_id targets one of two tables depending on
  // owner_type. Enforced at the application layer — see PHASE_3_PLAN.md
  // Section 13 ("Risks") for why a DB-level polymorphic FK was deliberately
  // skipped here.
  ownerId: uuid("owner_id").notNull(),
  role: mediaRoleEnum("role").notNull(),
  blobUrl: text("blob_url").notNull(),
  blobPathname: text("blob_pathname").notNull(),
  fileName: text("file_name").notNull().default(""),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  width: integer("width"),
  height: integer("height"),
  metadata: jsonb("metadata").$type<Record<string, string>>().notNull().default({}),
  sortOrder: integer("sort_order").notNull().default(0),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Phase 4 — Auth.js v5 adapter tables (Credentials provider, database
// sessions). Table shapes follow Auth.js's own documented Drizzle/Postgres
// adapter schema (https://authjs.dev/getting-started/adapters/drizzle)
// verbatim, deliberately kept separate from our own `admin_users` business
// table below rather than merged into it — that keeps the adapter on a
// shape it's known to work with, and keeps role/password/active-status data
// out of a table Auth.js itself writes to. `accounts` and
// `verification_tokens` exist only to satisfy the adapter's schema contract
// (both are required by @auth/drizzle-adapter's types) — this app has no
// OAuth providers and no email/magic-link sign-in, so neither table is ever
// written to at runtime; they're expected to stay empty.
// ---------------------------------------------------------------------------

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { withTimezone: true }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ---------------------------------------------------------------------------
// admin_users — our own business data for an admin account: 1:1 with `user`
// by id (Auth.js owns name/email/image on `user`; this table owns
// everything role/access-related). See PHASE_4_PLAN.md Sections 1 & 3.
// ---------------------------------------------------------------------------

export const adminUsers = pgTable("admin_users", {
  id: uuid("id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  role: adminRoleEnum("role").notNull().default("editor"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// activity_log — single unified audit/activity table (PHASE_4_PLAN.md
// Section 9). Written from one central helper (lib/admin/activity.ts),
// never inserted into directly from scattered call sites.
// ---------------------------------------------------------------------------

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorAdminUserId: uuid("actor_admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  summary: text("summary").notNull().default(""),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
