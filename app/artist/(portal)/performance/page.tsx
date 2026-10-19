import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireArtistSession } from "@/lib/artist/session";
import { PerformanceTab, type PerformanceFormatItem } from "@/components/admin/artists/PerformanceTab";
import { artistSavePerformanceFormats } from "@/lib/artist/cmsActionAdapters";

export const dynamic = "force-dynamic";

export default async function ArtistPortalPerformancePage() {
  const user = await requireArtistSession();
  const id = user.artistId;

  const db = getDb();
  const formats = await db.select().from(schema.performanceFormats).where(eq(schema.performanceFormats.artistId, id));

  const items: PerformanceFormatItem[] = formats
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((f) => ({
      formatId: f.formatId,
      name: f.name,
      lineup: f.lineup,
      style: f.style,
      suitableFor: f.suitableFor.join(", "),
    }));

  return <PerformanceTab artistId={id} items={items} saveAction={artistSavePerformanceFormats} />;
}
