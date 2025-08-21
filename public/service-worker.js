// This service worker can be customized further as needed
const CACHE_NAME = 'ubika-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/ubika-logo.png',
  '/styles/globals.css',
  // Add more URLs to cache as needed
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip caching for development-related requests
  if (event.request.url.includes('/_next/webpack-hmr') || 
      event.request.url.includes('.hot-update.') ||
      event.request.url.includes('_next/static/webpack/') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch and cache the result
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Only cache GET requests
            if (event.request.method === 'GET') {
              // Clone the response as it's a stream that can only be consumed once
              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          }
        ).catch(() => {
          // Return a fallback response for failed requests
          return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Clean up old caches when a new service worker takes over
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
