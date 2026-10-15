function getStore() {
  if (!globalThis.__thqStore) globalThis.__thqStore = { assets: [], users: [], checkins: [], logs: [], meta: {} };
  return globalThis.__thqStore;
}
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const store = getStore();
  if (req.method === 'GET') return res.status(200).json({ ok: true, data: store.assets || [] });
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') try { body = JSON.parse(body); } catch (e) {}
    const data = (body && body.data) || body;
    if (Array.isArray(data)) store.assets = data;
    return res.status(200).json({ ok: true, saved: (store.assets || []).length });
  }
  res.status(405).json({ ok: false });
};
