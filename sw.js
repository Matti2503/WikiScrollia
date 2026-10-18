const STATIC_CACHE = 'wikiscroll-static-v1';
const DYNAMIC_CACHE = 'wikiscroll-dynamic-v1';

// Alle lokalen Dateien mit strikt relativen Pfaden für GitHub Pages
const APP_SHELL = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json'
];

// 1. Installation: App-Shell in den statischen Cache laden
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

// 2. Aktivierung: Alte Caches aufräumen
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
                    .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// 3. Fetch-Strategie:
// - Wikipedia API & Bilder: Network-First mit Fallback auf Cache (für gelesene Artikel im Offline-Modus)
// - Statische App-Dateien: Cache-First mit Network-Fallback
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);

    // Externe Anfragen an Wikipedia / Wikimedia (API & Artikelbilder)
    if (requestUrl.hostname.includes('wikipedia.org') || requestUrl.hostname.includes('wikimedia.org')) {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    const clonedResponse = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => {
                        cache.put(event.request, clonedResponse);
                    });
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Lokale App-Shell-Dateien
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request).then(networkResponse => {
                return caches.open(STATIC_CACHE).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});
