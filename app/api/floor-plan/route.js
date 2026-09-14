// ──────────────────────────────────────────────────────────────────────────
// app/api/floor-plan/route.js
// ──────────────────────────────────────────────────────────────────────────
// POST /api/floor-plan — the free floor plan review offer on /floor-plan.
//
// multipart/form-data: name, email, company?, notes?, website (honeypot),
// source_url, file.
//
// The file is identified by its leading bytes, not the browser's claimed
// MIME type, and capped at 4 MB — Netlify functions reject request bodies
// not far above 6 MB. It's stored in a private Supabase Storage bucket
// (created on first use) and attached to the notification email, so a
// storage hiccup never loses the request. Rate limited harder than the
// text forms: uploads are heavier to receive and to email.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { validateFloorPlan } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { hashIp } from "@/lib/ipHash";
import { cap, FIELD_CAPS } from "@/lib/site";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendFloorPlanEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;
const BUCKET = "floor-plans";

/* Accepted formats, recognised by their magic numbers. */
function sniff(buf) {
  const at = (i, ...bytes) => bytes.every((b, k) => buf[i + k] === b);
  if (at(0, 0x25, 0x50, 0x44, 0x46)) return { ext: "pdf", type: "application/pdf" }; // %PDF
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return { ext: "png", type: "image/png" };
  if (at(0, 0xff, 0xd8, 0xff)) return { ext: "jpg", type: "image/jpeg" };
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) {
    return { ext: "webp", type: "image/webp" }; // RIFF....WEBP
  }
  return null;
}

/* A filename that's safe to put in an email attachment header, ending in
   the extension we actually detected. */
function safeFilename(original, ext) {
  const base = cap(original || "floor-plan", 120).replace(/[^a-zA-Z0-9._ -]+/g, "_");
  const stem = base.includes(".") ? base.slice(0, base.lastIndexOf(".")) : base;
  return `${stem || "floor-plan"}.${ext}`;
}

/* Returns "floor-plans/<path>" or null. Never throws — the email carries
   the file either way. */
async function storePlan(buffer, detected) {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const path = `${now.getUTCFullYear()}/${month}/${randomUUID()}.${detected.ext}`;
    const upload = () =>
      supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: detected.type, upsert: false });

    let { error } = await upload();
    if (error && /not found/i.test(error.message || "")) {
      // First plan ever: create the private bucket, then retry once.
      await supabase.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: MAX_BYTES,
      });
      ({ error } = await upload());
    }
    if (error) {
      console.error("[floor-plan] storage upload failed:", error);
      return null;
    }
    return `${BUCKET}/${path}`;
  } catch (err) {
    console.error("[floor-plan] storage unavailable:", err);
    return null;
  }
}

export async function POST(req) {
  const ip = getClientIp(req);
  const limit = await rateLimit(ip, { namespace: "floor_plan", max: 3 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many uploads. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      }
    );
  }

  let data;
  try {
    data = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  const field = (key) => String(data.get(key) ?? "").trim();

  // Honeypot — accept and drop so bots get no retry signal.
  if (field("website")) {
    return NextResponse.json({ ok: true });
  }

  const form = {
    name: field("name"),
    email: field("email"),
    company: field("company"),
    notes: field("notes"),
  };
  const errors = validateFloorPlan(form);

  const file = data.get("file");
  let buffer = null;
  let detected = null;
  if (!file || typeof file === "string" || file.size === 0) {
    errors.file = "Attach your floor plan.";
  } else if (file.size > MAX_BYTES) {
    errors.file = "That file is over 4 MB. Try a PDF export or a smaller image.";
  } else {
    buffer = Buffer.from(await file.arrayBuffer());
    detected = sniff(buffer);
    if (!detected) errors.file = "Upload a PDF, PNG, JPG, or WebP file.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { ok: false, error: "Please fix the highlighted fields.", fieldErrors: errors },
      { status: 400 }
    );
  }

  const path = await storePlan(buffer, detected);
  const meta = {
    sourceUrl: cap(field("source_url") || "/floor-plan", FIELD_CAPS.url),
    userAgent: cap(req.headers.get("user-agent") || "", FIELD_CAPS.userAgent),
    ipHash: hashIp(ip),
  };

  try {
    const res = await sendFloorPlanEmail(
      {
        name: cap(form.name, FIELD_CAPS.name),
        email: cap(form.email, FIELD_CAPS.email),
        company: cap(form.company, FIELD_CAPS.company),
        notes: cap(form.notes, 2000),
      },
      {
        name: safeFilename(file.name, detected.ext),
        size: file.size,
        type: detected.type,
        path,
        buffer,
      },
      meta
    );
    if (res?.error) {
      console.error("[floor-plan] Resend error:", res.error);
      return NextResponse.json(
        { ok: false, error: "Couldn't send your plan. Please try again." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, submissionId: res?.submissionId });
  } catch (err) {
    console.error("[floor-plan] route error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
