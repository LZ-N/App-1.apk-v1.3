/*
  Ascend service worker.
  ---------------------------------------------------------------
  HOW UPDATES WORK:
  Bump CACHE_VERSION any time you ship a new index.html. That's the
  only thing that needs to change here. A new version number makes
  this whole file "look different" to the browser, which is what
  triggers it to install the new service worker, fetch the new
  files, and swap them in — no reinstall, no app store, nothing
  for you to do on the tablet except relaunch the app once.
*/
var CACHE_VERSION = 'ascend-v9';
var APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k!==CACHE_VERSION; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method!=='GET') return;

  // Network-first for the app page itself, so you get the latest
  // code whenever you're online. Falls back to the cached copy
  // the moment you're offline.
  if(req.mode==='navigate' || req.url.indexOf('index.html')!==-1){
    event.respondWith(
      fetch(req).then(function(res){
        var copy=res.clone();
        caches.open(CACHE_VERSION).then(function(cache){ cache.put(req,copy); });
        return res;
      }).catch(function(){
        return caches.match(req).then(function(cached){
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Cache-first for static assets (icons, manifest) — these rarely change.
  event.respondWith(
    caches.match(req).then(function(cached){
      return cached || fetch(req);
    })
  );
});
