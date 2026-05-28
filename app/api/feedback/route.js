// ──────────────────────────────────────────────────────────────────────────
// app/api/feedback/route.js
// ──────────────────────────────────────────────────────────────────────────
// POST /api/feedback — "was this article helpful?" yes/no votes from help
// + blog pages, with an optional free-text reason.
//
// Hardened to match the other write surfaces:
//   - IP read + hash come from the shared lib/ipHash.js (trusted Netlify
//     client-IP header + a salt that FAILS CLOSED in production). The old
//     local copy here used a guessable "feedback-default-salt" that did NOT
//     throw in prod, leaving the stored ip_hash reversible.
//   - Per-IP rate limit via lib/rateLimit.js, in its own "feedback"
//     namespace (looser cap than the lead forms — voting on several
//     articles in one session is legitimate).
//   - Hidden-`website` honeypot, accept-and-drop (return ok, skip the
//     insert) so bots get no retry signal.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getClientIp, hashIp } from "@/lib/ipHash";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_VOTES = ["yes", "no"];
const REASON_MAX = 2000;
const RESOURCE_MAX = 200;
const SESSION_MAX = 100;

// Looser than the 5/hr lead-form cap: a curious reader may vote on a
// handful of help articles in one sitting. Still bounds runaway spam.
const FEEDBACK_MAX_PER_HOUR = 30;

export async function POST(request) {
  try {
    // ── Rate limit by IP (own namespace, so it doesn't share the lead
    //    forms' budget) ──
    const ip = getClientIp(request);
    const limit = rateLimit(ip, {
      namespace: "feedback",
      max: FEEDBACK_MAX_PER_HOUR,
    });
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSec) },
        }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // ── Honeypot ── hidden "website" field; real users never fill it.
    // Accept-and-drop: return ok so bots get no retry signal, skip insert.
    if (body.website && String(body.website).trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    /* ── Validation ── */
    const resource = String(body.resource || "")
      .slice(0, RESOURCE_MAX)
      .trim();
    const vote = String(body.vote || "").trim();
    const reason = body.reason
      ? String(body.reason).slice(0, REASON_MAX).trim() || null
      : null;
    const sessionId = body.sessionId
      ? String(body.sessionId).slice(0, SESSION_MAX).trim() || null
      : null;

    if (!resource) {
      return NextResponse.json({ error: "Missing resource." }, { status: 400 });
    }
    if (!VALID_VOTES.includes(vote)) {
      return NextResponse.json(
        { error: "Invalid vote value." },
        { status: 400 }
      );
    }

    /* ── Insert ── */
    const supabase = getSupabaseAdmin();
    const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null;

    const { error } = await supabase.from("article_feedback").insert({
      resource,
      vote,
      reason,
      session_id: sessionId,
      ip_hash: hashIp(ip),
      user_agent: userAgent,
    });

    if (error) {
      console.error("[feedback] Supabase insert error:", error);
      return NextResponse.json(
        { error: "Could not save your feedback. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback] Unhandled error:", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
