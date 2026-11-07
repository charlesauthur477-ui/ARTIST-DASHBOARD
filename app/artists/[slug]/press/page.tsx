import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { getAllArtistSlugs, getArtistBySlug } from "@/lib/artists";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { CTASection } from "@/components/ui/CTASection";
import { bookingHref } from "@/lib/nav";

export async function generateStaticParams() {
  return (await getAllArtistSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/artists/[slug]/press">): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return {};
  return {
    title: `Press Kit | ${artist.name}`,
    description: artist.pressKit.shortBio,
    alternates: { canonical: `/artists/${artist.slug}/press` },
  };
}

export default async function PressPage({ params }: PageProps<"/artists/[slug]/press">) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const { pressKit } = artist;

  return (
    <>
      <PageHero eyebrow="Press / EPK" title="Press Kit" description={pressKit.shortBio} />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex flex-col gap-6 rounded-lg border border-border-subtle p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="font-display text-2xl">Electronic Press Kit</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Biography, career highlights, press photography, and contact information — packaged for media,
              promoters, and event organizers.
            </p>
          </div>
          <Button href={pressKit.downloadUrl} external icon={<Download className="h-4 w-4" />}>
            Download Press Kit
          </Button>
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <SectionHeading eyebrow="Biography" title="Full Biography" />
            {pressKit.bio.split("\n\n").map((p, i) => (
              <p key={i} className="mt-4 text-sm leading-relaxed text-foreground/85 sm:text-base">
                {p}
              </p>
            ))}
          </div>
          <div>
            <SectionHeading eyebrow="Highlights" title="Career Highlights" />
            <ul className="mt-4 space-y-3">
              {artist.careerHighlights.map((h) => (
                <li key={h.id} className="flex gap-3 text-sm text-foreground/85 sm:text-base">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-bronze-400" />
                  {h.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {pressKit.pressPhotos.length > 0 ? (
          <div className="mt-16">
            <SectionHeading eyebrow="Photography" title="Press Photos" />
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {pressKit.pressPhotos.map((photo) => (
                <div key={photo} className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface">
                  <Image src={photo} alt={`${artist.name} press photo`} fill sizes="(min-width: 640px) 25vw, 50vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-16 rounded-xl border border-border-subtle bg-surface/50 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SectionHeading eyebrow="Production" title="Technical Rider & Stage Plot" />
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                Official live performance specifications, sound reinforcement requirements, 10-channel input patch list, and visual stage plot schematic for venue audio engineers and event producers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button href={`/artists/${artist.slug}/press/tech-rider`} external icon={<Download className="h-4 w-4" />}>
                Technical Rider (PDF)
              </Button>
              <Button href={`/artists/${artist.slug}/press/stage-plot`} external variant="secondary" icon={<Download className="h-4 w-4" />}>
                Stage Plot (PDF)
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <SectionHeading eyebrow="Contact" title="Press Enquiries" />
          <p className="mt-4 text-sm text-foreground/85 sm:text-base">
            {artist.contactInformation.press.email ? (
              <a href={`mailto:${artist.contactInformation.press.email}`} className="text-bronze-300 hover:text-bronze-200">
                {artist.contactInformation.press.email}
              </a>
            ) : (
              "Contact information available on request."
            )}
          </p>
        </div>
      </section>

      <CTASection title={`Book ${artist.name}`} description="Available for concerts, weddings, corporate events, festivals, clubs, colleges, private events, and brand events.">
        <Button href={bookingHref(artist.slug)}>Send Booking Enquiry</Button>
      </CTASection>
    </>
  );
}
