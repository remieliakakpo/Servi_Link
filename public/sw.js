// Service worker ServiLink (V1-06) : consultation hors connexion.
// Pages : réseau d'abord, copie en cache sinon (dernières fiches vues, prix, calculateur).
// Fichiers _next/static : cache d'abord (ils changent de nom à chaque version).
const VERSION = "slk-v1";
const A_PRECHARGER = ["/", "/prix", "/calculateur", "/hors-ligne"];
const MAX_PAGES = 40;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(A_PRECHARGER)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function limiter(cache) {
  const cles = await cache.keys();
  const pages = cles.filter((r) => !new URL(r.url).pathname.startsWith("/_next/"));
  for (const r of pages.slice(0, Math.max(0, pages.length - MAX_PAGES))) {
    if (!A_PRECHARGER.includes(new URL(r.url).pathname)) await cache.delete(r);
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/admin")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {
      const copie = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copie));
      return res;
    })));
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          const copie = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copie).then(() => limiter(c)));
        }
        return res;
      }).catch(async () => (await caches.match(req)) || (await caches.match("/hors-ligne"))),
    );
  }
});
