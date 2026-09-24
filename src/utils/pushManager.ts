/**
 * Web Push Notification Client Manager for Android & Modern Browsers
 * Integrates with W3C Push API, Service Worker, and Ouns Backend
 */

import { loadReminders } from './storage';
import type { ReminderSetting } from '../types';

export interface PushPreferences {
  prayers: boolean;
  athkar: boolean;
  tasks: boolean;
  occasions: boolean;
}

export interface PushStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  endpoint?: string;
  preferences: PushPreferences;
}

const PREFS_STORAGE_KEY = 'ouns_push_preferences_v1';

export const DEFAULT_PREFERENCES: PushPreferences = {
  prayers: true,
  athkar: true,
  tasks: true,
  occasions: true,
};

/**
 * Checks if the browser supports real Web Push notifications
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Gets current Notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission;
  }
  return 'default';
}

/**
 * Canonical fallback VAPID Public Key (uncompressed P-256 ECDSA key)
 * Guaranteed to match backend server and valid for Google FCM Web Push
 */
export const DEFAULT_VAPID_PUBLIC_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as Record<string, any>).env?.VITE_VAPID_PUBLIC_KEY) ||
  'BNZ2K6EyIYxITp4N0Gf547OroRMvzghNEoHZJ-zlGlYzR-4kMUkCrcLxwx0Vhhh9gUAGnaUfXIVY7fV5AtTjDX4';

/**
 * Decodes URL-safe base64 string to Uint8Array for VAPID applicationServerKey
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const cleaned = (base64String || '').trim();
  const padding = '='.repeat((4 - (cleaned.length % 4)) % 4);
  const base64 = (cleaned + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers the Service Worker at root scope /sw.js
 */
export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    // Wait for the service worker to become ready
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('[Push] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Fetches the backend VAPID public key with reliable fallback
 */
export async function fetchVapidPublicKey(): Promise<string> {
  const endpoints = [
    '/api/push/vapid-public-key',
    '/api/vapid-public-key',
    '/api/push/public-key',
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        if (
          data.publicKey &&
          typeof data.publicKey === 'string' &&
          data.publicKey.trim().length > 20
        ) {
          return data.publicKey.trim();
        }
      }
    } catch (err) {
      console.warn(`[Push] Failed to get VAPID key from ${ep}:`, err);
    }
  }

  return DEFAULT_VAPID_PUBLIC_KEY;
}

/**
 * Gets the current active PushSubscription if already subscribed
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.error('[Push] Error checking current subscription:', err);
    return null;
  }
}

/**
 * Loads stored notification preferences
 */
export function loadSavedPreferences(): PushPreferences {
  try {
    const saved = localStorage.getItem(PREFS_STORAGE_KEY);
    if (saved) return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
  } catch {
    // Fallback
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Saves notification preferences to localStorage
 */
export function savePreferencesLocally(prefs: PushPreferences): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore
  }
}

/**
 * Helper to convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Robustly extracts subscription payload with guaranteed keys
 */
export function extractSubscriptionPayload(subscription: PushSubscription): {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
} {
  const json = subscription.toJSON();
  let p256dh = json.keys?.p256dh || '';
  let auth = json.keys?.auth || '';

  // Fallback to direct getKey if toJSON() omitted keys
  if (!p256dh && typeof subscription.getKey === 'function') {
    try {
      const raw = subscription.getKey('p256dh');
      p256dh = arrayBufferToBase64(raw);
    } catch (e) {
      console.warn('[Push] Error getting p256dh key via getKey():', e);
    }
  }

  if (!auth && typeof subscription.getKey === 'function') {
    try {
      const raw = subscription.getKey('auth');
      auth = arrayBufferToBase64(raw);
    } catch (e) {
      console.warn('[Push] Error getting auth key via getKey():', e);
    }
  }

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh,
      auth,
    },
  };
}

/**
 * Subscribes the device to real Android Web Push notifications
 */
