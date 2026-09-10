// Service worker for Fire Gate Chapel Int'l Church PWA.
// Caches core pages and assets so the app opens even with a weak or no connection.

const CACHE_NAME = 'fgci-cache-v1';
const CORE_ASSETS = [
  'index.html',
  'style.css',
  'script.js',
  'logo.png',
  'icon-192.png',
  'icon-512.png',
  'sermon-responsibility.html',
  'sermon-calling-purpose.html',
  'sermon-calling-purpose-cover.svg',
  'pastor.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
            .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Network-first for HTML (so updates show up quickly), cache-first for everything else.
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          var resClone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, resClone); });
          return res;
        })
        .catch(function () { return caches.match(req).then(function (res) { return res || caches.match('index.html'); }); })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      return cached || fetch(req).then(function (res) {
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, resClone); });
        return res;
      });
    })
  );
});
