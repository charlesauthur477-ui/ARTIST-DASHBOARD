import Link from "next/link";
import type { Artist } from "@/types/artist";
import { ARTIST_NAV, artistHomeHref, bookingHref } from "@/lib/nav";
import { SocialLinks } from "@/components/ui/SocialLinks";

export function ArtistFooter({ artist }: { artist: Artist }) {
  return (
    <footer className="border-t border-border-subtle bg-background">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href={artistHomeHref(artist.slug)} className="font-display text-2xl">
              {artist.name}
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{artist.shortBio}</p>
            <SocialLinks links={artist.socialLinks} className="mt-6" />
          </div>

          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">Explore</p>
            <ul className="mt-4 space-y-3">
              {ARTIST_NAV.map((item) => (
                <li key={item.label}>
                  <Link href={item.href(artist.slug)} className="text-sm text-foreground/80 hover:text-bronze-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">Bookings</p>
            <ul className="mt-4 space-y-3 text-sm text-foreground/80">
              <li>
                <Link href={bookingHref(artist.slug)} className="hover:text-bronze-300">
                  Send a Booking Enquiry
                </Link>
              </li>
              {artist.contactInformation.bookings.email ? (
                <li>
                  <a
                    href={`mailto:${artist.contactInformation.bookings.email}`}
                    className="hover:text-bronze-300 break-all"
                  >
                    {artist.contactInformation.bookings.email}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border-subtle pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {artist.name}. All rights reserved.
          </p>
          <p>Site by Wavelength Artist Management · Demo content for development purposes</p>
        </div>
      </div>
    </footer>
  );
}
