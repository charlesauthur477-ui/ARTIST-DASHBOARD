import type { Config } from "drizzle-kit";

// ---------------------------------------------------------------------------
// drizzle-kit configuration.
//
// `npm run db:generate` reads db/schema.ts and the existing migration
// snapshots under db/migrations/meta to produce the next SQL migration file
// — this does NOT require a live database connection. `npm run db:migrate`
// (a small script, see package.json) applies pending migrations and DOES
// need DATABASE_URL set.
// ---------------------------------------------------------------------------

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Only read when a command actually needs a live connection (e.g.
    // `drizzle-kit push`, which this project does not use — migrations are
    // applied via `npm run db:migrate` instead). Falls back to a clearly
    // invalid placeholder so `db:generate` never fails locally just because
    // DATABASE_URL isn't set yet.
    url: process.env.DATABASE_URL ?? "postgres://unset:unset@localhost:5432/unset",
  },
} satisfies Config;
