// Minimal service worker for PWA installability over HTTP (e.g. iPad home screen). No caching.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
