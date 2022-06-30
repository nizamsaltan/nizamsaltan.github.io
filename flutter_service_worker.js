'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "4f188f851a9288482fbd7124ad5a3575",
"assets/assets/fonts/barlow/Barlow-Bold.ttf": "72871854aabdd7a79c4fc5038cb4faaf",
"assets/assets/fonts/barlow/Barlow-Light.ttf": "2f88cf8762c53a8be3c3ec53b8e01edf",
"assets/assets/fonts/barlow/Barlow-Medium.ttf": "bdffb48240a3383080812d6830ff6f54",
"assets/assets/fonts/codec/CodecPro-Regular.ttf": "7d7a58e411aee636172a8f86dd7ce4d5",
"assets/assets/fonts/garet/Garet-Book.ttf": "6aea6bc41f902e6e21db5d54c9f77261",
"assets/assets/images/about_bg.png": "d78546e60571b545cf3f46a0a24e5b17",
"assets/assets/images/email_icon.png": "c9172bdda51109489593c86da58f10e8",
"assets/assets/images/fiverr_icon.png": "03488a27032f48cf238018ef8590d2ab",
"assets/assets/images/github_icon.png": "f2099b8ad2426edeef6e5ca7a950c0a5",
"assets/assets/images/home_page_bg.jpg": "98c99864f1c6f8c2ba21727ce9b3e884",
"assets/assets/images/instagram_icon.png": "34f57562f96c0dca5a686ea984bf2022",
"assets/assets/images/medium_icon.png": "7ac2426c2ee3561db3802a85dfdf556c",
"assets/assets/images/tteam_logo.png": "88c8b3ab1dd8742282f76896ed1c4f68",
"assets/assets/images/tteam_map.jpg": "1b038629c53b1813005f178668a87648",
"assets/assets/images/tteam_motivation_bg.jpg": "219ddb8fbfcd54ae08ffab862d28aeca",
"assets/assets/riv/moving_cube.riv": "11cac262f6800fbd038b4707299cd848",
"assets/FontManifest.json": "85286e34b619f9dc6fd2949a07cf0322",
"assets/fonts/MaterialIcons-Regular.otf": "95db9098c58fd6db106f1116bae85a0b",
"assets/NOTICES": "a7bf43060cffa6a79a438901cf71d552",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"favicon.png": "2315cdccc754aa033c416ae27456ed3c",
"icons/Icon-192.png": "77da73a0d1280fcdffc3d323f361ad84",
"icons/Icon-512.png": "3068426f67899fbeb661d65cd9bac9a1",
"icons/Icon-maskable-192.png": "a478ce8d267b0fddf2e4b749e094f9ef",
"icons/Icon-maskable-512.png": "ccf0f870d22e5bc00429f57fedf16cfd",
"index.html": "885a4a34b6b216fce521ad5ba4e0ba51",
"/": "885a4a34b6b216fce521ad5ba4e0ba51",
"main.dart.js": "110c9654b828c3ff9121e8f7047371aa",
"manifest.json": "6758fa84067de0e508eebcb50e3062ab",
"version.json": "fb8d4678888024cd5f83d8522bb3a722"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
