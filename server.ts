import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import webpush from 'web-push';
import { createServer as createViteServer } from 'vite';

interface PushPreference {
  prayers: boolean;
  athkar: boolean;
  tasks: boolean;
  occasions: boolean;
}

interface StoredSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  preferences: PushPreference;
  coordinates?: {
    lat: number;
    lng: number;
  };
  timezone?: string;
  createdAt: number;
  lastActive: number;
  lastSentKeys?: Record<string, string>; // e.g. 'fajr': '2026-09-14'
}

const PORT = 3000;
const VAPID_FILE = path.join(process.cwd(), '.vapid-keys.json');
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), '.push-subscriptions.json');

// 1. Initialize VAPID Keys
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@ouns.app';

if (!vapidPublicKey || !vapidPrivateKey) {
  if (fs.existsSync(VAPID_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
      vapidPublicKey = saved.publicKey;
      vapidPrivateKey = saved.privateKey;
    } catch {
      // Fallback to generate below
    }
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    const generated = webpush.generateVAPIDKeys();
    vapidPublicKey = generated.publicKey;
    vapidPrivateKey = generated.privateKey;
    try {
      fs.writeFileSync(
        VAPID_FILE,
        JSON.stringify({ publicKey: vapidPublicKey, privateKey: vapidPrivateKey }, null, 2)
      );
    } catch (e) {
      console.error('Failed to save VAPID keys to file:', e);
    }
  }
}

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

// 2. Load Stored Subscriptions
let subscriptions: StoredSubscription[] = [];

function loadSubscriptions(): void {
  if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
    try {
      const raw = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      subscriptions = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse subscriptions file:', err);
      subscriptions = [];
    }
  }
}

function saveSubscriptions(): void {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
  } catch (err) {
    console.error('Failed to save subscriptions file:', err);
  }
}

