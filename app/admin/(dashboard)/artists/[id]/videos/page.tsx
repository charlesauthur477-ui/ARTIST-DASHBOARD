import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { getMediaByOwner } from "@/lib/repositories/media";
import { VideosTab, type VideoItem } from "@/components/admin/artists/VideosTab";

export const dynamic = "force-dynamic";

export default async function ArtistVideosTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

  const db = getDb();
  const [videos, media] = await Promise.all([
    db.select().from(schema.artistVideos).where(eq(schema.artistVideos.artistId, id)),
    getMediaByOwner("artist", id),
  ]);
  const mediaMap = new Map(media.map((m) => [m.id, m]));

  const items: VideoItem[] = videos
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((v) => ({
      title: v.title,
      description: v.description,
      platform: v.platform as VideoItem["platform"],
      videoId: v.videoId,
      posterImageMediaId: v.posterImageMediaId,
      posterImageUrl: v.posterImageMediaId ? (mediaMap.get(v.posterImageMediaId)?.blobUrl ?? null) : null,
      featured: v.featured,
    }));

  return <VideosTab artistId={id} items={items} />;
}
