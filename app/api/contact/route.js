import { NextResponse } from "next/server";
import { Resend } from "resend";
import { validateContact } from "@/lib/validation";

/* Force the Node runtime — Resend's SDK uses Node primitives. Edge runtime
   would work in theory but the SDK is friendlier on Node. */
export const runtime = "nodejs";
/* Don't cache POST responses (defensive; Next.js defaults to no-cache for
   route handlers anyway). */
export const dynamic = "force-dynamic";

/* Cap any string we accept before putting it in an email body. Defensive
   against payload-stuffing attacks. */
const cap = (s, max = 5000) => String(s || "").slice(0, max);

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    /* ── Honeypot ──────────────────────────────────────────────────────
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

    /* ── Resend config check ──
       If any env var is missing we return a clear 500 instead of throwing,
       so the user sees a real error message instead of a generic crash. */
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const toEmail = process.env.LEAD_TO_EMAIL;

    if (!apiKey || !fromEmail || !toEmail) {
      console.error(
        "[contact] Missing env vars — need RESEND_API_KEY, RESEND_FROM_EMAIL, LEAD_TO_EMAIL"
      );
      return NextResponse.json(
        { error: "Email service isn't configured. Try sales@nimbuswms.com." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const name = cap(body.name, 200);
    const email = cap(body.email, 320);
    const company = cap(body.company, 200);
    const role = cap(body.role, 100);
    const usage = cap(body.usage, 100);
    const message = cap(body.message, 5000);

    /* Plain-text email body — easier to read on phones, no HTML injection
       risk, fine for an internal lead notification. */
    const text = [
      "New contact form submission from nimbuswms.com",
      "",
      `Name:    ${name}`,
      `Email:   ${email}`,
      `Company: ${company || "(not provided)"}`,
      `Role:    ${role || "(not provided)"}`,
      `Stage:   ${usage || "(not provided)"}`,
      "",
      "Message:",
      message,
      "",
      "— Sent from the Contact page",
    ].join("\n");

    const subject = `Contact: ${name}${
      company ? ` from ${company}` : ""
    }`.slice(0, 200);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject,
      text,
    });

    if (error) {
      console.error("[contact] Resend error:", error);
      return NextResponse.json(
        {
          error:
            "Couldn't send your message. Please try again or email sales@nimbuswms.com.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("[contact] Unhandled error:", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
