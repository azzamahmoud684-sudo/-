import fs from 'fs';
import path from 'path';

function saveSubscriptionRecord(subData: any) {
  const filePaths = [
    path.join(process.cwd(), '.push-subscriptions.json'),
    '/tmp/.push-subscriptions.json',
  ];

  for (const fp of filePaths) {
    try {
      let list: any[] = [];
      if (fs.existsSync(fp)) {
        try {
          const raw = fs.readFileSync(fp, 'utf-8');
          list = JSON.parse(raw);
          if (!Array.isArray(list)) list = [];
        } catch {
          list = [];
        }
      }

      const idx = list.findIndex((s) => s && s.endpoint === subData.endpoint);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...subData, lastActive: Date.now() };
      } else {
        list.push({ ...subData, createdAt: Date.now(), lastActive: Date.now() });
      }

      fs.writeFileSync(fp, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn(`[Push Subscribe] Could not write to ${fp}:`, err);
    }
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

    const subscription = body?.subscription || body;
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
      return res.status(400).json({
        error: 'بيانات الاشتراك غير مكتملة: رابط التنبيه الخاص بالجهاز غير متوفر',
      });
    }

    if (!p256dh || !auth) {
      return res.status(400).json({
        error: 'بيانات الاشتراك غير مكتملة: مفاتيح التشفير غير متوفرة',
      });
    }

    const stored = {
      endpoint,
      keys: { p256dh: String(p256dh), auth: String(auth) },
      preferences: body?.preferences || { prayers: true, athkar: true, tasks: true, occasions: true },
      reminders: body?.reminders || [],
      coordinates: body?.coordinates || { lat: 30.0444, lng: 31.2357 },
      timezone: body?.timezone || 'Africa/Cairo',
    };

    saveSubscriptionRecord(stored);

    return res.status(200).json({
      success: true,
      message: 'تم تفعيل وحفظ اشتراك الإشعارات بنجاح في خادم أُنس',
      registered: true,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'حدث خطأ أثناء حفظ الاشتراك: ' + (err?.message || 'خطأ غير معروف'),
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const subscription = body?.subscription || body;
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh || body?.keys?.p256dh;
    const auth = subscription?.keys?.auth || body?.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return new Response(
        JSON.stringify({ error: 'بيانات الاشتراك غير مكتملة' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stored = {
      endpoint,
      keys: { p256dh: String(p256dh), auth: String(auth) },
      preferences: body?.preferences || { prayers: true, athkar: true, tasks: true, occasions: true },
      reminders: body?.reminders || [],
      coordinates: body?.coordinates || { lat: 30.0444, lng: 31.2357 },
      timezone: body?.timezone || 'Africa/Cairo',
    };

    saveSubscriptionRecord(stored);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم تفعيل وحفظ اشتراك الإشعارات بنجاح في خادم أُنس',
        registered: true,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
