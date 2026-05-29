// Durable IP rate limiter for the form + feedback endpoints.
//
// Backed by the Postgres `check_rate(p_key, p_max, p_window_seconds)` RPC, so
// the counter is shared across all serverless instances/regions and survives
// cold starts — unlike the previous per-process in-memory Map, whose limit
// was really "5 per container" and reset constantly. The RPC does an atomic
// fixed-window check-and-increment under a row lock.
//
// rateLimit() is now ASYNC. Call sites must `await` it.
//
// ── Namespaces ──
// Buckets are keyed `${namespace}:${ip}` so independent surfaces don't share a
// counter. The three lead forms share the default "form" namespace (one human
// filling out contact + demo shares a budget, matching prior behavior);
// feedback passes its own namespace + a looser cap.
//
// ── Degraded mode ──
// If the RPC errors (DB blip), we fall back to a small per-process in-memory
// limiter rather than failing fully open — bounded, lost on deploy. Forms are
// also protected by the honeypot + server-side validation, so this is a safe
// backstop, not the primary control.
//
// The RPC is granted to service_role only (not anon/authenticated), so it is
// not reachable from the public PostgREST API — only this server code calls
// it via the service-role key.

import { getSupabaseAdmin } from "@/lib/supabase";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;

export { getClientIp } from "@/lib/ipHash";

const fallbackBuckets = new Map();
let fbSweepRegistered = false;
function ensureFallbackSweep() {
  if (fbSweepRegistered) return;
  fbSweepRegistered = true;
  const t = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of fallbackBuckets) {
      if (b.resetAt <= now) fallbackBuckets.delete(k);
    }
  }, 10 * 60 * 1000);
  if (typeof t.unref === "function") t.unref();
}
function fallbackLimit(key, max, windowMs) {
  ensureFallbackSweep();
  const now = Date.now();
  const b = fallbackBuckets.get(key);
  if (!b || b.resetAt <= now) {
    fallbackBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= max) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true };
}

export async function rateLimit(ip, opts = {}) {
  const { namespace = "form", max = MAX_REQUESTS, windowMs = WINDOW_MS } = opts;
  const key = `${namespace}:${ip}`;
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("check_rate", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;

    const row = data?.[0] || {};
    if (row.allowed) return { ok: true };
    return {
      ok: false,
      retryAfterSec: Number(row.retry_after) || windowSeconds,
    };
  } catch (err) {
    console.error("[rateLimit] RPC failed, using in-memory fallback:", err);
    return fallbackLimit(key, max, windowMs);
  }
}
