// Service Worker para FULLTECH - Cache Inteligente y Sincronización
const CACHE_NAME = 'fulltech-v1.0.1';
const STATIC_CACHE = 'fulltech-static-v1.0.1';
const DYNAMIC_CACHE = 'fulltech-dynamic-v1.0.1';
const IMAGE_CACHE = 'fulltech-images-v1.0.1';

// Recursos críticos para precachear
const CRITICAL_RESOURCES = [
  '/',
  '/static/css/index.css',
  '/static/js/index.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Estrategias de cache
const CACHE_STRATEGIES = {
  API_DATA: 'stale-while-revalidate',
  IMAGES: 'cache-first',
  STATIC: 'cache-first',
  DYNAMIC: 'network-first'
};

// IndexedDB para datos locales
const DB_NAME = 'FulltechDB';
const DB_VERSION = 1;
const STORES = {
  PRODUCTS: 'products',
  HERO_SLIDES: 'heroSlides',
  CUSTOMER_DATA: 'customerData',
  ACTIVITIES: 'activities',
  OFFLINE_ACTIONS: 'offlineActions'
};

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Precaching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
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
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Interceptar requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // NO interceptar requests críticos del admin y auth - dejar que pasen directo
  if (url.pathname.startsWith('/api/admin/') || url.pathname.startsWith('/api/auth/')) {
    return; // No interceptar - dejar que fetch normal maneje esto
  }

  // API requests - Stale While Revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Imágenes - Cache First con fallback
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Recursos estáticos - Cache First
  if (url.pathname.match(/\.(css|js|woff|woff2|ttf|eot)$/)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // HTML y navegación - Network First
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Otros recursos - Network First
  event.respondWith(handleDynamicRequest(request));
});

// Manejo de API requests con cache inteligente
async function handleAPIRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Intentar obtener de la red primero
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Guardar en cache para uso offline
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      
      // También guardar en IndexedDB si es datos importantes
      await saveToIndexedDB(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, serving from cache:', request.url);
    
    // Si falla la red, servir desde cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si no hay cache, servir desde IndexedDB
    const indexedDBResponse = await getFromIndexedDB(request);
    if (indexedDBResponse) {
      return new Response(JSON.stringify(indexedDBResponse), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Respuesta offline por defecto
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'No hay conexión. Los datos se sincronizarán cuando vuelva la conexión.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Manejo de imágenes con cache agresivo
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  
  // Buscar en cache primero
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Si no está en cache, obtener de la red
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Guardar en cache
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Image failed to load:', request.url);
    
    // Imagen placeholder offline
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Sin conexión</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Manejo de recursos estáticos
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Cache first para recursos estáticos
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Manejo de navegación
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Servir app shell offline
    const cache = await caches.open(STATIC_CACHE);
    const offlineResponse = await cache.match('/');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

// Manejo de requests dinámicos
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// IndexedDB helpers
async function saveToIndexedDB(request, response) {
  try {
    const url = new URL(request.url);
    const data = await response.json();
    
    if (url.pathname === '/api/products') {
      await saveToStore(STORES.PRODUCTS, data);
    } else if (url.pathname === '/api/hero-slides') {
      await saveToStore(STORES.HERO_SLIDES, data);
    } else if (url.pathname.startsWith('/api/customer/')) {
      await saveToStore(STORES.CUSTOMER_DATA, { path: url.pathname, data });
    }
  } catch (error) {
    console.log('[SW] Error saving to IndexedDB:', error);
  }
}

async function getFromIndexedDB(request) {
  try {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/products') {
      return await getFromStore(STORES.PRODUCTS);
    } else if (url.pathname === '/api/hero-slides') {
      return await getFromStore(STORES.HERO_SLIDES);
    } else if (url.pathname.startsWith('/api/customer/')) {
      const customerData = await getFromStore(STORES.CUSTOMER_DATA);
      return customerData?.find(item => item.path === url.pathname)?.data;
    }
  } catch (error) {
    console.log('[SW] Error getting from IndexedDB:', error);
    return null;
  }
}

// IndexedDB operations
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      });
    };
  });
}

async function saveToStore(storeName, data) {
  const db = await openDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  
  await store.clear(); // Limpiar datos anteriores
  await store.put({
    id: 1,
    data: data,
    timestamp: Date.now()
  });
}

async function getFromStore(storeName) {
  const db = await openDB();
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  
  const result = await store.get(1);
  return result?.data;
}

// Background Sync para acciones offline
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  try {
    const actions = await getFromStore(STORES.OFFLINE_ACTIONS);
    if (!actions || actions.length === 0) return;
    
    for (const action of actions) {
      try {
        await fetch(action.url, action.options);
        console.log('[SW] Synced offline action:', action.url);
      } catch (error) {
        console.log('[SW] Failed to sync action:', action.url);
      }
    }
    
    // Limpiar acciones sincronizadas
    await saveToStore(STORES.OFFLINE_ACTIONS, []);
  } catch (error) {
    console.log('[SW] Error syncing offline actions:', error);
  }
}

// Notificaciones push
self.addEventListener('push', event => {
  console.log('[SW] Push received');
  
  const options = {
    body: 'Nuevos productos disponibles en FULLTECH',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver productos',
        icon: '/icon-explore.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icon-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('FULLTECH', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click received.');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service Worker loaded successfully');