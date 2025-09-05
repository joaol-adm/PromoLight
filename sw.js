const CACHE = 'promolight-v3-4';
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll([
    'index.html','styles.css','app.js','manifest.json',
    'icon-192.png','icon-512.png',
    'assets/images/img1.svg','assets/images/img2.svg','assets/images/img3.svg'
  ])));
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
      body: data.body || '', icon: 'icon-192.png', badge: 'icon-192.png', vibrate: [100, 50, 100]
    });
  }
});