export async function subscribeToWebPush(
  preferences: PushPreferences = loadSavedPreferences(),
  coordinates?: { lat: number; lng: number },
  customReminders?: ReminderSetting[]
): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
  if (!isPushSupported()) {
    return {
      success: false,
      error: 'المتصفح الحالي لا يدعم التنبيهات المباشرة. يُفضّل استخدام متصفح كروم على الهاتف.',
    };
  }

  try {
    // 1. Request user permission if not already granted
    let permission = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
    if (permission !== 'granted' && typeof window !== 'undefined' && 'Notification' in window && Notification.requestPermission) {
      try {
        permission = await Notification.requestPermission();
      } catch {
        // Fallback for some browsers
      }
    }

    if (permission !== 'granted') {
      return {
        success: false,
        error:
          permission === 'denied'
            ? 'إذن الإشعارات محظور في إعدادات متصفحك. يرجى الضغط على علامة القفل 🔒 أو إعدادات الموقع بجانب الرابط وتغيير الإشعارات إلى (السماح / Allow).'
            : 'لم يتم منح إذن الإشعارات.',
      };
    }

    // 2. Ensure Service Worker is registered
    const registration = await registerPushServiceWorker();
    if (!registration) {
      return { success: false, error: 'تعذر إعداد نظام التنبيهات في المتصفح.' };
    }

    // 3. Fetch VAPID public key
    const publicKey = await fetchVapidPublicKey();
    if (!publicKey || publicKey.trim().length < 20) {
      return { success: false, error: 'تعذر إتمام الاتصال بخدمة التنبيهات.' };
    }

    // 4. Decode key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // 5. Always ensure a fresh, active FCM subscription
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      console.log('[Push] Refreshing push subscription with fresh FCM token...');
      try {
        await existingSub.unsubscribe();
      } catch (e) {
        console.warn('[Push] Error clearing old subscription:', e);
      }
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // 6. Extract payload with guaranteed keys
    const payload = extractSubscriptionPayload(subscription);
    if (!payload.endpoint) {
      throw new Error('بيانات الاشتراك غير مكتملة: لم يتم إنشاء نقطة تنبيه من المتصفح');
    }

    if (!payload.keys.p256dh || !payload.keys.auth) {
      throw new Error('مفاتيح تشفير التنبيهات غير متوفرة من متصفح الهاتف');
    }

    // 7. Send subscription to backend server (trying primary and fallback endpoints)
    const endpointsToTry = [
      '/api/push/subscribe',
      '/api/subscribe',
      '/api/push/subscriptions',
    ];

    let response: Response | null = null;
    let resData: any = {};
    let lastStatus = 0;

    const savedReminders = customReminders || loadReminders();
    const requestBody = JSON.stringify({
      subscription: payload,
      preferences,
      reminders: savedReminders,
      coordinates,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo',
    });

    for (const ep of endpointsToTry) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'same-origin',
          body: requestBody,
        });

        lastStatus = res.status;
        if (res.status === 404) {
          console.warn(`[Push] Endpoint ${ep} returned 404, attempting fallback...`);
          continue;
        }

        response = res;
        const text = await res.text();
        try {
          resData = JSON.parse(text);
        } catch {
          console.warn('[Push] Server returned non-JSON:', text);
        }

        // If status 200 or 201, subscription saved successfully!
        if (res.ok && (res.status === 200 || res.status === 201)) {
          break;
        }
      } catch (netErr) {
        console.warn(`[Push] Network error attempting ${ep}:`, netErr);
      }
    }

    if (!response || !response.ok) {
      const serverError =
        resData.error ||
        resData.message ||
        `فشل حفظ الاشتراك في خادم الإشعارات (رمز الخطأ: ${lastStatus || 'غير معروف'})`;
      throw new Error(serverError);
    }

    savePreferencesLocally(preferences);
    return { success: true, subscription };
  } catch (error: any) {
    console.error('[Push Subscribe Error]', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء تفعيل اشتراك الإشعارات' };
  }
}

/**
 * Unsubscribes from Web Push
 */
export async function unsubscribeFromWebPush(): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await getCurrentPushSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      // Notify backend
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Verifies if an endpoint is registered and active on the backend server
 */
export async function verifySubscriptionWithServer(endpoint: string): Promise<boolean> {
  if (!endpoint) return false;
  const checkEndpoints = ['/api/push/check', '/api/check'];
  for (const ep of checkEndpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ endpoint }),
      });
      if (res.status === 404) continue;
      if (res.ok) {
        const data = await res.json();
        return Boolean(data.registered);
      }
    } catch (e) {
      console.warn(`[Push] Error verifying subscription with ${ep}:`, e);
    }
  }
  return false;
}

/**
 * Gets the full detailed status of push notifications on this device,
 * including verifying directly with the backend server whether it is saved!
 */
export async function getDetailedPushStatus(): Promise<{
  isSupported: boolean;
  permission: NotificationPermission;
  isBrowserSubscribed: boolean;
  isServerSaved: boolean;
  isSubscribed: boolean;
  endpoint?: string;
}> {
  const supported = isPushSupported();
  const perm = getNotificationPermission();
  let sub: PushSubscription | null = null;
  let isServerSaved = false;

  if (supported) {
    sub = await getCurrentPushSubscription();
  }

  // Check with server if this subscription is actually persisted
  if (sub && sub.endpoint) {
    isServerSaved = await verifySubscriptionWithServer(sub.endpoint);
  }

  // Only consider fully subscribed if browser granted permission,
  // subscription exists in browser, AND it is confirmed saved in server!
  const isFullySubscribed = perm === 'granted' && Boolean(sub) && isServerSaved;

  return {
    isSupported: supported,
    permission: perm,
    isBrowserSubscribed: Boolean(sub),
    isServerSaved,
    isSubscribed: isFullySubscribed,
    endpoint: sub?.endpoint,
  };
}

/**
 * Triggers a real test push notification from backend to this device
 * Auto-subscribes if user already granted permission!
 */
