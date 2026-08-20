export interface NavItem {
  label: string;
  href: (slug: string) => string;
}

export const ARTIST_NAV: NavItem[] = [
  { label: "About", href: (slug) => `/artists/${slug}/about` },
  { label: "Music", href: (slug) => `/artists/${slug}/music` },
  { label: "Shows", href: (slug) => `/artists/${slug}/shows` },
  { label: "Gallery", href: (slug) => `/artists/${slug}/gallery` },
  { label: "Band", href: (slug) => `/artists/${slug}/band` },
  { label: "Press", href: (slug) => `/artists/${slug}/press` },
  { label: "Contact", href: (slug) => `/artists/${slug}/contact` },
];

export function bookingHref(slug: string) {
  return `/artists/${slug}/booking`;
}

export function artistHomeHref(slug: string) {
  return `/artists/${slug}`;
}
