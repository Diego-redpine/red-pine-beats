// Red Pine Service Worker
const CACHE_NAME = 'red-pine-v1';
const urlsToCache = [
  '/',
  '/dashboard.html',
  '/beats.html',
  '/customers.html',
  '/analytics.html',
  '/settings.html',
  '/customize.html',
  '/assets/css/style.css',
  '/assets/js/config.js',
  '/assets/js/branding.js',
  '/assets/js/dashboard.js',
  '/assets/images/red_pine_logo.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache opened
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Cache error:', err))
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // RP-ANALYTICS-004: Skip caching for non-HTTP(S) requests (like chrome-extension://)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Don't cache non-successful responses or non-GET requests
          if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
            return response;
          }
          // Clone and cache the response with error handling
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              try {
                cache.put(event.request, responseToCache);
              } catch (err) {
                console.warn('Cache put failed:', err);
              }
            })
            .catch(err => console.warn('Cache open failed:', err));
          return response;
        }).catch(() => {
          // Network failed, return offline fallback if available
          return caches.match('/dashboard.html');
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            // Deleting old cache
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
