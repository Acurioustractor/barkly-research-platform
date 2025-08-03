// Service Worker for Community Intelligence Platform
// Provides offline functionality, caching, and background sync

const CACHE_NAME = 'community-intelligence-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/community/',
  '/api/stories/',
  '/api/events/',
  '/api/intelligence/',
  '/api/progress/'
];

// Maximum cache sizes (in items)
const MAX_CACHE_SIZE = {
  [STATIC_CACHE]: 50,
  [DYNAMIC_CACHE]: 100,
  [API_CACHE]: 200
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  [STATIC_CACHE]: 7 * 24 * 60 * 60 * 1000, // 7 days
  [DYNAMIC_CACHE]: 24 * 60 * 60 * 1000,    // 1 day
  [API_CACHE]: 30 * 60 * 1000              // 30 minutes
};

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with cache fallback
    event.respondWith(handleAPIRequest(request));
  } else if (STATIC_FILES.includes(url.pathname) || url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
    // Static files - Cache First
    event.respondWith(handleStaticRequest(request));
  } else {
    // Dynamic content - Network First with cache fallback
    event.respondWith(handleDynamicRequest(request));
  }
});

// Handle API requests with Network First strategy
async function handleAPIRequest(request) {
  const cacheName = API_CACHE;
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName);
      const responseClone = networkResponse.clone();
      
      // Add timestamp for expiration checking
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cached-at': Date.now().toString()
        }
      });
      
      cache.put(request, responseWithTimestamp);
      await limitCacheSize(cacheName, MAX_CACHE_SIZE[cacheName]);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for API request, trying cache:', request.url);
    
    // Network failed, try cache
    const cachedResponse = await getCachedResponse(request, cacheName);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This data is not available offline',
        cached: false 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static requests with Cache First strategy
async function handleStaticRequest(request) {
  const cacheName = STATIC_CACHE;
  
  try {
    // Try cache first
    const cachedResponse = await getCachedResponse(request, cacheName);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Cache miss, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseClone = networkResponse.clone();
      
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cached-at': Date.now().toString()
        }
      });
      
      cache.put(request, responseWithTimestamp);
      await limitCacheSize(cacheName, MAX_CACHE_SIZE[cacheName]);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch static resource:', request.url);
    
    // Return a fallback for failed static resources
    if (request.url.includes('.png') || request.url.includes('.jpg') || request.url.includes('.jpeg')) {
      return new Response('', { status: 404 });
    }
    
    return new Response('Resource not available offline', { status: 404 });
  }
}

// Handle dynamic requests with Network First strategy
async function handleDynamicRequest(request) {
  const cacheName = DYNAMIC_CACHE;
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseClone = networkResponse.clone();
      
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cached-at': Date.now().toString()
        }
      });
      
      cache.put(request, responseWithTimestamp);
      await limitCacheSize(cacheName, MAX_CACHE_SIZE[cacheName]);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for dynamic request, trying cache:', request.url);
    
    // Network failed, try cache
    const cachedResponse = await getCachedResponse(request, cacheName);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    return new Response('Page not available offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Get cached response with expiration check
async function getCachedResponse(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (!cachedResponse) {
    return null;
  }
  
  // Check if cached response has expired
  const cachedAt = cachedResponse.headers.get('sw-cached-at');
  if (cachedAt) {
    const age = Date.now() - parseInt(cachedAt);
    const maxAge = CACHE_EXPIRATION[cacheName];
    
    if (age > maxAge) {
      console.log('Cached response expired:', request.url);
      await cache.delete(request);
      return null;
    }
  }
  
  return cachedResponse;
}

// Limit cache size by removing oldest entries
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
    console.log(`Cleaned up ${keysToDelete.length} entries from ${cacheName}`);
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    console.log('Processing background sync...');
    
    // Get pending sync data from IndexedDB
    const pendingData = await getPendingSyncData();
    
    for (const item of pendingData) {
      try {
        await processSyncItem(item);
        await removeSyncItem(item.id);
        console.log('Synced item:', item.id);
      } catch (error) {
        console.error('Failed to sync item:', item.id, error);
      }
    }
    
    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_COMPLETE',
        synced: pendingData.length
      });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Get pending sync data from IndexedDB
async function getPendingSyncData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CommunityIntelligenceSync', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingSync'], 'readonly');
      const store = transaction.objectStore('pendingSync');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingSync')) {
        const store = db.createObjectStore('pendingSync', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Process individual sync item
async function processSyncItem(item) {
  const { action, data, url, method } = item;
  
  const response = await fetch(url, {
    method: method || 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
  }
  
  return response;
}

// Remove sync item from IndexedDB
async function removeSyncItem(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CommunityIntelligenceSync', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  let notificationData = {
    title: 'Community Intelligence',
    body: 'You have a new update',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'community-update',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ]
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats);
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Get cache statistics
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = keys.length;
  }
  
  return stats;
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  console.log('All caches cleared');
}

// Periodic cleanup
setInterval(async () => {
  console.log('Running periodic cache cleanup...');
  
  try {
    await limitCacheSize(STATIC_CACHE, MAX_CACHE_SIZE[STATIC_CACHE]);
    await limitCacheSize(DYNAMIC_CACHE, MAX_CACHE_SIZE[DYNAMIC_CACHE]);
    await limitCacheSize(API_CACHE, MAX_CACHE_SIZE[API_CACHE]);
    
    console.log('Cache cleanup completed');
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}, 60 * 60 * 1000); // Run every hour