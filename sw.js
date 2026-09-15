/**
 * sw.js — service worker per funzionamento offline.
 *
 * IMPORTANTE per aggiornamenti futuri: quando si modificano i file dell'app,
 * incrementare CACHE_NAME (es. da v1 a v2). Questo forza il service worker a
 * scaricare i nuovi file invece di servire quelli vecchi in cache. I dati in
 * IndexedDB (db.js) NON sono toccati da questo meccanismo: restano intatti.
 */

const CACHE_NAME = 'allenamenti-cache-v2';
const FILES_TO_CACHE = [
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './manifest.json',
  './seed-data.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // cache dinamica di eventuali nuove risorse stesso-origine
        if (event.request.method === 'GET' && response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
