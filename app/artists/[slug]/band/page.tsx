import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArtistSlugs, getArtistBand, getArtistBySlug, getArtistPerformanceFormats } from "@/lib/artists";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BandMemberCard } from "@/components/band/BandMemberCard";
import { PerformanceFormatCard } from "@/components/band/PerformanceFormatCard";
import { CTASection } from "@/components/ui/CTASection";
import { Button } from "@/components/ui/Button";
import { bookingHref } from "@/lib/nav";

export function generateStaticParams() {
  return getAllArtistSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/artists/[slug]/band">): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) return {};
  return { title: `The Band | ${artist.name}`, description: `Meet the musicians who perform live with ${artist.name}.` };
}

export default async function BandPage({ params }: PageProps<"/artists/[slug]/band">) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) notFound();

  const band = getArtistBand(slug);
  const formats = getArtistPerformanceFormats(slug);

  return (
    <>
      <PageHero eyebrow="Live Band" title="The Live Band" description={`The musicians behind every ${artist.name} performance.`} />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        {band.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {band.map((m, i) => (
              <BandMemberCard key={m.id} member={m} priority={i < 2} />
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border-subtle px-6 py-16 text-center text-sm text-muted">
            Band lineup coming soon.
          </p>
        )}
      </section>

      {formats.length > 0 ? (
        <section className="border-t border-border-subtle bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <SectionHeading eyebrow="Formats" title="Performance Formats" description="From an intimate solo set to a full concert production — every format is built around the event." />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {formats.map((f) => (
                <PerformanceFormatCard key={f.id} format={f} />
              ))}
            </div>
            <p className="mt-8 text-sm text-muted">{artist.bookingSettings.enquiryNote}.</p>
          </div>
        </section>
      ) : null}

      <CTASection title="Ready to book the band?" description="Tell us about your event and we'll recommend the right format.">
        <Button href={bookingHref(artist.slug)}>Send Booking Enquiry</Button>
      </CTASection>
    </>
  );
}
