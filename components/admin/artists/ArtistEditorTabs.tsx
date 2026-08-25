"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const TABS = [
  { href: "", label: "Overview" },
  { href: "/profile", label: "Profile" },
  { href: "/photos", label: "Photos" },
  { href: "/music", label: "Music" },
  { href: "/videos", label: "Videos" },
  { href: "/shows", label: "Shows" },
  { href: "/band", label: "Band" },
  { href: "/performance", label: "Performance" },
  { href: "/press", label: "Press" },
  { href: "/social", label: "Social" },
  { href: "/booking", label: "Booking" },
  { href: "/seo", label: "SEO" },
  { href: "/publishing", label: "Publishing" },
];

export function ArtistEditorTabs({ artistId }: { artistId: string }) {
  const pathname = usePathname();
  const base = `/admin/artists/${artistId}`;

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-[var(--admin-border)]">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.href}
            href={href}
            className={clsx(
              "shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium",
              active ? "border-[var(--admin-primary)] text-[var(--admin-primary)]" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
