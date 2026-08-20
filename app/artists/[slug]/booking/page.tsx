import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArtistSlugs, getArtistBySlug } from "@/lib/artists";
import { PageHero } from "@/components/ui/PageHero";
import { BookingForm } from "@/components/booking/BookingForm";

export function generateStaticParams() {
  return getAllArtistSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/artists/[slug]/booking">): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) return {};
  return { title: `Book ${artist.name}`, description: `Submit a booking enquiry for ${artist.name}.` };
}

export default async function BookingPage({ params }: PageProps<"/artists/[slug]/booking">) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) notFound();

  return (
    <>
      <PageHero
        eyebrow="Booking"
        title={`Book ${artist.name}`}
        description="For bookings, concerts, weddings, corporate events, festivals, clubs, colleges, private events and brand events."
      />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <BookingForm artistSlug={artist.slug} artistName={artist.name} settings={artist.bookingSettings} />
      </section>
    </>
  );
}
