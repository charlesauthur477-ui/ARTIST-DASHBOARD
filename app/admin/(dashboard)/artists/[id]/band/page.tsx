import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { getMediaByOwner } from "@/lib/repositories/media";
import { BandTab, type BandMemberItem } from "@/components/admin/artists/BandTab";

export const dynamic = "force-dynamic";

export default async function ArtistBandTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

  const db = getDb();
  const [members, media] = await Promise.all([
    db.select().from(schema.bandMembers).where(eq(schema.bandMembers.artistId, id)),
    getMediaByOwner("artist", id),
  ]);
  const mediaMap = new Map(media.map((m) => [m.id, m]));

  const items: BandMemberItem[] = members
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((m) => ({
      name: m.name,
      role: m.role,
      bio: m.bio,
      instagram: m.instagram ?? "",
      photoMediaId: m.photoMediaId,
      photoUrl: m.photoMediaId ? (mediaMap.get(m.photoMediaId)?.blobUrl ?? null) : null,
    }));

  return <BandTab artistId={id} items={items} />;
}
