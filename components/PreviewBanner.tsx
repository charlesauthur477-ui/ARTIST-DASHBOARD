import { draftMode } from "next/headers";
import { exitPreviewAction } from "@/app/preview-actions";

// ---------------------------------------------------------------------------
// Shown on every public page while an admin is previewing draft content
// (PHASE_4_PLAN.md Section 8). Renders nothing for ordinary visitors —
// draftMode().isEnabled is only ever true for a request carrying the
// admin-only preview cookie set by
// app/admin/(dashboard)/artists/[id]/preview/route.ts.
// ---------------------------------------------------------------------------

export async function PreviewBanner() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <span>Preview mode — you are viewing unpublished content.</span>
      <form action={exitPreviewAction}>
        <button type="submit" className="underline underline-offset-2">
          Exit preview
        </button>
      </form>
    </div>
  );
}
