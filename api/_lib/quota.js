/**
 * Best-effort daily usage quota for the hosted generation endpoint.
 *
 * IMPORTANT: this uses an in-memory Map, so on serverless it is per-instance and
 * resets on cold starts — it slows casual over-use but is NOT a hard guarantee.
 * For durable limits, swap `bump()` for a Vercel KV / Upstash Redis INCR with a
 * 24h TTL; the call sites do not need to change.
 *
 * Keyed by `${sessionId}|${ip}` so rotating the session id alone doesn't reset
 * the count for a given IP.
 *
 * Limit is read from env DAILY_GENERATION_LIMIT (default 40). Set to 0 to
 * disable the quota entirely (e.g. if you front the endpoint with your own auth).
 */

const buckets = new Map(); // key -> { count, resetAt }

function dailyLimit() {
  const raw = Number(process.env.DAILY_GENERATION_LIMIT);
  return Number.isFinite(raw) ? raw : 40;
}

/** Extract a best-effort client IP from common proxy headers. */
export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/**
 * Record one use and report whether it is allowed.
 * @returns {{ allowed: boolean, remaining: number, limit: number, resetAt: number }}
 */
export function bump(sessionId, ip) {
  const limit = dailyLimit();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (limit <= 0) {
    return { allowed: true, remaining: Infinity, limit: 0, resetAt: now + dayMs };
  }

  const key = `${sessionId || 'anon'}|${ip || 'unknown'}`;
  let b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + dayMs };
  }

  if (b.count >= limit) {
    buckets.set(key, b);
    return { allowed: false, remaining: 0, limit, resetAt: b.resetAt };
  }

  b.count += 1;
  buckets.set(key, b);
  return { allowed: true, remaining: Math.max(0, limit - b.count), limit, resetAt: b.resetAt };
}
