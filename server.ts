import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import webpush from 'web-push';

// Astronomical calculations for Egyptian Survey Authority prayer times
function calculatePrayerTimes(
  year: number,
  month: number,
  day: number,
  lat: number,
  lon: number
): {
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
  const solarNoonUTC = 12 - lon / 15 - eot;

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
  const maghribHourUTC = solarNoonUTC + h0 / 15;

  // Egyptian survey: Fajr 19.5°, Isha 17.5°
  const hFajr = hourAngle(-19.5);
  const fajrHourUTC = solarNoonUTC - hFajr / 15;

  const asrAltitude = 90 - atanD(1 + tanD(Math.abs(lat - dec)));
  const hAsr = hourAngle(asrAltitude);
  const asrHourUTC = solarNoonUTC + hAsr / 15;

  const hIsha = hourAngle(-17.5);
  const ishaHourUTC = solarNoonUTC + hIsha / 15;

  function toUtcDate(hUtc: number): Date {
    const baseUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0);
    return new Date(baseUtcMs + Math.round(hUtc * 3600 * 1000));
  }

  return {
    fajr: toUtcDate(fajrHourUTC),
    dhuhr: toUtcDate(solarNoonUTC),
    asr: toUtcDate(asrHourUTC),
    maghrib: toUtcDate(maghribHourUTC),
    isha: toUtcDate(ishaHourUTC),
  };
}

// User local date/time extractor based on IANA timezone
function getUserLocalDateParts(date: Date, timeZone: string) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(date);
    const getVal = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    const year = parseInt(getVal('year'), 10);
    const month = parseInt(getVal('month'), 10);
    const day = parseInt(getVal('day'), 10);
    const rawHour = parseInt(getVal('hour'), 10);
    const hour = isNaN(rawHour) ? 0 : rawHour % 24;
    const minute = parseInt(getVal('minute'), 10);
    const second = parseInt(getVal('second'), 10);
    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    };
  } catch {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const hour = d.getUTCHours() % 24;
    const minute = d.getUTCMinutes();
    const second = d.getUTCSeconds();
    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    };
  }
}

interface StoredReminder {
  id: string;
  title: string;
  enabled: boolean;
  time: string; // HH:mm format, or 'حسب مواقيت الأذان'
  message: string;
  isPrayerTime?: boolean;
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
  reminders?: StoredReminder[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  timezone?: string;
  createdAt: number;
  lastActive: number;
  lastSentKeys?: Record<string, string>; // e.g. 'prayer-fajr-2026-09-22': '2026-09-22T02:16:50.000Z'
}

const DEFAULT_SERVER_REMINDERS: StoredReminder[] = [
  {
    id: 'rem-prayer',
    title: 'تنبيهات الصلوات الخمس',
    enabled: true,
    time: 'حسب مواقيت الأذان',
    message: 'حان وقت الصلاة 🤍.. استرح بها وأقبل على ربك بسكينة',
    isPrayerTime: true,
  },
  {
    id: 'rem-morning-adhkar',
    title: 'أذكار الصباح ☀️',
    enabled: true,
    time: '06:30',
    message: 'حان وقت أذكار الصباح 🌿.. ابدأ يومك بنور الذكر وحفظ الله',
  },
  {
    id: 'rem-quran',
    title: 'ورد القرآن الكريم 📖',
    enabled: true,
    time: '13:30',
    message: 'لا تنسَ وردك من القرآن اليوم 📖.. آيات تطيب بها الروح والقلب',
  },
  {
    id: 'rem-daily-worship',
    title: 'عبادة اليوم الموصى بها 🌿',
    enabled: false,
    time: '16:30',
    message: 'اجعل ليومك أثراً طيباً 🌿.. تفقد عبادة اليوم المقترحة في أُنس',
  },
  {
    id: 'rem-evening-adhkar',
    title: 'أذكار المساء 🌅',
    enabled: true,
    time: '17:30',
    message: 'حان وقت أذكار المساء 🌅.. استودع يومك عند الله بحصن الذكر',
  },
  {
    id: 'rem-sleep-adhkar',
    title: 'أذكار النوم وسنن الليل 🌙',
    enabled: true,
    time: '22:30',
    message: 'اقترب وقت النوم، هل قرأت أذكارك؟ 🌙.. ليلة هانئة في حفظ الرحمن',
  },
  {
    id: 'rem-witr',
    title: 'صلاة الوتر 🤍',
    enabled: true,
    time: '23:00',
    message: 'ركعة تضيء ظلمة الليل 🤍.. لا تحرم نفسك أجر الوتر ولو بركعة',
  },
];

const PORT = 3000;
const VAPID_FILE = path.join(process.cwd(), '.vapid-keys.json');
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), '.push-subscriptions.json');
const FALLBACK_SUBSCRIPTIONS_FILE = '/tmp/.push-subscriptions.json';

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

