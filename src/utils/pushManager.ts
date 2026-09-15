/**
 * Web Push Notification Client Manager for Android & Modern Browsers
 * Integrates with W3C Push API, Service Worker, and Ouns Backend
 */

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
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Decodes URL-safe base64 string to Uint8Array for VAPID applicationServerKey
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
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
 * Fetches the backend VAPID public key
 */
export async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) throw new Error('Failed to fetch VAPID key');
    const data = await res.json();
    return data.publicKey;
  } catch (err) {
    console.error('[Push] Failed to get VAPID key from backend:', err);
    return null;
  }
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
 * Subscribes the device to real Android Web Push notifications
 */
export async function subscribeToWebPush(
  preferences: PushPreferences = loadSavedPreferences(),
  coordinates?: { lat: number; lng: number }
): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
  if (!isPushSupported()) {
    return {
      success: false,
      error: 'متصفحك الحالي لا يدعم تقنية Web Push للإشعارات. جرّب استخدام متصفح Google Chrome على هاتفك.',
    };
  }

  try {
    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error:
          permission === 'denied'
            ? 'تم رفض إذن الإشعارات من إعدادات المتصفح. يرجى تفعيل الإذن من علامة القفل بجانب عنوان الموقع.'
            : 'لم يتم منح إذن الإشعارات.',
      };
    }

    // 2. Ensure Service Worker is registered
    const registration = await registerPushServiceWorker();
    if (!registration) {
      return { success: false, error: 'تعذر تشغيل Service Worker للإشعارات' };
    }

    // 3. Fetch VAPID public key
    const publicKey = await fetchVapidPublicKey();
    if (!publicKey) {
      return { success: false, error: 'تعذر الاتصال بخادم الإشعارات للحصول على مفتاح التشفير VAPID' };
    }

    // 4. Subscribe to PushManager
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // 5. Send subscription to backend server
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        preferences,
        coordinates,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'فشل حفظ الاشتراك في الخادم');
    }

    savePreferencesLocally(preferences);
    return { success: true, subscription };
  } catch (error: any) {
    console.error('[Push Subscribe Error]', error);
    return { success: false, error: error.message || 'حدث خطأ غير متوقع أثناء الاشتراك' };
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
 * Triggers a real test push notification from backend to this device
 */
export async function sendTestPushNotification(customTitle?: string, customBody?: string): Promise<{
  success: boolean;
  delivered?: number;
  message?: string;
  error?: string;
}> {
  try {
    const subscription = await getCurrentPushSubscription();
    const endpoint = subscription?.endpoint;

    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        title: customTitle || 'أُنس - تجربة إشعار حقيقي 🌙',
        body:
          customBody ||
          'هذا إشعار تجريبي حقيقي لنظام Android Web Push! يصلك حتى وإن كان المتصفح مغلقاً تماماً 🤍',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'تعذر إرسال الإشعار التجريبي' };
    }

    return { success: true, delivered: data.delivered, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل الاتصال بخادم الإشعارات' };
  }
}

/**
 * Updates preferences on the backend for this device
 */
export async function updatePushPreferencesOnServer(
  preferences: PushPreferences,
  coordinates?: { lat: number; lng: number }
): Promise<boolean> {
  savePreferencesLocally(preferences);
  try {
    const sub = await getCurrentPushSubscription();
    if (!sub) return false;

    const res = await fetch('/api/push/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        preferences,
        coordinates,
      }),
    });
    return res.ok;
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
