/**
 * Hosted generation endpoint (Vercel serverless).
 *
 * Holds the AI provider keys server-side as environment variables so the public,
 * ad-funded site can offer generation without exposing a key in the browser.
 * The client only calls this when the user has NOT supplied their own key; BYOK
 * users still call providers directly from the browser.
 *
 * Env vars:
 *   CLAUDE_API_KEY | ANTHROPIC_API_KEY   server key for Claude
 *   OPENAI_API_KEY                       server key for OpenAI
 *   GEMINI_API_KEY                       server key for Gemini
 *   DEFAULT_AI_PROVIDER                  fallback provider (default 'gemini')
 *   DAILY_GENERATION_LIMIT               per session+IP daily cap (default 40)
 */

import { buildContentPrompt } from '../src/utils/contentPrompt.js';
import { generateParsed, PROVIDERS } from '../src/utils/aiClient.js';
import { bump, clientIp } from './_lib/quota.js';

function serverKeyFor(provider) {
  switch (provider) {
    case 'claude':
      return process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
    case 'openai':
      return process.env.OPENAI_API_KEY || '';
    case 'gemini':
      return process.env.GEMINI_API_KEY || '';
    default:
      return '';
  }
}

/** Pick the provider to actually use: requested if keyed, else any keyed one. */
function resolveProvider(requested) {
  if (requested && serverKeyFor(requested)) return requested;
  const preferred = process.env.DEFAULT_AI_PROVIDER;
  if (preferred && serverKeyFor(preferred)) return preferred;
  return PROVIDERS.find((p) => serverKeyFor(p)) || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel parses JSON bodies automatically; guard for string bodies just in case.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const { provider: requestedProvider, params, sessionId } = body;
  if (!params || !params.topic) {
    return res.status(400).json({ error: 'A topic is required.' });
  }

  const provider = resolveProvider(requestedProvider);
  if (!provider) {
    return res.status(503).json({
      error: 'The hosted generator is not configured. Add your own API key in Settings to generate.',
      code: 'no_server_key',
    });
  }

  // Quota check (best-effort; see api/_lib/quota.js).
  const gate = bump(sessionId, clientIp(req));
  res.setHeader('X-RateLimit-Limit', String(gate.limit));
  res.setHeader('X-RateLimit-Remaining', String(gate.remaining));
  if (!gate.allowed) {
    return res.status(429).json({
      error: 'Daily free generation limit reached. Add your own API key in Settings for unlimited use.',
      code: 'quota_exceeded',
      resetAt: gate.resetAt,
    });
  }

  try {
    const { promptText, systemPrompt } = buildContentPrompt(params);
    const content = await generateParsed({
      provider,
      apiKey: serverKeyFor(provider),
      systemPrompt,
      promptText,
      maxTokens: 3000,
      allowBrowser: false,
    });
    return res.status(200).json({ content, provider });
  } catch (err) {
    console.error('Hosted generation error:', err);
    const status = err?.status === 429 ? 429 : 502;
    return res.status(status).json({
      error:
        status === 429
          ? 'The generator is busy right now. Please try again in a few seconds.'
          : 'Generation failed. Please try again.',
    });
  }
}
