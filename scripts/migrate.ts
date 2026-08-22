// ---------------------------------------------------------------------------
// Applies pending Drizzle migrations (db/migrations/*.sql) to DATABASE_URL.
// Run with: npm run db:migrate
//
// Uses the pooled/WebSocket Neon driver (not the HTTP driver lib/db.ts uses
// for normal request-time queries) because drizzle's migrator needs to run
// multiple statements — see lib/repositories/approvals.ts for the same
// reasoning applied to the approval transaction.
// ---------------------------------------------------------------------------

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Set it (see .env.example) before running migrations.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  console.log("Applying migrations from ./db/migrations ...");
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("Migrations applied successfully.");

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
