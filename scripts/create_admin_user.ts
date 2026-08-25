// ---------------------------------------------------------------------------
// One-off admin account creation — the ONLY way an admin_users row is ever
// created (PHASE_4_PLAN.md Section 1). There is no public/self sign-up and
// no in-app "create admin" UI for the very first account (a chicken-and-egg
// problem — there's no admin session yet to authorize it). Later admins can
// be created the same way by anyone with terminal access to the deployment,
// or (once 4a+ admin UI exists) manually by a super_admin.
//
// Run with:
//   npm run admin:create -- --email you@example.com --name "Your Name" --role super_admin
// Password is read from the ADMIN_PASSWORD env var (never a CLI arg, so it
// never lands in shell history) — prompted for interactively if not set.
//
// Requires DATABASE_URL to be set (.env.local is picked up automatically by
// the --env-file flag in package.json's admin:create script, same as the
// other db: scripts).
// ---------------------------------------------------------------------------

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "@/db/schema";
import { ADMIN_ROLES, isAdminRole } from "@/lib/admin/permissions";

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value && !value.startsWith("--")) {
        out[key] = value;
        i++;
      } else {
        out[key] = "true";
      }
    }
  }
  return out;
}

async function promptPassword(): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  const password = await rl.question("Password for the new admin account: ");
  rl.close();
  return password;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = args.email?.trim().toLowerCase();
  const name = args.name?.trim() || email;
  const role = args.role?.trim() || "editor";

  if (!email || !email.includes("@")) {
    console.error('Usage: npm run admin:create -- --email you@example.com --name "Your Name" --role super_admin');
    process.exit(1);
  }
  if (!isAdminRole(role)) {
    console.error(`Invalid --role "${role}". Must be one of: ${ADMIN_ROLES.join(", ")}`);
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const password = process.env.ADMIN_PASSWORD || (await promptPassword());
  if (!password || password.length < 12) {
    console.error("Password must be at least 12 characters. Refusing to create a weak admin account.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  try {
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing) {
      console.error(`A user with email "${email}" already exists (id ${existing.id}). Refusing to create a duplicate.`);
      process.exit(1);
    }

    const passwordHash = await hash(password, 12);

    const [userRow] = await db.insert(schema.users).values({ email, name }).returning();
    await db.insert(schema.adminUsers).values({
      id: userRow.id,
      passwordHash,
      role,
      isActive: true,
    });

    console.log(`Created admin account: ${email} (role: ${role}, id: ${userRow.id})`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Failed to create admin user:", err);
  process.exit(1);
});
