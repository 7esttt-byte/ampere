// Service Worker لتطبيق أمبير - يجعل التطبيق يعمل بدون انترنت
const CACHE_NAME = 'ampere-v5.0';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon.png',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Cairo:wght@600;700;900&display=swap'
];

// تثبيت الـ Service Worker وتخزين الملفات
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE).catch(err => {
        console.warn('Some files failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// تنشيط الـ Service Worker وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// التعامل مع طلبات الشبكة
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات الـ Webhook (يجب أن تذهب للسيرفر دائماً)
  if (event.request.url.includes('webhook')) {
    return;
  }
  
  // استراتيجية: Cache First, ثم Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // تخزين النسخة الجديدة
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // في حالة فشل الشبكة، أرجع الصفحة الرئيسية
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
