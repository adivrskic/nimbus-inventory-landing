// app/api/demo/route.js
// POST /api/demo — handles demo request submissions.

import { NextResponse } from "next/server";
import { validateDemo } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendDemoRequestEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  // ── Rate limit by IP ──
  const ip = getClientIp(req);
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      }
    );
  }

  // ── Parse body ──
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  // ── Honeypot ── (silently accept-and-drop so bots don't retry)
  if (body && typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  // ── Validate ──
  // `topic` and `topicLabel` come from DemoModal's chip selector and ride
  // through into the sales email so the rep sees what the meeting is
  // about before replying. They're optional in the validator, so older
  // clients (or callers that don't set them) still work.
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

  // ── Send email ──
  try {
    const res = await sendDemoRequestEmail(form);
    if (res?.error) {
      console.error("Resend error (demo):", res.error);
      return NextResponse.json(
        { ok: false, error: "Could not send your request. Please try again." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Demo route error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
