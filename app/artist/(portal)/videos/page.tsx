import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireArtistSession } from "@/lib/artist/session";
import { getMediaByOwner } from "@/lib/repositories/media";
import { VideosTab, type VideoItem } from "@/components/admin/artists/VideosTab";
import { artistSaveVideos } from "@/lib/artist/cmsActionAdapters";

export const dynamic = "force-dynamic";

export default async function ArtistPortalVideosPage() {
  const user = await requireArtistSession();
  const id = user.artistId;

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

  return <VideosTab artistId={id} items={items} saveAction={artistSaveVideos} />;
}
