// Service Worker simplificado para FULLTECH
const CACHE_NAME = 'fulltech-v1.0.2';

// Recursos básicos para cache
const CRITICAL_RESOURCES = [
  '/',
  '/index.html'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Estrategia simple de cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // NO interceptar requests del API admin - dejar que pasen directo
  if (url.pathname.startsWith('/api/admin/')) {
    return; // No interceptar - dejar que fetch normal maneje esto
  }
  
  // NO interceptar requests del API auth - dejar que pasen directo  
  if (url.pathname.startsWith('/api/auth/')) {
    return; // No interceptar - dejar que fetch normal maneje esto
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es exitosa, clonar y guardar en cache
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar servir desde cache
        return caches.match(event.request)
          .then(cachedResponse => {
            return cachedResponse || new Response('Offline', { 
              status: 503, 
              statusText: 'Service Unavailable' 
            });
          });
      })
  );
});

console.log('[SW] Service Worker loaded successfully');