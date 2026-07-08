const CACHE_NAME = 'soso-cache-v2';
const ASSETS = [
  '',
  'index.html',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.log('SW: cache addAll failed for some assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Always try network first, fall back to cache
  e.respondWith(
    fetch(e.request).then(res => {
      // Cache successful responses for future offline use
      if (res.ok && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => {
      return caches.match(e.request).then(cached => {
        return cached || new Response(
          '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>SOSO - 离线</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0F0F12;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center}.card{background:#1A1A20;border-radius:16px;padding:24px;max-width:360px}.icon{font-size:48px;margin-bottom:12px}h2{font-size:18px;font-weight:700;margin:0 0 8px}p{font-size:13px;color:#888895;line-height:1.6;margin:0}</style></head><body><div class="card"><div class="icon">📡</div><h2>已断开网络连接</h2><p>SOSO 正在离线模式运行<br>打卡和已缓存内容仍可使用<br>联网后将自动恢复完整功能</p></div></body></html>',
          { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
        );
      });
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/soso-app/';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(clients => {
      const focused = clients.find(c => c.url.includes(url) && 'focus' in c);
      if (focused) return focused.focus();
      return clients.openWindow(url);
    })
  );
});
