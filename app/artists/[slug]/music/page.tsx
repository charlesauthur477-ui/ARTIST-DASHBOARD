import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArtistSlugs, getArtistBySlug } from "@/lib/artists";
import { PageHero } from "@/components/ui/PageHero";
import { ReleaseSection } from "@/components/music/ReleaseSection";
import { CTASection } from "@/components/ui/CTASection";
import { Button } from "@/components/ui/Button";
import { bookingHref } from "@/lib/nav";

export async function generateStaticParams() {
  return (await getAllArtistSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/artists/[slug]/music">): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return {};
  return {
    title: `Music | ${artist.name}`,
    description: `Albums, EPs, and singles from ${artist.name}.`,
    alternates: { canonical: `/artists/${artist.slug}/music` },
  };
}

export default async function MusicPage({ params }: PageProps<"/artists/[slug]/music">) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const hasReleases = artist.albums.length + artist.eps.length + artist.singles.length > 0;

  return (
    <>
      <PageHero eyebrow="Discography" title="Music" description={`Every release from ${artist.name}, in one place.`} />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        {hasReleases ? (
          <>
            <ReleaseSection title="Albums" releases={artist.albums} />
            <ReleaseSection title="EPs" releases={artist.eps} />
            <ReleaseSection title="Singles" releases={artist.singles} />
          </>
        ) : (
          <p className="rounded-md border border-dashed border-border-subtle px-6 py-16 text-center text-sm text-muted">
            New music is on the way — check back soon.
          </p>
        )}
      </section>

      <CTASection title="Listen Everywhere" description="Stream the full catalogue on your platform of choice.">
        <Button href={`/artists/${artist.slug}`} variant="secondary">
          Back to Homepage
        </Button>
        <Button href={bookingHref(artist.slug)}>Book Now</Button>
      </CTASection>
    </>
  );
}
