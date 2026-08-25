import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { PreviewBanner } from "@/components/PreviewBanner";

// NOTE on fonts: this project targets next/font/google (Playfair Display +
// Inter) for the premium editorial look described in the brief. Some build
// sandboxes (including the one this project was scaffolded in) block
// outbound requests to fonts.googleapis.com, which makes next/font/google
// fail at build time. To keep `npm run build` reliable everywhere — including
// offline/CI environments — this file ships with a high-quality system font
// stack instead. To restore the original Google fonts, see README.md →
// "Restoring Google Fonts", it's a ~5 line change back to next/font/google.

export const metadata: Metadata = {
  metadataBase: new URL("https://wavelength-artists-demo.vercel.app"),
  title: {
    default: "Wavelength Artist Management",
    template: "%s | Wavelength Artist Management",
  },
  description:
    "Premium multi-artist website platform — official artist websites, digital press kits, and booking for professionally managed touring musicians.",
};

export const viewport: Viewport = {
  themeColor: "#0b0a09",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <PreviewBanner />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
