/**
 * Hub-level Service Worker — root scope (`/`).
 *
 * Per-event SWs (e.g. /cho-tsukuyomi-2026-05/sw.js) are registered with
 * narrower scope and override this one for their sub-tree. This SW only
 * controls the hub shell (`/`, `/circles/`, `/review/`) and shared assets
 * directly under root (hub.js, hub.css, profile-patterns.js, platform-icons.js,
 * circles.js, app.js, etc.).
 *
 * Strategy:
 *   - network-first for same-origin (so updates flow without manual cache clear)
 *   - cache-first for cross-origin (CDN icons, fonts) so revisits stay snappy
 *   - precache the hub shell on install so the offline first-paint works even
 *     when the user installs the PWA without visiting circles/ first
 */
const CACHE_NAME = 'hub-cache-v1';

// Hub-page shell — precached on install so first offline visit shows the
// landing page even before any sub-page is opened.
const HUB_SHELL = [
  './',
  './index.html',
  './hub.css',
  './hub.js',
  './icon.svg',
  './manifest.webmanifest',
  './events.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Skip individual failures — some assets (e.g. cache-busted ?v= URLs)
    // may 404 if the version bumped between install and runtime.
    await Promise.allSettled(HUB_SHELL.map(u => cache.add(u)));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Drop older hub caches (keep per-event caches intact).
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k.startsWith('hub-cache-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // Network-first: try fresh, fall back to cache when offline. Mutates
    // cache on every successful fetch so future offline visits get the
    // latest version we ever saw online.
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request);
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, fresh.clone()).catch(() => {});
        }
        return fresh;
      } catch (e) {
        const cached = await caches.match(event.request, { ignoreSearch: true });
        if (cached) return cached;
        return new Response('Offline and not cached', { status: 504, statusText: 'Gateway Timeout' });
      }
    })());
  } else {
    // Cache-first for cross-origin (CDN icons / X images). Opaque responses
    // are fine — they show but can't be inspected, which is the standard PWA
    // pattern for third-party assets.
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((resp) => {
          // Cache opaque + ok responses for next time
          if (resp) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone)).catch(() => {});
          }
          return resp;
        }).catch(() => {
          return new Response('Offline and not cached', { status: 504, statusText: 'Gateway Timeout' });
        });
      })
    );
  }
});
