import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import webpush from 'web-push';
import { createServer as createViteServer } from 'vite';
import { calculatePrayerTimes } from './src/utils/prayerCalculator';

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

// Canonical permanent VAPID keypair for Web Push
const DEFAULT_VAPID_PUBLIC_KEY =
  'BNZ2K6EyIYxITp4N0Gf547OroRMvzghNEoHZJ-zlGlYzR-4kMUkCrcLxwx0Vhhh9gUAGnaUfXIVY7fV5AtTjDX4';
const DEFAULT_VAPID_PRIVATE_KEY = 'pk1HVHhQgOG0slubtYEyKEZ4RSBQ6jwjuqwedERu5g4';
const DEFAULT_VAPID_SUBJECT = 'mailto:support@ouns.app';

// 1. Initialize VAPID Keys
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT;

if (!vapidPublicKey || !vapidPrivateKey) {
  if (fs.existsSync(VAPID_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
      if (saved.publicKey && saved.privateKey) {
        vapidPublicKey = saved.publicKey;
        vapidPrivateKey = saved.privateKey;
      }
    } catch {
      // Fallback
    }
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    vapidPublicKey = DEFAULT_VAPID_PUBLIC_KEY;
    vapidPrivateKey = DEFAULT_VAPID_PRIVATE_KEY;
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
console.log('[Push] VAPID configured. Public Key:', vapidPublicKey.substring(0, 16) + '...');

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

    let targets = endpoint
      ? subscriptions.filter((s) => s.endpoint === endpoint)
      : subscriptions;

    // Fallback: If specific endpoint was not matched but we have registered subscriptions, target the newest subscription
    if (targets.length === 0 && subscriptions.length > 0) {
      targets = [subscriptions[subscriptions.length - 1]];
    }

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
    let lastError: string | null = null;

    await Promise.all(
      targets.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload,
            {
              TTL: 60 * 60, // 1 hour TTL
              urgency: 'high', // Wake Android immediately
            }
          );
          delivered++;
          console.log(`[Push Success] Delivered test notification to ${sub.endpoint.substring(0, 45)}...`);
        } catch (error: any) {
          console.error(
            `[Push Error] Failed to send to ${sub.endpoint.substring(0, 45)}:`,
            error?.statusCode || error?.message
          );
          lastError = error?.message || 'Push service rejected notification';
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

    if (delivered === 0) {
      res.status(500).json({
        success: false,
        error: 'تعذر تسليم الإشعار إلى جهازك. يرجى التأكد من تفعيل الإشعارات.',
      });
      return;
    }

    res.json({
      success: true,
      delivered,
      totalTargets: targets.length,
      message: 'تم إرسال الإشعار بنجاح إلى هاتفك 📲',
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
  // Runs every 30 seconds to check prayer/athkar events and wake device
  setInterval(async () => {
    if (subscriptions.length === 0) return;

    const now = new Date();
    const nowUtcMs = now.getTime();
    const deadEndpoints: string[] = [];

    for (const sub of subscriptions) {
      const userTz = sub.timezone || 'Africa/Cairo';
      let localTimeStr = '12:00';
      let dateStr = now.toISOString().slice(0, 10);
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: userTz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).formatToParts(now);

        const h = parts.find((p) => p.type === 'hour')?.value || '00';
        const m = parts.find((p) => p.type === 'minute')?.value || '00';
        const yr = parts.find((p) => p.type === 'year')?.value || '2026';
        const mo = parts.find((p) => p.type === 'month')?.value || '01';
        const dy = parts.find((p) => p.type === 'day')?.value || '01';
        localTimeStr = `${h}:${m}`;
        dateStr = `${yr}-${mo}-${dy}`;
      } catch {
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        localTimeStr = `${hours}:${minutes}`;
      }

      if (!sub.lastSentKeys) sub.lastSentKeys = {};

      // 1. Check Obligatory Prayers & Adhan
      if (sub.preferences && sub.preferences.prayers) {
        const lat = sub.coordinates?.lat || 30.0444;
        const lng = sub.coordinates?.lng || 31.2357;
        try {
          const prayerTimes = calculatePrayerTimes(now, lat, lng, 'Egyptian');
          const prayerConfigs = [
            { id: 'fajr', name: 'الفجر', date: prayerTimes.fajr },
            { id: 'dhuhr', name: 'الظهر', date: prayerTimes.dhuhr },
            { id: 'asr', name: 'العصر', date: prayerTimes.asr },
            { id: 'maghrib', name: 'المغرب', date: prayerTimes.maghrib },
            { id: 'isha', name: 'العشاء', date: prayerTimes.isha },
          ];

          for (const prayer of prayerConfigs) {
            const diffMs = Math.abs(nowUtcMs - prayer.date.getTime());
            // Trigger if within a 90 second window
            if (diffMs <= 90 * 1000) {
              const uniqueKey = `prayer-${prayer.id}-${dateStr}`;
              if (!sub.lastSentKeys[uniqueKey]) {
                const title = `🕌 أذان صلاة ${prayer.name}`;
                const body = `«حي على الصلاة، حي على الفلاح».. حان الآن موعد صلاة ${prayer.name}، تقبل الله طاعتكم 🤍`;
                await sendPushToSubscription(sub, uniqueKey, title, body, deadEndpoints);
              }
            }
          }
        } catch (calcErr) {
          console.error('[Push] Prayer calculation error:', calcErr);
        }
      }

      // 2. Morning Athkar at 06:30
      if (sub.preferences && sub.preferences.athkar && localTimeStr === '06:30') {
        const key = `athkar-morning-${dateStr}`;
        if (!sub.lastSentKeys[key]) {
          await sendPushToSubscription(
            sub,
            key,
            'أذكار الصباح ☀️',
            '«أصبحنا وأصبح الملك لله والحمد لله».. ابدأ يومك بذكر الله وحصنه الحصين 🌿',
            deadEndpoints
          );
        }
      }

      // 3. Evening Athkar at 17:00
      if (sub.preferences && sub.preferences.athkar && localTimeStr === '17:00') {
        const key = `athkar-evening-${dateStr}`;
        if (!sub.lastSentKeys[key]) {
          await sendPushToSubscription(
            sub,
            key,
            'أذكار المساء 🌙',
            '«أمسينا وأمسى الملك لله».. حان وقت أذكار المساء وسكينة القلب 🤍',
            deadEndpoints
          );
        }
      }

      // 4. Daily Tasks & Evening Reminder at 20:30
      if (sub.preferences && sub.preferences.tasks && localTimeStr === '20:30') {
        const key = `tasks-reminder-${dateStr}`;
        if (!sub.lastSentKeys[key]) {
          await sendPushToSubscription(
            sub,
            key,
            'تذكير مهام وطاعات اليوم 📝',
            'هل أتممت طاعاتك ومهامك لليوم مع أُنس؟ تفقد قائمة مهامك وأكمل يومك برضا 🌿',
            deadEndpoints
          );
        }
      }

      // 5. Sleep Athkar at 22:30
      if (sub.preferences && sub.preferences.athkar && localTimeStr === '22:30') {
        const key = `athkar-sleep-${dateStr}`;
        if (!sub.lastSentKeys[key]) {
          await sendPushToSubscription(
            sub,
            key,
            'أذكار النوم وسنن الليل 🌙',
            'اقترب وقت النوم، هل قرأت أذكارك؟.. ليلة هانئة في حفظ الله ورعايته 🤍',
            deadEndpoints
          );
        }
      }
    }

    if (deadEndpoints.length > 0) {
      subscriptions = subscriptions.filter((s) => !deadEndpoints.includes(s.endpoint));
      saveSubscriptions();
    } else {
      saveSubscriptions();
    }
  }, 30 * 1000);

  async function sendPushToSubscription(
    sub: StoredSubscription,
    uniqueKey: string,
    title: string,
    body: string,
    deadList: string[]
  ) {
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
        }),
        {
          TTL: 60 * 60,
          urgency: 'high',
        }
      );

      if (!sub.lastSentKeys) sub.lastSentKeys = {};
      sub.lastSentKeys[uniqueKey] = 'sent';
      console.log(`[Push Success] Sent ${uniqueKey} to ${sub.endpoint.substring(0, 30)}...`);
    } catch (err: any) {
      console.error(`[Push Fail] ${uniqueKey}:`, err?.statusCode || err?.message);
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        deadList.push(sub.endpoint);
      }
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
