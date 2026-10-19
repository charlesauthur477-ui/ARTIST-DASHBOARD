CREATE TYPE "public"."calendar_connection_provider" AS ENUM('google', 'apple_ics');--> statement-breakpoint
CREATE TYPE "public"."calendar_connection_status" AS ENUM('connected', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "public"."calendar_event_source" AS ENUM('manual', 'google_calendar', 'apple_ics');--> statement-breakpoint
CREATE TYPE "public"."calendar_privacy_mode" AS ENUM('busy_only', 'detailed');--> statement-breakpoint
CREATE TABLE "calendar_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"provider" "calendar_connection_provider" NOT NULL,
	"status" "calendar_connection_status" DEFAULT 'disconnected' NOT NULL,
	"access_token_enc" text,
	"refresh_token_enc" text,
	"token_expires_at" timestamp with time zone,
	"scope" text,
	"external_account_email" text,
	"external_calendar_id" text,
	"external_calendar_label" text,
	"ics_subscription_url" text,
	"privacy_mode" "calendar_privacy_mode" DEFAULT 'busy_only' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_sync_status" text DEFAULT 'never' NOT NULL,
	"last_sync_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artist_calendar_events" ADD COLUMN "source" "calendar_event_source" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "artist_calendar_events" ADD COLUMN "external_connection_id" uuid;--> statement-breakpoint
ALTER TABLE "artist_calendar_events" ADD COLUMN "external_event_uid" text;--> statement-breakpoint
ALTER TABLE "artist_users" ADD COLUMN "calendar_feed_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_connections_artist_provider_idx" ON "calendar_connections" USING btree ("artist_id","provider");--> statement-breakpoint
ALTER TABLE "artist_calendar_events" ADD CONSTRAINT "artist_calendar_events_external_connection_id_calendar_connections_id_fk" FOREIGN KEY ("external_connection_id") REFERENCES "public"."calendar_connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_users" ADD CONSTRAINT "artist_users_calendar_feed_token_unique" UNIQUE("calendar_feed_token");