/**
 * Minimal token-minting server
 *  - POST /api/realtime/session  →  { token: "rt-sk-…" }
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

/* ----------------------------------------------------------- */
/* 1.  Express setup                                           */
/* ----------------------------------------------------------- */
const app = express();
app.use(cors());            // allow your Vite page to call this server
app.use(express.json());    // not actually needed, but harmless

/* ----------------------------------------------------------- */
/* 2.  Single route                                            */
/* ----------------------------------------------------------- */
app.post('/api/realtime/session', async (_req, res) => {
  try {
    // If your Node version < 18, uncomment next line and
    //   import fetch from 'node-fetch' at the top.
    // const fetch = (await import('node-fetch')).default;

    const resp = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2025-06-03'
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OpenAI HTTP ${resp.status}: ${text}`);
    }

    const session = await resp.json();
    res.json({ token: session.client_secret.value });   // ← only thing you expose
  } catch (err) {
    console.error('[realtime/session] ', err);
    res.status(500).json({ error: String(err) });
  }
});

/* ----------------------------------------------------------- */
/* 3.  Start server                                            */
/* ----------------------------------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🟢  Token server listening on http://localhost:${PORT}`)
);
