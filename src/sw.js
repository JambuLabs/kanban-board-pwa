const cacheName = 'kanban-cache';
const isExcluded = f => /hot-update|sockjs/.test(f);
const isBootstrapRequest = request => /bootstrapcdn/.test(request.url);

const filesToCache = [
  ...serviceWorkerOption.assets.filter(file => !isExcluded(file)),
  '/'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    new Promise((resolve, reject) => {
      if (isExcluded(event.request.url)) {
        resolve(fetch(event.request));
      } else {
        resolve(
          caches.match(event.request).then(response => {
            if (response) return response;

            var fetchRequest = event.request.clone();

            return fetch(fetchRequest).then(response => {
              var responseToCache = response.clone();

              if (isBootstrapRequest(fetchRequest)) {
                caches.open(cacheName).then(cache => {
                  cache.put(fetchRequest, responseToCache);
                });
              } else {
                if (
                  !response ||
                  response.status !== 200 ||
                  response.type !== 'basic'
                ) {
                  return response;
                }

                caches.open(cacheName).then(cache => {
                  cache.put(fetchRequest, responseToCache);
                });
              }

              return response;
            });
          })
        );
      }
    })
  );
});