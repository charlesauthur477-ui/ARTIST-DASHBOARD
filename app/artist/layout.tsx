import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "@/lib/pwa/RegisterServiceWorker";

// ---------------------------------------------------------------------------
// PWA-readiness for the Artist Portal only — scoped to /artist/* via a
// layout at this level (NOT the (portal) route group), so it wraps both
// /artist/login and every authenticated page without adding any auth logic
// of its own. The (portal) group's own layout still does 100% of the
// session/redirect work — this file is pure metadata plus registering the
// (strictly public-assets-only) service worker, nothing else.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: { default: "Wavelength Artist Portal", template: "%s | Wavelength Artist Portal" },
  manifest: "/manifest-artist.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Wavelength",
    statusBarStyle: "black-translucent",
  },
};

export default function ArtistRootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <RegisterServiceWorker />
      {children}
    </>
  );
}
