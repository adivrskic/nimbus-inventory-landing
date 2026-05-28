// ──────────────────────────────────────────────────────────────────────────
// app/api/contact/route.js
// ──────────────────────────────────────────────────────────────────────────
// POST /api/contact — contact form submissions from the /contact page.
// Funnels through lib/email.js for the shared branded template + Supabase
// persistence (durable even if Resend errors). Always go through the lib —
// the old direct-Resend plain-text path is the bug that made contact
// emails look ugly. IP hashing is shared (lib/ipHash); field caps, the
// sales address, and the cap() helper come from lib/site.
//
// Response envelope is { ok, error?, fieldErrors? } on every path, matching
// the demo + waitlist routes so the client branches one way.
//
// NOTE: rateLimit is now async (durable Supabase-backed limiter) — awaited.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { validateContact } from "@/lib/validation";
import { sendContactEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { hashIp } from "@/lib/ipHash";
import { cap, FIELD_CAPS, SALES_EMAIL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    // ── Rate limit by IP ──
    const ip = getClientIp(request);
    const limit = await rateLimit(ip);
    if (!limit.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    // ── Honeypot ── hidden "website" field; real users never fill it.
    // Return 200 so bots get no retry signal, but skip sending.
    if (body.website && String(body.website).trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    // ── Server-side validation ── client can't be trusted; re-check and
    // return fieldErrors so the client can highlight bad fields inline.
    const fieldErrors = validateContact(body);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { ok: false, error: "Please fix the highlighted fields.", fieldErrors },
        { status: 400 }
      );
    }

    const form = {
      name: cap(body.name, FIELD_CAPS.name),
      email: cap(body.email, FIELD_CAPS.email),
      company: cap(body.company, FIELD_CAPS.company),
      role: cap(body.role, FIELD_CAPS.role),
      usage: cap(body.usage, FIELD_CAPS.usage),
      message: cap(body.message, FIELD_CAPS.message),
    };

    const meta = {
      sourceUrl: cap(body.source_url || "/contact", FIELD_CAPS.url),
      userAgent: cap(
        request.headers.get("user-agent") || "",
        FIELD_CAPS.userAgent
      ),
      ipHash: hashIp(ip),
    };

    // ── Send (and persist) ── sendContactEmail handles log → send →
    // update. Missing Supabase env vars degrade gracefully (logs + continues).
    try {
      const result = await sendContactEmail(form, meta);
      if (result?.error) {
        console.error("[contact] Resend error:", result.error);
        return NextResponse.json(
          {
            ok: false,
            error: `Couldn't send your message. Please try again or email ${SALES_EMAIL}.`,
          },
          { status: 502 }
        );
      }
      return NextResponse.json({
        ok: true,
        id: result?.data?.id,
        submissionId: result?.submissionId,
      });
    } catch (err) {
      console.error("[contact] sendContactEmail threw:", err);
      const msg = String(err?.message || "");
      const isConfig =
        msg.includes("RESEND_API_KEY") ||
        msg.includes("LEAD_TO_EMAIL") ||
        msg.includes("RESEND_FROM_EMAIL");
      return NextResponse.json(
        {
          ok: false,
          error: isConfig
            ? `Email service isn't configured. Try ${SALES_EMAIL}.`
            : "Couldn't send your message. Please try again.",
        },
        { status: isConfig ? 500 : 502 }
      );
    }
  } catch (err) {
    console.error("[contact] Unhandled error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
