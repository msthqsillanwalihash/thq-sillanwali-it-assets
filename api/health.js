module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  // Try read from global store
  const store = globalThis.__thqStore || { assets: [], users: [], checkins: [], logs: [], meta: {} };
  res.status(200).json({
    ok: true,
    time: new Date().toISOString(),
    service: 'THQ Sillanwali IT Asset API (Vercel)',
    counts: {
      assets: (store.assets || []).length,
      users: (store.users || []).length,
      checkins: (store.checkins || []).length
    },
    lastPush: store.meta && store.meta.lastPush,
    note: 'Free serverless storage is ephemeral. For permanent multi-device sync use local thq_it_server.py or a database.'
  });
};
