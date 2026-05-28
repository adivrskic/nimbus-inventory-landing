// ──────────────────────────────────────────────────────────────────────────
// app/api/demo/route.js
// ──────────────────────────────────────────────────────────────────────────
// POST /api/demo — demo requests from DemoModal. Validation + rate limiting
// here; email delivery + persistence in lib/email.js. IP hashing is shared
// (lib/ipHash); the cap() helper + field caps come from lib/site.
//
// Response envelope is { ok, error?, fieldErrors? } on every path.
//
// NOTE: rateLimit is now async (durable Supabase-backed limiter) — awaited.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { validateDemo } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendDemoRequestEmail } from "@/lib/email";
import { hashIp } from "@/lib/ipHash";
import { cap, FIELD_CAPS } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  // ── Rate limit by IP ──
  const ip = getClientIp(req);
  const limit = await rateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
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

  // ── Honeypot ── silently accept-and-drop so bots don't retry.
  if (body && typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  // `topic`/`topicLabel` ride through to the sales email so the rep sees
  // what the meeting is about. Optional in the validator for older clients.
  const form = {
    name: String(body?.name || "").trim(),
    email: String(body?.email || "").trim(),
    company: String(body?.company || "").trim(),
    warehouseSize: String(body?.warehouseSize || "").trim(),
    comments: String(body?.comments || "").trim(),
    topic: String(body?.topic || "demo").trim(),
    topicLabel: String(body?.topicLabel || "").trim(),
  };
  const errors = validateDemo(form);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please check the form for errors.",
        fieldErrors: errors,
      },
      { status: 400 }
    );
  }

  const meta = {
    sourceUrl: cap(body?.source_url || "", FIELD_CAPS.url),
    userAgent: cap(req.headers.get("user-agent") || "", FIELD_CAPS.userAgent),
    ipHash: hashIp(ip),
  };

  try {
    const res = await sendDemoRequestEmail(form, meta);
    if (res?.error) {
      console.error("Resend error (demo):", res.error);
      return NextResponse.json(
        { ok: false, error: "Could not send your request. Please try again." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, submissionId: res?.submissionId });
  } catch (err) {
    console.error("Demo route error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
