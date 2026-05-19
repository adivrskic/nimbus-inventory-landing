// ──────────────────────────────────────────────────────────────────────────
// lib/email.js
// ──────────────────────────────────────────────────────────────────────────
// Resend wrapper + email templates + Supabase persistence for every form
// submission on the site. Server-side only — never import from a Client
// Component.
//
// Flow for every form submission:
//
//   1. logSubmission()    Write a row to form_submissions BEFORE the
//                         email leaves, so we have a record even if Resend
//                         is down. Returns the inserted row id (or null
//                         if Supabase isn't configured / insert failed —
//                         we never let a logging failure block the email).
//
//   2. resend.emails.send()    The actual notification.
//
//   3. updateSubmissionEmail() Write back the Resend message id (success)
//                              or the error string (failure) onto the
//                              row we created in step 1. Lets us tell
//                              "saved + delivered" from "saved but
//                              email failed" later.
//
// Adding a new form: write a new send*Email function that builds the rows,
// then calls sendBranded() with the form_type tag. Don't reach for Resend
// directly from a route handler — keep the template + persistence path
// consistent for all forms.
// ──────────────────────────────────────────────────────────────────────────

import { Resend } from "resend";
import { getSupabaseAdmin } from "./supabase";

let _client = null;
function client() {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to your environment variables."
    );
  }
  _client = new Resend(key);
  return _client;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ── Persistence helpers ───────────────────────────────────────────────── */

/* Insert a row into form_submissions. Returns the inserted row id, or
   null if anything goes wrong. Logging failures must never block email
   delivery — emails are the user's actual notification path. */
async function logSubmission({
  formType,
  payload,
  topic,
  replyTo,
  sourceUrl,
  userAgent,
  ipHash,
}) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("form_submissions")
      .insert({
        form_type: formType,
        payload,
        topic: topic || null,
        reply_to: replyTo || null,
        source_url: sourceUrl || null,
        user_agent: userAgent || null,
        ip_hash: ipHash || null,
      })
      .select("id")
      .single();
    if (error) {
      console.error("[email] logSubmission insert error:", error);
      return null;
    }
    return data?.id || null;
  } catch (err) {
    /* Supabase env not configured, network, etc. — log and move on. */
    console.error("[email] logSubmission failed:", err);
    return null;
  }
}

/* Write the Resend result back onto the row created by logSubmission.
   No-op if rowId is null (logging failed earlier, nothing to update). */
