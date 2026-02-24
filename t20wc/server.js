const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Serve static files from this directory (the static site)
app.use(express.static(path.join(__dirname, '/')));

// Proxy endpoint for the counter API to avoid CORS/DNS issues during local testing
app.post('/api/counter', async (req, res) => {
  try {
    const upstream = 'https://trackbacks-suffering-min-catch.trycloudflare.com/counter';
    const response = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {})
    });

    const body = await response.text();
    // try parse JSON, fallback to raw
    try {
      const json = JSON.parse(body);
      return res.status(response.status).json(json);
    } catch (e) {
      return res.status(response.status).type('text').send(body);
    }
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).json({ error: 'proxy_error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Local static server running at http://localhost:${PORT}/`);
  console.log('POST /api/counter will proxy to the upstream counter API.');
});
