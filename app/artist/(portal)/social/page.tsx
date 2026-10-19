import { requireArtistSession } from "@/lib/artist/session";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { SocialTabForm } from "@/components/admin/artists/SocialTabForm";
import { artistUpdateProfileAction } from "@/lib/artist/cmsActions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ArtistPortalSocialPage() {
  const user = await requireArtistSession();
  const artist = await getArtistRowById(user.artistId);
  if (!artist) notFound();

  return (
    <SocialTabForm
      artistId={user.artistId}
      initial={{
        instagramHandle: artist.instagramHandle ?? "",
        socialLinks: artist.socialLinks,
        streamingLinks: artist.streamingLinks,
      }}
      saveAction={artistUpdateProfileAction}
    />
  );
}
