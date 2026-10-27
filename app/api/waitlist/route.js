// ──────────────────────────────────────────────────────────────────────────
// app/api/waitlist/route.js
// ──────────────────────────────────────────────────────────────────────────
// POST /api/waitlist — waitlist signups. `list` picks which one: "api" (API
// early access, the default for older clients) or "mobile_apps" (the
// notify-me form under the footer's coming-soon store badges). Unknown
// values fall back to "api".
//
// Passes meta (source_url, user_agent, ip_hash) through to
// sendWaitlistEmail so the form_submissions row has full context. Email
// + persistence are handled inside lib/email.js — this route is just
// validation, rate limiting, and shaping the form payload.
//
// IP reading + hashing come from the shared lib/ipHash.js.
//
// NOTE: rateLimit is now async (durable Supabase-backed limiter) — awaited.
// It uses its own namespace so a notify-me signup never eats into the demo
// and contact forms' allowance.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { validateWaitlist, WAITLIST_LISTS } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { hashIp } from "@/lib/ipHash";
import { cap, FIELD_CAPS } from "@/lib/site";
import { sendWaitlistEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const ip = getClientIp(req);
  const limit = await rateLimit(ip, { namespace: "waitlist" });
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
  /* `null`, an array or a bare string parse as valid JSON; reject them
     before any field is read. */
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  // Honeypot
  if (body && typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const list = Object.hasOwn(WAITLIST_LISTS, String(body?.list))
    ? String(body.list)
    : "api";
  const form = {
    email: String(body?.email || "").trim(),
    list,
    listLabel: WAITLIST_LISTS[list],
  };
  const errors = validateWaitlist(form);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { ok: false, error: "Please check your email.", fieldErrors: errors },
      { status: 400 }
    );
  }

  const meta = {
    sourceUrl: cap(
      body?.source_url || "/",
      FIELD_CAPS.url
    ),
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
