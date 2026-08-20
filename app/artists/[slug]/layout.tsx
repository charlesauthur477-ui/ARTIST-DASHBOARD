import { notFound } from "next/navigation";
import { getArtistBySlug } from "@/lib/artists";
import { ArtistHeader } from "@/components/layout/ArtistHeader";
import { ArtistFooter } from "@/components/layout/ArtistFooter";
import { MobileBookingBar } from "@/components/layout/MobileBookingBar";

export default async function ArtistLayout({ children, params }: LayoutProps<"/artists/[slug]">) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);

  if (!artist) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <ArtistHeader slug={artist.slug} artistName={artist.name} />
      <main className="flex-1 pb-20 sm:pb-0">{children}</main>
      <ArtistFooter artist={artist} />
      <MobileBookingBar slug={artist.slug} artistName={artist.name} />
    </div>
  );
}
