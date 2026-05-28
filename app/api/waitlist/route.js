// ──────────────────────────────────────────────────────────────────────────
// app/api/waitlist/route.js
// ──────────────────────────────────────────────────────────────────────────
// POST /api/waitlist — handles API early-access waitlist signups.
//
// Passes meta (source_url, user_agent, ip_hash) through to
// sendWaitlistEmail so the form_submissions row has full context. Email
// + persistence are handled inside lib/email.js — this route is just
// validation, rate limiting, and shaping the form payload.
//
// IP reading + hashing come from the shared lib/ipHash.js.
//
// NOTE: rateLimit is now async (durable Supabase-backed limiter) — awaited.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { validateWaitlist } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { hashIp } from "@/lib/ipHash";
import { cap, FIELD_CAPS } from "@/lib/site";
import { sendWaitlistEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const ip = getClientIp(req);
  const limit = await rateLimit(ip);
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
    sourceUrl: cap(body?.source_url || "/api-docs", FIELD_CAPS.url),
    userAgent: cap(req.headers.get("user-agent") || "", FIELD_CAPS.userAgent),
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
