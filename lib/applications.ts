"use server";

// ---------------------------------------------------------------------------
// Admin-facing application read service (Server Actions).
//
// Not called from any UI yet — there is no /admin this phase. This exists so
// the future admin dashboard has a stable, already-tested entry point to
// build against, per PHASE_3_PLAN.md Section 8 ("Do NOT build the complete
// admin dashboard in this phase. Design the database/API so it can support
// it."). Every export here re-checks nothing about auth yet, because there
// is no manager auth system this phase either (Section 7) — the future
// admin phase must add a session/role check at the top of each of these
// before exposing them to any route.
// ---------------------------------------------------------------------------

import { getApplicationById, listApplications, type ApplicationStatus } from "@/lib/repositories/applications";

export async function listArtistApplications(status?: ApplicationStatus) {
  return listApplications(status);
}

export async function getArtistApplication(id: string) {
  return getApplicationById(id);
}
