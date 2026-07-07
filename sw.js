const CACHE_NAME = 'soso-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/db.js',
  '/js/plan.js',
  '/js/notification.js',
  '/js/data.js',
  '/pages/home.html',
  '/pages/diet.html',
  '/pages/exercise.html',
  '/pages/sleep.html',
  '/pages/stats.html',
  '/pages/profile.html',
  '/pages/knowledge.html',
  '/pages/welcome.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        if (e.request.url.match(/\.(html|css|js|png|json)$/)) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(clients => {
      const focused = clients.find(c => c.url.includes(url) && 'focus' in c);
      if (focused) return focused.focus();
      return clients.openWindow(url);
    })
  );
});
