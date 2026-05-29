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
    console.error("[email] logSubmission failed:", err);
    return null;
  }
}

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
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#f0f6fc;white-space:pre-wrap;word-wrap:break-word;">${esc(
              value
            )}</div>
          </td>
        </tr>`
    )
    .join("");

  const replyHtml = replyTo
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
        <tr>
          <td style="background:rgba(212,168,83,0.08);border:1px solid rgba(212,168,83,0.22);border-left:2px solid #D4A853;padding:18px 20px;">
            <div style="font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#D4A853;margin-bottom:10px;">Reply directly</div>
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6;color:#d4d2d1;margin-bottom:14px;">Hit reply and your response goes straight to <span style="color:#f0f6fc;font-weight:500;">${esc(
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
    ? `<div style="margin-top:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.6;color:rgba(240,246,252,0.55);">${esc(
        footerNote
      )}</div>`
    : "";

  const introHtml = intro
    ? `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:rgba(240,246,252,0.65);margin:0 0 28px;">${esc(
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
<body style="margin:0;padding:0;background:#04091c;color:#f0f6fc;-webkit-font-smoothing:antialiased;">
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
              <td align="right" style="font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(240,246,252,0.35);">${esc(
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
              ? `<div style="font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(240,246,252,0.4);margin-bottom:14px;">${esc(
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
          <div style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);font-family:'JetBrains Mono','SF Mono',ui-monospace,monospace;font-size:9.5px;letter-spacing:1px;color:rgba(240,246,252,0.3);">
            Sent automatically by Nautilus &middot; nautilusinventory.com
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

  const rowId = await logSubmission({
    formType,
    payload,
    topic,
    replyTo,
    sourceUrl: meta.sourceUrl,
    userAgent: meta.userAgent,
    ipHash: meta.ipHash,
  });

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

  if (result?.error) {
    await updateSubmissionEmail(rowId, {
      error: result.error?.message || JSON.stringify(result.error),
    });
  } else {
    await updateSubmissionEmail(rowId, { emailId: result?.data?.id });
  }

  return { ...result, submissionId: rowId };
}

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
