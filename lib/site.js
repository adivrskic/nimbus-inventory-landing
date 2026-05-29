// Single source of truth for site-wide literals that were previously
// scattered as hardcoded strings/numbers:
//   - SITE_URL was written out as "https://nautilusinventory.com" in ~15
//     places (and as a NEXT_PUBLIC_SITE_URL fallback in others).
//   - SALES_EMAIL appeared as a literal in 7+ spots across routes, libs,
//     and components.
//   - Input length caps (.slice(0, 200) etc.) were repeated per route with
//     no shared definition.
// Import from here instead of retyping. JSDoc keeps editor hints intact.
// ──────────────────────────────────────────────────────────────────────────

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://nautilusinventory.com";

export const SALES_EMAIL = "sales@nautilusinventory.com";

export const FIELD_CAPS = Object.freeze({
  name: 200,
  email: 320, // RFC 5321 max
  company: 200,
  role: 100,
  usage: 100,
  warehouseSize: 100,
  message: 5000,
  comments: 5000,
  topic: 50,
  topicLabel: 100,
  url: 500,
  userAgent: 500,
});

export const cap = (s, max = FIELD_CAPS.url) => String(s || "").slice(0, max);