// 2. Load and Persist Subscriptions Robustly
let subscriptions: StoredSubscription[] = [];

function loadSubscriptions(): void {
  let primarySubs: StoredSubscription[] = [];
  let fallbackSubs: StoredSubscription[] = [];

  if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
    try {
      const raw = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        primarySubs = parsed;
      }
    } catch (err) {
      console.error('[Push Store] Error reading primary subscriptions:', err);
    }
  }

  if (fs.existsSync(FALLBACK_SUBSCRIPTIONS_FILE)) {
    try {
      const raw = fs.readFileSync(FALLBACK_SUBSCRIPTIONS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        fallbackSubs = parsed;
      }
    } catch (err) {
      console.error('[Push Store] Error reading fallback subscriptions:', err);
    }
  }

  // Merge subscriptions cleanly without losing any registered endpoint
  const mergedMap = new Map<string, StoredSubscription>();
  for (const s of fallbackSubs) {
    if (s && s.endpoint) mergedMap.set(s.endpoint, s);
  }
  for (const s of primarySubs) {
    if (s && s.endpoint) mergedMap.set(s.endpoint, s);
  }

  subscriptions = Array.from(mergedMap.values());
  console.log(
    `[Push Store] Loaded ${subscriptions.length} persistent subscriptions (Primary: ${primarySubs.length}, Fallback: ${fallbackSubs.length})`
  );
}

function saveSubscriptions(): boolean {
  let saved = false;
  // Deduplicate by endpoint
  const seen = new Set<string>();
  const deduped: StoredSubscription[] = [];
  for (const sub of subscriptions) {
    if (sub && sub.endpoint && !seen.has(sub.endpoint)) {
      seen.add(sub.endpoint);
      deduped.push(sub);
    }
  }
  subscriptions = deduped;

  const payload = JSON.stringify(subscriptions, null, 2);

  // Attempt 1: primary file with atomic rename
  try {
    const tmp = `${SUBSCRIPTIONS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmp, payload, 'utf-8');
    fs.renameSync(tmp, SUBSCRIPTIONS_FILE);
    saved = true;
  } catch (err) {
    console.warn('[Push Store] Primary atomic save failed, attempting direct write:', err);
    try {
      fs.writeFileSync(SUBSCRIPTIONS_FILE, payload, 'utf-8');
      saved = true;
    } catch (_e) {
      // Continue to fallback
    }
  }

  // Attempt 2: fallback file in /tmp with atomic rename
  try {
    const tmpFallback = `${FALLBACK_SUBSCRIPTIONS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFallback, payload, 'utf-8');
    fs.renameSync(tmpFallback, FALLBACK_SUBSCRIPTIONS_FILE);
    saved = true;
  } catch (err) {
    try {
      fs.writeFileSync(FALLBACK_SUBSCRIPTIONS_FILE, payload, 'utf-8');
      saved = true;
    } catch (_e) {
      // ignore
    }
  }

  return saved;
}

loadSubscriptions();

