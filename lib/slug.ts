import { slugExists } from "@/lib/repositories/artists";

// ---------------------------------------------------------------------------
// Slug validation for the approval flow (PHASE_3_PLAN.md Section 5 / the
// "SLUG COLLISIONS" instruction: never silently rename a manager's intended
// slug — return a clear error and let a human decide instead).
// ---------------------------------------------------------------------------

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface SlugCheckResult {
  valid: boolean;
  error?: string;
}

/**
 * `excludeArtistId` — Phase 4 addition: when re-validating a slug during
 * publish/save for an artist that already exists (renaming while
 * publishing), the artist's own current row must not count as a collision
 * against itself. Optional and defaulted so the Phase 3 approval call site
 * (a brand new artist, nothing to exclude) is unaffected.
 */
export async function validateSlugForApproval(slug: string, excludeArtistId?: string): Promise<SlugCheckResult> {
  if (!slug || slug.length < 2) {
    return { valid: false, error: "Slug must be at least 2 characters." };
  }
  if (!SLUG_RE.test(slug)) {
    return {
      valid: false,
      error: "Slug may only contain lowercase letters, numbers, and single hyphens between words (e.g. \"aurora-noir\").",
    };
  }
  const RESERVED = ["apply", "api", "admin", "artists", "sitemap.xml", "robots.txt"];
  if (RESERVED.includes(slug)) {
    return { valid: false, error: `"${slug}" is a reserved route and cannot be used as an artist slug.` };
  }
  const taken = await slugExists(slug, excludeArtistId);
  if (taken) {
    return { valid: false, error: `The slug "${slug}" is already in use by another artist. Choose a different slug.` };
  }
  return { valid: true };
}
