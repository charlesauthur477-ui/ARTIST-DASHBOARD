import { notFound } from "next/navigation";
import { getArtistRowById, getPublishChecklist } from "@/lib/repositories/artistAdmin";
import { PublishingTab } from "@/components/admin/artists/PublishingTab";

export const dynamic = "force-dynamic";

export default async function ArtistPublishingTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

  const checks = getPublishChecklist(artist);

  return (
    <PublishingTab
      artistId={id}
      status={artist.status}
      checks={checks}
      publishedAt={artist.publishedAt ? artist.publishedAt.toISOString() : null}
    />
  );
}
