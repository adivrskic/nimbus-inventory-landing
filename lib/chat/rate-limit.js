// ──────────────────────────────────────────────────────────────────────────
// lib/chat/rate-limit.js
// ──────────────────────────────────────────────────────────────────────────
// Three layers of protection, in this order:
//
//   1. Minimum interval between requests from the same visitor (in-memory,
//      500ms). Catches automated scripts that the hourly check would miss
//      since they can fire 100 requests in a second.
//   2. Hourly message ceiling per visitor (40 messages/hr).
//   3. Daily message ceiling (200/day) and daily token ceiling (1M tokens
//      ~= $3 of Sonnet input). The token ceiling is your real cost cap.
//
// Limits are intentionally generous for real users — a curious prospect
// asking 30-40 follow-ups is fine, but a runaway script gets stopped.
//
// Fail-open behavior: if the rate-limit RPC itself errors (DB outage),
// we let the request through rather than block legitimate users on
// infra issues. Worth it for v1; reconsider if you see abuse exploiting it.
// ──────────────────────────────────────────────────────────────────────────

import { getSupabaseAdmin } from "@/lib/supabase";

const LIMITS = {
  messages_per_hour: 40,
  messages_per_day: 200,
  tokens_per_day: 1_000_000, // ~$3 in Sonnet 4.6 input tokens
};

const MIN_INTERVAL_MS = 500;

// Process-local map of visitor → last request timestamp. Pruned when it
// grows. Lost on deploy, which is fine — fresh deploys reset abuse windows.
const lastRequest = new Map();

function pruneLastRequest(now) {
  if (lastRequest.size < 5000) return;
  const cutoff = now - 60_000;
  for (const [k, v] of lastRequest.entries()) {
    if (v < cutoff) lastRequest.delete(k);
  }
}

export async function checkRateLimit(visitorId) {
  if (!visitorId) return { ok: true };

  // ── Layer 1: minimum interval ────────────────────────────────────────
  const now = Date.now();
  const last = lastRequest.get(visitorId);
  if (last && now - last < MIN_INTERVAL_MS) {
    return {
      ok: false,
      code: "too_fast",
      retryAfter: Math.ceil((MIN_INTERVAL_MS - (now - last)) / 1000) || 1,
      message: "Slow down — you're sending messages very quickly.",
    };
  }
  lastRequest.set(visitorId, now);
  pruneLastRequest(now);

  // ── Layers 2 + 3: DB-backed counts ───────────────────────────────────
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("check_visitor_rate", {
    v_visitor_id: visitorId,
  });

  if (error) {
    console.error("[rate-limit] RPC failed:", error);
    return { ok: true };
  }

  const row = data?.[0] || {};
  const hourly = Number(row.messages_last_hour || 0);
  const daily = Number(row.messages_last_day || 0);
  const tokens = Number(row.tokens_last_day || 0);

  if (hourly >= LIMITS.messages_per_hour) {
    return {
      ok: false,
      code: "hourly_limit",
      retryAfter: 3600,
      message:
        "Hourly limit reached. Try again in an hour, or email sales@Nautiluswms.com.",
    };
  }
  if (daily >= LIMITS.messages_per_day) {
    return {
      ok: false,
      code: "daily_limit",
      retryAfter: 86400,
      message:
        "Daily message limit reached. Try again tomorrow, or email sales@Nautiluswms.com.",
    };
  }
  if (tokens >= LIMITS.tokens_per_day) {
    return {
      ok: false,
      code: "tokens_limit",
      retryAfter: 86400,
      message:
        "Daily usage limit reached. Try again tomorrow, or email sales@Nautiluswms.com.",
    };
  }

  return { ok: true, hourly, daily, tokens };
}
