const CACHE_NAME = "my-diary-cache-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    (async () => {
      const url = new URL(req.url);
      // 같은 오리진만 캐시 전략 적용
      if (url.origin !== self.location.origin) return fetch(req);

      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);
        // 기본 파일들은 캐시에 넣기
        if (res.ok && (url.pathname.endsWith(".css") || url.pathname.endsWith(".js") || url.pathname.endsWith(".webmanifest") || url.pathname.endsWith(".png") || url.pathname.endsWith(".svg") || url.pathname.endsWith(".html"))) {
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        // 오프라인 폴백
        return (await cache.match("./index.html")) || new Response("offline", { status: 503 });
      }
    })()
  );
});

