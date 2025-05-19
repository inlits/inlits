/// <reference lib="webworker" />

const CACHE_NAME = 'inlits-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

async function cacheFirst(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;
  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request).then(async (response) => {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  });
  return cachedResponse || fetchPromise;
}

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);
  let strategy = CACHE_STRATEGIES.NETWORK_FIRST;

  // Static assets use cache-first
  if (STATIC_ASSETS.includes(url.pathname)) {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
  }
  // API requests use stale-while-revalidate
  else if (url.pathname.startsWith('/api/')) {
    strategy = CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirst(event.request));
      break;
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(event.request));
      break;
    default:
      event.respondWith(networkFirst(event.request));
  }
});

export {};