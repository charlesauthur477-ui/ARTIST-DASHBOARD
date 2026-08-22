import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@/db/schema";

// ---------------------------------------------------------------------------
// Database client — server-only.
//
// Uses Neon's HTTP driver (drizzle-orm/neon-http), which is the right choice
// for Next.js Server Actions / Route Handlers running on Vercel's serverless
// runtime: it's a stateless fetch-based driver with no connection pool to
// manage, so it works cleanly across cold starts. It does NOT support
// interactive multi-statement transactions the way a pooled TCP client does
// — see lib/repositories/approvals.ts for how the approval flow's
// transaction is structured to work within that constraint.
//
// DATABASE_URL is intentionally read only here, and only ever imported by
// server-only modules (this file is never imported by a "use client"
// component). Never expose this value, or any client built from it, to the
// browser.
// ---------------------------------------------------------------------------

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. This code path requires the database (USE_DATABASE=true) — " +
        "see .env.example and PHASE_3_PLAN.md for setup."
    );
  }
  return url;
}

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Lazily creates (and caches, per serverless invocation / dev process) the
 * Drizzle client. Lazy on purpose: importing this module must not throw for
 * code paths that never actually touch the database, which matters for the
 * USE_DATABASE=false fallback (see lib/artists.ts).
 */
export function getDb() {
  if (!cachedDb) {
    const sql = neon(getDatabaseUrl());
    cachedDb = drizzle(sql, { schema });
  }
  return cachedDb;
}

export { schema };
