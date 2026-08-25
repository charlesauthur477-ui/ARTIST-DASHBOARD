import { notFound } from "next/navigation";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { SeoTabForm } from "@/components/admin/artists/SeoTabForm";

export const dynamic = "force-dynamic";

export default async function ArtistSeoTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

  return (
    <SeoTabForm
      artistId={id}
      initial={{
        seoTitle: artist.seoTitle ?? "",
        seoDescription: artist.seoDescription ?? "",
        canonicalUrl: artist.canonicalUrl ?? "",
      }}
    />
  );
}
