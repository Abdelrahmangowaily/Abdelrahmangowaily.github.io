const CACHE = 'workout-v8';

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

// Install: cache the app shell, but DON'T skipWaiting automatically —
// we wait for the user to tap "Refresh" so we never interrupt an open session.
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Page sends { type: 'SKIP_WAITING' } when the user taps the banner
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Fetch strategy:
//   Supabase API calls  → network only (always live data)
//   External CDN        → network first, cache fallback
//   App shell files     → cache first, background refresh
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (url.hostname.includes('supabase.co')) return;

  if (url.hostname !== self.location.hostname) {
    e.respondWith(
      fetch(e.request)
        .then(res => { caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
      return cached || network;
    })
  );
});
