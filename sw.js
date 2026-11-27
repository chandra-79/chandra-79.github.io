// Online web play: never retain a playable offline release.
// Keep a worker so existing installations migrate safely without touching saved progress.
const CACHE = 'ziggle-2.76.0';
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      for (const key of await caches.keys()) if (key.startsWith('ziggle-')) await caches.delete(key).catch(() => {});
    } catch { /* Network play must still activate when browser cache storage is unavailable. */ }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  // APIs, other origins and non-GET requests keep their normal privacy/network behavior.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  // Versioned scripts and styles (/v/<release>/...) never change under their name: let the browser keep them without asking.
  if (url.pathname.startsWith('/v/')) return;
  // Revalidate even browser-cached assets; connection errors must never revive an old puzzle.
  event.respondWith(fetch(request, { cache: 'no-cache' }));
});
