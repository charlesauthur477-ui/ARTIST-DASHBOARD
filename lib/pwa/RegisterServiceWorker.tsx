"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js once, client-side, when either the Artist or Admin
 * portal layout mounts. Rendered from app/artist/layout.tsx and
 * app/admin/layout.tsx only — the public marketing site never renders
 * this, so it never registers a service worker and is never offered
 * "Add to Home Screen" via a worker-driven install prompt.
 *
 * Renders nothing. Fails silently (old browser, disabled SW, etc.) since
 * the app must work identically with or without the worker installed.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Non-fatal: the app works fully without the service worker.
    });
  }, []);

  return null;
}
