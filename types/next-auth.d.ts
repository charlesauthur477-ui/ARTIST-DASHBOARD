import type { AdminRole } from "@/lib/admin/permissions";

// ---------------------------------------------------------------------------
// Module augmentation: adds our admin-specific fields (id/role/isActive) to
// Auth.js's Session["user"] type, set in auth.ts's `session` callback.
// ---------------------------------------------------------------------------

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: AdminRole;
      isActive: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
