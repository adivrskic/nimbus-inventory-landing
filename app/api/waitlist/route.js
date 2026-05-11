// app/api/waitlist/route.js
// POST /api/waitlist — handles API early-access waitlist signups.

import { NextResponse } from "next/server";
import { validateWaitlist } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendWaitlistEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  try {
    const res = await sendWaitlistEmail(form);
    if (res?.error) {
      console.error("Resend error (waitlist):", res.error);
      return NextResponse.json(
        { ok: false, error: "Could not save your signup. Please try again." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Waitlist route error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
