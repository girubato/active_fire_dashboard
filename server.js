const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// NASA FIRMS CSV endpoints
const FIRMS_URLS = {
  '24h': 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Global_24h.csv',
  '48h': 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Global_48h.csv',
  '7d':  'https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Global_7d.csv',
};

// In-memory cache: { data, timestamp }
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Proxy endpoint: GET /api/fires?range=24h|48h|7d
app.get('/api/fires', async (req, res) => {
  const range = req.query.range || '24h';
  const url = FIRMS_URLS[range];

  if (!url) {
    return res.status(400).json({ error: 'Invalid range. Use 24h, 48h, or 7d.' });
  }

  // Serve from cache if fresh
  const cached = cache[range];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.set('Content-Type', 'text/csv');
    res.set('X-Cache', 'HIT');
    res.set('X-Cache-Age', String(Math.round((Date.now() - cached.timestamp) / 1000)));
    return res.send(cached.data);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA FIRMS returned HTTP ${response.status}`);
    }
    const csv = await response.text();

    if (!csv || csv.length < 100) {
      throw new Error('Empty or invalid response from NASA FIRMS');
    }

    // Cache the result
    cache[range] = { data: csv, timestamp: Date.now() };

    res.set('Content-Type', 'text/csv');
    res.set('X-Cache', 'MISS');
    res.send(csv);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Proxy error (${range}):`, err.message);

    // Serve stale cache if available
    if (cached) {
      res.set('Content-Type', 'text/csv');
      res.set('X-Cache', 'STALE');
      return res.send(cached.data);
    }

    res.status(502).json({ error: 'Failed to fetch fire data from NASA FIRMS', detail: err.message });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  const ranges = Object.keys(cache);
  const cacheStatus = {};
  for (const r of ranges) {
    const entry = cache[r];
    cacheStatus[r] = {
      cached: true,
      ageSeconds: Math.round((Date.now() - entry.timestamp) / 1000),
      sizeBytes: entry.data.length,
    };
  }
  res.json({ status: 'ok', uptime: process.uptime(), cache: cacheStatus });
});

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Wildfire Tracker server running on http://localhost:${PORT}`);
});
