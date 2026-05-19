// ──────────────────────────────────────────────────────────────────────────
// app/api/waitlist/route.js
// ──────────────────────────────────────────────────────────────────────────
// POST /api/waitlist — handles API early-access waitlist signups.
//
// Now passes meta (source_url, user_agent, ip_hash) through to
// sendWaitlistEmail so the form_submissions row has full context. Email
// + persistence are handled inside lib/email.js — this route is just
// validation, rate limiting, and shaping the form payload.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { validateWaitlist } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendWaitlistEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cap = (s, max = 500) => String(s || "").slice(0, max);

/* Daily-rotating IP hash. Same pattern as contact + demo + chat routes. */
function hashIp(ip) {
  if (!ip) return null;
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.IP_HASH_SALT || "waitlist-default-salt";
  return crypto
    .createHash("sha256")
    .update(`${ip}|${day}|${salt}`)
    .digest("hex")
    .slice(0, 32);
}

export async function POST(req) {
  const ip = getClientIp(req);
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  // Honeypot
  if (body && typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const form = {
    email: String(body?.email || "").trim(),
  };
  const errors = validateWaitlist(form);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { ok: false, error: "Please check your email.", fieldErrors: errors },
      { status: 400 }
    );
  }

  const meta = {
    sourceUrl: cap(body?.source_url || "/api-docs", 500),
    userAgent: cap(req.headers.get("user-agent") || "", 500),
    ipHash: hashIp(ip),
  };

  try {
    const res = await sendWaitlistEmail(form, meta);
    if (res?.error) {
      console.error("Resend error (waitlist):", res.error);
      return NextResponse.json(
        { ok: false, error: "Could not save your signup. Please try again." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, submissionId: res?.submissionId });
  } catch (err) {
    console.error("Waitlist route error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
