/**
 * URL repurposing endpoint (Vercel serverless).
 *
 * Fetches a blog post / article / YouTube link server-side and returns extracted
 * text the user can turn into a carousel. Server-side fetch replaces the old
 * public CORS proxy (api.allorigins.win), which was unreliable and routed user
 * activity through a third party.
 */

import { extractFromUrl } from './_lib/extract.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const url = body?.url;
  if (!url) return res.status(400).json({ error: 'A URL is required.' });

  try {
    const result = await extractFromUrl(url);
    return res.status(200).json(result);
  } catch (err) {
    // Extraction errors are user-facing and already phrased for humans.
    const msg = err?.message || 'Could not read that link.';
    const status = /valid URL|http\(s\)/i.test(msg) ? 400 : 502;
    return res.status(status).json({ error: msg });
  }
}
