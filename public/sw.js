// Service Worker for Batting Order Generator PWA
// The version below is replaced at build time by the Vite plugin.
// During development it stays as-is which is fine (dev doesn't use SW).
const CACHE_VERSION = '__BUILD_VERSION__';
const CACHE_NAME = 'batting-order-' + CACHE_VERSION;

// Static shell files to pre-cache on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install event - cache essential shell files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching shell:', CACHE_NAME);
        return cache.addAll(PRECACHE_URLS);
      })
  );
  // Activate new SW immediately so updates aren't stuck waiting
  self.skipWaiting();
});

// Activate event - clean up ALL old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for SKIP_WAITING message (kept for backward compat)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event
// Strategy:
//  - Navigation requests (HTML pages): Network-first, fall back to cache
//  - Hashed assets (contain hash in filename): Cache-first (immutable)
//  - Everything else: Network-first, fall back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Navigation requests - always try network first for fresh HTML
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Hashed assets from Vite build (e.g. /assets/index-abc123.js)
  // These are immutable - safe to serve from cache forever
  if (isHashedAsset(request.url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // All other requests - network first
  event.respondWith(networkFirst(request));
});

// Network-first strategy: try network, fall back to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // For navigation, return cached index.html as fallback
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    return new Response('Offline', { status: 503 });
  }
}

// Cache-first strategy: serve from cache, update from network in background
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Check if URL is a Vite hashed asset (contains content hash in filename)
function isHashedAsset(url) {
  // Vite outputs assets like /assets/index-BxK3a1Fc.js or /assets/style-abc123.css
  return /\/assets\/[^/]+-[a-zA-Z0-9]{8,}\.(js|css|woff2?|png|jpg|svg)/.test(url);
}
