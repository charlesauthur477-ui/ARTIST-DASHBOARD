import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllArtists } from "@/lib/artists";
import { platform } from "@/data/platform";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Our Artists",
  description: platform.description,
  alternates: { canonical: "/" },
};

export default function PlatformHomePage() {
  const artists = getAllArtists();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: platform.name,
    description: platform.description,
    email: platform.contactEmail,
  };

  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <span className="font-display text-lg tracking-wide">{platform.name}</span>
        <a href={`mailto:${platform.contactEmail}`} className="text-sm text-foreground/75 hover:text-bronze-300">
          {platform.contactEmail}
        </a>
      </header>

      <section className="relative flex min-h-[70vh] items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image src={platform.heroImage} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <p className="text-xs font-medium tracking-[0.3em] text-bronze-300 uppercase">Artist Management</p>
          <h1 className="font-display text-balance mt-3 max-w-3xl text-4xl leading-[1.05] text-white sm:text-6xl md:text-7xl">
            {platform.tagline}
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">{platform.description}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <p className="text-xs font-medium tracking-[0.25em] text-bronze-300 uppercase">Roster</p>
          <h2 className="font-display mt-3 text-3xl sm:text-4xl">Our Artists</h2>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {artists.map((artist, i) => (
            <Reveal key={artist.slug} delay={i * 0.08}>
              <Link
                href={`/artists/${artist.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-lg"
              >
                <Image
                  src={artist.heroImage}
                  alt={artist.name}
                  fill
                  sizes="(min-width: 640px) 45vw, 90vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <p className="text-xs font-medium tracking-[0.2em] text-bronze-300 uppercase">{artist.genre}</p>
                  <h3 className="font-display mt-2 text-2xl text-white sm:text-3xl">{artist.name}</h3>
                  <p className="mt-1 text-sm text-white/75">{artist.tagline}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white">
                    Visit Website <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <footer className="border-t border-border-subtle px-4 py-8 text-center text-xs text-muted sm:px-6">
        © {new Date().getFullYear()} {platform.name}. Demo content for development purposes.
      </footer>
    </div>
  );
}
