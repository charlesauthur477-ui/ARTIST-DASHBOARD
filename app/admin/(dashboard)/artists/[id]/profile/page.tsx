import { notFound } from "next/navigation";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { ProfileTabForm } from "@/components/admin/artists/ProfileTabForm";

export const dynamic = "force-dynamic";

export default async function ArtistProfileTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

  return (
    <ProfileTabForm
      artistId={id}
      initial={{
        name: artist.name,
        stageName: artist.stageName,
        tagline: artist.tagline,
        genre: artist.genre,
        location: artist.location,
        bio: artist.bio,
        shortBio: artist.shortBio,
      }}
    />
  );
}
