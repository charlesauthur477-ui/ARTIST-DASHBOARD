import { notFound } from "next/navigation";
import { getArtistBySlug } from "@/lib/artists";
import { generateTechRiderPdf } from "@/lib/pdf/pdfGenerator";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const pdfBuffer = generateTechRiderPdf(artist);

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${artist.slug}-technical-rider.pdf"`,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
