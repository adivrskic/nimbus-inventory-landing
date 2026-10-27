// ──────────────────────────────────────────────────────────────────────────
// app/api/estimate/route.js
// ──────────────────────────────────────────────────────────────────────────
// POST /api/estimate — "Email me this estimate" on /calculator.
//
// The body carries only an email address and the four calculator inputs.
// The server recomputes the estimate with lib/roi (the same code the page
// runs), so the email can never contain numbers the visitor didn't see, and
// this endpoint can't be used to put arbitrary text into an email sent to an
// arbitrary address. Abuse limits: the shared durable IP rate limiter (own
// namespace), the honeypot, and at most one estimate email per address per
// day (enforced in sendEstimateEmail).
//
// Response envelope matches the other form routes: { ok, error?,
// fieldErrors?, submissionId? }.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { validateEstimate } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { hashIp } from "@/lib/ipHash";
import { cap, FIELD_CAPS } from "@/lib/site";
import { RANGES, calculate, clampInput } from "@/lib/roi";
import { sendEstimateEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const ip = getClientIp(req);
  const limit = await rateLimit(ip, { namespace: "estimate" });
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

  // Honeypot — accept and drop so bots get no retry signal.
  if (body && typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const errors = validateEstimate(body || {});
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { ok: false, error: "Please check your email address.", fieldErrors: errors },
      { status: 400 }
    );
  }

  const inputs = {
    size: clampInput(body.inputs.size, RANGES.size),
    pickers: clampInput(body.inputs.pickers, RANGES.pickers),
    accuracy: clampInput(body.inputs.accuracy, RANGES.accuracy),
    wage: clampInput(body.inputs.wage, RANGES.wage),
  };

  const meta = {
    sourceUrl: cap(body.source_url || "/calculator", FIELD_CAPS.url),
    userAgent: cap(req.headers.get("user-agent") || "", FIELD_CAPS.userAgent),
    ipHash: hashIp(ip),
  };

  try {
    const res = await sendEstimateEmail(
      {
        email: cap(body.email, FIELD_CAPS.email).trim(),
        inputs,
        estimate: calculate(inputs),
      },
      meta
    );
    if (res?.error) {
      console.error("[estimate] Resend error:", res.error);
      return NextResponse.json(
        { ok: false, error: "Couldn't send your estimate. Please try again." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, submissionId: res?.submissionId });
  } catch (err) {
    console.error("[estimate] route error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
