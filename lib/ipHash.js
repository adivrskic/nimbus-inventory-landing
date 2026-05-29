// Single source of truth for reading the client IP and producing the
// daily-rotating, salted IP hash used for spam/abuse detection across
// every entry point (chat, contact, demo, waitlist, feedback).
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
//
// ── Trusted IP source (security) ──────────────────────────────────────────
// getClientIp reads the IP from the platform's TRUSTED header first, not
// from x-forwarded-for. The left-most x-forwarded-for entry is whatever the
// caller sent — proxies append, they don't overwrite — so reading it let a
// client spoof their own IP (`x-forwarded-for: 1.2.3.4`, rotated per
// request) and thereby evade per-IP rate limits and poison the abuse-
// detection ip_hash. We deploy on Netlify, whose edge sets
// `x-nf-client-connection-ip` to the real client address and which the
// client cannot forge through the edge — so that's the source of truth.
// x-real-ip / x-forwarded-for remain only as best-effort fallbacks for
// local dev and non-Netlify environments, where there's no untrusted-input
// exposure (dev) or no better signal available.
// ──────────────────────────────────────────────────────────────────────────

import crypto from "node:crypto";

const DEV_FALLBACK_SALT = "nautilus-dev-salt";

export function getClientIp(req, fallback = "unknown") {
  const nf = req.headers.get("x-nf-client-connection-ip");
  if (nf) return nf.trim();

  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();

  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();

  return fallback;
}

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
