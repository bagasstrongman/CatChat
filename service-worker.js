// service-worker.js
const CACHE_NAME = 'cat-pwa-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/fakeGrokAI.js',
  '/manifest.json'
];

self.addEventListener('install', (evt) => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    caches.match(evt.request).then((resp) => {
      return resp || fetch(evt.request).catch(() => {
        // fallback minimal jika offline dan bukan cached
        if (evt.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
