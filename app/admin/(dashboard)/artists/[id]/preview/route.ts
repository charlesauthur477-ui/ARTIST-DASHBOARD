import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";

// ---------------------------------------------------------------------------
// Preview entry point — PHASE_4_PLAN.md Section 8.
//
// A Route Handler (not a page component) because enabling Draft Mode
// mutates a cookie, which Next.js only allows from a Route Handler or
// Server Action — see the official Draft Mode guide
// (node_modules/next/dist/docs/01-app/02-guides/draft-mode.md), whose exact
// pattern this follows: verify access, draft.enable(), redirect to the real
// public URL (not to a separate preview template) so the public page
// component itself renders the draft data via lib/artists.ts's
// getArtistBySlug already being draftMode-aware.
//
// requireAdmin() re-checks the session independently of middleware.ts's
// gate on /admin/:path*, per the "middleware must not be the only layer"
// requirement.
// ---------------------------------------------------------------------------

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) {
    return new Response("Artist not found.", { status: 404 });
  }

  const draft = await draftMode();
  draft.enable();

  redirect(`/artists/${artist.slug}`);
}
