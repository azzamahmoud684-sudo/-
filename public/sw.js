// Service Worker for Real Android Web Push Notifications - أُنس
const SW_VERSION = '2.1.0';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for existing clients
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all active clients immediately
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push message even when the website/browser is closed
self.addEventListener('push', (event) => {
  let parsedPayload = null;

  if (event.data) {
    try {
      parsedPayload = event.data.json();
    } catch (_jsonErr) {
      try {
        const text = event.data.text();
        if (text && text.trim().length > 0) {
          // If text happens to be a JSON string
          if (text.startsWith('{') && text.endsWith('}')) {
            try {
              parsedPayload = JSON.parse(text);
            } catch {
              parsedPayload = { body: text.trim() };
            }
          } else {
            parsedPayload = { body: text.trim() };
          }
        }
      } catch (_textErr) {
        parsedPayload = null;
      }
    }
  }

  // 1. Guaranteed Non-Empty Title
  let rawTitle = parsedPayload && parsedPayload.title;
  let finalTitle =
    typeof rawTitle === 'string' && rawTitle.trim().length > 0
      ? rawTitle.trim()
      : 'أُنس - رفيقك للعبادة 🌙';

  // 2. Guaranteed Non-Empty Body (Prevents blank/empty notification cards)
  let rawBody = parsedPayload && parsedPayload.body;
  let finalBody =
    typeof rawBody === 'string' && rawBody.trim().length > 0
      ? rawBody.trim()
      : 'حان الآن موعد ذكر الله والصلاة 🤍.. تقبل الله طاعتكم';

  // 3. Absolute icon and badge URLs (Required for reliable display on some Android OEMs)
  const origin = self.location.origin;
  const iconUrl = new URL(
    (parsedPayload && parsedPayload.icon) || '/assets/icon-192.png',
    origin
  ).href;
  const badgeUrl = new URL(
    (parsedPayload && parsedPayload.badge) || '/assets/badge-72.png',
    origin
  ).href;

  const tag =
    (parsedPayload && parsedPayload.tag) ||
    'ouns-notification-' + Date.now();

  const urlToOpen =
    (parsedPayload && parsedPayload.data && parsedPayload.data.url) || '/';

  const notificationOptions = {
    body: finalBody,
    icon: iconUrl,
    badge: badgeUrl,
    vibrate: [200, 100, 200, 100, 300],
    data: {
      url: urlToOpen,
      timestamp: Date.now(),
    },
    tag: tag,
    renotify: true,
    requireInteraction: false,
    silent: false,
    actions: [
      { action: 'open', title: 'فتح أُنس 📖' },
      { action: 'dismiss', title: 'إغلاق ✕' },
    ],
    dir: 'rtl',
    lang: 'ar',
  };

  event.waitUntil(
    self.registration.showNotification(finalTitle, notificationOptions)
  );
});

// Handle subscription renewal when browser/FCM expires it
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const options = event.oldSubscription ? event.oldSubscription.options : { userVisibleOnly: true };
        const newSub = await self.registration.pushManager.subscribe(options);
        const subData = {
          endpoint: newSub.endpoint,
          keys: {
            p256dh: newSub.getKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(newSub.getKey('p256dh')))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : '',
            auth: newSub.getKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(newSub.getKey('auth')))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : '',
          },
        };
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subData }),
        });
        console.log('[SW] Successfully renewed subscription after pushsubscriptionchange');
      } catch (err) {
        console.error('[SW] Failed to renew subscription:', err);
      }
    })()
  );
});

// Handle user clicking on the notification on their phone
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // If user tapped dismiss action, just close
  if (event.action === 'dismiss') {
    return;
  }

  const origin = self.location.origin;
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';
  const targetUrl = new URL(urlToOpen, origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If an open window of our app already exists, focus it
        for (const client of windowClients) {
          if (client.url.startsWith(origin) && 'focus' in client) {
            if ('navigate' in client && client.url !== targetUrl) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
