import { Pool } from "@neondatabase/serverless";

// Read-only diagnostic — makes no writes, drops nothing. Safe to run against
// the production database. Requires DATABASE_URL to be set (e.g. run with
// `npx tsx --env-file=.env.local scripts/_audit_db_state.ts` from the project root).
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url });

  try {
    console.log("=== drizzle migrations tracking table (drizzle.__drizzle_migrations) ===");
    try {
      const tracked = await pool.query(
        `select id, hash, created_at from "drizzle"."__drizzle_migrations" order by created_at`
      );
      for (const row of tracked.rows) {
        console.log(`  id=${row.id} hash=${row.hash} created_at=${row.created_at}`);
      }
      if (tracked.rows.length === 0) console.log("  (table exists but has zero rows)");
    } catch (err) {
      console.log("  Could not read drizzle.__drizzle_migrations:", err instanceof Error ? err.message : err);
    }

    console.log("=== artist_users actual columns (information_schema) ===");
    const cols = await pool.query(
      `select column_name, data_type, is_nullable from information_schema.columns where table_name = 'artist_users' order by ordinal_position`
    );
    for (const row of cols.rows) {
      console.log(`  ${row.column_name} (${row.data_type}, nullable=${row.is_nullable})`);
    }

    console.log("=== artist_users row count (data safety check, no data printed) ===");
    const count = await pool.query(`select count(*)::int as n from artist_users`);
    console.log(`  ${count.rows[0].n} row(s)`);

    console.log("=== does the specific artist_users row from the error exist? ===");
    const specific = await pool.query(
      `select id, artist_id, email, is_active, created_at from artist_users where id = $1`,
      ["1d8c7473-d0e7-4b83-a2bc-d6c3d31b6449"]
    );
    if (specific.rows.length === 0) {
      console.log("  NOT FOUND — no artist_users row with that id.");
    } else {
      const r = specific.rows[0];
      console.log(`  FOUND — artist_id=${r.artist_id} email=${r.email} is_active=${r.is_active} created_at=${r.created_at}`);
    }

    console.log("=== which Neon database/branch is this? (sanity check for step 9) ===");
    const dbInfo = await pool.query(`select current_database() as db, current_user as usr, inet_server_addr() as addr`);
    console.log(`  ${JSON.stringify(dbInfo.rows[0])}`);

    console.log("=== attempting the EXACT failing query from getArtistSessionUser() ===");
    try {
      const exact = await pool.query(
        `select "id","artist_id","email","password_hash","is_active","calendar_feed_token","password_reset_token_hash","password_reset_expires_at","created_at","updated_at" from "artist_users" where "artist_users"."id" = $1 limit $2`,
        ["1d8c7473-d0e7-4b83-a2bc-d6c3d31b6449", 1]
      );
      console.log(`  Query succeeded, ${exact.rows.length} row(s) returned.`);
    } catch (err) {
      console.log("  QUERY FAILED — this is the real underlying error:");
      console.log(err);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Diagnostic failed:", err);
  process.exit(1);
});
