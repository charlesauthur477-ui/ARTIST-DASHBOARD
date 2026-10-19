// ---------------------------------------------------------------------------
// Wavelength service worker — installability + a clean offline fallback only.
// This is NOT a full offline app. Deliberately dependency-free (no Workbox).
//
// STRICT CACHING ALLOWLIST — do not widen this without re-reading the intent
// below. Everything NOT matched by isCacheableStaticAsset() is passed
// straight to the network, uncached, every time:
//
//   - Never cached: any /api/* route, any /admin/* or /artist/* page
//     (HTML/RSC payload), any authentication response, any response that
//     could contain private artist or booking data.
//   - Cached: only build-hashed Next.js static assets (/_next/static/*),
//     the app icons, the two web app manifests, and the offline fallback
//     page itself. All content-addressed or hand-controlled, all public.
//
// Registered only from the artist and admin layouts (see registerServiceWorker
// in lib/pwa/registerServiceWorker.ts) — the public marketing site does not
// register this worker at all.
// ---------------------------------------------------------------------------

const CACHE_NAME = "wavelength-static-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest-artist.webmanifest",
  "/manifest-admin.webmanifest",
  "/icons/artist-icon-192.png",
  "/icons/artist-icon-512.png",
  "/icons/admin-icon-192.png",
  "/icons/admin-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

/**
 * Only Next.js's content-hashed build assets and our own hand-controlled
 * public files are ever cacheable. Anything under /api/, /admin/, or
 * /artist/ — or any other path — falls through to "network, no cache".
 */
function isCacheableStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  const path = url.pathname;
  if (path.startsWith("/_next/static/")) return true;
  if (path.startsWith("/icons/")) return true;
  if (path === "/manifest-artist.webmanifest" || path === "/manifest-admin.webmanifest") return true;
  if (path === OFFLINE_URL) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never intercept mutations

  const url = new URL(request.url);

  // Page navigations: always go to the network first so admins/artists
  // always see live, current, authenticated content. Only on a genuine
  // network failure do we show the offline fallback — we never serve a
  // cached copy of a private page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((res) => res || Response.error()))
    );
    return;
  }

  if (!isCacheableStaticAsset(url)) {
    // Explicitly NOT handled here: /api/*, admin/artist data requests,
    // auth responses. Let the browser do its normal network fetch.
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
