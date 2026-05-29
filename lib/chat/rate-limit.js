// Layers of protection, in this order:
//
//   1. Minimum interval (in-memory, 500ms) — checked against BOTH the
//      visitor AND the IP, so flooding can't be hidden by rotating the
//      visitor cookie (the IP key still trips).
//   2. Global daily token breaker — caps total Anthropic spend across ALL
//      visitors. Protects the budget even against a distributed attack
//      (botnet / proxy rotation) that evades the per-caller keys.
//   3. Per-visitor ceilings — hourly/daily messages + daily tokens.
//   4. Per-IP ceilings — looser than per-visitor (people legitimately share
//      an IP behind NAT / mobile carriers), but they exist so that rotating
//      the visitor cookie from a single source can't reset the cap. Cookie
//      rotation doesn't change the IP.
//
// The DB-backed counts (layers 2–4) come from ONE round-trip to the
// check_chat_rate(v_visitor_id, v_ip_hash) RPC, which returns visitor + IP +
// global counts in a single row. A null ip_hash makes the IP columns return
// 0, so a missing IP simply falls back to the visitor + global layers.
//
// Degraded behavior on RPC error (DB outage): we do NOT fail fully open. A
// fully-open token cap meant a single DB blip could enable unbounded
// Anthropic spend. Instead we fall back to a small per-process grace quota
// (FALLBACK_GRACE), keyed on the IP when known so cookie rotation during an
// outage can't mint unlimited grace, then block with a soft "try again"
// message. The grace counter clears on the next successful RPC.
// ──────────────────────────────────────────────────────────────────────────

import { getSupabaseAdmin } from "@/lib/supabase";
import { SALES_EMAIL } from "@/lib/site";

const LIMITS = {
  messages_per_hour: 40,
  messages_per_day: 200,
  tokens_per_day: 1_000_000,
};

const IP_LIMITS = {
  messages_per_hour: 150,
  messages_per_day: 800,
  tokens_per_day: 4_000_000,
};

const GLOBAL_TOKENS_PER_DAY = 60_000_000;

const MIN_INTERVAL_MS = 500;

const FALLBACK_GRACE = 5;

const lastRequest = new Map();

const fallbackCounts = new Map();

function pruneLastRequest(now) {
  if (lastRequest.size < 5000) return;
  const cutoff = now - 60_000;
  for (const [k, v] of lastRequest.entries()) {
    if (v < cutoff) lastRequest.delete(k);
  }
}

export async function checkRateLimit(visitorId, ipHash = null) {
  if (!visitorId) return { ok: true };

  const now = Date.now();

  const intervalKeys = [`v:${visitorId}`];
  if (ipHash) intervalKeys.push(`ip:${ipHash}`);
  for (const key of intervalKeys) {
    const last = lastRequest.get(key);
    if (last && now - last < MIN_INTERVAL_MS) {
      return {
        ok: false,
        code: "too_fast",
        retryAfter: Math.ceil((MIN_INTERVAL_MS - (now - last)) / 1000) || 1,
        message: "Slow down — you're sending messages very quickly.",
      };
    }
  }
  for (const key of intervalKeys) lastRequest.set(key, now);
  pruneLastRequest(now);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("check_chat_rate", {
    v_visitor_id: visitorId,
    v_ip_hash: ipHash,
  });

  if (error) {
    console.error("[rate-limit] RPC failed, entering degraded mode:", error);
    const graceKey = ipHash ? `ip:${ipHash}` : `v:${visitorId}`;
    const used = (fallbackCounts.get(graceKey) || 0) + 1;
    fallbackCounts.set(graceKey, used);
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

  if (fallbackCounts.size) {
    fallbackCounts.delete(`v:${visitorId}`);
    if (ipHash) fallbackCounts.delete(`ip:${ipHash}`);
  }

  const row = data?.[0] || {};
  const vHour = Number(row.visitor_messages_last_hour || 0);
  const vDay = Number(row.visitor_messages_last_day || 0);
  const vTokens = Number(row.visitor_tokens_last_day || 0);
  const ipHour = Number(row.ip_messages_last_hour || 0);
  const ipDay = Number(row.ip_messages_last_day || 0);
  const ipTokens = Number(row.ip_tokens_last_day || 0);
  const globalTokens = Number(row.global_tokens_last_day || 0);

  if (globalTokens >= GLOBAL_TOKENS_PER_DAY) {
    return {
      ok: false,
      code: "global_busy",
      retryAfter: 3600,
      message: `Chat is seeing unusually high demand right now. Please try again later, or email ${SALES_EMAIL}.`,
    };
  }

  if (vHour >= LIMITS.messages_per_hour) {
    return {
      ok: false,
      code: "hourly_limit",
      retryAfter: 3600,
      message: `Hourly limit reached. Try again in an hour, or email ${SALES_EMAIL}.`,
    };
  }
  if (vDay >= LIMITS.messages_per_day) {
    return {
      ok: false,
      code: "daily_limit",
      retryAfter: 86400,
      message: `Daily message limit reached. Try again tomorrow, or email ${SALES_EMAIL}.`,
    };
  }
  if (vTokens >= LIMITS.tokens_per_day) {
    return {
      ok: false,
      code: "tokens_limit",
      retryAfter: 86400,
      message: `Daily usage limit reached. Try again tomorrow, or email ${SALES_EMAIL}.`,
    };
  }

  if (ipHour >= IP_LIMITS.messages_per_hour) {
    return {
      ok: false,
      code: "ip_hourly_limit",
      retryAfter: 3600,
      message: `Hourly limit reached. Try again in an hour, or email ${SALES_EMAIL}.`,
    };
  }
  if (ipDay >= IP_LIMITS.messages_per_day) {
    return {
      ok: false,
      code: "ip_daily_limit",
      retryAfter: 86400,
      message: `Daily message limit reached. Try again tomorrow, or email ${SALES_EMAIL}.`,
    };
  }
  if (ipTokens >= IP_LIMITS.tokens_per_day) {
    return {
      ok: false,
      code: "ip_tokens_limit",
      retryAfter: 86400,
      message: `Daily usage limit reached. Try again tomorrow, or email ${SALES_EMAIL}.`,
    };
  }

  return {
    ok: true,
    vHour,
    vDay,
    vTokens,
    ipHour,
    ipDay,
    ipTokens,
    globalTokens,
  };
}
