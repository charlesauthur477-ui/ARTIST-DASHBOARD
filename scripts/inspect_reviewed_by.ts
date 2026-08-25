// ---------------------------------------------------------------------------
// READ-ONLY inspection script — Phase 4 migration failure triage.
//
// Investigates why `ALTER TABLE artist_applications ALTER COLUMN
// reviewed_by SET DATA TYPE uuid` failed with SQLSTATE 42804 ("column
// reviewed_by cannot be cast automatically to type uuid").
//
// This script performs ONLY SELECT statements against information_schema
// and the existing tables. It does not ALTER, UPDATE, DELETE, or DROP
// anything. Safe to run against the live database.
//
// Run with: npm run db:inspect-reviewed-by
// ---------------------------------------------------------------------------

import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const sql = neon(url);

  console.log("====================================================================");
  console.log("A. Current column type of artist_applications.reviewed_by");
  console.log("====================================================================");
  const reviewedByType = await sql`
    SELECT column_name, data_type, udt_name, is_nullable, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'artist_applications' AND column_name = 'reviewed_by'
  `;
  console.log(reviewedByType);

  console.log();
  console.log("====================================================================");
  console.log("B1. Row counts: total applications vs. non-null reviewed_by");
  console.log("====================================================================");
  const counts = await sql`
    SELECT count(*) AS total_applications, count(reviewed_by) AS non_null_reviewed_by
    FROM artist_applications
  `;
  console.log(counts);

  console.log();
  console.log("====================================================================");
  console.log("B2. Distinct non-null reviewed_by values (up to 50), with lengths");
  console.log("====================================================================");
  const values = await sql`
    SELECT reviewed_by, length(reviewed_by::text) AS len, id, stage_name, status, created_at
    FROM artist_applications
    WHERE reviewed_by IS NOT NULL
    LIMIT 50
  `;
  console.log(values.length === 0 ? "(no non-null values found)" : values);

  console.log();
  console.log("====================================================================");
  console.log("B3. Do any non-null reviewed_by values NOT look like a valid UUID?");
  console.log("====================================================================");
  const nonUuidLike = await sql`
    SELECT id, reviewed_by
    FROM artist_applications
    WHERE reviewed_by IS NOT NULL
      AND reviewed_by::text !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  `;
  console.log(nonUuidLike.length === 0 ? "(none — every non-null value IS uuid-formatted, if any exist)" : nonUuidLike);

  console.log();
  console.log("====================================================================");
  console.log("C. admin_users table — does it exist yet, and what type is its id?");
  console.log("====================================================================");
  const adminUsersCols = await sql`
    SELECT column_name, data_type, udt_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_users'
    ORDER BY ordinal_position
  `;
  console.log(adminUsersCols.length === 0 ? "(admin_users table does not exist yet — migration failed before/during table creation)" : adminUsersCols);

  console.log();
  console.log("====================================================================");
  console.log("C2. \"user\" table (Auth.js adapter) — does it exist, and id type?");
  console.log("====================================================================");
  const userCols = await sql`
    SELECT column_name, data_type, udt_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user'
    ORDER BY ordinal_position
  `;
  console.log(userCols.length === 0 ? "(user table does not exist yet)" : userCols);

  console.log();
  console.log("====================================================================");
  console.log("D. Full artist_applications schema (for context)");
  console.log("====================================================================");
  const appCols = await sql`
    SELECT column_name, data_type, udt_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'artist_applications'
    ORDER BY ordinal_position
  `;
  console.log(appCols);

  console.log();
  console.log("====================================================================");
  console.log("E. Any existing constraints/indexes on reviewed_by?");
  console.log("====================================================================");
  const constraints = await sql`
    SELECT con.conname, con.contype, pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'artist_applications'
  `;
  console.log(constraints);

  console.log();
  console.log("====================================================================");
  console.log("F. Sanity check: Aurora Noir / Nova Vale still present and untouched");
  console.log("====================================================================");
  const artists = await sql`
    SELECT id, slug, status, name, created_at, updated_at FROM artists WHERE slug IN ('aurora-noir', 'nova-vale')
  `;
  console.log(artists);

  console.log();
  console.log("====================================================================");
  console.log("G. Which tables from the Phase 4 migration already exist (partial-apply check)");
  console.log("====================================================================");
  const phase4Tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('admin_users', 'user', 'account', 'session', 'verificationToken', 'activity_log')
    ORDER BY table_name
  `;
  console.log(phase4Tables);

  console.log();
  console.log("Inspection complete. No data was modified.");
}

main().catch((err) => {
  console.error("Inspection query failed:", err);
  process.exit(1);
});