// 3. Unified Push Notification Delivery Engine
async function sendPushNotification(
  sub: StoredSubscription,
  notification: {
    title: string;
    body: string;
    tag?: string;
    url?: string;
  }
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  // Guaranteed non-empty title and body (Prevents empty notification cards)
  const finalTitle =
    notification.title && typeof notification.title === 'string' && notification.title.trim().length > 0
      ? notification.title.trim()
      : 'أُنس - رفيقك للعبادة 🌙';

  const finalBody =
    notification.body && typeof notification.body === 'string' && notification.body.trim().length > 0
      ? notification.body.trim()
      : 'حان الآن موعد ذكر الله والصلاة 🤍.. تقبل الله طاعتكم';

  const payload = JSON.stringify({
    title: finalTitle,
    body: finalBody,
    icon: '/assets/icon-192.png',
    badge: '/assets/badge-72.png',
    tag: notification.tag || 'ouns-' + Date.now(),
    data: {
      url: notification.url || '/',
      timestamp: Date.now(),
    },
  });

  try {
    const result = await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      },
      payload,
      {
        TTL: 24 * 60 * 60, // 24 hours so devices receive it upon reconnect
        urgency: 'high',   // High priority to wake Android Doze mode
      }
    );

    const deviceSnippet = sub.endpoint.substring(sub.endpoint.lastIndexOf('/') + 1, sub.endpoint.lastIndexOf('/') + 16) || sub.endpoint.substring(0, 20);
    console.log(
      `[Push Success] Delivered "${finalTitle}" to device ${deviceSnippet}... (Status: ${result.statusCode})`
    );
    return { success: true, statusCode: result.statusCode };
  } catch (err: any) {
    const statusCode = err?.statusCode || 500;
    const msg = err?.message || 'Push delivery failed';
    const deviceSnippet = sub.endpoint.substring(sub.endpoint.lastIndexOf('/') + 1, sub.endpoint.lastIndexOf('/') + 16) || sub.endpoint.substring(0, 20);
    console.error(
      `[Push Failed] Delivery failed to device ${deviceSnippet}... (Status: ${statusCode}, Reason: ${msg})`
    );
    return { success: false, error: msg, statusCode };
  }
}

// 4. Background Scheduler Engine for Prayers & Athkar
let lastSchedulerHeartbeat = 0;

interface SchedulerLogItem {
  time: string;
  type: 'HEARTBEAT' | 'CHECK' | 'TRIGGER' | 'SENT' | 'ERROR' | 'PURGE';
  device: string;
  details: string;
}

const recentSchedulerLogs: SchedulerLogItem[] = [];

function addSchedulerLog(
  type: 'HEARTBEAT' | 'CHECK' | 'TRIGGER' | 'SENT' | 'ERROR' | 'PURGE',
  device: string,
  details: string
) {
  const item: SchedulerLogItem = {
    time: new Date().toISOString(),
    type,
    device,
    details,
  };
  recentSchedulerLogs.unshift(item);
  if (recentSchedulerLogs.length > 200) {
    recentSchedulerLogs.length = 200;
  }
}