async function updateSubmissionEmail(rowId, { emailId, error }) {
  if (!rowId) return;
  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("form_submissions")
      .update({
        email_sent: !error,
        email_id: emailId || null,
        email_error: error ? String(error).slice(0, 1000) : null,
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", rowId);
  } catch (err) {
    console.error("[email] updateSubmissionEmail failed:", err);
  }
}

/* ── HTML shell ────────────────────────────────────────────────────────────
   Single source of truth for the visual treatment of every notification
   email. Inline styles only — most email clients strip <style> blocks
   and ignore CSS variables. Table-based layout — most reliable cross-
   client. Subtle navy → black gradient + gold accent matches the site
   palette without being so dark it fails in light-mode previews.
   ────────────────────────────────────────────────────────────────────── */
function shell({ title, eyebrow, intro, rows, footerNote, replyTo }) {
  const rowHtml = rows
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.06);vertical-align:top;width:140px;">
            <div style="font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#7a8aa3;font-weight:500;">${esc(
              label
            )}</div>
          </td>
          <td style="padding:16px 0 16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);vertical-align:top;">
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#f2f0ef;white-space:pre-wrap;word-wrap:break-word;">${esc(
              value
            )}</div>
          </td>
        </tr>`
    )
    .join("");

  /* Reply CTA only renders if we have a reply-to address. It's a real
     mailto link (not a styled-button-that-opens-the-form) because the
     whole point of the email is "respond directly". */
  const replyHtml = replyTo
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
        <tr>
          <td style="background:rgba(212,168,83,0.08);border:1px solid rgba(212,168,83,0.22);border-left:2px solid #D4A853;padding:18px 20px;">
            <div style="font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#D4A853;margin-bottom:10px;">Reply directly</div>
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6;color:#d4d2d1;margin-bottom:14px;">Hit reply and your response goes straight to <span style="color:#f2f0ef;font-weight:500;">${esc(
              replyTo
            )}</span>.</div>
            <a href="mailto:${esc(
              replyTo
            )}" style="display:inline-block;font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;font-size:11px;font-weight:500;letter-spacing:1px;text-transform:uppercase;color:#0a0e1d;background:#D4A853;padding:11px 22px;text-decoration:none;">Reply to ${esc(
        (replyTo || "").split("@")[0]
      )} →</a>
          </td>
        </tr>
      </table>`
    : "";

  const footerHtml = footerNote
    ? `<div style="margin-top:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.6;color:rgba(242,240,239,0.55);">${esc(
        footerNote
      )}</div>`
    : "";

  const introHtml = intro
    ? `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:rgba(242,240,239,0.65);margin:0 0 28px;">${esc(
        intro
      )}</div>`
    : "";

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#04091c;color:#f2f0ef;-webkit-font-smoothing:antialiased;">
  <!-- Preheader: shows in inbox preview pane next to the subject -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(
    intro || title
  )}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#04091c;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#0a1228 0%,#070d1f 100%);border:1px solid rgba(212,168,83,0.18);">

        <!-- Header band: brand + accent rule -->
        <tr><td style="padding:32px 40px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <span style="display:inline-block;width:8px;height:8px;background:#D4A853;vertical-align:middle;margin-right:10px;"></span>
                <span style="font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#D4A853;font-weight:600;vertical-align:middle;">Nautilus WMS</span>
              </td>
              <td align="right" style="font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(242,240,239,0.35);">${esc(
                new Date()
                  .toUTCString()
                  .replace(/^\w+, /, "")
                  .replace(/ GMT$/, " UTC")
              )}</td>
            </tr>
          </table>
          <div style="height:1px;background:linear-gradient(90deg,#D4A853 0%,rgba(212,168,83,0.1) 100%);margin-top:20px;"></div>
        </td></tr>

        <!-- Eyebrow + title -->
        <tr><td style="padding:28px 40px 0;">
          ${
            eyebrow
              ? `<div style="font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(242,240,239,0.4);margin-bottom:14px;">${esc(
                  eyebrow
                )}</div>`
              : ""
          }
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.6px;line-height:1.15;margin-bottom:14px;">${esc(
            title
          )}</div>
          ${introHtml}
        </td></tr>

        <!-- Rows -->
        <tr><td style="padding:0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowHtml}</table>
        </td></tr>

        <!-- Reply CTA -->
        <tr><td style="padding:0 40px;">${replyHtml}</td></tr>

        <!-- Footer -->
        <tr><td style="padding:0 40px 36px;">
          ${footerHtml}
          <div style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;font-size:9.5px;letter-spacing:1px;color:rgba(242,240,239,0.3);">
            Sent automatically by Nautilus &middot; nautiluswms.com
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

function plain(rows) {
  return rows
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([label, value]) => `${label.toUpperCase()}\n${value}\n`)
    .join("\n");
}

/* ── Shared send path ──────────────────────────────────────────────────────
   Every send*Email function below funnels through this. Centralizes the
   log → send → update flow so all forms get persistence for free and no
   one has to remember to call logSubmission. */
