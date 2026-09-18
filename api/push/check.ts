export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(200).json({
    registered: true,
  });
}

export async function POST() {
  return new Response(JSON.stringify({ registered: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
