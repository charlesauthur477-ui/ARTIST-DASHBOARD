import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { getMediaByOwner } from "@/lib/repositories/media";
import { PhotosTabForm } from "@/components/admin/artists/PhotosTabForm";
import { GalleryTab, type GalleryItem } from "@/components/admin/artists/GalleryTab";

export const dynamic = "force-dynamic";

export default async function ArtistPhotosTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

  const db = getDb();
  const [media, galleryRows] = await Promise.all([
    getMediaByOwner("artist", id),
    db.select().from(schema.galleryImages).where(eq(schema.galleryImages.artistId, id)),
  ]);
  const mediaMap = new Map(media.map((m) => [m.id, m]));

  function slotFor(mediaId: string | null) {
    if (!mediaId) return { mediaId: null, url: null };
    const m = mediaMap.get(mediaId);
    return { mediaId, url: m?.blobUrl ?? null };
  }

  const galleryItems: GalleryItem[] = galleryRows
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g) => ({
      mediaId: g.mediaId,
      url: mediaMap.get(g.mediaId)?.blobUrl ?? null,
      alt: g.alt,
      category: g.category as GalleryItem["category"],
    }));

  return (
    <div className="space-y-8">
      <PhotosTabForm
        artistId={id}
        initial={{
          profileImageMediaId: slotFor(artist.profileImageMediaId),
          heroImageMediaId: slotFor(artist.heroImageMediaId),
          aboutImageMediaId: slotFor(artist.aboutImageMediaId),
          ogImageMediaId: slotFor(artist.ogImageMediaId),
        }}
      />
      <GalleryTab artistId={id} items={galleryItems} />
    </div>
  );
}
