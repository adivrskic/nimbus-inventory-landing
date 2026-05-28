// lib/rateLimit.js
// Simple in-memory IP rate limiter for the form + feedback endpoints.
//
// Limits each IP to a fixed number of submissions per rolling window.
// State lives in a Map and survives the lifetime of a serverless function
// container. On Netlify/Vercel, cold starts will reset this, and separate
// concurrent containers each keep their own Map — that's fine for form-spam
// mitigation (combined with the honeypot it filters out the 95% case). For
// bulletproof rate limiting across regions/containers, swap the internals
// for Upstash Redis / @vercel/kv / a Supabase RPC later — the rateLimit()
// signature can stay the same.
//
// ── Namespaces ──
// Buckets are keyed by `${namespace}:${ip}` so independent surfaces don't
// share a counter. Without this, a visitor who submitted the contact form
// would burn the same 5/hr budget that a help-article vote draws from. The
// three lead forms intentionally share the default "form" namespace (a
// single human filling out contact + demo shares one budget, matching the
// prior behavior); feedback uses its own namespace with a looser cap since
// voting on several articles in a session is legitimate.

const buckets = new Map(); // "namespace:ip" -> { count, resetAt }

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5; // per IP per window (default "form" namespace)
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
    for (const [key, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(key);
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
 *
 * @param {string} ip   Client IP (from getClientIp).
 * @param {object} [opts]
 * @param {string} [opts.namespace="form"]   Independent bucket namespace.
 * @param {number} [opts.max=MAX_REQUESTS]    Requests allowed per window.
 * @param {number} [opts.windowMs=WINDOW_MS]  Rolling window length.
 *
 * Backward compatible: rateLimit(ip) behaves exactly as before
 * (namespace "form", 5 requests / hour).
 */
export function rateLimit(ip, opts = {}) {
  const { namespace = "form", max = MAX_REQUESTS, windowMs = WINDOW_MS } = opts;

  ensureSweep();
  const now = Date.now();
  const key = `${namespace}:${ip}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= max) {
    const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
    return { ok: false, retryAfterSec };
  }

  existing.count += 1;
  return { ok: true };
}
