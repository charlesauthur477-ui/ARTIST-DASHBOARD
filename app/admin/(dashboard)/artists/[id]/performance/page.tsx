import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { PerformanceTab, type PerformanceFormatItem } from "@/components/admin/artists/PerformanceTab";

export const dynamic = "force-dynamic";

export default async function ArtistPerformanceTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

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

  return <PerformanceTab artistId={id} items={items} />;
}