export async function sendTestPushNotification(
  customTitle?: string,
  customBody?: string
): Promise<{
  success: boolean;
  delivered?: number;
  message?: string;
  error?: string;
}> {
  try {
    let subscription = await getCurrentPushSubscription();

    // If no subscription exists, but notification permission is already granted, auto-subscribe seamlessly!
    if (!subscription && getNotificationPermission() === 'granted') {
      console.log('[Push] Notification permission is already granted. Auto-subscribing before sending test...');
      const subRes = await subscribeToWebPush();
      if (subRes.success && subRes.subscription) {
        subscription = subRes.subscription;
      } else {
        return {
          success: false,
          error: subRes.error || 'يرجى تفعيل الإشعارات أولاً بالضغط على زر «تفعيل الإشعارات».',
        };
      }
    }

    if (!subscription) {
      return {
        success: false,
        error: 'لم يتم تفعيل الإشعارات بعد في هذا الجهاز. يرجى الضغط على زر «تفعيل الإشعارات» أولاً.',
      };
    }

    let currentSub = subscription;
    let endpoint = currentSub.endpoint;
    let payload = extractSubscriptionPayload(currentSub);

    const testEndpoints = ['/api/push/test', '/api/test'];
    let lastErr = 'تعذر إرسال الإشعار التجريبي';
    let needsRetryWithFreshSub = false;

    const detectedTimezone =
      (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      'Africa/Cairo';

    for (const ep of testEndpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            endpoint,
            subscription: payload,
            timezone: detectedTimezone,
            title: customTitle || 'أُنس - تجربة إشعار الأذان والهاتف 🕌',
            body:
              customBody ||
              'ما شاء الله! إشعارات أُنس والأذان مفعلة وتعمل بنجاح على هاتفك حتى عند إغلاق التطبيق وقفل الشاشة 🤍',
          }),
        });

        if (res.status === 404) continue;
        const data = await res.json().catch(() => ({}));

        if (res.status === 410 || data?.expired) {
          needsRetryWithFreshSub = true;
          break;
        }

        if (res.ok && data.success) {
          return { success: true, delivered: data.delivered, message: data.message };
        }
        lastErr = data.error || lastErr;
      } catch (err: any) {
        lastErr = err.message || lastErr;
      }
    }

    // Auto-heal: If FCM returned 410 (expired), re-subscribe with fresh token and retry once
    if (needsRetryWithFreshSub) {
      console.log('[Push Auto-Heal] Subscription expired on FCM, renewing subscription...');
      const reSub = await subscribeToWebPush();
      if (reSub.success && reSub.subscription) {
        const freshPayload = extractSubscriptionPayload(reSub.subscription);
        for (const ep of testEndpoints) {
          try {
            const retryRes = await fetch(ep, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({
                endpoint: reSub.subscription.endpoint,
                subscription: freshPayload,
                title: customTitle || 'أُنس - تجربة إشعار الأذان والهاتف 🕌',
                body:
                  customBody ||
                  'ما شاء الله! تم تجديد اشتراك الإشعارات وتعمل الآن بنجاح على هاتفك 🤍',
              }),
            });
            if (retryRes.status === 404) continue;
            const retryData = await retryRes.json().catch(() => ({}));
            if (retryRes.ok && retryData.success) {
              return { success: true, delivered: retryData.delivered, message: retryData.message };
            }
          } catch {
            // continue
          }
        }
      }
    }

    return { success: false, error: lastErr };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل الاتصال بخادم الإشعارات' };
  }
}

/**
 * Updates preferences and scheduled reminders on the backend for this device
 */
export async function updatePushPreferencesOnServer(
  preferences: PushPreferences,
  coordinates?: { lat: number; lng: number },
  customReminders?: ReminderSetting[]
): Promise<boolean> {
  savePreferencesLocally(preferences);
  try {
    const sub = await getCurrentPushSubscription();
    if (!sub) return false;

    const savedReminders = customReminders || loadReminders();
    const detectedTimezone =
      (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      'Africa/Cairo';
    const prefEndpoints = ['/api/push/preferences', '/api/preferences'];
    for (const ep of prefEndpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            endpoint: sub.endpoint,
            preferences,
            reminders: savedReminders,
            coordinates,
            timezone: detectedTimezone,
          }),
        });
        if (res.status === 404) continue;
        if (res.ok) return true;
      } catch {
        // try next
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Gets complete current push status
 */
export async function getFullPushStatus(): Promise<PushStatus> {
  const supported = isPushSupported();
  const permission = getNotificationPermission();
  const preferences = loadSavedPreferences();

  if (!supported) {
    return {
      isSupported: false,
      permission: 'denied',
      isSubscribed: false,
      preferences,
    };
  }

  const sub = await getCurrentPushSubscription();
  return {
    isSupported: true,
    permission,
    isSubscribed: Boolean(sub),
    endpoint: sub?.endpoint,
    preferences,
  };
}
