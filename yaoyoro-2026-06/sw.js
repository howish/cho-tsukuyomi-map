/**
 * Service Worker — offline mode for a single event.
 *
 * Scope: /<event-slug>/ — registered by app.js per event page.
 *
 * Cache strategy:
 *   - Versioned cache name: 'event-cache-v1'
 *   - 'install' event: skip waiting so new SW activates immediately
 *   - 'activate' event: claim clients
 *   - 'message' event with action='cache-event': pre-fetch and store
 *     all URLs in `payload.urls` into the named cache, posting progress
 *     back to the requesting client.
 *   - 'message' with action='clear-event': delete the cache entirely
 *   - 'fetch' event: serve from cache if present, else fall through to
 *     the network. (Cache-first for offline resilience.)
 */
// Bump this to force previously-offlined clients to drop the old cache on
// next activate (the activate handler deletes any cache whose name doesn't
// match CACHE_NAME). Increment whenever the shell schema changes in a way
// that the old cache would obscure (e.g. new map_image field, renamed JS).
const CACHE_NAME = 'event-cache-v4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Drop any older caches so previously-offlined users get fresh shell on
  // next visit (otherwise cache-first below would keep serving stale assets).
  // Then force-navigate any controlled clients to reload — the current page
  // loaded under the old SW so its app.js + map.jpg are still stale; only
  // a navigation makes the new SW actually serve them. Without this, users
  // are stuck until they manually hard-refresh.
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => { try { c.navigate(c.url); } catch (e) {} });
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  // Same-origin shell files (HTML/JS/CSS/JSON/map images) → network-first so
  // updates flow without manual cache toggle. Cross-origin (X CDN, Plurk
  // images, etc.) → cache-first so offline use stays snappy.
  if (isSameOrigin) {
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
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).catch(() => {
          return new Response('Offline and not cached', { status: 504, statusText: 'Gateway Timeout' });
        });
      })
    );
  }
});

self.addEventListener('message', async (event) => {
  const { action, payload } = event.data || {};
  const client = event.source;
  if (action === 'cache-event') {
    const urls = (payload && payload.urls) || [];
    const total = urls.length;
    let done = 0;
    let failed = 0;
    try {
      const cache = await caches.open(CACHE_NAME);
      // Fetch in small batches to avoid burst rate-limits
      const concurrency = 6;
      const queue = urls.slice();
      const workers = Array.from({ length: concurrency }, async () => {
        while (queue.length) {
          const url = queue.shift();
          try {
            // Cross-origin images need no-cors mode (opaque response cached)
            const isCrossOrigin = /^https?:\/\//.test(url) && !url.startsWith(self.location.origin);
            const req = new Request(url, { mode: isCrossOrigin ? 'no-cors' : 'cors', credentials: 'omit' });
            const resp = await fetch(req);
            await cache.put(req, resp.clone());
            done++;
          } catch (e) {
            failed++;
          }
          if (client) client.postMessage({ event: 'cache-progress', done, failed, total });
        }
      });
      await Promise.all(workers);
      if (client) client.postMessage({ event: 'cache-done', done, failed, total });
    } catch (e) {
      if (client) client.postMessage({ event: 'cache-error', message: String(e) });
    }
  } else if (action === 'clear-event') {
    try {
      await caches.delete(CACHE_NAME);
      if (client) client.postMessage({ event: 'cache-cleared' });
    } catch (e) {
      if (client) client.postMessage({ event: 'cache-error', message: String(e) });
    }
  }
});
