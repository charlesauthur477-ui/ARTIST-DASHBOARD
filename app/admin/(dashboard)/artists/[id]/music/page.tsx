import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { getMediaByOwner } from "@/lib/repositories/media";
import { MusicTab, type ReleaseItem } from "@/components/admin/artists/MusicTab";

export const dynamic = "force-dynamic";

export default async function ArtistMusicTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

  const db = getDb();
  const [releases, media] = await Promise.all([
    db.select().from(schema.releases).where(eq(schema.releases.artistId, id)),
    getMediaByOwner("artist", id),
  ]);
  const mediaMap = new Map(media.map((m) => [m.id, m]));

  const items: ReleaseItem[] = releases
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r) => ({
      type: r.type,
      title: r.title,
      releaseDate: r.releaseDate,
      coverImageMediaId: r.coverImageMediaId,
      coverImageUrl: r.coverImageMediaId ? (mediaMap.get(r.coverImageMediaId)?.blobUrl ?? null) : null,
      description: r.description,
      trackCount: r.trackCount,
      streamingLinks: r.streamingLinks,
    }));

  return <MusicTab artistId={id} items={items} />;
}
