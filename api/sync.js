function getStore() {
  if (!globalThis.__thqStore) {
    globalThis.__thqStore = { assets: [], users: [], checkins: [], logs: [], meta: {} };
  }
  return globalThis.__thqStore;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const store = getStore();

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      assets: store.assets || [],
      users: store.users || [],
      checkins: store.checkins || [],
      logs: store.logs || [],
      meta: store.meta || {}
    });
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ ok: false, error: 'Invalid JSON' }); }
    }
    body = body || {};
    if (Array.isArray(body.assets)) store.assets = body.assets;
    if (Array.isArray(body.users)) store.users = body.users;
    if (Array.isArray(body.checkins)) store.checkins = body.checkins;
    if (Array.isArray(body.logs)) store.logs = body.logs;
    store.meta = store.meta || {};
    store.meta.lastPush = new Date().toISOString();
    return res.status(200).json({
      ok: true,
      counts: {
        assets: (store.assets || []).length,
        users: (store.users || []).length,
        checkins: (store.checkins || []).length
      },
      note: 'Data stored in serverless memory (may reset on cold start). Prefer local server for permanent storage.'
    });
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
};