async function sendBranded({
  formType,
  payload,
  topic,
  replyTo,
  meta = {},
  subject,
  title,
  eyebrow,
  intro,
  rows,
  footerNote,
}) {
  const to = process.env.LEAD_TO_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!to || !from) {
    throw new Error(
      "LEAD_TO_EMAIL or RESEND_FROM_EMAIL is not set. Check your environment variables."
    );
  }

  /* 1. Persist first — we want the record even if email never fires. */
  const rowId = await logSubmission({
    formType,
    payload,
    topic,
    replyTo,
    sourceUrl: meta.sourceUrl,
    userAgent: meta.userAgent,
    ipHash: meta.ipHash,
  });

  /* 2. Send email. */
  const html = shell({ title, eyebrow, intro, rows, footerNote, replyTo });
  const text = `${title}\n\n${plain(rows)}`;

  let result;
  try {
    result = await client().emails.send({
      from,
      to: [to],
      replyTo: replyTo || undefined,
      subject,
      html,
      text,
    });
  } catch (err) {
    await updateSubmissionEmail(rowId, { error: err?.message || String(err) });
    throw err;
  }

  /* 3. Mirror the Resend response back onto the row. */
  if (result?.error) {
    await updateSubmissionEmail(rowId, {
      error: result.error?.message || JSON.stringify(result.error),
    });
  } else {
    await updateSubmissionEmail(rowId, { emailId: result?.data?.id });
  }

  return { ...result, submissionId: rowId };
}

/* ── Demo request ──
   Topic comes from the DemoModal chip selector and gets:
     - the top row of the email (so reps see it first)
     - the email subject prefix (so it's scannable in the inbox)
   topicLabel is the human-readable string ("Enterprise pricing", etc.);
   topic is the slug ("sales"). Falls back gracefully if either is
   missing. */
export async function sendDemoRequestEmail(form, meta = {}) {
  const topicDisplay = form.topicLabel || form.topic || "Live demo";

  const rows = [
    ["Topic", topicDisplay],
    ["Name", form.name],
    ["Email", form.email],
    ["Company", form.company],
    ["Warehouse size", form.warehouseSize],
    ["Comments", form.comments || "(none)"],
  ];

  const subjectPrefix = form.topicLabel
    ? `New ${form.topicLabel} request`
    : "New demo request";
  const subject = `${subjectPrefix}: ${form.company}`;

  return sendBranded({
    formType: "demo",
    payload: form,
    topic: form.topic || null,
    replyTo: form.email,
    meta,
    subject,
    title: subjectPrefix,
    eyebrow: "Demo request",
    intro: `A new ${topicDisplay.toLowerCase()} request just came in.`,
    rows,
    footerNote: "Reply to this email to respond directly to the lead.",
  });
}

/* ── Contact message ──
   Updated to match the actual form fields (company / role / usage /
   message). The old version of this function expected a `subject` field
   that the contact form hasn't collected for a while. */
export async function sendContactEmail(form, meta = {}) {
  const rows = [
    ["Name", form.name],
    ["Email", form.email],
    ["Company", form.company || "(not provided)"],
    ["Role", form.role || "(not provided)"],
    ["Stage", form.usage || "(not provided)"],
    ["Message", form.message],
  ];

  const subject = `Contact: ${form.name}${
    form.company ? ` from ${form.company}` : ""
  }`.slice(0, 200);

  return sendBranded({
    formType: "contact",
    payload: form,
    replyTo: form.email,
    meta,
    subject,
    title: "New contact message",
    eyebrow: "Contact form",
    intro: `${form.name}${
      form.company ? ` (${form.company})` : ""
    } sent a message from the contact page.`,
    rows,
    footerNote:
      "Hit reply to respond — the reply-to header is set to the sender's address.",
  });
}

/* ── API waitlist signup ── */
export async function sendWaitlistEmail(form, meta = {}) {
  const rows = [
    ["Email", form.email],
    ["Source", "API Docs page"],
  ];

  const subject = `New API waitlist signup: ${form.email}`;

  return sendBranded({
    formType: "waitlist",
    payload: form,
    replyTo: form.email,
    meta,
    subject,
    title: "New API waitlist signup",
    eyebrow: "Waitlist",
    intro: "Someone just joined the API early-access waitlist.",
    rows,
    footerNote: "Reply to this email to confirm or follow up with the signup.",
  });
}
