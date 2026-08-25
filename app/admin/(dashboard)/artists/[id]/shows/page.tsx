import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { ShowsTab, type ShowItem } from "@/components/admin/artists/ShowsTab";

export const dynamic = "force-dynamic";

export default async function ArtistShowsTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

  const db = getDb();
  const shows = await db.select().from(schema.shows).where(eq(schema.shows.artistId, id));

  const items: ShowItem[] = shows
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({
      date: s.date,
      city: s.city,
      venue: s.venue,
      country: s.country,
      eventType: s.eventType,
      status: s.status as ShowItem["status"],
      ticketUrl: s.ticketUrl ?? "",
      detailsUrl: s.detailsUrl ?? "",
      isPast: s.isPast,
    }));

  return <ShowsTab artistId={id} items={items} />;
}
