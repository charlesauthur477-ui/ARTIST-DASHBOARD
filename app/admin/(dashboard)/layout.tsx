import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/AdminShell";

// ---------------------------------------------------------------------------
// Protected admin shell. Deliberately a route GROUP — app/admin/(dashboard)
// — rather than app/admin/layout.tsx, so /admin/login (a sibling route
// outside this group) is never wrapped by it. Wrapping /admin/login here
// too would call requireAdmin() -> redirect("/admin/login") on the login
// page itself, an infinite redirect loop.
//
// Every route under this group independently re-verifies the session via
// requireAdmin() (defense in depth alongside middleware.ts, per
// PHASE_4_PLAN.md Section 12) — not just relying on middleware's redirect.
// ---------------------------------------------------------------------------

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  return (
    <AdminShell userName={user.name} userEmail={user.email} role={user.role}>
      {children}
    </AdminShell>
  );
}
