// Red Pine Service Worker - Network First Strategy
const CACHE_NAME = 'red-pine-v2';
const urlsToCache = [
  '/',
  '/login.html',
  '/dashboard.html',
  '/beats.html',
  '/customers.html',
  '/analytics.html',
  '/settings.html',
  '/assets/css/style.css',
  '/assets/js/config.js',
  '/assets/images/red_pine_logo.png'
];

// URLs to never cache
const SKIP_CACHE_PATTERNS = [
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  'edge-extension://',
  'supabase.co',
  'googleapis.com',
  'gstatic.com'
];

/**
 * Check if a URL should be skipped from caching
 * @param {string} url - The URL to check
 * @returns {boolean} - True if should skip caching
 */
function shouldSkipCache(url) {
  // Skip non-HTTP(S) URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return true;
  }

  // Skip URLs matching skip patterns
  for (const pattern of SKIP_CACHE_PATTERNS) {
    if (url.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a response can be cached
 * @param {Response} response - The response to check
 * @returns {boolean} - True if response can be cached
 */
function canCacheResponse(response) {
  // Don't cache non-successful responses
  if (!response || response.status !== 200) {
    return false;
  }

  // Don't cache opaque responses (cross-origin without CORS)
  if (response.type === 'opaque') {
    return false;
  }

  return true;
}

// Install event - cache static assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => {
        // Silently fail on install cache errors
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  const requestUrl = event.request.url;

  // Skip non-cacheable requests entirely
  if (shouldSkipCache(requestUrl)) {
    return;
  }

  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Got network response - cache it if valid
        if (canCacheResponse(response)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone).catch(() => {
                // Silently fail on cache put errors
              });
            })
            .catch(() => {
              // Silently fail on cache open errors
            });
        }
        return response;
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/login.html');
            }
            // Return empty response for other failed requests
            return new Response('', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});
