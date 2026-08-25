// ---------------------------------------------------------------------------
// Login rate limiting — PHASE_4_PLAN.md Sections 12 & 18.
//
// A simple in-memory sliding-window limiter keyed by "ip:email". This is a
// deliberate, documented limitation (see PHASE_4_PLAN.md Section 18 and the
// Phase 4 final report): an in-memory Map only limits attempts seen by a
// single serverless instance, so under real multi-instance load on Vercel
// an attacker distributed across instances could exceed this budget. For a
// small trusted-admin-team login surface this is a reasonable first layer;
// upgrading to a shared store (Vercel KV / @upstash/ratelimit) is a
// same-shaped follow-up that does not require changing the call site below
// (loginAction in app/admin/login/actions.ts) — only this module's
// internals.
// ---------------------------------------------------------------------------

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Bound memory growth: opportunistically sweep expired buckets on access
// rather than running a timer (this module can be imported in edge/route
// contexts where setInterval isn't appropriate).
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

export function checkLoginRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - bucket.windowStart) };
  }

  bucket.count += 1;
  return { allowed: true };
}

/** Call on a successful login to clear the counter for that key. */
export function resetLoginRateLimit(key: string) {
  buckets.delete(key);
}
