const CACHE_NAME = 'amath-online-v1';
const PRECACHE_URLS = [
  './amath-online.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// กลยุทธ์: network-first สำหรับ Firebase/API (ต้องการข้อมูลสดเสมอ)
// cache-first สำหรับไฟล์เกมเอง (ให้เปิดได้แม้ออฟไลน์ในโหมดเล่นคนเดียว)
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // อย่าไปยุ่งกับ request ที่ไม่ใช่ GET หรือไปยัง Firebase/Google APIs
  if (event.request.method !== 'GET') return;
  if (url.includes('firestore.googleapis.com') || url.includes('googleapis.com') || url.includes('gstatic.com/firebasejs')) {
    return; // ปล่อยให้ผ่านไปตามปกติ ไม่ cache ข้อมูลเกมออนไลน์แบบเรียลไทม์
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
