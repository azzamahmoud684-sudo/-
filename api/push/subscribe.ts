// Universal Serverless Function for /api/push/subscribe
// Compatible with Vercel, Netlify, Cloud Functions, and Express-like runtimes

export default async function handler(req: any, res: any) {
  // CORS Headers
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

// Edge runtime / Web Fetch API compatible POST handler
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
