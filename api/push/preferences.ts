import fs from 'fs';
import path from 'path';

function updatePreferencesRecord(payload: any) {
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

      const idx = list.findIndex((s) => s && s.endpoint === payload.endpoint);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          preferences: payload.preferences ? { ...list[idx].preferences, ...payload.preferences } : list[idx].preferences,
          reminders: Array.isArray(payload.reminders) ? payload.reminders : list[idx].reminders,
          coordinates: payload.coordinates || list[idx].coordinates,
          timezone: payload.timezone || list[idx].timezone || 'Africa/Cairo',
          lastActive: Date.now(),
        };
        fs.writeFileSync(fp, JSON.stringify(list, null, 2), 'utf-8');
      }
    } catch (err) {
      console.warn(`[Preferences Vercel API] Could not write to ${fp}:`, err);
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

    const { endpoint, preferences, reminders, coordinates, timezone } = body || {};
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    updatePreferencesRecord({ endpoint, preferences, reminders, coordinates, timezone });
    return res.status(200).json({ success: true, message: 'Preferences updated' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error updating preferences' });
  }
}
