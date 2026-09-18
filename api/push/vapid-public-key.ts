const DEFAULT_VAPID_PUBLIC_KEY =
  'BNZ2K6EyIYxITp4N0Gf547OroRMvzghNEoHZJ-zlGlYzR-4kMUkCrcLxwx0Vhhh9gUAGnaUfXIVY7fV5AtTjDX4';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
  return res.status(200).json({ publicKey });
}

export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
  return new Response(JSON.stringify({ publicKey }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
