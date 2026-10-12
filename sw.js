const SHELL_CACHE = 'saffres-shell-57ed17f57a';
const IMG_CACHE = 'saffres-img-d076710bed';
const SHELL = ["./", "index.html", "app.js", "style.css", "data.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k.startsWith('saffres-') && k !== SHELL_CACHE && k !== IMG_CACHE) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.includes('/img/')) {
    e.respondWith((async () => {
      const hit = await caches.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) (await caches.open(IMG_CACHE)).put(e.request, res.clone());
      return res;
    })());
    return;
  }

  // App shell: serve from cache, refresh in the background.
  e.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const key = e.request.mode === 'navigate' ? 'index.html' : e.request;
    const hit = await cache.match(key, { ignoreSearch: true });
    const net = fetch(e.request).then((res) => {
      if (res.ok && e.request.mode !== 'navigate') cache.put(e.request, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  })());
});
