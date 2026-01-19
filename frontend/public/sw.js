/**
 * Lucky System PWA Service Worker
 * Standard implementation with caching strategies
 */

const CACHE_VERSION = 'v1.0.2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/Logo.png',
    '/icon-192.png',
    '/icon-512.png'
];

// Cache strategies
const CACHE_STRATEGIES = {
    STATIC: 'cache-first',
    DYNAMIC: 'network-first',
    RUNTIME: 'network-only'
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing version ${CACHE_VERSION}`);

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log(`[SW] Activating version ${CACHE_VERSION}`);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName !== STATIC_CACHE &&
                                cacheName !== DYNAMIC_CACHE &&
                                cacheName !== RUNTIME_CACHE;
                        })
                        .map((cacheName) => {
                            console.log(`[SW] Deleting old cache: ${cacheName}`);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip API calls - always network
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Skip browser extensions
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
        return;
    }

    // Determine cache strategy
    const strategy = getCacheStrategy(url);

    switch (strategy) {
        case CACHE_STRATEGIES.STATIC:
            event.respondWith(cacheFirst(request, STATIC_CACHE));
            break;
        case CACHE_STRATEGIES.DYNAMIC:
            event.respondWith(networkFirst(request, DYNAMIC_CACHE));
            break;
        case CACHE_STRATEGIES.RUNTIME:
            event.respondWith(networkOnly(request));
            break;
        default:
            event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    }
});

/**
 * Determine cache strategy based on URL
 */
function getCacheStrategy(url) {
    // Static assets - cache first
    if (url.pathname.includes('/_next/static/') ||
        url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|webp|woff|woff2)$/)) {
        return CACHE_STRATEGIES.STATIC;
    }

    // Runtime chunks - network only
    if (url.pathname.includes('/_next/static/chunks/')) {
        return CACHE_STRATEGIES.RUNTIME;
    }

    // Dynamic content - network first
    return CACHE_STRATEGIES.DYNAMIC;
}

/**
 * Cache-first strategy
 */
function cacheFirst(request, cacheName) {
    return caches.match(request)
        .then((response) => {
            if (response) {
                return response;
            }
            return fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(cacheName).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            });
        });
}

/**
 * Network-first strategy
 */
function networkFirst(request, cacheName) {
    return fetch(request)
        .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(cacheName).then((cache) => {
                    cache.put(request, responseClone);
                });
            }
            return networkResponse;
        })
        .catch(() => {
            return caches.match(request);
        });
}

/**
 * Network-only strategy
 */
function networkOnly(request) {
    return fetch(request);
}

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            type: 'VERSION_RESPONSE',
            version: CACHE_VERSION
        });
    }
});
