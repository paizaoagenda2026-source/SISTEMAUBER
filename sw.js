/* Service Worker — PAIZÃO UBER 2.0 */
const CACHE_NAME = 'paizao-uber-v3';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './lobao.jpg'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARQUIVOS).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;

  /* Não passa pelo cache: Firebase, CDNs de libs dinâmicas, APIs */
  if (
    url.includes('firestore') ||
    url.includes('firebase') ||
    url.includes('googleapis.com') ||
    url.includes('parallelum.com.br') ||
    url.includes('tesseract') ||
    url.includes('pdf.worker')
  ) {
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => {
        /* Só cacheia GET same-origin ou estáticos leves */
        try {
          if (resp && resp.status === 200 && req.url.startsWith(self.location.origin)) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => {});
          }
        } catch (err) {}
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
