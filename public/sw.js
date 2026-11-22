const CACHE_VERSION = 'nijama-mosama-v1';
const SHELL_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icon-192.svg',
  '/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Network-first for API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({
            error: 'Offline',
            offline: true,
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );
    return;
  }

  // Navigation requests: try network, fall back to cached shell or /offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/', clone));
          return response;
        })
        .catch(() =>
          caches.match('/').then((cached) => cached || caches.match('/offline.html')),
        ),
    );
    return;
  }

  // Cache-first for static same-origin assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
  }
});
