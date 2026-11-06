"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import {
  Menu,
  X,
  LayoutDashboard,
  User,
  Image as ImageIcon,
  Music,
  Video,
  CalendarDays,
  Users,
  Mic2,
  Newspaper,
  Share2,
  CalendarClock,
  CalendarCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { artistLogoutAction } from "@/lib/artist/authActions";

// ---------------------------------------------------------------------------
// Artist Portal shell — mirrors components/admin/AdminShell.tsx's layout and
// styling (same admin-shell CSS classes/tokens) so the portal reads as part
// of the same product, just scoped to one artist's own data.
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { href: "/artist/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/artist/profile", label: "Profile", icon: User },
  { href: "/artist/photos", label: "Photos", icon: ImageIcon },
  { href: "/artist/music", label: "Music", icon: Music },
  { href: "/artist/videos", label: "Videos", icon: Video },
  { href: "/artist/shows", label: "Shows", icon: CalendarDays },
  { href: "/artist/band", label: "Band", icon: Users },
  { href: "/artist/performance", label: "Performance", icon: Mic2 },
  { href: "/artist/press", label: "Press", icon: Newspaper },
  { href: "/artist/social", label: "Social", icon: Share2 },
  { href: "/artist/availability", label: "Availability", icon: CalendarClock },
  { href: "/artist/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/artist/account", label: "Account", icon: Settings },
];

function isActivePath(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-[var(--admin-primary)] text-white" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ArtistShell({ children, artistName, email }: { children: React.ReactNode; artistName: string; email: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-shell flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] py-5 lg:flex">
        <div className="mb-6 px-4">
          <p className="text-base font-semibold">Artist Portal</p>
        </div>
        <SidebarLinks />
        <div className="mt-auto border-t border-[var(--admin-border)] px-4 pt-4">
          <p className="truncate text-sm font-medium">{artistName}</p>
          <p className="truncate text-xs text-[var(--admin-muted)]">{email}</p>
          <form action={artistLogoutAction} className="mt-3">
            <button type="submit" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[var(--admin-danger)]">
              <LogOut size={16} /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 lg:hidden">
          <p className="text-base font-semibold">Artist Portal</p>
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
        </header>
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex w-72 flex-col bg-[var(--admin-surface)] py-5 shadow-lg">
              <div className="mb-6 flex items-center justify-between px-4">
                <p className="text-base font-semibold">Artist Portal</p>
                <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>
              <SidebarLinks onNavigate={() => setMobileOpen(false)} />
              <div className="mt-auto border-t border-[var(--admin-border)] px-4 pt-4">
                <p className="truncate text-sm font-medium">{artistName}</p>
                <form action={artistLogoutAction} className="mt-3">
                  <button type="submit" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <LogOut size={16} /> Sign out
                  </button>
                </form>
              </div>
            </div>
            <button type="button" className="flex-1 bg-slate-900/40" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          </div>
        ) : null}
        <main className="flex-1 overflow-x-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
