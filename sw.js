/* ============================================================
   Sedesa PWA — Service Worker
   Strategi:
   - App shell (HTML, font) → Cache First dengan fallback network
   - Supabase API calls      → Network First dengan fallback cache
   ============================================================ */

const CACHE_NAME     = 'sedesa-v1';
const OFFLINE_URL    = './index.html';

const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,500&family=Public+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap',
];

/* ── Install: cache app shell ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL).catch(err => {
        console.warn('[SW] Beberapa aset gagal di-cache saat install:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

/* ── Activate: hapus cache lama ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => {
            console.log('[SW] Menghapus cache lama:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Lewati request non-GET
  if (request.method !== 'GET') return;

  // Lewati chrome-extension dan lainnya
  if (!url.protocol.startsWith('http')) return;

  // Supabase API → Network First
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Google Fonts → Cache First
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // App shell & aset lokal → Cache First
  event.respondWith(cacheFirst(request));
});

/* ── Strategi: Cache First ── */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Jika offline dan tidak ada cache, kembalikan halaman offline
    const fallback = await caches.match(OFFLINE_URL);
    return fallback || new Response('Sedesa sedang offline. Buka kembali setelah terhubung ke internet.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

/* ── Strategi: Network First (untuk Supabase) ── */
async function networkFirst(request) {
  try {
    const response = await fetch(request.clone());
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', message: 'Tidak ada koneksi. Data dari cache lokal.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/* ── Push Notification (opsional, siap digunakan) ── */
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Sedesa', {
      body:  data.body  || '',
      icon:  './icons/icon-192x192.png',
      badge: './icons/icon-96x96.png',
      data:  data.url || './',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || './')
  );
});
