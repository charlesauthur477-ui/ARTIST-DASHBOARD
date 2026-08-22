import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArtistSlugs, getArtistBySlug, getArtistShows } from "@/lib/artists";
import { PageHero } from "@/components/ui/PageHero";
import { ShowsList } from "@/components/shows/ShowsList";
import { CTASection } from "@/components/ui/CTASection";
import { Button } from "@/components/ui/Button";
import { bookingHref } from "@/lib/nav";

export async function generateStaticParams() {
  return (await getAllArtistSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/artists/[slug]/shows">): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return {};
  return {
    title: `Shows | ${artist.name}`,
    description: `Upcoming and past shows from ${artist.name}.`,
    alternates: { canonical: `/artists/${artist.slug}/shows` },
  };
}

export default async function ShowsPage({ params }: PageProps<"/artists/[slug]/shows">) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const [upcoming, past] = await Promise.all([
    getArtistShows(slug, { upcomingOnly: true }),
    getArtistShows(slug, { pastOnly: true }),
  ]);

  const jsonLd = upcoming.map((show) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${artist.name} — ${show.eventType}`,
    startDate: show.date,
    eventStatus:
      show.status === "sold-out"
        ? "https://schema.org/EventScheduled"
        : "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: show.venue,
      address: show.city,
    },
    performer: { "@type": "MusicGroup", name: artist.name },
    ...(show.ticketUrl ? { offers: { "@type": "Offer", url: show.ticketUrl } } : {}),
  }));

  return (
    <>
      {jsonLd.length > 0 ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}
      <PageHero eyebrow="Live Dates" title="Shows" description={`Where to catch ${artist.name} live.`} />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="mb-2 text-xs font-medium tracking-[0.25em] text-bronze-300 uppercase">Upcoming Shows</h2>
        <ShowsList shows={upcoming} emptyLabel="No upcoming shows announced right now — check back soon." />

        <h2 className="mt-16 mb-2 text-xs font-medium tracking-[0.25em] text-muted uppercase">Past Shows</h2>
        <ShowsList shows={past} emptyLabel="Past shows will appear here." />
      </section>

      <CTASection title="Want to bring the show to your event?" description="Available for concerts, weddings, corporate events, festivals, clubs, colleges, private events, and brand events.">
        <Button href={bookingHref(artist.slug)}>Send Booking Enquiry</Button>
      </CTASection>
    </>
  );
}
