CREATE TYPE "public"."booking_status" AS ENUM('new', 'contacted', 'negotiating', 'confirmed', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."calendar_event_type" AS ENUM('available', 'tentative', 'booked_platform', 'booked_external', 'unavailable');--> statement-breakpoint
CREATE TABLE "artist_calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"type" "calendar_event_type" DEFAULT 'unavailable' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"venue" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"event_type" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"booking_id" uuid,
	"created_by_admin_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"status" "booking_status" DEFAULT 'new' NOT NULL,
	"client_name" text DEFAULT '' NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"event_type" text DEFAULT '' NOT NULL,
	"event_date" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"expected_audience" text DEFAULT '' NOT NULL,
	"performance_format" text DEFAULT '' NOT NULL,
	"budget_range" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"internal_notes" text DEFAULT '' NOT NULL,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artist_calendar_events" ADD CONSTRAINT "artist_calendar_events_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_calendar_events" ADD CONSTRAINT "artist_calendar_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_calendar_events" ADD CONSTRAINT "artist_calendar_events_created_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("created_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;