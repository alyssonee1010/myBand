self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('myband-offline-v1').then((cache) => cache.add('/offline.html')).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== 'myband-offline-v1')
            .map((key) => caches.delete(key)),
        ),
      ),
    ]),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate') {
    return
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const offlineResponse = await caches.match('/offline.html')

      return (
        offlineResponse ||
        new Response('MyBand is offline right now.', {
          status: 503,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        })
      )
    }),
  )
})
