// GymFlow service worker: makes the app shell load offline. Workout data is not cached here;
// Firestore keeps its own offline cache in IndexedDB.
const CACHE = 'gymflow-v1'
const APP_SHELL = ['/', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

const putInCache = (request, response) => {
  if (response.ok) {
    const copy = response.clone()
    caches.open(CACHE).then((cache) => cache.put(request, copy))
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Page loads: network first so updates arrive immediately, cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => putInCache('/', response))
        .catch(() => caches.match('/')),
    )
    return
  }

  // Hashed build assets and Google Fonts never change under the same URL: cache first.
  const immutable =
    (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'fonts.googleapis.com'
  if (immutable) {
    event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request).then((response) => putInCache(request, response))))
    return
  }

  // Other same-origin files (icons, manifest): serve cached, refresh in the background.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => putInCache(request, response))
          .catch(() => cached)
        return cached ?? network
      }),
    )
  }
  // Everything else (Firebase APIs) goes straight to the network.
})
