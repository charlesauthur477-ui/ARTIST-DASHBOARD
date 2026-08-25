"use server";

// ---------------------------------------------------------------------------
// Approval Server Actions — thin wrappers around lib/repositories/approvals.ts
// (which holds the actual transaction). Not called from any UI this phase
// (no /admin exists yet) — see that file's doc comment for the full design.
// Kept as its own module, separate from the repository, so a future
// authenticated /admin route can import a server-action-safe entry point
// without pulling in the transactional Postgres Pool client at the top of a
// non-"use server" module.
// ---------------------------------------------------------------------------

import { approveApplication, markUnderReview, rejectApplication, returnApplicationToReview } from "@/lib/repositories/approvals";

export { approveApplication, rejectApplication, markUnderReview, returnApplicationToReview };
