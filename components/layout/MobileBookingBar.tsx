"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { bookingHref } from "@/lib/nav";

export function MobileBookingBar({ slug, artistName }: { slug: string; artistName: string }) {
  const pathname = usePathname();
  const href = bookingHref(slug);

  if (pathname === href) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:hidden">
      <Link
        href={href}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-bronze-400 px-6 text-sm font-semibold tracking-wide text-[#0b0a09] transition active:bg-bronze-300"
      >
        <CalendarCheck className="h-4 w-4" aria-hidden="true" />
        Book {artistName.split(" ")[0]} Now
      </Link>
    </div>
  );
}
