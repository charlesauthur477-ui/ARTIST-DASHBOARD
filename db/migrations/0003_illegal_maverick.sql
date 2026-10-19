CREATE TABLE "artist_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artist_users_artist_id_unique" UNIQUE("artist_id"),
	CONSTRAINT "artist_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "artist_calendar_events" ADD COLUMN "created_by_artist_user_id" uuid;--> statement-breakpoint
ALTER TABLE "artist_users" ADD CONSTRAINT "artist_users_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_calendar_events" ADD CONSTRAINT "artist_calendar_events_created_by_artist_user_id_artist_users_id_fk" FOREIGN KEY ("created_by_artist_user_id") REFERENCES "public"."artist_users"("id") ON DELETE set null ON UPDATE no action;