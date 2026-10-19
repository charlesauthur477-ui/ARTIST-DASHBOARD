import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireArtistSession } from "@/lib/artist/session";
import { ShowsTab, type ShowItem } from "@/components/admin/artists/ShowsTab";
import { artistSaveShows } from "@/lib/artist/cmsActionAdapters";

export const dynamic = "force-dynamic";

export default async function ArtistPortalShowsPage() {
  const user = await requireArtistSession();
  const id = user.artistId;

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

  return <ShowsTab artistId={id} items={items} saveAction={artistSaveShows} />;
}
