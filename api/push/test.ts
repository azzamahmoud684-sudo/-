import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

const DEFAULT_VAPID_PUBLIC_KEY =
  'BNZ2K6EyIYxITp4N0Gf547OroRMvzghNEoHZJ-zlGlYzR-4kMUkCrcLxwx0Vhhh9gUAGnaUfXIVY7fV5AtTjDX4';
const DEFAULT_VAPID_PRIVATE_KEY = 'pk1HVHhQgOG0slubtYEyKEZ4RSBQ6jwjuqwedERu5g4';
const DEFAULT_VAPID_SUBJECT = 'mailto:support@ouns.app';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT;

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (e) {
  console.error('[API Push Test] VAPID configuration error:', e);
}

function findSubscription(endpoint?: string) {
  const filePaths = [
    path.join(process.cwd(), '.push-subscriptions.json'),
    '/tmp/.push-subscriptions.json',
  ];
  for (const fp of filePaths) {
    if (fs.existsSync(fp)) {
      try {
        const list = JSON.parse(fs.readFileSync(fp, 'utf-8'));
        if (Array.isArray(list)) {
          if (endpoint) {
            const found = list.find((s: any) => s && s.endpoint === endpoint);
            if (found) return found;
          } else if (list.length > 0) {
            return list[list.length - 1];
          }
        }
      } catch {
        // ignore
      }
    }
  }
  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore
      }
    }

    const endpoint = body?.endpoint || body?.subscription?.endpoint;
    const p256dh =
      body?.subscription?.keys?.p256dh ||
      body?.keys?.p256dh ||
      body?.p256dh;
    const auth =
      body?.subscription?.keys?.auth ||
      body?.keys?.auth ||
      body?.auth;

    let targetSub: any = null;
    if (endpoint && p256dh && auth) {
      targetSub = {
        endpoint,
        keys: { p256dh, auth },
      };
    } else {
      targetSub = findSubscription(endpoint);
    }

    if (!targetSub || !targetSub.endpoint || !targetSub.keys) {
      return res.status(404).json({
        success: false,
        error: 'لم يتم العثور على اشتراك صالح للجهاز، يرجى تفعيل الإشعارات أولاً.',
      });
    }

    const title =
      body?.title && typeof body.title === 'string' && body.title.trim().length > 0
        ? body.title.trim()
        : 'أُنس - تجربة الإشعار 🌙';

    const textBody =
      body?.body && typeof body.body === 'string' && body.body.trim().length > 0
        ? body.body.trim()
        : 'ما شاء الله! إشعارات أُنس والأذان مفعلة وتعمل بنجاح على هاتفك 🤍';

    const payload = JSON.stringify({
      title,
      body: textBody,
      icon: '/assets/icon-192.png',
      badge: '/assets/badge-72.png',
      tag: 'ouns-test-' + Date.now(),
      data: { url: '/', timestamp: Date.now() },
    });

    const sendRes = await webpush.sendNotification(
      {
        endpoint: targetSub.endpoint,
        keys: targetSub.keys,
      },
      payload,
      {
        TTL: 86400,
        urgency: 'high',
      }
    );

    return res.status(200).json({
      success: true,
      message: 'تم إرسال الإشعار بنجاح إلى هاتفك',
      delivered: 1,
      statusCode: sendRes.statusCode,
    });
  } catch (err: any) {
    console.error('[API Push Test Error]:', err);
    const statusCode = err?.statusCode || 500;
    const isExpired = statusCode === 410 || statusCode === 404;
    return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
      success: false,
      expired: isExpired,
      error: isExpired
        ? 'انتهت صلاحية اشتراك التنبيهات في المتصفح، جارٍ التجديد التلقائي...'
        : 'تعذر تسليم الإشعار: ' + (err?.message || 'خطأ غير معروف'),
      statusCode,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const endpoint = body?.endpoint || body?.subscription?.endpoint;
    const p256dh =
      body?.subscription?.keys?.p256dh ||
      body?.keys?.p256dh ||
      body?.p256dh;
    const auth =
      body?.subscription?.keys?.auth ||
      body?.keys?.auth ||
      body?.auth;

    let targetSub: any = null;
    if (endpoint && p256dh && auth) {
      targetSub = { endpoint, keys: { p256dh, auth } };
    } else {
      targetSub = findSubscription(endpoint);
    }

    if (!targetSub || !targetSub.endpoint || !targetSub.keys) {
      return new Response(
        JSON.stringify({ success: false, error: 'لم يتم العثور على اشتراك صالح للجهاز' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({
      title: body?.title || 'أُنس - تجربة الإشعار 🌙',
      body: body?.body || 'ما شاء الله! إشعارات أُنس والأذان مفعلة وتعمل بنجاح على هاتفك 🤍',
      icon: '/assets/icon-192.png',
      badge: '/assets/badge-72.png',
      tag: 'ouns-test-' + Date.now(),
      data: { url: '/', timestamp: Date.now() },
    });

    const sendRes = await webpush.sendNotification(
      { endpoint: targetSub.endpoint, keys: targetSub.keys },
      payload,
      { TTL: 86400, urgency: 'high' }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إرسال الإشعار بنجاح',
        delivered: 1,
        statusCode: sendRes.statusCode,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    const statusCode = err?.statusCode || 500;
    const isExpired = statusCode === 410 || statusCode === 404;
    return new Response(
      JSON.stringify({
        success: false,
        expired: isExpired,
        error: isExpired
          ? 'انتهت صلاحية اشتراك التنبيهات في المتصفح'
          : err?.message || 'Push delivery failed',
        statusCode,
      }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
