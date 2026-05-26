// ──────────────────────────────────────────────────────────────────────────
// lib/ipHash.js
// ──────────────────────────────────────────────────────────────────────────
// Single source of truth for reading the client IP and producing the
// daily-rotating, salted IP hash used for spam/abuse detection across
// every entry point (chat, contact, demo, waitlist).
//
// Previously each route carried its own copy of getClientIp + hashIp +
// a per-route default salt ("contact-default-salt", "demo-default-salt",
// "waitlist-default-salt", "chat-default-salt"). The copies drifted (the
// chat/waitlist copies were hardened to require a real salt in prod while
// the contact/demo copies still shipped a guessable default), which is
// exactly the kind of thing a single module prevents.
//
// The hash is sha256("ip|YYYY-MM-DD|salt") truncated to 128 bits: stable
// within a day for pattern detection, not stable across days so it never
// becomes a long-term identifier (GDPR-friendly).
// ──────────────────────────────────────────────────────────────────────────

import crypto from "node:crypto";

const DEV_FALLBACK_SALT = "nautilus-dev-salt";

/* Read the client IP from a request. Honors x-forwarded-for (first hop),
   then x-real-ip. `fallback` is what to return when neither header is
   present — "unknown" for the form limiter (so unknown-IP traffic still
   gets bucketed together) or null for callers that prefer to skip hashing. */
export function getClientIp(req, fallback = "unknown") {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return fallback;
}

/* Resolve the IP-hash salt. A public default makes the daily hashes
   trivially reversible against a known salt, so in production
   IP_HASH_SALT is required — we throw rather than hash with a guessable
   value. The dev fallback only applies outside production. */
export function resolveSalt() {
  const salt = process.env.IP_HASH_SALT;
  if (salt) return salt;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "IP_HASH_SALT must be set in production — refusing to hash IPs with a public default salt."
    );
  }
  return DEV_FALLBACK_SALT;
}

export function hashIp(ip) {
  if (!ip || ip === "unknown") return null;
  const day = new Date().toISOString().slice(0, 10);
  const salt = resolveSalt();
  return crypto
    .createHash("sha256")
    .update(`${ip}|${day}|${salt}`)
    .digest("hex")
    .slice(0, 32);
}
