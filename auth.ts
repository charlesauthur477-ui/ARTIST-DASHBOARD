import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { isAdminRole } from "@/lib/admin/permissions";

// ---------------------------------------------------------------------------
// Auth.js v5 configuration — PHASE_4_PLAN.md Section 1.
//
// - Credentials provider only: no public sign-up, no OAuth. Admin accounts
//   are created exclusively via scripts/create_admin_user.ts.
// - JWT session strategy: Auth.js v5 hard-rejects a Credentials-only
//   provider list combined with database sessions at startup ("Signing in
//   with credentials only supported if JWT strategy is enabled" —
//   node_modules/@auth/core/lib/utils/assert.js). This is not configurable
//   — the original database-strategy config threw on every request, which
//   surfaced (misleadingly) as a Proxy-loader error. The DrizzleAdapter and
//   its user/account/session/verificationToken tables stay as-is (useful if
//   an OAuth provider is ever added), they're just unused for session
//   storage under Credentials-only sign-in.
// - authorize() is the ONLY place a plaintext password is ever compared; it
//   runs server-side (Node runtime, not edge) since bcrypt needs Node's
//   crypto. It re-checks admin_users.is_active on every login attempt, not
//   just role — a deactivated account cannot obtain a new session even if
//   the password is still correct.
// - The `session` callback re-reads admin_users on EVERY session read (not
//   just at login, and not just embedded in the JWT at sign-in) and attaches
//   { id, role, isActive } to session.user, so lib/admin/auth.ts's
//   requireAdmin()/requireRole() always see current role/active-status
//   rather than a stale snapshot from login/token-issue time. A deactivated
//   admin's JWT cookie remains cryptographically valid until it expires
//   (maxAge below), but every protected Server Component/Action re-checks
//   is_active independently and rejects them — the proxy-layer check was
//   always documented as a cheap first gate, not the only one.
// ---------------------------------------------------------------------------

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const db = getDb();

  return {
    adapter: DrizzleAdapter(db, {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    }),
    session: {
      // JWT, not "database" — see the note above the config object: Auth.js
      // v5 rejects database sessions for a Credentials-only provider list.
      strategy: "jwt",
      // ~12hr session lifetime per PHASE_4_PLAN.md Section 12.
      maxAge: 12 * 60 * 60,
    },
    pages: {
      signIn: "/admin/login",
    },
    providers: [
      Credentials({
        name: "Admin login",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
          const password = typeof credentials?.password === "string" ? credentials.password : "";
          if (!email || !password) return null;

          const [userRow] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
          if (!userRow) return null;

          const [adminRow] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, userRow.id)).limit(1);
          if (!adminRow || !adminRow.isActive) return null;

          const passwordMatches = await compare(password, adminRow.passwordHash);
          if (!passwordMatches) return null;

          return {
            id: userRow.id,
            email: userRow.email,
            name: userRow.name ?? userRow.email,
          };
        },
      }),
    ],
    callbacks: {
      async session({ session, token }) {
        // Under the JWT strategy, `user` isn't passed to this callback on
        // every read (only on initial sign-in) — the admin's id is instead
        // carried in the token's standard `sub` claim, which Auth.js sets
        // from authorize()'s returned `id` and keeps stable across refreshes.
        const userId = token.sub;
        if (!userId) return session;

        const [adminRow] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, userId)).limit(1);
        const role = adminRow && isAdminRole(adminRow.role) ? adminRow.role : undefined;
        return {
          ...session,
          user: {
            ...session.user,
            id: userId,
            role,
            isActive: adminRow?.isActive ?? false,
          },
        };
      },
    },
  };
});
