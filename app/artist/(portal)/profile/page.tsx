import { requireArtistSession } from "@/lib/artist/session";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { ProfileTabForm } from "@/components/admin/artists/ProfileTabForm";
import { artistUpdateProfileAction } from "@/lib/artist/cmsActions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ArtistPortalProfilePage() {
  const user = await requireArtistSession();
  const artist = await getArtistRowById(user.artistId);
  if (!artist) notFound();

  return (
    <ProfileTabForm
      artistId={user.artistId}
      initial={{
        name: artist.name,
        stageName: artist.stageName,
        tagline: artist.tagline,
        genre: artist.genre,
        location: artist.location,
        bio: artist.bio,
        shortBio: artist.shortBio,
      }}
      saveAction={artistUpdateProfileAction}
    />
  );
}
