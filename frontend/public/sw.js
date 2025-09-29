const CACHE_NAME = 'gistreeview-cache-v2';
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

// Install service worker and cache static assets (best-effort)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((err) => {
        // If some asset fails to cache, don't block installation.
        console.warn('SW install: cache.addAll failed', err);
      })
  );
  // Activate worker immediately so we can control clients sooner
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches and take control of clients immediately
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
          return Promise.resolve();
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Handle navigation requests (SPA): try network first, fallback to cached index.html
  const isNavigation = req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'));

  if (isNavigation) {
    // For navigations, prefer the cached index.html so the SPA can boot even if network
    // returns a 404. Then try to update cache in background.
    event.respondWith(
      caches.match('/index.html').then((cachedIndex) => {
        if (cachedIndex) {
          // In parallel, update cache from network but don't block response
          fetch(req)
            .then((res) => {
              if (res && res.ok) {
                caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', res.clone()));
              }
            })
            .catch(() => {});
          return cachedIndex;
        }
        // No cached index, fallback to network and cache on success
        return fetch(req)
          .then((res) => {
            if (res && res.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', res.clone()));
            }
            return res;
          })
          .catch(() => caches.match('/index.html'));
      })
    );
    return;
  }

  // For other requests: cache-first, with network fallback. Don't cache error/opaque responses.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((networkRes) => {
          // If response is bad or opaque, just return it without caching
          if (!networkRes || !networkRes.ok) return networkRes;
          // Cache a copy for next time
          return caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(req, networkRes.clone());
            } catch (e) {
              // Some requests (e.g., range requests, opaque responses) may not be cacheable
              // We ignore cache put failures.
            }
            return networkRes;
          });
        })
        .catch(() => {
          // network failed and nothing in cache
          return null;
        });
    })
  );
});