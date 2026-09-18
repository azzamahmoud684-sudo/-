import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import webpush from 'web-push';

// Astronomical calculations for Egyptian Survey Authority prayer times
function calculatePrayerTimes(date: Date, lat: number, lon: number): {
  fajr: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
} {
  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;
  const sinD = (deg: number) => Math.sin(deg * D2R);
  const cosD = (deg: number) => Math.cos(deg * D2R);
  const tanD = (deg: number) => Math.tan(deg * D2R);
  const asinD = (x: number) => Math.asin(x) * R2D;
  const acosD = (x: number) => Math.acos(x) * R2D;
  const atanD = (x: number) => Math.atan(x) * R2D;
  const fixHour = (h: number) => ((h % 24) + 24) % 24;

  const tzOffset = -date.getTimezoneOffset() / 60;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  const d = jdn - 2451545.0 + 0.5;

  const g = (357.529 + 0.98560028 * d) % 360;
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = (q + 1.915 * sinD(g) + 0.02 * sinD(2 * g)) % 360;
  const e = 23.439 - 0.00000036 * d;

  const sinDec = sinD(e) * sinD(L);
  const dec = asinD(sinDec);
  let RA = atanD(cosD(e) * tanD(L));
  if (L >= 0 && L < 180) {
    if (RA < 0) RA += 180;
  } else {
    if (RA > 0) RA += 180;
    else RA += 360;
  }

  const eot = (q - RA) / 15;
  const solarNoon = 12 + tzOffset - lon / 15 - eot;

  function hourAngle(alpha: number): number {
    const top = sinD(alpha) - sinD(lat) * sinD(dec);
    const bottom = cosD(lat) * cosD(dec);
    const val = top / bottom;
    if (val > 1) return 0;
    if (val < -1) return 180;
    return acosD(val);
  }

  const sunRiseSetAngle = -0.833;
  const h0 = hourAngle(sunRiseSetAngle);
  const maghribHour = solarNoon + h0 / 15;

  // Egyptian survey: Fajr 19.5°, Isha 17.5°
  const hFajr = hourAngle(-19.5);
  const fajrHour = solarNoon - hFajr / 15;

  const asrAltitude = 90 - atanD(1 + tanD(Math.abs(lat - dec)));
  const hAsr = hourAngle(asrAltitude);
  const asrHour = solarNoon + hAsr / 15;

  const hIsha = hourAngle(-17.5);
  const ishaHour = solarNoon + hIsha / 15;

  function hourToDate(h: number): Date {
    const fixedH = fixHour(h);
    const hours = Math.floor(fixedH);
    const minsFloat = (fixedH - hours) * 60;
    const minutes = Math.floor(minsFloat);
    const seconds = Math.floor((minsFloat - minutes) * 60);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  return {
    fajr: hourToDate(fajrHour),
    dhuhr: hourToDate(solarNoon),
    asr: hourToDate(asrHour),
    maghrib: hourToDate(maghribHour),
    isha: hourToDate(ishaHour),
  };
}

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
const FALLBACK_SUBSCRIPTIONS_FILE = '/tmp/.push-subscriptions.json';

function loadSubscriptions(): void {
  let loaded = false;
  // Try primary location first
  if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
    try {
      const raw = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        subscriptions = parsed;
        loaded = true;
      }
    } catch (err) {
      console.error('Failed to parse primary subscriptions file:', err);
    }
  }

  // If not loaded or empty, try fallback location
  if (!loaded && fs.existsSync(FALLBACK_SUBSCRIPTIONS_FILE)) {
    try {
      const raw = fs.readFileSync(FALLBACK_SUBSCRIPTIONS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        subscriptions = parsed;
      }
    } catch (err) {
      console.error('Failed to parse fallback subscriptions file:', err);
    }
  }
}

function saveSubscriptions(): boolean {
  let saved = false;
  const payload = JSON.stringify(subscriptions, null, 2);

  // Attempt 1: primary file
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, payload);
    saved = true;
  } catch (err) {
    console.warn('Failed to save to primary subscriptions file, attempting fallback:', err);
  }

  // Attempt 2: fallback file in /tmp
  try {
    fs.writeFileSync(FALLBACK_SUBSCRIPTIONS_FILE, payload);
    saved = true;
  } catch (err) {
    console.error('Failed to save to fallback subscriptions file:', err);
  }

  return saved;
}

