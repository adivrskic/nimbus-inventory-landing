// ──────────────────────────────────────────────────────────────────────────
// lib/chat/visitor.js
// ──────────────────────────────────────────────────────────────────────────
// Anonymous but stable visitor ID, stored in an httpOnly cookie. Used to
// associate chat conversations with the same person across visits without
// requiring login.
//
// IP reading + hashing now live in lib/ipHash.js (shared with the contact,
// demo, and waitlist routes). getIp/hashIp are re-exported here so existing
// chat-route imports keep working unchanged.
// ──────────────────────────────────────────────────────────────────────────

import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getClientIp, hashIp } from "@/lib/ipHash";

const COOKIE_NAME = "Nautilus_visitor";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years

export async function getOrCreateVisitor() {
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  jar.set(COOKIE_NAME, id, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return id;
}

/* The chat route prefers a null fallback (skip hashing entirely when no
   IP header is present) rather than the "unknown" sentinel the form
   limiter uses for bucketing. */
export function getIp(request) {
  return getClientIp(request, null);
}

export { hashIp };
