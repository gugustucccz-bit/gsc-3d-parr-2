/* GSC 3D parr 2 — offline shell.
   Caches the compiler and its vendored 3D engine on first visit, so the site
   keeps working from the Home Screen with no network. */
const CACHE = 'gsc-3d-parr-2-v2';
const ASSETS = [
  './',
  './index.html',
  './site.webmanifest',
  './icon.svg',
  './vendor/three.module.js',
  './vendor/controls/OrbitControls.js',
  './vendor/exporters/GLTFExporter.js',
  './vendor/utils/TextureUtils.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html'))),
    );
    return;
  }

  // Everything else: serve from the cache at once, refresh it in the background,
  // so a new deploy lands on the next visit without any cache bump.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    }),
  );
});
