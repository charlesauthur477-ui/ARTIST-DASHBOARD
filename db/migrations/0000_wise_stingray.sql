CREATE TYPE "public"."application_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."artist_status" AS ENUM('draft', 'active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."media_owner_type" AS ENUM('application', 'artist');--> statement-breakpoint
CREATE TYPE "public"."media_role" AS ENUM('profile_photo', 'hero_photo', 'about_photo', 'gallery_photo', 'release_artwork', 'band_member_photo', 'press_kit_file', 'og_image');--> statement-breakpoint
CREATE TYPE "public"."release_type" AS ENUM('album', 'ep', 'single');--> statement-breakpoint
CREATE TABLE "application_band_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"role" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"instagram" text DEFAULT '' NOT NULL,
	"photo_media_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_collaborations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"brand" text DEFAULT '' NOT NULL,
	"type" text DEFAULT '' NOT NULL,
	"year" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"link" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_press_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"quote" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"type" "release_type" DEFAULT 'single' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"release_date" text DEFAULT '' NOT NULL,
	"artwork_media_id" uuid,
	"description" text DEFAULT '' NOT NULL,
	"spotify_url" text DEFAULT '' NOT NULL,
	"apple_music_url" text DEFAULT '' NOT NULL,
	"youtube_url" text DEFAULT '' NOT NULL,
	"other_url" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_shows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"venue" text DEFAULT '' NOT NULL,
	"event_name" text DEFAULT '' NOT NULL,
	"event_type" text DEFAULT '' NOT NULL,
	"ticket_url" text DEFAULT '' NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"client_name" text DEFAULT '' NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"event" text DEFAULT '' NOT NULL,
	"testimonial" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artist_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "application_status" DEFAULT 'draft' NOT NULL,
	"stage_name" text DEFAULT '' NOT NULL,
	"real_name" text DEFAULT '' NOT NULL,
	"pronunciation" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"primary_genre" text DEFAULT '' NOT NULL,
	"secondary_genres" text DEFAULT '' NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"short_bio" text DEFAULT '' NOT NULL,
	"full_bio" text DEFAULT '' NOT NULL,
	"artist_type" text DEFAULT '' NOT NULL,
	"primary_role" text DEFAULT '' NOT NULL,
	"years_active" text DEFAULT '' NOT NULL,
	"languages_performed" text DEFAULT '' NOT NULL,
	"style_description" text DEFAULT '' NOT NULL,
	"career_highlights" text DEFAULT '' NOT NULL,
	"awards" text DEFAULT '' NOT NULL,
	"notable_performances" text DEFAULT '' NOT NULL,
	"festivals_played" text DEFAULT '' NOT NULL,
	"media_features" text DEFAULT '' NOT NULL,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"has_no_upcoming_shows" boolean DEFAULT false NOT NULL,
	"is_solo_no_band" boolean DEFAULT false NOT NULL,
	"performance_formats" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"budget_range" text DEFAULT '' NOT NULL,
	"typical_set_duration" text DEFAULT '' NOT NULL,
	"number_of_sets" text DEFAULT '' NOT NULL,
	"technical_requirements" text DEFAULT '' NOT NULL,
	"stage_requirements" text DEFAULT '' NOT NULL,
	"hospitality_notes" text DEFAULT '' NOT NULL,
	"artist_statement" text DEFAULT '' NOT NULL,
	"press_kit_url" text DEFAULT '' NOT NULL,
	"website_url" text DEFAULT '' NOT NULL,
	"preferred_contact_email" text DEFAULT '' NOT NULL,
	"booking_contact_name" text DEFAULT '' NOT NULL,
	"booking_contact_email" text DEFAULT '' NOT NULL,
	"booking_phone" text DEFAULT '' NOT NULL,
	"management_email" text DEFAULT '' NOT NULL,
	"management_phone" text DEFAULT '' NOT NULL,
	"available_event_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"domestic_travel" boolean DEFAULT false NOT NULL,
	"international_travel" boolean DEFAULT false NOT NULL,
	"booking_notes" text DEFAULT '' NOT NULL,
	"consent_content_use" boolean DEFAULT false NOT NULL,
	"consent_media_rights" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"rejection_reason" text,
	"linked_artist_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artist_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"platform" text DEFAULT 'youtube' NOT NULL,
	"video_id" text DEFAULT '' NOT NULL,
	"poster_image_media_id" uuid,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"status" "artist_status" DEFAULT 'draft' NOT NULL,
	"source_application_id" uuid,
	"name" text DEFAULT '' NOT NULL,
	"stage_name" text DEFAULT '' NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"genre" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"short_bio" text DEFAULT '' NOT NULL,
	"career_highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"streaming_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"instagram_handle" text,
	"press_kit" jsonb DEFAULT '{"bio":"","shortBio":"","downloadUrl":""}'::jsonb NOT NULL,
	"booking_settings" jsonb DEFAULT '{"eventTypes":[],"performanceFormats":[],"budgetRanges":[],"enquiryNote":""}'::jsonb NOT NULL,
	"contact_information" jsonb DEFAULT '{"bookings":{"label":"Bookings"},"management":{"label":"Management"},"press":{"label":"Press"},"general":{"label":"General"}}'::jsonb NOT NULL,
	"profile_image_media_id" uuid,
	"hero_image_media_id" uuid,
	"about_image_media_id" uuid,
	"og_image_media_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artists_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "band_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"role" text DEFAULT '' NOT NULL,
	"photo_media_id" uuid,
	"bio" text DEFAULT '' NOT NULL,
	"instagram" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaborations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"type" text DEFAULT '' NOT NULL,
	"logo_media_id" uuid,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'live' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_type" "media_owner_type" NOT NULL,
	"owner_id" uuid NOT NULL,
	"role" "media_role" NOT NULL,
	"blob_url" text NOT NULL,
	"blob_pathname" text NOT NULL,
	"file_name" text DEFAULT '' NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_formats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"format_id" text DEFAULT '' NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"lineup" text DEFAULT '' NOT NULL,
	"style" text DEFAULT '' NOT NULL,
	"suitable_for" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"type" "release_type" DEFAULT 'single' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"release_date" text DEFAULT '' NOT NULL,
	"cover_image_media_id" uuid,
	"description" text DEFAULT '' NOT NULL,
	"track_count" integer,
	"streaming_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"venue" text DEFAULT '' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"event_type" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"ticket_url" text,
	"details_url" text,
	"is_past" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"quote" text DEFAULT '' NOT NULL,
	"client_name" text DEFAULT '' NOT NULL,
	"event_type" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_band_members" ADD CONSTRAINT "application_band_members_application_id_artist_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."artist_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_collaborations" ADD CONSTRAINT "application_collaborations_application_id_artist_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."artist_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_press_quotes" ADD CONSTRAINT "application_press_quotes_application_id_artist_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."artist_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_releases" ADD CONSTRAINT "application_releases_application_id_artist_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."artist_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_shows" ADD CONSTRAINT "application_shows_application_id_artist_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."artist_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_testimonials" ADD CONSTRAINT "application_testimonials_application_id_artist_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."artist_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_videos" ADD CONSTRAINT "application_videos_application_id_artist_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."artist_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_videos" ADD CONSTRAINT "artist_videos_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "band_members" ADD CONSTRAINT "band_members_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_formats" ADD CONSTRAINT "performance_formats_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shows" ADD CONSTRAINT "shows_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;