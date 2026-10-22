// Service worker: makes the app work offline and tells the page when an update is ready.
// The cache name comes from APP_VERSION in version.js, so there is one place to bump.
importScripts("version.js");

const PREFIX = "workout-app:" + self.registration.scope + ":";
const CACHE = PREFIX + self.APP_VERSION;

// Files needed to start offline. Anything else (e.g. exercise images) is cached the first time it loads.
const CORE = [
  "./", "index.html", "styles.css", "version.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  "fonts/outfit-latin.woff2", "fonts/dm-sans-latin.woff2",
  "src/app.js", "src/rig.js", "src/exercise.js", "src/player.js", "src/screens.js", "src/storage.js",
  "src/i18n.js", "src/icons.js", "src/validate.js", "src/legacy.js",
  "config/app.config.js", "config/exercises.js", "config/routines.js",
];
const TEXT = /\.(html|js|css|webmanifest|json)$|\/$/;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: "reload" })).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const old = (await caches.keys()).filter(k => k.startsWith(PREFIX) && k !== CACHE);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    if (old.length) notify();
  })());
});

let notified = false;
async function notify() {
  if (notified) return;
  notified = true;
  for (const c of await self.clients.matchAll({ type: "window" })) c.postMessage({ type: "updated" });
}

// Stale-while-revalidate: answer from the cache right away (fast, works offline),
// then fetch a fresh copy in the background. If it changed, offer a reload.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: req.mode === "navigate" });
    const before = hit ? hit.clone() : null;
    const fresh = fetch(req, { cache: "no-cache" }).then(async res => {
      if (res && res.ok && res.type === "basic") {
        if (before && TEXT.test(new URL(req.url).pathname)) {
          const [a, b] = await Promise.all([before.text(), res.clone().text()]);
          if (a !== b) notify();
        }
        await cache.put(req, res.clone());
      }
      return res;
    });
    if (hit) { e.waitUntil(fresh.catch(() => {})); return hit; }
    return fresh.catch(async () => (req.mode === "navigate" && await cache.match("index.html")) || Response.error());
  })());
});
