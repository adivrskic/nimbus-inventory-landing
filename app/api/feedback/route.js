import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_VOTES = ["yes", "no"];
const REASON_MAX = 2000;
const RESOURCE_MAX = 200;
const SESSION_MAX = 100;

/* sha256 of "ip|YYYY-MM-DD|salt", truncated to 128 bits.
   Stable within a day (so we can spot "100 votes in 5min from same IP"
   patterns) but not stable across days, so it never functions as a
   long-term identifier and stays GDPR-friendly. */
function hashIp(ip) {
  if (!ip) return null;
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.IP_HASH_SALT || "feedback-default-salt";
  return crypto
    .createHash("sha256")
    .update(`${ip}|${day}|${salt}`)
    .digest("hex")
    .slice(0, 32);
}

function getIp(request) {
  /* Standard forwarded-IP headers. Vercel sets x-forwarded-for; other
     hosts may set x-real-ip. First entry in the comma list is the
     original client. */
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || null;
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
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
    const ip = getIp(request);
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
