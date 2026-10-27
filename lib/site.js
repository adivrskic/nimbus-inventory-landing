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

/* The product app lives on its own origin, and signing up there starts the
   7-day free trial (no card). Hardcoded rather than env-driven on purpose:
   NEXT_PUBLIC_APP_URL exists in some environments with other values, and a
   wrong origin would silently break every trial button. */
export const APP_URL = "https://app.nautilusinventory.com";

/* Signup link for a "Start free trial" button. utm_content names the button
   (hero, nav, pricing_tier_pro, …) so signups can be traced to it. */
export const signupUrl = (source) =>
  `${APP_URL}/signup?utm_source=nautilusinventory.com&utm_medium=site&utm_campaign=free_trial${
    source ? `&utm_content=${encodeURIComponent(source)}` : ""
  }`;

export const FIELD_CAPS = Object.freeze({
  name: 200,
  email: 320, // RFC 5321 max
  company: 200,
  role: 100,
  usage: 100,
  warehouseSize: 100,
  message: 5000,
  comments: 5000,
  notes: 2000,
  topic: 50,
  topicLabel: 100,
  url: 500,
  userAgent: 500,
});

export const cap = (s, max = FIELD_CAPS.url) => String(s || "").slice(0, max);

/* Social share image. app/opengraph-image.png (the file convention) covers
   every route that inherits the root openGraph, but a page that defines its
   own `openGraph` replaces the inherited object INCLUDING its images — so
   every per-page openGraph must list this explicitly. Same file, served
   from /public so the URL is stable. */
export const OG_IMAGE = Object.freeze({
  url: "/og-image.png",
  width: 1600,
  height: 840,
  alt: "Nautilus Inventory — AI-powered warehouse management",
});

/* Meta descriptions: Google truncates the SERP snippet around 155-160
   characters, so trim at a word boundary and append an ellipsis. */
export function truncateDescription(str, max = 155) {
  const s = String(str || "").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,;:—-]+$/, "") + "…";
}

/* Loose editorial dates ("Feb 18, 2026", "September 13, 2026") → ISO 8601
   for Open Graph article:published_time, JSON-LD, and the sitemap. Values
   already in YYYY-MM-DD form pass through untouched; unparseable input is
   returned as-is so a typo never throws at build time. */
export function toIsoDate(date) {
  if (!date) return undefined;
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) return date;
  const d = new Date(date);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return date;
}

/* Heading text → anchor id. Shared by the blog + help article TOCs so the
   TOC links and the heading ids are built by the same function. */
export const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
