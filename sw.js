const CACHE = 'workout-v7';

const SHELL = [
  '/index.html',
  '/app.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/css/style.css',
  '/js/app.js',
  '/js/db.js',
  '/js/utils.js',
  '/js/data.js',
  '/js/views/dashboard.js',
  '/js/views/workout.js',
  '/js/views/program.js',
  '/js/views/calendar.js',
  '/js/views/nutrition.js',
  '/js/views/progress.js',
  '/js/views/leaderboard.js',
];

// Install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
//   Supabase API calls  → network only (always live data)
//   Google Fonts / CDN  → network first, cache fallback
//   App shell files     → cache first, network fallback + update cache
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go to network for Supabase
  if (url.hostname.includes('supabase.co')) return;

  // Network-first for external CDN (fonts, supabase JS lib)
  if (url.hostname !== self.location.hostname) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      });
      return cached || network;
    })
  );
});
