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
    // also remove the cache of the original single-file app ("unser-training-v4")
    const old = (await caches.keys()).filter(k => (k.startsWith(PREFIX) && k !== CACHE) || /^unser-training-v\d+$/.test(k));
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    if (old.length) notify();
  })());
});

// If no page is open yet (the check finished during navigation), remember it and
// answer the page's "hello" once it has loaded.
let pending = false;
async function notify() {
  const list = await self.clients.matchAll({ type: "window" });
  if (!list.length) { pending = true; return; }
  for (const c of list) c.postMessage({ type: "updated" });
}
self.addEventListener("message", e => {
  if (e.data && e.data.type === "hello" && pending && e.source) { pending = false; e.source.postMessage({ type: "updated" }); }
});

// Stale-while-revalidate: answer from the cache right away (fast, works offline),
// then fetch a fresh copy in the background. If it changed, offer a reload.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Pages are stored without their query string (?utm=…), so every link to a page shares one entry.
    const url = new URL(req.url);
    const key = req.mode === "navigate" ? url.origin + url.pathname : req;
    const hit = await cache.match(key);
    const before = hit ? hit.clone() : null;
    const fresh = fetch(req, { cache: "no-cache" }).then(async res => {
      if (res && res.ok && res.type === "basic") {
        if (before && TEXT.test(new URL(req.url).pathname)) {
          const [a, b] = await Promise.all([before.text(), res.clone().text()]);
          if (a !== b) notify();
        }
        await cache.put(key, res.clone());
      }
      return res;
    });
    if (hit) { e.waitUntil(fresh.catch(() => {})); return hit; }
    return fresh.catch(async () => (req.mode === "navigate" && await cache.match("index.html")) || Response.error());
  })());
});
