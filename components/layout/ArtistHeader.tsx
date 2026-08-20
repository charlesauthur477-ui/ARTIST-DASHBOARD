"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ARTIST_NAV, artistHomeHref, bookingHref } from "@/lib/nav";
import { cn } from "@/lib/cn";

export function ArtistHeader({ slug, artistName }: { slug: string; artistName: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu on navigation. Adjusted during render (rather than
  // in a useEffect) per React's guidance for resetting state when a prop
  // changes — avoids an extra render pass from setState-in-effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        scrolled || open ? "bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b border-border-subtle" : "bg-gradient-to-b from-black/50 to-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <Link href={artistHomeHref(slug)} className="font-display text-lg tracking-wide text-foreground sm:text-xl">
          {artistName}
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {ARTIST_NAV.map((item) => {
            const href = item.href(slug);
            const active = pathname === href;
            return (
              <Link
                key={item.label}
                href={href}
                className={cn(
                  "text-sm tracking-wide text-foreground/80 transition hover:text-bronze-300",
                  active && "text-bronze-300"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={bookingHref(slug)}
            className="hidden min-h-10 items-center justify-center rounded-full bg-bronze-400 px-5 py-2.5 text-sm font-semibold tracking-wide text-[#0b0a09] transition hover:bg-bronze-300 md:inline-flex"
          >
            Book Now
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-foreground md:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-border-subtle bg-background md:hidden"
          >
            <ul className="flex flex-col px-4 py-2">
              {ARTIST_NAV.map((item) => (
                <li key={item.label} className="border-b border-border-subtle/60 last:border-none">
                  <Link
                    href={item.href(slug)}
                    className="flex min-h-12 items-center text-base text-foreground/90 hover:text-bronze-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="px-4 pb-6 pt-2">
              <Link
                href={bookingHref(slug)}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-bronze-400 text-sm font-semibold tracking-wide text-[#0b0a09]"
              >
                Book Now
              </Link>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
