/**
 * Isomorphic AI provider dispatch.
 *
 * Works in both the browser (BYOK path — pass `allowBrowser: true`) and Node /
 * Vercel serverless (hosted path). The only environment difference is the
 * Anthropic SDK's `dangerouslyAllowBrowser` flag, gated behind `allowBrowser`.
 *
 * Centralizing this means the client and the serverless function call the exact
 * same models with the exact same parsing, so output is identical regardless of
 * which path a request takes.
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export const PROVIDERS = ['claude', 'openai', 'gemini'];

const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';
const OPENAI_MODEL = 'gpt-4o';
const GEMINI_MODEL = 'gemini-2.0-flash';

/**
 * Call the selected provider and return the raw text response (still JSON-ish).
 *
 * @param {object}  opts
 * @param {('claude'|'openai'|'gemini')} opts.provider
 * @param {string}  opts.apiKey
 * @param {string}  opts.systemPrompt
 * @param {string}  opts.promptText
 * @param {number}  [opts.maxTokens=3000]
 * @param {boolean} [opts.allowBrowser=false] - required true when called in a browser
 * @returns {Promise<string>} raw model text
 */
export async function callAIProvider({
  provider,
  apiKey,
  systemPrompt,
  promptText,
  maxTokens = 3000,
  allowBrowser = false,
}) {
  if (!provider) throw new Error('No AI provider specified.');
  if (!apiKey) throw new Error('No API key provided for ' + provider + '.');

  if (provider === 'claude') {
    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: allowBrowser });
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens, // headroom for up to 10 detailed slides
      system: systemPrompt,
      messages: [{ role: 'user', content: promptText }],
    });
    return msg.content[0].text;
  }

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: allowBrowser });
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptText },
      ],
    });
    return response.choices[0].message.content;
  }

  if (provider === 'gemini') {
    // Gemini via REST — fetch exists in both modern browsers and Node 18+.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: Math.max(2000, maxTokens),
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData?.error?.message || res.statusText;
      if (res.status === 400 && /API key/i.test(errMsg)) {
        throw new Error('Invalid Gemini API key.');
      }
      const e = new Error(`Gemini API error: ${res.status} — ${errMsg}`);
      e.status = res.status;
      throw e;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) throw new Error('Gemini returned an empty response. Try again.');
    return text;
  }

  throw new Error(`Unknown AI provider: ${provider}`);
}

/** Strip stray markdown fences and parse the model's JSON response. */
export function parseContentJson(rawJson) {
  const cleaned = String(rawJson || '')
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(cleaned);
}

/** Convenience: call a provider and return the parsed content object. */
export async function generateParsed(opts) {
  const raw = await callAIProvider(opts);
  return parseContentJson(raw);
}
