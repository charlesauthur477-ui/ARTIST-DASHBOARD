import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getAllArtistSlugs, getArtistBand, getArtistBySlug, getArtistGallery, getArtistLatestRelease, getArtistShows } from "@/lib/artists";
import { ArtistHero } from "@/components/artist/ArtistHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { CTASection } from "@/components/ui/CTASection";
import { ReleaseCard } from "@/components/music/ReleaseCard";
import { VideoPlayer } from "@/components/home/VideoSection";
import { ShowsList } from "@/components/shows/ShowsList";
import { BandMemberCard } from "@/components/band/BandMemberCard";
import { CollaborationGrid } from "@/components/home/CollaborationGrid";
import { TestimonialCard } from "@/components/home/TestimonialCard";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { bookingHref } from "@/lib/nav";

export function generateStaticParams() {
  return getAllArtistSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/artists/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) return {};
  return {
    title: artist.name,
    description: artist.shortBio,
    openGraph: {
      title: `${artist.name} — Official Website`,
      description: artist.shortBio,
      images: [{ url: artist.ogImage }],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: artist.name,
      description: artist.shortBio,
      images: [artist.ogImage],
    },
    alternates: { canonical: `/artists/${artist.slug}` },
  };
}

export default async function ArtistHomePage({ params }: PageProps<"/artists/[slug]">) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) notFound();

  const latestRelease = getArtistLatestRelease(slug);
  const featuredVideo = artist.videos.find((v) => v.featured) ?? artist.videos[0];
  const upcomingShows = getArtistShows(slug, { upcomingOnly: true }).slice(0, 3);
  const galleryPreview = getArtistGallery(slug).slice(0, 6);
  const bandPreview = getArtistBand(slug).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: artist.name,
    genre: artist.genre,
    url: `https://wavelength-artists-demo.vercel.app/artists/${artist.slug}`,
    image: artist.ogImage,
    description: artist.shortBio,
    sameAs: Object.values(artist.socialLinks).filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ArtistHero artist={artist} />

      {latestRelease ? (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal>
            <SectionHeading eyebrow="New Release" title="Latest Release" />
          </Reveal>
          <Reveal delay={0.1} className="mt-10 max-w-xs sm:max-w-sm">
            <ReleaseCard release={latestRelease} priority />
          </Reveal>
        </section>
      ) : null}

      {featuredVideo ? (
        <section id="watch" className="border-t border-border-subtle bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <Reveal>
              <SectionHeading eyebrow="Featured Performance" title="Watch Live" align="center" className="mx-auto" />
            </Reveal>
            <Reveal delay={0.1} className="mx-auto mt-10 max-w-4xl">
              <VideoPlayer video={featuredVideo} />
            </Reveal>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Live Dates" title="Upcoming Shows" />
          <Link
            href={`/artists/${artist.slug}/shows`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-bronze-300 hover:text-bronze-200"
          >
            View All Shows <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
        <Reveal delay={0.1} className="mt-8">
          <ShowsList shows={upcomingShows} emptyLabel="No upcoming shows announced right now — check back soon." />
        </Reveal>
      </section>

      <section className="border-t border-border-subtle bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 md:grid-cols-2 md:items-center md:gap-16">
          <Reveal className="relative aspect-[4/5] overflow-hidden rounded-lg">
            <Image
              src={artist.aboutImage}
              alt={`${artist.name} editorial portrait`}
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal delay={0.15}>
            <SectionHeading eyebrow="About" title={`Meet ${artist.name}`} />
            <p className="mt-5 text-base leading-relaxed text-muted">{artist.shortBio}</p>
            <ul className="mt-6 space-y-2">
              {artist.careerHighlights.slice(0, 3).map((h) => (
                <li key={h.id} className="flex gap-2.5 text-sm text-foreground/85">
                  <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-bronze-400" />
                  {h.label}
                </li>
              ))}
            </ul>
            <Button href={`/artists/${artist.slug}/about`} variant="secondary" className="mt-8">
              Discover the Artist
            </Button>
          </Reveal>
        </div>
      </section>

      {galleryPreview.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Photography" title="Gallery" />
            <Link
              href={`/artists/${artist.slug}/gallery`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-bronze-300 hover:text-bronze-200"
            >
              View Gallery <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {galleryPreview.map((img) => (
              <div key={img.id} className="relative aspect-square overflow-hidden rounded-md bg-surface">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover transition duration-500 hover:scale-[1.03]"
                />
              </div>
            ))}
          </Reveal>
        </section>
      ) : null}

      {bandPreview.length > 0 ? (
        <section className="border-t border-border-subtle bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow="Live Band" title="The Band" />
              <Link
                href={`/artists/${artist.slug}/band`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-bronze-300 hover:text-bronze-200"
              >
                Meet the Band <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
            <Reveal delay={0.1} className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {bandPreview.map((m) => (
                <BandMemberCard key={m.id} member={m} />
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      {artist.collaborations.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal>
            <SectionHeading eyebrow="Credibility" title="Brands &amp; Collaborations" align="center" className="mx-auto" />
          </Reveal>
          <Reveal delay={0.1} className="mt-10">
            <CollaborationGrid collaborations={artist.collaborations} />
          </Reveal>
        </section>
      ) : null}

      {artist.testimonials.length > 0 ? (
        <section className="border-t border-border-subtle bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <Reveal>
              <SectionHeading eyebrow="Client Feedback" title="Testimonials" align="center" className="mx-auto" />
            </Reveal>
            <Reveal delay={0.1} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {artist.testimonials.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      {artist.instagramFeed.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal>
            <SectionHeading eyebrow="Social" title="Latest from Instagram" align="center" className="mx-auto" />
          </Reveal>
          <Reveal delay={0.1} className="mt-10">
            <InstagramFeed posts={artist.instagramFeed} handle={artist.instagramHandle} />
          </Reveal>
        </section>
      ) : null}

      <CTASection
        eyebrow="Booking"
        title={`Book ${artist.name}`}
        description="Available for concerts, weddings, corporate events, festivals, clubs, colleges, private events, and brand events."
      >
        <Button href={bookingHref(artist.slug)}>Send Booking Enquiry</Button>
        <Button href={`/artists/${artist.slug}/press`} variant="secondary">
          View Press Kit
        </Button>
      </CTASection>
    </>
  );
}
