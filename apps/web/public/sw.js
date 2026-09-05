// Dotion Custom Progressive Web App Service Worker
const CACHE_VERSION = 'v1'
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

// --- 1. Install Event: Precache App Shell ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => {
        // Do not force skipWaiting automatically so that users can finish ongoing edits
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error)
      }),
  )
})

// --- 2. Activate Event: Clean up stale caches and claim clients ---
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

// --- 3. Message Event: Skip Waiting on user request ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// --- Helper: Check if request is an API / WebSocket call ---
function isApiOrWsRequest(url, request) {
  if (url.pathname.startsWith('/api')) return true
  if (url.pathname.includes('/ws')) return true
  if (request.headers.get('upgrade') === 'websocket') return true
  return false
}

// --- Helper: Cache First Strategy ---
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

// --- Helper: Stale While Revalidate Strategy ---
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
      // Network failure; if cached response is available it will be used
      return null
    })

  return cached || (await fetchPromise) || fetch(request)
}

// --- Helper: Network First for HTML Navigation ---
async function networkFirstNavigation(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Try exact page match, or fallback to cached root app shell
    const cachedResponse =
      (await caches.match(request)) || (await caches.match('/'))
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// --- 4. Fetch Event ---
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignore non-GET and unsupported schemes
  if (request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return

  // Never intercept API and WebSocket requests
  if (isApiOrWsRequest(url, request)) return

  // 1. Navigation requests (HTML pages) -> Network First with cached fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  // 2. Web Fonts -> Cache First
  if (
    url.pathname.match(/\.(woff|woff2|ttf|eot)$/) ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com')
  ) {
    event.respondWith(cacheFirst(request, FONTS_CACHE))
    return
  }

  // 3. Images and Icons -> Stale While Revalidate
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|gif)$/) ||
    url.hostname.includes('images.unsplash.com')
  ) {
    event.respondWith(staleWhileRevalidate(request, IMAGES_CACHE))
    return
  }

  // 4. Hashed JS/CSS Assets -> Stale While Revalidate / Cache First
  if (
    url.pathname.startsWith('/assets/') &&
    url.pathname.match(/\.(js|css)$/)
  ) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
    return
  }

  // 5. Default: Stale While Revalidate for static resources
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
    return
  }
})
