import type { Metadata } from "next";
import Link from "next/link";
import { platform } from "@/data/platform";
import { ApplicationWizard } from "@/components/application/ApplicationWizard";

export const metadata: Metadata = {
  title: "Artist Press Kit | Artist Onboarding",
  description: "Submit your artist information, music, photography and booking details.",
  alternates: { canonical: "/apply" },
};

export default function ApplyPage() {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
          <Link href="/" className="font-display text-lg tracking-wide text-foreground sm:text-xl">
            {platform.name}
          </Link>
          <Link href="/" className="text-sm text-foreground/70 hover:text-bronze-300">
            Cancel
          </Link>
        </div>
      </header>

      <section className="border-b border-border-subtle bg-surface/30">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs font-medium tracking-[0.25em] text-bronze-300 uppercase">Artist Onboarding</p>
          <h1 className="font-display text-balance mt-3 text-3xl leading-tight sm:text-5xl">Artist Press Kit</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Help us build your artist profile. We&rsquo;ll use the information and media you provide to create your
            professional artist profile, press kit and booking page.
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
            This should take about 10–15 minutes. Your answers are saved as a draft in this browser as you go, so
            it&rsquo;s safe to step away and come back. Nothing you submit is shared publicly without our team
            reviewing it first.
          </p>
        </div>
      </section>

      <div className="flex-1 py-10 sm:py-14">
        <ApplicationWizard />
      </div>
    </div>
  );
}
