import { notFound } from "next/navigation";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { SocialTabForm } from "@/components/admin/artists/SocialTabForm";

export const dynamic = "force-dynamic";

export default async function ArtistSocialTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

  return (
    <SocialTabForm
      artistId={id}
      initial={{
        instagramHandle: artist.instagramHandle ?? "",
        socialLinks: artist.socialLinks,
        streamingLinks: artist.streamingLinks,
      }}
    />
  );
}
