import { handlers } from "@/auth";

// Required by Auth.js convention — the one Route Handler this app has
// (PHASE_4_PLAN.md Section 11). Everything else is Server Actions.
export const { GET, POST } = handlers;
