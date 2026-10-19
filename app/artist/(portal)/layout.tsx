import type { ReactNode } from "react";
import { requireArtistSession } from "@/lib/artist/session";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { ArtistShell } from "@/components/artist/ArtistShell";

// ---------------------------------------------------------------------------
// Protected artist portal shell — mirrors app/admin/(dashboard)/layout.tsx.
// A route GROUP, not app/artist/layout.tsx, so /artist/login (a sibling
// route outside this group) is never wrapped by it — wrapping it here too
// would call requireArtistSession() -> redirect("/artist/login") on the
// login page itself, an infinite redirect loop, same reasoning as admin's.
//
// Every route under this group independently re-verifies the session via
// requireArtistSession() (defense in depth alongside proxy.ts), exactly
// the same pattern the admin shell uses.
// ---------------------------------------------------------------------------

export default async function ArtistPortalLayout({ children }: { children: ReactNode }) {
  const user = await requireArtistSession();
  const artist = await getArtistRowById(user.artistId);

  return (
    <ArtistShell artistName={artist?.stageName || artist?.name || "Artist"} email={user.email}>
      {children}
    </ArtistShell>
  );
}