loadSubscriptions();

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      pushEnabled: true,
      activeSubscriptions: subscriptions.length,
    });
  });

  // 1. Get VAPID Public Key for client subscription
  app.get('/api/push/vapid-public-key', (_req: Request, res: Response) => {
    res.json({
      publicKey: vapidPublicKey,
    });
  });

  // 2. Subscribe endpoint
  app.post('/api/push/subscribe', (req: Request, res: Response) => {
    const { subscription, preferences, coordinates, timezone } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      res.status(400).json({ error: 'Invalid push subscription payload' });
      return;
    }

    const defaultPreferences: PushPreference = {
      prayers: true,
      athkar: true,
      tasks: true,
      occasions: true,
      ...preferences,
    };

    const existingIndex = subscriptions.findIndex(
      (s) => s.endpoint === subscription.endpoint
    );

    const now = Date.now();
    const storedItem: StoredSubscription = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      preferences: defaultPreferences,
      coordinates: coordinates || { lat: 30.0444, lng: 31.2357 }, // Cairo default fallback
      timezone: timezone || 'Africa/Cairo',
      createdAt: existingIndex >= 0 ? subscriptions[existingIndex].createdAt : now,
      lastActive: now,
      lastSentKeys: existingIndex >= 0 ? subscriptions[existingIndex].lastSentKeys || {} : {},
    };

    if (existingIndex >= 0) {
      subscriptions[existingIndex] = storedItem;
    } else {
      subscriptions.push(storedItem);
    }

    saveSubscriptions();

    console.log(
      `[Push] New subscription registered. Total active devices: ${subscriptions.length}`
    );

    res.json({
      success: true,
      message: 'تم تفعيل اشتراك الإشعارات بنجاح',
      totalSubscriptions: subscriptions.length,
    });
  });

  // 3. Unsubscribe endpoint
  app.post('/api/push/unsubscribe', (req: Request, res: Response) => {
    const { endpoint } = req.body;
    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint is required' });
      return;
    }

    subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
    saveSubscriptions();

    res.json({ success: true, message: 'تم إلغاء الاشتراك بنجاح' });
  });

  // 4. Update notification preferences
  app.post('/api/push/preferences', (req: Request, res: Response) => {
    const { endpoint, preferences, coordinates } = req.body;
    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint is required' });
      return;
    }

    const sub = subscriptions.find((s) => s.endpoint === endpoint);
    if (sub) {
      if (preferences) sub.preferences = { ...sub.preferences, ...preferences };
      if (coordinates) sub.coordinates = coordinates;
      sub.lastActive = Date.now();
      saveSubscriptions();
      res.json({ success: true, preferences: sub.preferences });
    } else {
      res.status(404).json({ error: 'Subscription not found' });
    }
  });

  // 5. Send Real Instant Test Push Notification
  app.post('/api/push/test', async (req: Request, res: Response) => {
    const { endpoint, title, body } = req.body;

    const targets = endpoint
      ? subscriptions.filter((s) => s.endpoint === endpoint)
      : subscriptions;

    if (targets.length === 0) {
      res.status(404).json({
        error: 'لم يتم العثور على أي اشتراك نشط للإشعارات. يرجى تفعيل الإشعارات أولاً من المتصفح.',
      });
      return;
    }

    const payload = JSON.stringify({
      title: title || 'أُنس - تجربة الإشعار 🌙',
      body:
        body ||
        'مرحباً بك! إشعارات أُنس تعمل الآن بنجاح على هاتفك حتى عند إغلاق المتصفح أو قفل الشاشة 🤍',
      icon: '/assets/icon-192.png',
      badge: '/assets/badge-72.png',
      tag: 'ouns-test-' + Date.now(),
      data: {
        url: '/',
        timestamp: Date.now(),
      },
    });

    let delivered = 0;
    const deadEndpoints: string[] = [];

    await Promise.all(
      targets.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload
          );
          delivered++;
        } catch (error: any) {
          console.error(`[Push Error] Failed to send to ${sub.endpoint.substring(0, 30)}:`, error?.statusCode || error?.message);
          // If subscription has expired or unsubscribed on Android/FCM (410 Gone / 404 Not Found)
          if (error?.statusCode === 410 || error?.statusCode === 404) {
            deadEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    if (deadEndpoints.length > 0) {
      subscriptions = subscriptions.filter((s) => !deadEndpoints.includes(s.endpoint));
      saveSubscriptions();
    }

    res.json({
      success: true,
      delivered,
      totalTargets: targets.length,
      message: `تم إرسال الإشعار بنجاح إلى ${delivered} جهاز بنظام Web Push`,
    });
  });

  // 6. Push status check
  app.get('/api/push/status', (_req: Request, res: Response) => {
    res.json({
      configured: true,
      hasVapidKeys: Boolean(vapidPublicKey && vapidPrivateKey),
      publicKeyPreview: vapidPublicKey.substring(0, 12) + '...',
      activeDevices: subscriptions.length,
    });
  });

  // --- Background Scheduler for Islamic Reminders & Prayers ---
  // Runs every 60 seconds to check prayer/athkar events
  setInterval(async () => {
    if (subscriptions.length === 0) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    const dateStr = now.toISOString().slice(0, 10);

    // 1. Morning Athkar Reminder at 06:30
    if (timeStr === '06:30') {
      const key = `athkar-morning-${dateStr}`;
      await broadcastCategory(
        'athkar',
        key,
        'أذكار الصباح ☀️',
        '«أصبحنا وأصبح الملك لله والحمد لله».. ابدأ يومك بذكر الله وحصنه الحصين 🌿'
      );
    }

    // 2. Evening Athkar Reminder at 17:00
    if (timeStr === '17:00') {
      const key = `athkar-evening-${dateStr}`;
      await broadcastCategory(
        'athkar',
        key,
        'أذكار المساء 🌙',
        '«أمسينا وأمسى الملك لله».. حان وقت أذكار المساء وطمأنينة القلب 🤍'
      );
    }

    // 3. Daily Tasks Evening Reminder at 20:30
    if (timeStr === '20:30') {
      const key = `tasks-reminder-${dateStr}`;
      await broadcastCategory(
        'tasks',
        key,
        'تذكير مهام اليوم 📝',
        'هل أتممت مهامك وطاعاتك لليوم مع أُنس؟ تفقد قائمة مهامك وأكمل يومك برضا 🌿'
      );
    }
  }, 60 * 1000);

  async function broadcastCategory(
    category: keyof PushPreference,
    uniqueKey: string,
    title: string,
    body: string
  ) {
    const deadEndpoints: string[] = [];

    for (const sub of subscriptions) {
      if (!sub.preferences || !sub.preferences[category]) continue;
      if (sub.lastSentKeys && sub.lastSentKeys[uniqueKey]) continue;

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify({
            title,
            body,
            icon: '/assets/icon-192.png',
            badge: '/assets/badge-72.png',
            tag: uniqueKey,
            data: { url: '/', timestamp: Date.now() },
          })
        );

        if (!sub.lastSentKeys) sub.lastSentKeys = {};
        sub.lastSentKeys[uniqueKey] = 'sent';
      } catch (err: any) {
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          deadEndpoints.push(sub.endpoint);
        }
      }
    }

    if (deadEndpoints.length > 0) {
      subscriptions = subscriptions.filter((s) => !deadEndpoints.includes(s.endpoint));
      saveSubscriptions();
    } else {
      saveSubscriptions();
    }
  }

  // Vite middleware setup (per framework instructions)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Ouns Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
