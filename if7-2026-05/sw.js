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
const CACHE_NAME = 'event-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only intercept same-origin GET requests; cross-origin (X CDN) handled the
  // same way via Cache.match so cached assets work offline.
  if (event.request.method !== 'GET') return;
  event.respondWith(
    // ignoreSearch:true so cache-bust params like `app.js?v=12345` still
    // match the clean `app.js` we pre-cached. Trade-off: once cached,
    // assets won't update until the user toggles offline mode OFF→ON.
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        // If offline and not cached, surface a generic 504 so the page
        // can show its fallback (image onerror, etc.)
        return new Response('Offline and not cached', { status: 504, statusText: 'Gateway Timeout' });
      });
    })
  );
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
