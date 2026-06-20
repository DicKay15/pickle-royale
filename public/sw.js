// Pickle Royale service worker.
// - HTML / navigations: network-first (so a new deploy is picked up
//   immediately and we never serve an index.html that points at a
//   renamed JS bundle → white screen). Falls back to cache offline.
// - Hashed build assets (/assets/*): cache-first (content-hashed, immutable).
// - API: network-first, friendly offline JSON (rankings must be fresh).
// - /auth/* and cross-origin: NEVER intercepted (OAuth redirects to Google
//   and back must be handled natively by the browser).
const CACHE = "pickle-royale-v5";
const SHELL = ["/", "/manifest.webmanifest", "/favicon.svg", "/mascot.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Let the browser handle anything cross-origin and the whole auth flow
  // natively (Google sign-in redirects must not be touched by the SW).
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/auth/")) return;

  // API: network first, friendly offline payload
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ error: "You're offline 📶" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    return;
  }

  // Navigations / HTML: network first, cache fallback (offline shell)
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          // only cache a clean same-origin HTML response (never a redirect)
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put("/", copy));
          }
          return res;
        })
        .catch(() => caches.match("/").then((hit) => hit || caches.match(request))),
    );
    return;
  }

  // Hashed assets + other static: cache first, then network (fill cache)
  e.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok && url.origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
