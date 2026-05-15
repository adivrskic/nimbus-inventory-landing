// ──────────────────────────────────────────────────────────────────────────
// lib/chat/visitor.js
// ──────────────────────────────────────────────────────────────────────────
// Anonymous but stable visitor ID, stored in an httpOnly cookie. Used to
// associate chat conversations with the same person across visits without
// requiring login. Same daily-rotating IP hash pattern as the feedback route
// so logs stay GDPR-friendly.
// ──────────────────────────────────────────────────────────────────────────

import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE_NAME = "nimbus_visitor";
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

export function getIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || null;
}

export function hashIp(ip) {
  if (!ip) return null;
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.IP_HASH_SALT || "chat-default-salt";
  return crypto
    .createHash("sha256")
    .update(`${ip}|${day}|${salt}`)
    .digest("hex")
    .slice(0, 32);
}
