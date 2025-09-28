const CACHE_NAME = 'gistreeview-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/images/logo/logo.png',
  '/images/logo/logo-dark.png',
  '/images/logo/logo-icon.png',
  '/icons/map.svg',
  '/icons/report.svg',
  '/icons/admin.svg',
  '/icons/officer.svg',
  '/icons/user.svg',
];

// Install service worker and cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Serve cached content when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});