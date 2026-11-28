// In a browser tab Ziggle is played online: nothing is kept, and a lost connection never revives an old puzzle.
// Once Ziggle is installed (Home Screen or app window) the page asks this worker to keep the games on the device,
// so they open without a connection (2.87). Saved progress is never touched here.
const CACHE = 'ziggle-2.91.3';
const OFFLINE = CACHE.replace('ziggle-', 'ziggle-offline-'), READY = '/offline-ready', LIST = '/play/offline-files.json';
// The kept release's asset token (/v/<token>/...), or '' while nothing is kept. Set once the whole release is on the device.
let kept = '';
const readKept = async () => { try { const mark = await caches.match(READY, { cacheName: OFFLINE }); kept = mark ? await mark.text() : ''; } catch { kept = ''; } return kept; };
let starting = readKept();
async function keepRelease() {
  const list = await (await fetch(LIST, { cache: 'reload' })).json();
  const cache = await caches.open(OFFLINE);
  try {
    let token = 'plain';
    // A few at a time: gentle on a phone, and one missing file stops the lot so a half release is never used.
    for (let at = 0; at < list.length; at += 8) await Promise.all(list.slice(at, at + 8).map(async path => {
      const response = await fetch(path, { cache: 'reload' });
      if (!response.ok) throw new Error(`offline copy: ${path} ${response.status}`);
      if (path === '/index.html') token = (await response.clone().text()).match(/\/v\/([0-9a-f]+)\/play\//)?.[1] || 'plain';
      await cache.put(path, response);
    }));
    await cache.put(READY, new Response(token));
    kept = token;
  } catch (error) { await caches.delete(OFFLINE).catch(() => {}); throw error; }
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    let had = false;
    try { had = (await caches.keys()).some(key => key.startsWith('ziggle-offline-') && key !== OFFLINE); } catch { /* storage blocked: online play only */ }
    // An installed Ziggle moves to the new release whole: if any file cannot be fetched, the old worker and its copy stay.
    if (had) await keepRelease();
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      for (const key of await caches.keys()) if (key.startsWith('ziggle-') && key !== OFFLINE) await caches.delete(key).catch(() => {});
    } catch { /* Network play must still activate when browser cache storage is unavailable. */ }
    await (starting = readKept());
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  // Sent by an installed Ziggle on every start; a browser tab never sends it.
  if (event.data !== 'ziggle-offline') return;
  event.waitUntil((async () => { if (!await readKept()) await keepRelease().catch(() => {}); })());
});
// Where a request lives in the kept release: versioned addresses are stored under their plain name, and only for the kept token.
function keptPath(url) {
  const versioned = url.pathname.match(/^\/v\/([^/]+)(\/.+)$/);
  if (versioned) return versioned[1] === kept ? versioned[2] : '';
  return url.pathname === '/' ? '/index.html' : url.pathname;
}
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  // APIs, other origins and non-GET requests keep their normal privacy/network behavior.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  const versioned = url.pathname.startsWith('/v/');
  // Versioned scripts and styles (/v/<release>/...) never change under their name: let the browser keep them without asking.
  if (versioned && !kept) return;
  event.respondWith((async () => {
    await starting;
    // Revalidate even browser-cached assets; connection errors must never revive an old puzzle.
    const network = versioned ? fetch(request) : fetch(request, { cache: 'no-cache' });
    if (!kept) return network;
    network.catch(() => {});
    // Installed: the network still comes first, the kept release answers only when the connection fails or stalls.
    let timer;
    try {
      return await Promise.race([network, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('slow network')), 4000); })]);
    } catch {
      const path = keptPath(url);
      const copy = path && await caches.match(path, { cacheName: OFFLINE }).catch(() => null);
      if (copy) return copy;
      if (request.mode === 'navigate') { const home = await caches.match('/index.html', { cacheName: OFFLINE }).catch(() => null); if (home) return home; }
      return network;
    } finally { clearTimeout(timer); }
  })());
});
