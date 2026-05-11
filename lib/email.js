// lib/email.js
// Resend wrapper + email templates for form submissions.
// Server-side only — never import this from a Client Component.

import { Resend } from "resend";

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

/* ── Shared HTML shell ── */
function shell({ title, rows, footerNote }) {
  const rowHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #1f1f1f;vertical-align:top;width:140px;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#737373;">${esc(
              label
            )}</div>
          </td>
          <td style="padding:14px 0;border-bottom:1px solid #1f1f1f;vertical-align:top;">
            <div style="font-family:-apple-system,system-ui,sans-serif;font-size:14px;line-height:1.6;color:#ffffff;white-space:pre-wrap;">${esc(
              value
            )}</div>
          </td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0a0a0a;border:1px solid #1f1f1f;border-radius:16px;padding:36px;">
        <tr><td>
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#D4A853;margin-bottom:8px;">Nimbus WMS</div>
          <div style="font-family:-apple-system,system-ui,sans-serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;margin-bottom:24px;">${esc(
            title
          )}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowHtml}</table>
          ${
            footerNote
              ? `<div style="margin-top:24px;padding:14px 16px;background:rgba(212,168,83,0.05);border:1px solid rgba(212,168,83,0.15);border-radius:10px;font-family:-apple-system,system-ui,sans-serif;font-size:13px;color:#D4A853;">${esc(
                  footerNote
                )}</div>`
              : ""
          }
          <div style="margin-top:24px;font-family:'JetBrains Mono',monospace;font-size:10px;color:#525252;">Received ${esc(
            new Date().toUTCString()
          )}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function plain(rows) {
  return rows
    .map(([label, value]) => `${label.toUpperCase()}\n${value}\n`)
    .join("\n");
}

/* ── Demo request ── */
export async function sendDemoRequestEmail(form) {
  const to = process.env.LEAD_TO_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!to || !from) {
    throw new Error(
      "LEAD_TO_EMAIL or RESEND_FROM_EMAIL is not set. Check your environment variables."
    );
  }

  const rows = [
    ["Name", form.name],
    ["Email", form.email],
    ["Company", form.company],
    ["Warehouse size", form.warehouseSize],
    ["Comments", form.comments || "(none)"],
  ];

  const subject = `New demo request: ${form.company}`;
  const html = shell({
    title: "New demo request",
    rows,
    footerNote: "Reply to this email to respond directly to the lead.",
  });
  const text = `New demo request\n\n${plain(rows)}`;

  return client().emails.send({
    from,
    to: [to],
    replyTo: form.email,
    subject,
    html,
    text,
  });
}

/* ── Contact message ── */
export async function sendContactEmail(form) {
  const to = process.env.LEAD_TO_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!to || !from) {
    throw new Error(
      "LEAD_TO_EMAIL or RESEND_FROM_EMAIL is not set. Check your environment variables."
    );
  }

  const rows = [
    ["Name", form.name],
    ["Email", form.email],
    ["Subject", form.subject],
    ["Message", form.message],
  ];

  const emailSubject = `Contact: ${form.subject}`;
  const html = shell({
    title: "New contact message",
    rows,
    footerNote: "Reply to this email to respond directly.",
  });
  const text = `New contact message\n\n${plain(rows)}`;

  return client().emails.send({
    from,
    to: [to],
    replyTo: form.email,
    subject: emailSubject,
    html,
    text,
  });
}

/* ── API waitlist signup ── */
export async function sendWaitlistEmail(form) {
  const to = process.env.LEAD_TO_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!to || !from) {
    throw new Error(
      "LEAD_TO_EMAIL or RESEND_FROM_EMAIL is not set. Check your environment variables."
    );
  }

  const rows = [
    ["Email", form.email],
    ["Source", "API Docs page"],
  ];

  const subject = `New API waitlist signup: ${form.email}`;
  const html = shell({
    title: "New API waitlist signup",
    rows,
    footerNote: "Reply to this email to confirm or follow up with the signup.",
  });
  const text = `New API waitlist signup\n\n${plain(rows)}`;

  return client().emails.send({
    from,
    to: [to],
    replyTo: form.email,
    subject,
    html,
    text,
  });
}
