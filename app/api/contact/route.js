// ──────────────────────────────────────────────────────────────────────────
// app/api/contact/route.js
// ──────────────────────────────────────────────────────────────────────────
// POST /api/contact — handles contact form submissions from the /contact
// page. Funnels through lib/email.js so it gets:
//
//   - The shared branded HTML template (same as /api/demo and /api/waitlist)
//   - Supabase persistence to form_submissions (durable record even if
//     Resend bounces / errors / is down)
//
// Previous version reached for Resend directly with a plain-text body —
// that's the bug that made contact emails look ugly while demo emails
// looked fine. Don't reintroduce that — always go through the lib.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { validateContact } from "@/lib/validation";
import { sendContactEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Cap any string we accept before putting it in an email body. Defensive
   against payload-stuffing attacks. */
const cap = (s, max = 5000) => String(s || "").slice(0, max);

/* sha256 of "ip|YYYY-MM-DD|salt", truncated to 128 bits. Matches the
   visitor-tracking pattern used by chat — stable within a day for spam
   detection, not stable across days so it never functions as a long-
   term identifier. */
function hashIp(ip) {
  if (!ip) return null;
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.IP_HASH_SALT || "contact-default-salt";
  return crypto
    .createHash("sha256")
    .update(`${ip}|${day}|${salt}`)
    .digest("hex")
    .slice(0, 32);
}

export async function POST(request) {
  try {
    // ── Rate limit by IP ──
    const ip = getClientIp(request);
    const limit = rateLimit(ip);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSec) },
        }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    /* ── Honeypot ──
       The form has a hidden "website" field that real users never see and
       never fill. If it has anything in it, this is almost certainly a
       bot. Return 200 so they don't get a signal to retry, but skip
       sending. */
    if (body.website && String(body.website).trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    /* ── Server-side validation ──
       Same rules as the client runs, but we re-check because the client
       can't be trusted. If validation fails we return `fieldErrors` so
       the client can highlight the bad fields inline. */
    const fieldErrors = validateContact(body);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: "Please fix the highlighted fields.", fieldErrors },
        { status: 400 }
      );
    }

    /* Normalize + cap before handing to the email lib. */
    const form = {
      name: cap(body.name, 200),
      email: cap(body.email, 320),
      company: cap(body.company, 200),
      role: cap(body.role, 100),
      usage: cap(body.usage, 100),
      message: cap(body.message, 5000),
    };

    const meta = {
      sourceUrl: cap(body.source_url || "/contact", 500),
      userAgent: cap(request.headers.get("user-agent") || "", 500),
      ipHash: hashIp(ip),
    };

    /* ── Send (and persist) ──
       sendContactEmail handles the full log → send → update flow. If
       Supabase env vars are missing it gracefully logs and continues —
       email is the primary delivery path, persistence is a bonus. */
    try {
      const result = await sendContactEmail(form, meta);
      if (result?.error) {
        console.error("[contact] Resend error:", result.error);
        return NextResponse.json(
          {
            error:
              "Couldn't send your message. Please try again or email sales@nautilusinventory.com.",
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
      /* Most likely RESEND_API_KEY / RESEND_FROM_EMAIL / LEAD_TO_EMAIL
         missing — surface a clean error to the user instead of a 500
         with a stack trace. */
      const msg = String(err?.message || "");
      const isConfig =
        msg.includes("RESEND_API_KEY") ||
        msg.includes("LEAD_TO_EMAIL") ||
        msg.includes("RESEND_FROM_EMAIL");
      return NextResponse.json(
        {
          error: isConfig
            ? "Email service isn't configured. Try sales@nautilusinventory.com."
            : "Couldn't send your message. Please try again.",
        },
        { status: isConfig ? 500 : 502 }
      );
    }
  } catch (err) {
    console.error("[contact] Unhandled error:", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
