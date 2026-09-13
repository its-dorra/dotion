const CACHE_VERSION = 'v1.0.2'
const STATIC_CACHE = `dotion-static-${CACHE_VERSION}`
const FONTS_CACHE = `dotion-fonts-${CACHE_VERSION}`
const IMAGES_CACHE = `dotion-images-${CACHE_VERSION}`
const RUNTIME_CACHE = `dotion-runtime-${CACHE_VERSION}`

const CURRENT_CACHES = [STATIC_CACHE, FONTS_CACHE, IMAGES_CACHE, RUNTIME_CACHE]

const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/apple-touch-icon-180x180.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))

      .catch((error) => {
        console.error('[SW] Precache failed:', error)
      }),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (name) =>
                name.startsWith('dotion-') && !CURRENT_CACHES.includes(name),
            )
            .map((name) => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            }),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function shouldIgnoreRequest(url, request) {
  if (url.pathname.startsWith('/api')) return true
  if (url.pathname.includes('/ws')) return true
  if (request.headers.get('upgrade') === 'websocket') return true
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@id/') ||
    url.pathname.includes('/@fs/')
  ) {
    return true
  }
  if (url.pathname.includes('/node_modules/.vite/')) return true
  if (url.searchParams.has('v')) return true
  if (url.pathname === '/__vite_ping') return true
  return false
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    if (cached) return cached
    throw error
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch((err) => {
      return null
    })

  return cached || (await fetchPromise) || fetch(request)
}

async function networkFirstNavigation(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse =
      (await caches.match(request)) || (await caches.match('/'))
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return

  if (shouldIgnoreRequest(url, request)) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  if (
    url.pathname.match(/\.(woff|woff2|ttf|eot)$/) ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com')
  ) {
    event.respondWith(cacheFirst(request, FONTS_CACHE))
    return
  }

  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|gif)$/) ||
    url.hostname.includes('images.unsplash.com')
  ) {
    event.respondWith(staleWhileRevalidate(request, IMAGES_CACHE))
    return
  }

  if (
    url.pathname.startsWith('/assets/') &&
    url.pathname.match(/\.(js|css)$/)
  ) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
    return
  }

  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
    return
  }
})
