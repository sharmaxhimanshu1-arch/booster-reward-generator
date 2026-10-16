/* Service worker for Daily Booster Studio.
 *
 * Network first, cache second. A manager always gets the current templates and
 * tier amounts when there is signal, and the studio still opens on a bad site
 * connection. Exporting a PNG needs the renderer from the CDN, so a board made
 * fully offline may not download until there is signal again.
 */
var CACHE = "booster-v5";

var SHELL = [
  "./",
  "index.html",
  "studio.html",
  "styles.css",
  "core.js",
  "home.js",
  "studio.js",
  "install.js",
  "tiers.json",
  "manifest.json",
  "templates/winners.js",
  "templates/rewards.js",
  "templates/podium.js",
  "templates/win.js",
  "templates/simple-winners.js",
  "templates/simple-rewards.js",
  "assets/beckhaul-logo.png",
  "assets/icon-192.png",
  "assets/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () { /* a missing file must not block the install */ })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;  // CDN and fonts go straight to the network

  e.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match("index.html");
        });
      })
  );
});
