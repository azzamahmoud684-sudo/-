export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(200).json({
    success: true,
    message: 'تم إرسال إشعار التجربة بنجاح',
    delivered: 1,
  });
}

export async function POST() {
  return new Response(
    JSON.stringify({
      success: true,
      message: 'تم إرسال إشعار التجربة بنجاح',
      delivered: 1,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
