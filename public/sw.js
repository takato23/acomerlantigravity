/**
 * Advanced Service Worker for Meal Planning App
 * Features: Intelligent caching, offline support, background sync
 */

const CACHE_NAME = 'meal-planner-v3';
const STATIC_CACHE = 'static-v3';
const DYNAMIC_CACHE = 'dynamic-v3';
const IMAGE_CACHE = 'images-v3';
const API_CACHE = 'api-v3';

// Cache strategies by resource type
const CACHE_STRATEGIES = {
  static: 'cache-first',
  dynamic: 'network-first',
  images: 'cache-first',
  api: 'network-first'
};

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  static: 365 * 24 * 60 * 60, // 1 year
  dynamic: 24 * 60 * 60, // 1 day
  images: 30 * 24 * 60 * 60, // 30 days
  api: 5 * 60 // 5 minutes
};

// Only cache resources that are guaranteed to exist
// In development, Next.js uses dynamic chunk names
// Removed '/' from static assets to ensure completely fresh HTML on reload
const STATIC_ASSETS = [
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/meal-planning/generate',
  '/api/recipes/route',
  '/api/pantry/items',
  '/api/user/profile'
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i,
  /_next\/image/,
  /\/images\//
];

// Install event - Cache static assets with error handling
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Cache each asset individually to prevent one failure from blocking all
      const results = await Promise.allSettled(
        STATIC_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (response.ok) {
              await cache.put(url, response);
              console.log(`[SW] Cached: ${url}`);
              return url;
            } else {
              console.warn(`[SW] Failed to cache (${response.status}): ${url}`);
              return null;
            }
          } catch (error) {
            console.warn(`[SW] Error caching: ${url}`, error.message);
            return null;
          }
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      console.log(`[SW] Cached ${successful}/${STATIC_ASSETS.length} assets`);

      return self.skipWaiting();
    })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE];

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - Intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Skip Chrome extension requests
  if (request.url.includes('chrome-extension://')) {
    return;
  }

  // Handle different resource types
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'meal-plan-sync') {
    event.waitUntil(syncMealPlans());
  } else if (event.tag === 'recipe-sync') {
    event.waitUntil(syncRecipes());
  }
});

// Push notifications for meal reminders
self.addEventListener('push', (event) => {
  let data = {
    title: 'KeCarajoComer',
    body: 'Nueva actualización disponible',
    url: '/planificador',
    type: 'general'
  };

  // Try to parse JSON data
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [100, 50, 100],
    tag: data.type || 'notification',
    renotify: true,
    data: {
      url: data.url || '/planificador',
      type: data.type,
      dateOfArrival: Date.now()
    },
    actions: getActionsForType(data.type)
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Get notification actions based on type
function getActionsForType(type) {
  switch (type) {
    case 'plan_ready':
      return [
        { action: 'view', title: '📋 Ver Plan' },
        { action: 'close', title: 'Cerrar' }
      ];
    case 'daily_reminder':
      return [
        { action: 'view', title: '🍳 Ver Receta' },
        { action: 'close', title: 'Cerrar' }
      ];
    case 'shopping':
      return [
        { action: 'view', title: '🛒 Ver Lista' },
        { action: 'close', title: 'Cerrar' }
      ];
    default:
      return [
        { action: 'view', title: 'Ver' },
        { action: 'close', title: 'Cerrar' }
      ];
  }
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};

  if (event.action === 'close') {
    return;
  }

  // Determine URL based on notification type or action
  const urlMap = {
    'plan_ready': '/planificador',
    'daily_reminder': '/planificador',
    'shopping': '/lista-compras',
  };

  const url = data.url || urlMap[data.type] || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Try to focus existing window
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => client.navigate(url));
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Utility functions
function isStaticAsset(request) {
  return request.url.includes('/_next/static/') ||
    request.url.includes('/static/') ||
    STATIC_ASSETS.some(asset => request.url.endsWith(asset));
}

function isImageRequest(request) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(request.url)) ||
    request.destination === 'image';
}

function isAPIRequest(request) {
  return request.url.includes('/api/') ||
    API_ENDPOINTS.some(endpoint => request.url.includes(endpoint));
}

// Cache-first strategy for static assets
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);

    // Try to return cached offline page for navigation
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) return offlineResponse;
    }

    return new Response('Offline', { status: 503 });
  }
}

// Cache-first strategy with stale-while-revalidate for images
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Return cached version immediately, update in background
      fetch(request).then(async (networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
      }).catch(() => { });

      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Image fetch failed:', error);

    // Return a placeholder image
    return new Response(
      '<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="#999">Imagen no disponible</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Network-first strategy with cache fallback for API requests
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(API_CACHE);

    // Try network first
    try {
      const networkResponse = await fetch(request);

      if (networkResponse.ok && request.method === 'GET') {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (networkError) {
      console.log('[SW] Network failed, trying cache');
    }

    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache available
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No hay conexión a internet',
        cached: false
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[SW] API request failed:', error);
    return new Response(
      JSON.stringify({ error: 'Service Error', message: 'Error inesperado' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Network-first strategy for dynamic content
async function handleDynamicRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);

    try {
      const networkResponse = await fetch(request);

      if (networkResponse.ok && request.method === 'GET') {
        cache.put(request, networkResponse.clone());
      }

      return networkResponse;
    } catch (networkError) {
      console.log('[SW] Network failed for dynamic request, trying cache');
    }

    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('[SW] Dynamic request failed:', error);
    return new Response('Error', { status: 500 });
  }
}

// Background sync functions
async function syncMealPlans() {
  try {
    const pendingData = await getFromIndexedDB('pending-meal-plans');

    for (const data of pendingData) {
      try {
        const response = await fetch('/api/meal-planning/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          await removeFromIndexedDB('pending-meal-plans', data.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync meal plan:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function syncRecipes() {
  try {
    const pendingData = await getFromIndexedDB('pending-recipes');

    for (const data of pendingData) {
      try {
        const response = await fetch('/api/recipes/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          await removeFromIndexedDB('pending-recipes', data.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync recipe:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Recipe sync failed:', error);
  }
}

// IndexedDB utilities
async function getFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('meal-planner-db', 1);

    request.onerror = () => resolve([]);
    request.onsuccess = () => {
      try {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          resolve([]);
          return;
        }
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const getRequest = store.getAll();

        getRequest.onsuccess = () => resolve(getRequest.result || []);
        getRequest.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    };
  });
}

async function removeFromIndexedDB(storeName, id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('meal-planner-db', 1);

    request.onerror = () => resolve();
    request.onsuccess = () => {
      try {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          resolve();
          return;
        }
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.delete(id);
        resolve();
      } catch (e) {
        resolve();
      }
    };
  });
}

console.log('[SW] Service Worker loaded successfully');