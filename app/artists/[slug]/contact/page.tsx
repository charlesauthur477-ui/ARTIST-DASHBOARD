import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { getAllArtistSlugs, getArtistBySlug } from "@/lib/artists";
import { PageHero } from "@/components/ui/PageHero";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { Button } from "@/components/ui/Button";
import { bookingHref } from "@/lib/nav";
import type { ContactChannel } from "@/types/artist";

export function generateStaticParams() {
  return getAllArtistSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/artists/[slug]/contact">): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) return {};
  return {
    title: `Contact | ${artist.name}`,
    description: `Contact information for ${artist.name}.`,
    alternates: { canonical: `/artists/${artist.slug}/contact` },
  };
}

function ContactCard({ channel }: { channel: ContactChannel }) {
  return (
    <div className="rounded-lg border border-border-subtle p-6">
      <h3 className="font-display text-lg text-foreground">{channel.label}</h3>
      <div className="mt-3 space-y-2 text-sm">
        {channel.email ? (
          <a href={`mailto:${channel.email}`} className="flex items-center gap-2 text-foreground/85 hover:text-bronze-300 break-all">
            <Mail className="h-4 w-4 flex-shrink-0" />
            {channel.email}
          </a>
        ) : null}
        {channel.phone ? (
          <a href={`tel:${channel.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2 text-foreground/85 hover:text-bronze-300">
            <Phone className="h-4 w-4 flex-shrink-0" />
            {channel.phone}
          </a>
        ) : null}
        {!channel.email && !channel.phone ? <p className="text-muted">Available on request.</p> : null}
      </div>
    </div>
  );
}

export default async function ContactPage({ params }: PageProps<"/artists/[slug]/contact">) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) notFound();

  const { contactInformation } = artist;

  return (
    <>
      <PageHero eyebrow="Contact" title="Get in Touch" description={`Reach the right team for ${artist.name}.`} />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-5 sm:grid-cols-2">
          <ContactCard channel={contactInformation.bookings} />
          <ContactCard channel={contactInformation.management} />
          <ContactCard channel={contactInformation.press} />
          <ContactCard channel={contactInformation.general} />
        </div>

        <div className="mt-12 flex flex-col items-start gap-6 border-t border-border-subtle pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-medium tracking-[0.2em] text-muted uppercase">Follow</h3>
            <SocialLinks links={artist.socialLinks} className="mt-3" />
          </div>
          <Button href={bookingHref(artist.slug)}>Send Booking Enquiry</Button>
        </div>
      </section>
    </>
  );
}