async function checkAndSendScheduledNotifications(): Promise<{
  checkedDevices: number;
  matchedCount: number;
  sentCount: number;
  failureCount: number;
}> {
  if (!subscriptions || subscriptions.length === 0) {
    return { checkedDevices: 0, matchedCount: 0, sentCount: 0, failureCount: 0 };
  }

  const now = new Date();
  const nowUtcMs = now.getTime();
  const deadEndpoints: string[] = [];
  let matchedCount = 0;
  let sentCount = 0;
  let failureCount = 0;
  let stateModified = false;

  // Periodic heartbeat log every 5 minutes
  if (nowUtcMs - lastSchedulerHeartbeat >= 5 * 60 * 1000) {
    lastSchedulerHeartbeat = nowUtcMs;
    const msg = `Active devices: ${subscriptions.length} | Checked at: ${now.toISOString()}`;
    console.log(`[Scheduler Heartbeat] ${msg}`);
    addSchedulerLog('HEARTBEAT', 'ALL', msg);
  }

  for (const sub of subscriptions) {
    if (!sub || !sub.endpoint || !sub.keys) continue;

    const userTz = sub.timezone || 'Africa/Cairo';
    const local = getUserLocalDateParts(now, userTz);
    const { year, month, day, hour, minute, dateStr } = local;
    const currentLocalMinutes = hour * 60 + minute;
    const devSnippet =
      sub.endpoint.substring(sub.endpoint.lastIndexOf('/') + 1, sub.endpoint.lastIndexOf('/') + 16) ||
      sub.endpoint.substring(0, 15);

    if (!sub.lastSentKeys) {
      sub.lastSentKeys = {};
      stateModified = true;
    }

    // Prune entries older than 7 days from lastSentKeys
    const cutoffDate = new Date(nowUtcMs - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    for (const key of Object.keys(sub.lastSentKeys)) {
      const parts = key.split('-');
      const itemDate = parts.slice(-3).join('-');
      if (itemDate && itemDate < cutoffDate) {
        delete sub.lastSentKeys[key];
        stateModified = true;
      }
    }

    // A. Obligatory Prayer Times & Adhan Notifications
    if (sub.preferences && sub.preferences.prayers !== false) {
      const lat = sub.coordinates?.lat || 30.0444;
      const lng = sub.coordinates?.lng || 31.2357;
      try {
        const prayerTimes = calculatePrayerTimes(year, month, day, lat, lng);
        const prayerConfigs = [
          { id: 'fajr', name: 'الفجر', date: prayerTimes.fajr },
          { id: 'dhuhr', name: 'الظهر', date: prayerTimes.dhuhr },
          { id: 'asr', name: 'العصر', date: prayerTimes.asr },
          { id: 'maghrib', name: 'المغرب', date: prayerTimes.maghrib },
          { id: 'isha', name: 'العشاء', date: prayerTimes.isha },
        ];

        for (const prayer of prayerConfigs) {
          const prayerMs = prayer.date.getTime();
          const diffMinutes = (nowUtcMs - prayerMs) / 60000;

          // Safe trigger window: from adhan time (-1 minute tolerance up to 25 minutes after)
          if (diffMinutes >= -1 && diffMinutes <= 25) {
            const uniqueKey = `prayer-${prayer.id}-${dateStr}`;
            if (!sub.lastSentKeys[uniqueKey]) {
              matchedCount++;
              const title = `🕌 أذان صلاة ${prayer.name}`;
              const body = `«حي على الصلاة، حي على الفلاح».. حان الآن موعد أذان ${prayer.name}، تقبل الله طاعتكم 🤍`;
              console.log(
                `[Scheduler Trigger] Matched prayer ${prayer.name} for device ${devSnippet} (${sub.timezone}) at ${local.timeStr}`
              );
              addSchedulerLog(
                'TRIGGER',
                devSnippet,
                `Matched prayer ${prayer.name} at local ${local.timeStr} (diff: ${diffMinutes.toFixed(1)}m)`
              );

              const sendRes = await sendPushNotification(sub, {
                title,
                body,
                tag: uniqueKey,
                url: '/',
              });

              if (sendRes.success) {
                sentCount++;
                sub.lastSentKeys[uniqueKey] = new Date().toISOString();
                sub.lastActive = nowUtcMs;
                stateModified = true;
                addSchedulerLog('SENT', devSnippet, `Delivered Adhan ${prayer.name} successfully (201)`);
              } else {
                failureCount++;
                addSchedulerLog('ERROR', devSnippet, `Failed Adhan ${prayer.name}: ${sendRes.error}`);
                if (sendRes.statusCode === 404 || sendRes.statusCode === 410) {
                  deadEndpoints.push(sub.endpoint);
                }
              }
            }
          }
        }
      } catch (prayerErr) {
        console.error('[Scheduler] Error calculating prayer times:', prayerErr);
      }
    }

    // B. Scheduled Athkar & Custom Worship Reminders
    const activeReminders =
      sub.reminders && sub.reminders.length > 0
        ? sub.reminders
        : DEFAULT_SERVER_REMINDERS;

    for (const rem of activeReminders) {
      if (!rem || rem.enabled === false || rem.isPrayerTime) continue;

      // Parse reminder time (HH:mm)
      const timeMatch = (rem.time || '').match(/^(\d{1,2}):(\d{2})$/);
      if (!timeMatch) continue;

      const remHour = parseInt(timeMatch[1], 10);
      const remMin = parseInt(timeMatch[2], 10);
      const reminderMinutes = remHour * 60 + remMin;
      let diffMinutes = currentLocalMinutes - reminderMinutes;

      // Wrap-around for midnight transitions (e.g., scheduled 23:59 checked at 00:01)
      if (diffMinutes < -720) {
        diffMinutes += 1440;
      } else if (diffMinutes > 720) {
        diffMinutes -= 1440;
      }

      // Safe trigger window: from scheduled time (-1 minute tolerance up to 25 minutes after)
      if (diffMinutes >= -1 && diffMinutes <= 25) {
        // Key includes rem.time so changing the time in tests creates a fresh, triggerable window
        const uniqueKey = `rem-${rem.id}-${rem.time}-${dateStr}`;
        if (!sub.lastSentKeys[uniqueKey]) {
          matchedCount++;
          const title = rem.title || 'أذكار وطاعات أُنس 🌙';
          const body = rem.message || 'حان وقت ذكر الله وطاعته 🤍.. تقبل الله منكم صالح الأعمال';
          console.log(
            `[Scheduler Trigger] Matched reminder "${title}" (${rem.time}) for device ${devSnippet} (${sub.timezone}) at ${local.timeStr} (diff: ${diffMinutes}m)`
          );
          addSchedulerLog(
            'TRIGGER',
            devSnippet,
            `Matched reminder "${title}" at scheduled ${rem.time} (current local: ${local.timeStr})`
          );

          const sendRes = await sendPushNotification(sub, {
            title,
            body,
            tag: uniqueKey,
            url: '/',
          });

          if (sendRes.success) {
            sentCount++;
            sub.lastSentKeys[uniqueKey] = new Date().toISOString();
            sub.lastActive = nowUtcMs;
            stateModified = true;
            addSchedulerLog('SENT', devSnippet, `Delivered reminder "${title}" successfully (201)`);
          } else {
            failureCount++;
            addSchedulerLog('ERROR', devSnippet, `Failed reminder "${title}": ${sendRes.error}`);
            if (sendRes.statusCode === 404 || sendRes.statusCode === 410) {
              deadEndpoints.push(sub.endpoint);
            }
          }
        }
      }
    }
  }

  // Remove stale / unsubscribed endpoints
  if (deadEndpoints.length > 0) {
    const prevCount = subscriptions.length;
    subscriptions = subscriptions.filter((s) => !deadEndpoints.includes(s.endpoint));
    console.log(
      `[Push Store] Cleaned up ${deadEndpoints.length} expired endpoints. Active devices: ${subscriptions.length} (was ${prevCount})`
    );
    addSchedulerLog('PURGE', 'CLEANUP', `Cleaned up ${deadEndpoints.length} expired devices`);
    saveSubscriptions();
  } else if (stateModified) {
    saveSubscriptions();
  }

  return {
    checkedDevices: subscriptions.length,
    matchedCount,
    sentCount,
    failureCount,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(express.text({ limit: '2mb', type: ['text/*', 'application/json'] }));

  // CORS and preflight headers for all environments (iframe, previews, mobile browsers)
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

  // Health and scheduler status endpoints
  app.get(['/api/health', '/api/ping'], (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      pushEnabled: true,
      activeSubscriptions: subscriptions.length,
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Get VAPID Public Key for client subscription (with aliases)
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

  // Verify if an endpoint is registered on the server
  const checkRoutes = ['/api/push/check', '/api/check', '/api/push/verify'];
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

  // 2. Subscribe endpoint (with aliases)
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
      const reminders = body.reminders;
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

      const existingIndex = subscriptions.findIndex((s) => s && s.endpoint === endpoint);
      const now = Date.now();
      const storedItem: StoredSubscription = {
        endpoint,
        keys: {
          p256dh: String(p256dh),
          auth: String(auth),
        },
        preferences: defaultPreferences,
        reminders: Array.isArray(reminders) && reminders.length > 0 ? reminders : (existingIndex >= 0 ? subscriptions[existingIndex].reminders : DEFAULT_SERVER_REMINDERS),
        coordinates:
          coordinates && typeof coordinates.lat === 'number'
            ? { lat: coordinates.lat, lng: coordinates.lng }
            : { lat: 30.0444, lng: 31.2357 },
        timezone: typeof timezone === 'string' && timezone.length > 0 ? timezone : 'Africa/Cairo',
        createdAt: existingIndex >= 0 ? subscriptions[existingIndex].createdAt || now : now,
        lastActive: now,
        lastSentKeys: existingIndex >= 0 ? subscriptions[existingIndex].lastSentKeys || {} : {},
      };

      if (existingIndex >= 0) {
        subscriptions[existingIndex] = storedItem;
      } else {
        subscriptions.push(storedItem);
      }

      const savedOk = saveSubscriptions();
      const deviceSnippet = endpoint.substring(endpoint.lastIndexOf('/') + 1, endpoint.lastIndexOf('/') + 16) || endpoint.substring(0, 20);
      console.log(
        `[Push Register] Device subscribed: ${deviceSnippet}... (Timezone: ${storedItem.timezone}, Saved: ${savedOk}, Total Devices: ${subscriptions.length})`
      );

      res.status(200).json({
        success: true,
        message: 'تم تفعيل وحفظ اشتراك الإشعارات بنجاح في خادم أُنس',
        registered: true,
        totalSubscriptions: subscriptions.length,
      });
    } catch (serverErr: any) {
      console.error('[Push Register Error]:', serverErr);
      res.status(500).json({
        error: 'حدث خطأ في الخادم أثناء معالجة وحفظ الاشتراك: ' + (serverErr?.message || 'خطأ غير معروف'),
      });
    }
  });

  // 3. Unsubscribe endpoint (with aliases)
  const unsubscribeRoutes = ['/api/push/unsubscribe', '/api/unsubscribe'];
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

  // 4. Update notification preferences & reminders (with aliases)
  const preferencesRoutes = ['/api/push/preferences', '/api/preferences'];
  app.post(preferencesRoutes, (req: Request, res: Response) => {
    try {
      const { endpoint, preferences, reminders, coordinates, timezone } = req.body || {};
      if (!endpoint) {
        res.status(400).json({ error: 'Endpoint is required' });
        return;
      }

      const sub = subscriptions.find((s) => s && s.endpoint === endpoint);
      if (sub) {
        if (preferences) sub.preferences = { ...sub.preferences, ...preferences };
        if (Array.isArray(reminders)) {
          sub.reminders = reminders;
          // Clear sent keys for today for any modified/enabled reminder so fresh user tests fire
          if (sub.lastSentKeys) {
            const todayStr = getUserLocalDateParts(new Date(), sub.timezone || 'Africa/Cairo').dateStr;
            for (const r of reminders) {
              const prefix = `rem-${r.id}-`;
              for (const k of Object.keys(sub.lastSentKeys)) {
                if (k.startsWith(prefix) && k.endsWith(todayStr)) {
                  // If reminder is enabled and time was updated, allow re-trigger
                  delete sub.lastSentKeys[k];
                }
              }
            }
          }
        }
        if (coordinates && typeof coordinates.lat === 'number') sub.coordinates = coordinates;
        if (timezone && typeof timezone === 'string' && timezone.length > 0) sub.timezone = timezone;
        sub.lastActive = Date.now();
        saveSubscriptions();
        addSchedulerLog(
          'CHECK',
          sub.endpoint.slice(-15),
          `Preferences updated: ${sub.reminders?.length || 0} reminders, TZ: ${sub.timezone}`
        );
        res.json({ success: true, preferences: sub.preferences, timezone: sub.timezone });
      } else {
        res.status(404).json({ error: 'Subscription not found on server' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Error updating preferences' });
    }
  });

  // 5. Send Real Instant Test Push Notification (with aliases)
  const testRoutes = ['/api/push/test', '/api/test'];
  app.post(testRoutes, async (req: Request, res: Response) => {
    const { endpoint, subscription, title, body, timezone } = req.body || {};

    let targets = endpoint
      ? subscriptions.filter((s) => s.endpoint === endpoint)
      : subscriptions;

    // If endpoint not in stored list, but client provided subscription keys, use it directly!
    if (targets.length === 0 && (subscription?.endpoint || endpoint)) {
      const ep = subscription?.endpoint || endpoint;
      const p256dh = subscription?.keys?.p256dh || req.body?.keys?.p256dh;
      const auth = subscription?.keys?.auth || req.body?.keys?.auth;
      if (ep && p256dh && auth) {
        const adhocSub: StoredSubscription = {
          endpoint: ep,
          keys: { p256dh: String(p256dh), auth: String(auth) },
          preferences: { prayers: true, athkar: true, tasks: true, occasions: true },
          reminders: DEFAULT_SERVER_REMINDERS,
          coordinates: { lat: 30.0444, lng: 31.2357 },
          timezone: timezone || subscription?.timezone || 'Africa/Cairo',
          createdAt: Date.now(),
          lastActive: Date.now(),
          lastSentKeys: {},
        };
        // Auto-save so future scheduled pushes reach it too
        subscriptions.push(adhocSub);
        saveSubscriptions();
        targets = [adhocSub];
      }
    }

    // Sync timezone to existing target subscriptions if provided
    if (timezone && typeof timezone === 'string' && targets.length > 0) {
      for (const t of targets) {
        t.timezone = timezone;
      }
      saveSubscriptions();
    }

    if (targets.length === 0 && subscriptions.length > 0) {
      targets = [subscriptions[subscriptions.length - 1]];
    }

    if (targets.length === 0) {
      res.status(404).json({
        error: 'لم يتم العثور على أي اشتراك نشط للإشعارات. يرجى تفعيل الإشعارات أولاً من المتصفح.',
      });
      return;
    }

    let delivered = 0;
    const deadEndpoints: string[] = [];
    let lastError: string | null = null;
    let hadExpired = false;

    for (const sub of targets) {
      const result = await sendPushNotification(sub, {
        title: title || 'أُنس - تجربة الإشعار 🌙',
        body:
          body ||
          'مرحباً بك! إشعارات أُنس تعمل الآن بنجاح على هاتفك حتى عند إغلاق المتصفح أو قفل الشاشة 🤍',
        tag: 'ouns-test-' + Date.now(),
        url: '/',
      });

      if (result.success) {
        delivered++;
        addSchedulerLog('SENT', sub.endpoint.slice(-15), 'Manual instant test delivered successfully (201)');
      } else {
        lastError = result.error || 'فشل إرسال الإشعار';
        addSchedulerLog('ERROR', sub.endpoint.slice(-15), `Manual test push failed: ${lastError}`);
        if (result.statusCode === 404 || result.statusCode === 410) {
          deadEndpoints.push(sub.endpoint);
          hadExpired = true;
        }
      }
    }

    if (deadEndpoints.length > 0) {
      subscriptions = subscriptions.filter((s) => !deadEndpoints.includes(s.endpoint));
      saveSubscriptions();
    }

    if (delivered > 0) {
      res.json({
        success: true,
        message: `تم إرسال الإشعار التجريبي بنجاح إلى هاتفك (${delivered} جهاز)`,
        delivered,
      });
    } else {
      const statusCode = hadExpired ? 410 : 500;
      res.status(statusCode).json({
        success: false,
        expired: hadExpired,
        error: hadExpired
          ? 'انتهت صلاحية اشتراك الجهاز لدى خادم الإشعارات (FCM)، جارٍ التجديد التلقائي...'
          : `تعذر تسليم الإشعار التجريبي إلى الجهاز: ${lastError}`,
      });
    }
  });

  // 6. Manual trigger and diagnostics for background scheduler
  app.post('/api/push/scheduler/run', async (_req: Request, res: Response) => {
    try {
      const result = await checkAndSendScheduledNotifications();
      res.json({
        success: true,
        report: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Error running scheduler' });
    }
  });

  // 7. Get Recent Scheduler Execution Logs for full transparency
  app.get('/api/push/scheduler/logs', (_req: Request, res: Response) => {
    res.json({
      success: true,
      totalLogs: recentSchedulerLogs.length,
      logs: recentSchedulerLogs,
    });
  });

  app.get('/api/push/scheduler/status', (_req: Request, res: Response) => {
    const now = new Date();
    const overview = subscriptions.map((s) => {
      const local = getUserLocalDateParts(now, s.timezone || 'Africa/Cairo');
      return {
        endpoint: s.endpoint.substring(0, 30) + '...',
        timezone: s.timezone || 'Africa/Cairo',
        userLocalTime: local.timeStr,
        userLocalDate: local.dateStr,
        prayersEnabled: s.preferences?.prayers ?? true,
        athkarEnabled: s.preferences?.athkar ?? true,
        remindersCount: s.reminders?.length || DEFAULT_SERVER_REMINDERS.length,
        sentKeysToday: Object.keys(s.lastSentKeys || {}).filter((k) => k.endsWith(local.dateStr)),
      };
    });

    res.json({
      totalDevices: subscriptions.length,
      currentServerTimeUtc: now.toISOString(),
      devices: overview,
    });
  });

  // Start Background Scheduler Loop (runs every 25 seconds)
  setInterval(async () => {
    try {
      await checkAndSendScheduledNotifications();
    } catch (schedErr) {
      console.error('[Scheduler Error]:', schedErr);
    }
  }, 25 * 1000);

  // Initial trigger 5 seconds after boot to catch any due events
  setTimeout(async () => {
    try {
      await checkAndSendScheduledNotifications();
    } catch (e) {
      console.warn('[Initial Scheduler Check Error]:', e);
    }
  }, 5000);

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
