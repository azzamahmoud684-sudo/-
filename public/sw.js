// Service Worker for Real Android Web Push Notifications - أُنس
const SW_VERSION = '1.0.0';

self.addEventListener('install', (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all active clients
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push message even when the website/browser is closed
self.addEventListener('push', (event) => {
  let data = {
    title: 'أُنس - رفيقك للعبادة 🌙',
    body: 'حان الآن موعد ذكر الله والصلاة',
    icon: '/assets/icon-192.png',
    badge: '/assets/badge-72.png',
    tag: 'ouns-notification',
    data: {
      url: '/',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'فتح التطبيق 📖' },
      { action: 'dismiss', title: 'إغلاق ✕' },
    ],
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/assets/icon-192.png',
    badge: data.badge || '/assets/badge-72.png',
    image: data.image,
    vibrate: [150, 80, 150, 80, 250],
    data: data.data || { url: '/' },
    tag: data.tag || 'ouns-notification-' + Date.now(),
    renotify: true,
    requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : false,
    silent: false,
    actions: data.actions || [
      { action: 'open', title: 'فتح أُنس 📖' },
      { action: 'dismiss', title: 'تم ✓' },
    ],
    dir: 'rtl',
    lang: 'ar',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Handle user clicking on the notification on their phone
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // If user tapped dismiss, just close
  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with our app
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && urlToOpen !== '/') {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
