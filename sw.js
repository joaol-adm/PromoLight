const CACHE = 'promolight-v4-1';
const VER = 'v=4-1';

self.addEventListener('install', (e)=>{
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll([
      'index.html',
      'index.html?v=4-1',
      'styles.css?v=4-1',
      'app.js?v=4-1',
      'manifest.json?v=4-1',
      'icon-192-v4-1.png',
      'icon-512-v4-1.png',
      'assets/images/img1.svg?v=4-1',
      'assets/images/img2.svg?v=4-1',
      'assets/images/img3.svg?v=4-1'
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e)=>{
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      });
    }).catch(() => caches.match('index.html'))
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if(data.type === 'show-notification'){
    self.registration.showNotification(data.title || 'PromoLight', {
      body: data.body || '',
      icon: 'icon-192-v4-1.png',
      badge: 'icon-192-v4-1.png',
      vibrate: [100, 50, 100]
    });
  }
});
