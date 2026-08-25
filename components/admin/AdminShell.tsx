"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { Menu, X, LayoutDashboard, Inbox, Users, ImageIcon, Activity, LogOut } from "lucide-react";
import type { AdminRole } from "@/lib/admin/permissions";
import { roleLabel } from "@/lib/admin/permissions";
import { logoutAction } from "@/app/admin/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/applications", label: "Applications", icon: Inbox },
  { href: "/admin/artists", label: "Artists", icon: Users },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/activity", label: "Activity", icon: Activity },
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

export function AdminShell({
  children,
  userName,
  userEmail,
  role,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  role: AdminRole;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-shell flex min-h-screen">
      {/* Desktop sidebar (fixed, ~1280px+) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] py-5 lg:flex">
        <div className="mb-6 px-4">
          <p className="text-base font-semibold">Wavelength Admin</p>
        </div>
        <SidebarLinks />
        <div className="mt-auto border-t border-[var(--admin-border)] px-4 pt-4">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="truncate text-xs text-[var(--admin-muted)]">{userEmail}</p>
          <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{roleLabel(role)}</p>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[var(--admin-danger)]"
            >
              <LogOut size={16} /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile/tablet: top bar + slide-over drawer */}
      <div className="flex flex-1 flex-col lg:hidden">
        <header className="flex items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
          <p className="text-base font-semibold">Wavelength Admin</p>
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
        </header>
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 flex">
            <div className="w-72 flex-col bg-[var(--admin-surface)] py-5 shadow-lg flex">
              <div className="mb-6 flex items-center justify-between px-4">
                <p className="text-base font-semibold">Wavelength Admin</p>
                <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>
              <SidebarLinks onNavigate={() => setMobileOpen(false)} />
              <div className="mt-auto border-t border-[var(--admin-border)] px-4 pt-4">
                <p className="truncate text-sm font-medium">{userName}</p>
                <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{roleLabel(role)}</p>
                <form action={logoutAction} className="mt-3">
                  <button type="submit" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <LogOut size={16} /> Sign out
                  </button>
                </form>
              </div>
            </div>
            <button
              type="button"
              className="flex-1 bg-slate-900/40"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
          </div>
        ) : null}
        <main className="flex-1 overflow-x-auto p-4">{children}</main>
      </div>

      {/* Desktop content area */}
      <main className="hidden flex-1 overflow-x-auto p-8 lg:block">{children}</main>
    </div>
  );
}
