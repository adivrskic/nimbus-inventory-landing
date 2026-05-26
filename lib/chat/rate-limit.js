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
// Degraded behavior on RPC error (DB outage): we no longer fail fully
// open. A fully-open token cap meant a single DB blip could enable
// unbounded Anthropic spend. Instead, when the rate-limit RPC errors we
// fall back to a small per-process grace quota per visitor (FALLBACK_GRACE
// messages), then block with a soft "try again shortly" message. This
// keeps cost bounded during an outage without bricking chat for a
// transient hiccup. The grace counter resets for a visitor as soon as the
// DB recovers (next successful RPC), so it only bites while the DB is down.
// ──────────────────────────────────────────────────────────────────────────

import { getSupabaseAdmin } from "@/lib/supabase";
import { SALES_EMAIL } from "@/lib/site";

const LIMITS = {
  messages_per_hour: 40,
  messages_per_day: 200,
  tokens_per_day: 1_000_000, // ~$3 in Sonnet 4.6 input tokens
};

const MIN_INTERVAL_MS = 500;

// How many messages a single visitor may send per process while the
// rate-limit DB is unreachable. Small enough that an outage can't be
// exploited for runaway spend; large enough that a brief blip doesn't
// interrupt a real conversation.
const FALLBACK_GRACE = 5;

// Process-local map of visitor → last request timestamp. Pruned when it
// grows. Lost on deploy, which is fine — fresh deploys reset abuse windows.
const lastRequest = new Map();

// Process-local map of visitor → messages served while the DB was erroring.
// Cleared per-visitor on the next successful RPC so it only accumulates
// during an actual outage window.
const fallbackCounts = new Map();

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
    // Degraded mode — bounded grace instead of unbounded fail-open.
    console.error("[rate-limit] RPC failed, entering degraded mode:", error);
    const used = (fallbackCounts.get(visitorId) || 0) + 1;
    fallbackCounts.set(visitorId, used);
    if (used > FALLBACK_GRACE) {
      return {
        ok: false,
        code: "degraded",
        retryAfter: 60,
        message: `We're having a brief hiccup on our end — give it a minute and try again, or email ${SALES_EMAIL}.`,
      };
    }
    return { ok: true, degraded: true };
  }

  // DB is healthy — clear any degraded-mode grace counter for this visitor.
  if (fallbackCounts.size) fallbackCounts.delete(visitorId);

  const row = data?.[0] || {};
  const hourly = Number(row.messages_last_hour || 0);
  const daily = Number(row.messages_last_day || 0);
  const tokens = Number(row.tokens_last_day || 0);

  if (hourly >= LIMITS.messages_per_hour) {
    return {
      ok: false,
      code: "hourly_limit",
      retryAfter: 3600,
      message: `Hourly limit reached. Try again in an hour, or email ${SALES_EMAIL}.`,
    };
  }
  if (daily >= LIMITS.messages_per_day) {
    return {
      ok: false,
      code: "daily_limit",
      retryAfter: 86400,
      message: `Daily message limit reached. Try again tomorrow, or email ${SALES_EMAIL}.`,
    };
  }
  if (tokens >= LIMITS.tokens_per_day) {
    return {
      ok: false,
      code: "tokens_limit",
      retryAfter: 86400,
      message: `Daily usage limit reached. Try again tomorrow, or email ${SALES_EMAIL}.`,
    };
  }

  return { ok: true, hourly, daily, tokens };
}
