import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "@/lib/pwa/RegisterServiceWorker";

// ---------------------------------------------------------------------------
// PWA-readiness for the Admin Portal only — scoped to /admin/* via a layout
// at this level (NOT the (dashboard) route group), mirroring
// app/artist/layout.tsx exactly. Wraps both /admin/login and every
// authenticated page without adding any auth logic of its own — the
// (dashboard) group's own layout still does 100% of the requireAdmin()/
// redirect work. This file is pure metadata, nothing else.
//
// This manifest is intentionally never linked from the root app/layout.tsx,
// so the public marketing site is never offered as installable, and an
// anonymous visitor to the public site is never shown "Install Wavelength
// Admin" — only someone who has navigated into /admin/* gets this metadata.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: { default: "Wavelength Admin", template: "%s | Wavelength Admin" },
  manifest: "/manifest-admin.webmanifest",
  appleWebApp: {
    capable: true,
    title: "WL Admin",
    statusBarStyle: "black-translucent",
  },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <RegisterServiceWorker />
      {children}
    </>
  );
}
