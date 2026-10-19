// Temporary, read-only diagnostic script — no writes, no schema changes.
// Reports: (1) which migrations Drizzle's own tracking table thinks are
// applied, (2) the actual current columns on artist_users. Deleted after use.
import { Pool } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url });

  try {
    console.log("=== drizzle migrations tracking table ===");
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
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Diagnostic failed:", err);
  process.exit(1);
});
