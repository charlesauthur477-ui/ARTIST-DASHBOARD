import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllArtistSlugs, getArtistBySlug } from "@/lib/artists";
import { PageHero } from "@/components/ui/PageHero";
import { CTASection } from "@/components/ui/CTASection";
import { Button } from "@/components/ui/Button";
import { bookingHref } from "@/lib/nav";

export function generateStaticParams() {
  return getAllArtistSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/artists/[slug]/about">): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) return {};
  return {
    title: `About | ${artist.name}`,
    description: artist.shortBio,
    alternates: { canonical: `/artists/${artist.slug}/about` },
  };
}

export default async function AboutPage({ params }: PageProps<"/artists/[slug]/about">) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) notFound();

  return (
    <>
      <PageHero eyebrow="About" title={`Meet ${artist.name}`} description={artist.tagline} />

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg md:sticky md:top-24 md:self-start">
          <Image src={artist.profileImage} alt={`${artist.name} portrait`} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" priority />
        </div>

        <div>
          {artist.bio.split("\n\n").map((paragraph, i) => (
            <p key={i} className="mb-5 text-base leading-relaxed text-foreground/85 sm:text-lg">
              {paragraph}
            </p>
          ))}

          <div className="mt-10">
            <h2 className="text-xs font-medium tracking-[0.25em] text-bronze-300 uppercase">Career Highlights</h2>
            <ul className="mt-5 space-y-4">
              {artist.careerHighlights.map((h) => (
                <li key={h.id} className="flex gap-3 border-b border-border-subtle pb-4 text-sm text-foreground/90 last:border-none sm:text-base">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-bronze-400" />
                  {h.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CTASection
        title={`Book ${artist.name}`}
        description="Available for concerts, weddings, corporate events, festivals, clubs, colleges, private events, and brand events."
      >
        <Button href={bookingHref(artist.slug)}>Send Booking Enquiry</Button>
      </CTASection>
    </>
  );
}