loadSubscriptions();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(express.text({ limit: '2mb', type: ['text/*', 'application/json'] }));

  // CORS and preflight headers for all environments (iframe, previews, dev, mobile)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Health check endpoint
  app.get(['/api/health', '/api/ping'], (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      pushEnabled: true,
      activeSubscriptions: subscriptions.length,
    });
  });

  // 1. Get VAPID Public Key for client subscription (with all common aliases)
  const vapidRoutes = [
    '/api/push/vapid-public-key',
    '/api/push/public-key',
    '/api/vapid-public-key',
    '/api/public-key',
    '/api/vapidPublicKey',
  ];
  app.get(vapidRoutes, (_req: Request, res: Response) => {
    res.json({
      publicKey: vapidPublicKey,
    });
  });

  // Check / Verify if an endpoint is already registered and saved on the server
  const checkRoutes = [
    '/api/push/check',
    '/api/check',
    '/api/push/verify',
  ];
  app.post(checkRoutes, (req: Request, res: Response) => {
    const { endpoint } = req.body || {};
    if (!endpoint || typeof endpoint !== 'string') {
      res.json({ registered: false, error: 'Endpoint is required' });
      return;
    }
    const isRegistered = subscriptions.some((s) => s && s.endpoint === endpoint);
    res.json({
      registered: isRegistered,
      totalDevices: subscriptions.length,
    });
  });

  // 2. Subscribe endpoint (with all common aliases)
  const subscribeRoutes = [
    '/api/push/subscribe',
    '/api/subscribe',
    '/api/push/subscriptions',
    '/api/subscriptions',
  ];
  app.post(subscribeRoutes, (req: Request, res: Response) => {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          // ignore
        }
      }

      if (!body) {
        res.status(400).json({ error: 'لم يتم استلام بيانات في الطلب (Empty payload)' });
        return;
      }

      const subscription = body.subscription || body;
      const preferences = body.preferences;
      const coordinates = body.coordinates;
      const timezone = body.timezone;

      const endpoint = subscription?.endpoint;
      const p256dh =
        subscription?.keys?.p256dh ||
        body?.keys?.p256dh ||
        subscription?.p256dh ||
        body?.p256dh;
      const auth =
        subscription?.keys?.auth ||
        body?.keys?.auth ||
        subscription?.auth ||
        body?.auth;

      if (!endpoint || typeof endpoint !== 'string') {
        res.status(400).json({
          error: 'بيانات الاشتراك غير مكتملة: رابط التنبيه الخاص بالجهاز (Endpoint) غير متوفر',
        });
        return;
      }

      if (!p256dh || !auth) {
        res.status(400).json({
          error: 'بيانات الاشتراك غير مكتملة: مفاتيح التشفير (p256dh أو auth) غير متوفرة من متصفح الهاتف',
        });
        return;
      }

      const defaultPreferences: PushPreference = {
        prayers: true,
        athkar: true,
        tasks: true,
        occasions: true,
        ...(preferences || {}),
      };

      if (!Array.isArray(subscriptions)) {
        subscriptions = [];
      }

      const existingIndex = subscriptions.findIndex(
        (s) => s && s.endpoint === endpoint
      );

      const now = Date.now();
      const storedItem: StoredSubscription = {
        endpoint,
        keys: {
          p256dh: String(p256dh),
          auth: String(auth),
        },
        preferences: defaultPreferences,
        coordinates: coordinates && typeof coordinates.lat === 'number'
          ? { lat: coordinates.lat, lng: coordinates.lng }
          : { lat: 30.0444, lng: 31.2357 }, // Cairo default fallback
        timezone: typeof timezone === 'string' && timezone.length > 0 ? timezone : 'Africa/Cairo',
        createdAt: existingIndex >= 0 ? (subscriptions[existingIndex].createdAt || now) : now,
        lastActive: now,
        lastSentKeys: existingIndex >= 0 ? (subscriptions[existingIndex].lastSentKeys || {}) : {},
      };

      if (existingIndex >= 0) {
        subscriptions[existingIndex] = storedItem;
      } else {
        subscriptions.push(storedItem);
      }

      const savedOk = saveSubscriptions();
      console.log(
        `[Push Server] Subscription registered successfully (Persisted: ${savedOk}). Total active devices: ${subscriptions.length}`
      );

      res.status(200).json({
        success: true,
        message: 'تم تفعيل وحفظ اشتراك الإشعارات بنجاح في خادم أُنس',
        registered: true,
        totalSubscriptions: subscriptions.length,
      });
    } catch (serverErr: any) {
      console.error('[Push Server Error in /api/push/subscribe]:', serverErr);
      res.status(500).json({
        error: 'حدث خطأ في الخادم أثناء معالجة وحفظ الاشتراك: ' + (serverErr?.message || 'خطأ غير معروف'),
      });
    }
  });

  // 3. Unsubscribe endpoint (with aliases)
  const unsubscribeRoutes = [
    '/api/push/unsubscribe',
    '/api/unsubscribe',
  ];
  app.post(unsubscribeRoutes, (req: Request, res: Response) => {
    try {
      const { endpoint } = req.body || {};
      if (!endpoint) {
        res.status(400).json({ error: 'Endpoint is required' });
        return;
      }

      subscriptions = subscriptions.filter((s) => s && s.endpoint !== endpoint);
      saveSubscriptions();

      res.json({ success: true, message: 'تم إلغاء الاشتراك بنجاح من الخادم' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Error unsubscribing' });
    }
  });

  // 4. Update notification preferences (with aliases)
  const preferencesRoutes = [
    '/api/push/preferences',
    '/api/preferences',
  ];
  app.post(preferencesRoutes, (req: Request, res: Response) => {
    try {
      const { endpoint, preferences, coordinates } = req.body || {};
      if (!endpoint) {
        res.status(400).json({ error: 'Endpoint is required' });
        return;
      }

      const sub = subscriptions.find((s) => s && s.endpoint === endpoint);
      if (sub) {
        if (preferences) sub.preferences = { ...sub.preferences, ...preferences };
        if (coordinates && typeof coordinates.lat === 'number') sub.coordinates = coordinates;
        sub.lastActive = Date.now();
        saveSubscriptions();
        res.json({ success: true, preferences: sub.preferences });
      } else {
        res.status(404).json({ error: 'Subscription not found on server' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Error updating preferences' });
    }
  });

  // 5. Send Real Instant Test Push Notification (with aliases)
  const testRoutes = [
    '/api/push/test',
    '/api/test',
  ];
  app.post(testRoutes, async (req: Request, res: Response) => {
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
          const prayerTimes = calculatePrayerTimes(now, lat, lng);
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
      if (
        err?.statusCode === 410 ||
        err?.statusCode === 404 ||
        (typeof err?.message === 'string' && (err.message.includes('key') || err.message.includes('p256dh') || err.message.includes('auth')))
      ) {
        deadList.push(sub.endpoint);
      }
    }
  }

  // Vite middleware setup (per framework instructions)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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
