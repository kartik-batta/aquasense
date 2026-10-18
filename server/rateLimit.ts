import type { RequestHandler } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  now?: () => number;
}

/**
 * Minimal fixed-window, per-IP rate limiter (in-memory; suitable for a single instance).
 */
export function createRateLimiter({ windowMs, max, now = Date.now }: RateLimitOptions): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req, res, next) => {
    const key = req.ip ?? 'unknown';
    const current = now();

    // Opportunistic cleanup keeps the map bounded to active clients.
    if (hits.size > 10_000) {
      for (const [k, entry] of hits) {
        if (entry.resetAt <= current) hits.delete(k);
      }
    }

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= current) {
      entry = { count: 0, resetAt: current + windowMs };
      hits.set(key, entry);
    }
    entry.count++;

    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - current) / 1000));
      res.status(429).json({ success: false, error: 'Too many requests. Please retry shortly.' });
      return;
    }
    next();
  };
}
