// Service Worker - Network-First Ultra Sync + Offline Fallback
const CACHE_NAME = "keuangan-keluarga-v19";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./ui-dialog.js",
  "./date-helper.js",
  "./whatsapp.js",
  "./auth.js",
  "./settings.js",
  "./categories.js",
  "./bills.js",
  "./shopping-list.js",
  "./family-parents.js",
  "./kondangan-social.js",
  "./vehicle-service.js",
  "./education.js",
  "./community.js",
  "./taxes-holidays.js",
  "./emergency-fund.js",
  "./investments.js",
  "./goals.js",
  "./monthly-stats.js",
  "./analytics-health.js",
  "./export-reports.js",
  "./ibu-kost.js",
  "./ibu-gas.js",
  "./ocr.js",
  "./backup-restore.js",
  "./sync.js",
  "./app.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Hanya proses GET dan jangan pernah mengintersepsi Google Apps Script API
  if (event.request.method !== "GET" || event.request.url.includes("script.google.com")) {
    return;
  }

  // Network First: Utamakan versi terbaru dari server, gunakan cache jika offline
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

