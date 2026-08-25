export const platform = {
  name: "Wavelength Artist Management",
  tagline: "Premium representation for professional touring musicians.",
  description:
    "We manage a small, curated roster of professional touring artists — handling bookings, press, and live production so every show is ready for serious clients.",
  // No platform-level hero image yet — null until one is uploaded through
  // the admin Photos system. app/page.tsx only renders the <Image> when
  // this is set, so it never requests a file that doesn't exist.
  heroImage: null as string | null,
  contactEmail: "hello@wavelength-demo.com",
};
