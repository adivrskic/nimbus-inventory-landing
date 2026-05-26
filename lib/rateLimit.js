// lib/rateLimit.js
// Simple in-memory IP rate limiter for the demo + contact form endpoints.
//
// Limits each IP to a fixed number of submissions per rolling window.
// State lives in a Map and survives the lifetime of a serverless function
// container. On Netlify/Vercel, cold starts will reset this — that's fine
// for form-spam mitigation (combined with the honeypot it filters out the
// 95% case). For bulletproof rate limiting across regions/containers,
// swap this for Upstash Redis or @vercel/kv later.

const buckets = new Map(); // ip -> { count, resetAt }

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5; // per IP per window
const SWEEP_INTERVAL_MS = 10 * 60 * 1000; // 10 min

// Periodically drop expired entries so the Map doesn't grow unbounded.
// Guarded so we only register one timer per process.
let sweepRegistered = false;
function ensureSweep() {
  if (sweepRegistered) return;
  sweepRegistered = true;
  // Use unref() so the timer doesn't hold the process open in Node.
  const t = setInterval(() => {
    const now = Date.now();
    for (const [ip, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(ip);
    }
  }, SWEEP_INTERVAL_MS);
  if (typeof t.unref === "function") t.unref();
}

/* getClientIp now lives in lib/ipHash.js (shared with the chat path).
   Re-exported here so existing `import { rateLimit, getClientIp } from
   "@/lib/rateLimit"` callers keep working unchanged. */
export { getClientIp } from "@/lib/ipHash";

/**
 * Returns { ok: true } if the request is allowed,
 * or { ok: false, retryAfterSec } if rate-limited.
 */
export function rateLimit(ip) {
  ensureSweep();
  const now = Date.now();
  const existing = buckets.get(ip);

  if (!existing || existing.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (existing.count >= MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
    return { ok: false, retryAfterSec };
  }

  existing.count += 1;
  return { ok: true };
}
