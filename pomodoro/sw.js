/**
 * Pomodoro Timer Service Worker
 * 
 * Provides offline functionality and background features for the PWA
 */

const CACHE_NAME = 'pomodoro-v1.1.0';
const urlsToCache = [
    '/pomodoro/',
    '/pomodoro/index.html',
    '/pomodoro/pomodoro.css',
    '/pomodoro/pomodoro-full.js',
    '/pomodoro/timer-manager.js',
    '/pomodoro/statistics.js',
    '/pomodoro/advanced-statistics.js',
    '/pomodoro/lock-screen.js',
    '/pomodoro/progress-ring.js',
    '/pomodoro/manifest.json',
    '/design_system/design-system.css',
    '/design_system/themes/theme-manager.js',
    '/design_system/components/snackbar.js',
    '/design_system/components/snackbar.css',
    // Chart.js CDN for offline support
    'https://cdn.jsdelivr.net/npm/chart.js',
    // Icons will be created next
    '/pomodoro/icon-72.png',
    '/pomodoro/icon-96.png',
    '/pomodoro/icon-128.png',
    '/pomodoro/icon-144.png',
    '/pomodoro/icon-152.png',
    '/pomodoro/icon-192.png',
    '/pomodoro/icon-384.png',
    '/pomodoro/icon-512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Pomodoro cache opened');
                
                // Cache files individually to handle missing files gracefully
                return Promise.all(
                    urlsToCache.map(url => 
                        cache.add(url).catch(err => {
                            console.warn(`Failed to cache ${url}:`, err.message);
                            // Don't fail the entire installation if one file is missing
                        })
                    )
                );
            })
            .catch((error) => {
                console.error('Cache installation failed:', error);
            })
    );
    
    // Force activation of new service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName.startsWith('pomodoro-') && cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Take control of all clients
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response for caching
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(() => {
                // Return offline fallback if available
                if (event.request.destination === 'document') {
                    return caches.match('/pomodoro/index.html');
                }
            })
    );
});

// Background sync for timer state
self.addEventListener('sync', (event) => {
    if (event.tag === 'timer-sync') {
        event.waitUntil(syncTimerState());
    }
});

async function syncTimerState() {
    try {
        // Sync timer state with server if needed
        // For now, we'll just ensure local storage is consistent
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_TIMER_STATE'
            });
        });
    } catch (error) {
        console.error('Timer sync failed:', error);
    }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;
    
    notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url.includes('/pomodoro/') && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Otherwise open new window
            if (clients.openWindow) {
                const url = action === 'start-break' ? 
                    '/pomodoro/?action=start-break' : 
                    '/pomodoro/';
                return clients.openWindow(url);
            }
        })
    );
});

// Handle push messages for future notifications
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body || 'Time to check your Pomodoro timer!',
            icon: '/pomodoro/icon-192.png',
            badge: '/pomodoro/icon-192.png',
            vibrate: [200, 100, 200],
            tag: 'pomodoro-notification',
            requireInteraction: true,
            actions: [
                {
                    action: 'open',
                    title: 'Open Timer',
                    icon: '/pomodoro/icon-192.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss',
                    icon: '/pomodoro/icon-192.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'Pomodoro Timer', options)
        );
    }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_UPDATE':
            // Update specific cache entries
            if (data && data.urls) {
                caches.open(CACHE_NAME).then(cache => {
                    data.urls.forEach(url => {
                        cache.add(url).catch(() => {
                            // Silently fail for missing resources
                        });
                    });
                });
            }
            break;
            
        case 'SYNC_REQUEST':
            // Request background sync
            if ('sync' in self.registration) {
                self.registration.sync.register('timer-sync');
            }
            break;
    }
});

// Periodic background sync for timer accuracy
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'timer-accuracy-check') {
        event.waitUntil(checkTimerAccuracy());
    }
});

async function checkTimerAccuracy() {
    try {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'CHECK_TIMER_ACCURACY',
                timestamp: Date.now()
            });
        });
    } catch (error) {
        console.error('Timer accuracy check failed:', error);
    }
}

// Register periodic sync for timer accuracy (if supported)
self.addEventListener('activate', (event) => {
    if ('periodicSync' in self.registration) {
        event.waitUntil(
            self.registration.periodicSync.register('timer-accuracy-check', {
                minInterval: 60 * 1000 // Every minute
            }).catch(() => {
                // Periodic sync not supported or permission denied
            })
        );
    }
});