import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireArtistSession } from "@/lib/artist/session";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { getMediaByOwner } from "@/lib/repositories/media";
import { PressTab, type CollaborationItem, type TestimonialItem } from "@/components/admin/artists/PressTab";
import { artistSaveCollaborations, artistSavePressKit, artistSaveTestimonials } from "@/lib/artist/cmsActionAdapters";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ArtistPortalPressPage() {
  const user = await requireArtistSession();
  const id = user.artistId;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

  const db = getDb();
  const [collabRows, testimonialRows, media] = await Promise.all([
    db.select().from(schema.collaborations).where(eq(schema.collaborations.artistId, id)),
    db.select().from(schema.testimonials).where(eq(schema.testimonials.artistId, id)),
    getMediaByOwner("artist", id),
  ]);
  const mediaMap = new Map(media.map((m) => [m.id, m]));

  const collaborations: CollaborationItem[] = collabRows
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      name: c.name,
      type: c.type,
      logoMediaId: c.logoMediaId,
      logoUrl: c.logoMediaId ? (mediaMap.get(c.logoMediaId)?.blobUrl ?? null) : null,
      description: c.description ?? "",
    }));

  const testimonials: TestimonialItem[] = testimonialRows
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => ({ quote: t.quote, clientName: t.clientName, eventType: t.eventType }));

  return (
    <PressTab
      artistId={id}
      pressKit={{ bio: artist.pressKit.bio, shortBio: artist.pressKit.shortBio, downloadUrl: artist.pressKit.downloadUrl }}
      collaborations={collaborations}
      testimonials={testimonials}
      actions={{ savePressKit: artistSavePressKit, saveCollaborations: artistSaveCollaborations, saveTestimonials: artistSaveTestimonials }}
    />
  );
}
