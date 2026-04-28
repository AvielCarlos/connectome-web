/**
 * Connectome Service Worker — App Shell + API caching
 * Cache-first for shell assets, network-first for API with offline fallback
 */

const CACHE_VERSION = 'v2';
const SHELL_CACHE = `connectome-shell-${CACHE_VERSION}`;
const API_CACHE = `connectome-api-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  '/connectome-web/',
  '/connectome-web/index.html',
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch(() => {
        // Fail silently — assets may not exist at install time in CI
      });
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http
  if (!url.protocol.startsWith('http')) return;

  // API calls → network-first, cache fallback for GETs
  if (url.hostname === 'connectome-api-production.up.railway.app') {
    // Only cache safe read endpoints
    const cacheable = url.pathname.startsWith('/api/dao') ||
                      url.pathname.startsWith('/api/journal/entries') ||
                      url.pathname.startsWith('/api/goals');
    if (cacheable) {
      event.respondWith(networkFirstWithCache(request, API_CACHE, 60));
    }
    return;
  }

  // App shell → network-first so updates are picked up immediately
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirstWithShellFallback(request, SHELL_CACHE));
  }
});

// ─── Strategies ───────────────────────────────────────────────────────────────

async function networkFirstWithShellFallback(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline — return cached version
    const cached = await caches.match(request);
    if (cached) return cached;
    const fallback = await caches.match('/connectome-web/');
    return fallback || new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithCache(request, cacheName, maxAgeSeconds) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
