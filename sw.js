const CACHE_NAME = "marginalia-v1";
const SHELL_URLS = ["./", "./index.html", "./manifest.json", "./icon.svg"];
const SHELL_FILENAMES = ["index.html", "manifest.json", "icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// App shell (this page, its manifest, its icon): cache-first.
// Everything else (Open Library, Google Fonts): let the browser fetch normally, uncached —
// live search/recommendation data must never be served stale from cache.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isRootRequest = isSameOrigin && url.pathname.endsWith("/");
  const isShellFile = isSameOrigin && SHELL_FILENAMES.some((name) => url.pathname.endsWith(name));

  if (isRootRequest || isShellFile) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
  // else: don't intercept — goes straight to the network
});
