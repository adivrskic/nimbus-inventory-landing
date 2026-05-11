// app/api/contact/route.js
// POST /api/contact — handles contact form submissions.

import { NextResponse } from "next/server";
import { validateContact } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendContactEmail } from "@/lib/email";

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
    name: String(body?.name || "").trim(),
    email: String(body?.email || "").trim(),
    subject: String(body?.subject || "").trim(),
    message: String(body?.message || "").trim(),
  };
  const errors = validateContact(form);
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

  try {
    const res = await sendContactEmail(form);
    if (res?.error) {
      console.error("Resend error (contact):", res.error);
      return NextResponse.json(
        { ok: false, error: "Could not send your message. Please try again." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
