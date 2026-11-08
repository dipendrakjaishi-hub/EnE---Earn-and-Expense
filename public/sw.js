// CrewPulse PWA Service Worker - Offline Clock-In & Background Sync
const CACHE_NAME = 'crewpulse-v1';
const OFFLINE_QUEUE_KEY = 'crewpulse_offline_shifts';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Cache-first strategy for static assets, network-first for APIs
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).catch(() => {
        // Return offline fallback if navigating
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Listen for background sync if supported
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-shifts') {
    event.waitUntil(syncOfflineShifts());
  }
});

async function syncOfflineShifts() {
  console.log('[CrewPulse SW] Background syncing offline shifts...');
}
