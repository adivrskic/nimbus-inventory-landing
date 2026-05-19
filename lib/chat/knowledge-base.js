// ──────────────────────────────────────────────────────────────────────────
// lib/chat/knowledge-base.js
// ──────────────────────────────────────────────────────────────────────────
// Assembles a single text representation of all site content (blog, help,
// integrations, industries, comparisons, plus hand-written pricing and
// features sections). Built once at module load — Node caches the module
// for the lifetime of the process. Sent with every chat request as the
// system prompt and cached via Anthropic's prompt caching.
//
// PRICING_TEXT mirrors the data in app/pricing/PricingClient.jsx (TIERS,
// PRICING, MATRIX_ROWS, FAQS). If you change the pricing page, update
// this text too — keep them in sync.
//
// FEATURES_TEXT mirrors the feature surfaces rendered by AISection.jsx
// (voice / spatial / search / analytics), Features.jsx (the 6-card grid),
// and the integration/industry/compliance data the rest of the site
// renders. Same sync rule applies.
// ──────────────────────────────────────────────────────────────────────────

import { BLOG_POSTS } from "@/lib/blogData";
import { HELP_CATEGORIES } from "@/lib/helpData";
import { INTEGRATIONS } from "@/components/IntegrationPage/integrationData";
import { INDUSTRIES } from "@/components/IndustryPage/industryData";
import { COMPETITORS } from "@/app/compare/[slug]/compareData";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://nautilusinventory.com";

// ──────────────────────────────────────────────────────────────────────────
// HAND-WRITTEN SECTIONS — keep in sync with the pricing page and the
// feature components when those change.
// ──────────────────────────────────────────────────────────────────────────

const PRICING_TEXT = `
Nautilus has two tiers, both priced per warehouse. No per-user fees, no
hidden modules. Annual billing saves 20% over monthly.

# Pro — for single warehouses
- $239 per warehouse / month (annual billing)
- $299 per warehouse / month (monthly billing)
- 1 warehouse
- Unlimited active scanner users
- Up to 50,000 SKUs
- AI scanning + voice commands
- All 18 integrations included (QuickBooks, Xero, FreshBooks, SAP Business
  One, NetSuite, Sage, Shopify, WooCommerce, Amazon, Square, BigCommerce,
  Lightspeed, ShipStation, Shippo, EasyPost, FedEx, UPS, DHL)
- Standard analytics and alerts
- API access (read-only)
- Email support · 24-hour response
- 99.9% uptime SLA
- 14-day free trial, no credit card required

# Enterprise — for multi-site operations
- Custom pricing — contact sales
- Unlimited warehouses
- Unlimited SKUs
- Everything in Pro, plus:
  - Spatial Intelligence (real-time warehouse mapping)
  - Multi-warehouse orchestration
  - Custom API integrations (full read/write API access)
  - SSO / SAML
  - Dedicated success manager
  - 24/7 priority support · 1-hour response
  - 99.99% uptime SLA
  - SOC 2 + HIPAA reports available
- Typically 30-day tailored proof-of-concept with hands-on team support

# Billing details
- A warehouse is any physical facility with its own inventory, location
  codes, and team. Multiple buildings on the same site managed as one
  logical operation count as one warehouse. Separate facilities with
  separate stock count as separate warehouses.
- Pro to Enterprise upgrades take effect immediately, prorated for the
  remainder of the current cycle. Downgrades take effect at the start
  of the next billing cycle.
- Annual Pro plans and all Enterprise contracts can be paid by invoice
  with net-30 terms. Monthly Pro is credit card only.
- 501(c)(3) non-profits and accredited educational institutions get
  30% off Pro and Enterprise — contact sales with documentation.
- Approaching plan limits never breaks operations — Nautilus reaches out
  to discuss before any change.
`.trim();

const FEATURES_TEXT = `
Nautilus is a warehouse management system built around four AI surfaces
(voice, spatial, search, analytics) and a polished set of native mobile +
web tools for scanning, counting, and inventory management.

# AI engine — the four signature surfaces
- Voice commands: natural-speech interface for hands-free pick, receive,
  and count workflows. Processes commands in noisy warehouse environments.
- Spatial intelligence: a real-time 3D model of the warehouse, built from
  scan data. After about two weeks of normal operations the model is
  accurate to within 0.5 meters. Drives putaway suggestions and
  congestion avoidance. (Spatial Intelligence is Enterprise-only.)
- Intelligent search: natural-language search across products, locations,
  and movement history. Plain-English queries return answers, not query
  results.
- Predictive analytics: forecasts stock depletion, flags anomalies, and
  prioritizes cycle counts based on discrepancy risk. Low-stock alerts
  fire roughly 3 days before stockouts.

# Core scanning and inventory
- AI-enhanced barcode scanning — native iOS and Android, sub-200ms
  recognition with 99.7% accuracy. Handles damaged or partial barcodes.
- Interactive 3D floor plans — color-coded sections, bays, and levels.
  Live updates as inventory moves.
- 8 scan actions: pick, receive, putaway, transfer, count, adjust,
  register, lookup. Full audit trail on every action.
- Smart cycle counting — AI prioritizes sections by discrepancy risk;
  scan at your pace, Nautilus handles reconciliation. About 70% faster
  than traditional periodic counting.
- Label printing — barcode labels generated directly from the app.
- Custom fields — lot numbers, expiration dates, supplier codes, anything
  the operation needs.
- CSV import/export for products and locations.
- Role-based access (Admin, Manager, Staff) with full activity logging.

# Integrations (18 included on Pro and up)
- Accounting / ERP: QuickBooks, Xero, FreshBooks, SAP Business One,
  NetSuite, Sage
- E-commerce: Shopify, WooCommerce, Amazon, BigCommerce
- POS: Square, Lightspeed
- Shipping: ShipStation, Shippo, EasyPost, FedEx, UPS, DHL
- Plus: Zapier (5,000+ no-code workflows), REST API + webhooks (API in
  early access, v1 GA Q3 2026), SSO/SAML on Enterprise.

# Industries served
Built around 8 industry contexts with specific workflows and language:
flooring & building materials, manufacturing & assembly, food & beverage
(FEFO + lot tracking), automotive & parts, pharmaceuticals & medical
(compliance-first), e-commerce & 3PL (multi-tenant), electrical & plumbing
supply, and agriculture & seed.

# Platforms
- Web dashboard (any modern browser)
- Native iOS app (offline-capable)
- Native Android app (offline-capable)
- REST API (v1 in preview, GA Q3 2026)
- Webhooks
- Official Node and Python SDKs (with API)

# Compliance and trust
- SOC 2 Type II certified (audited annually, last audit Mar 2026)
- GDPR compliant — DPA available, EU customer data under SCCs
- HIPAA compliant — BAA available for healthcare and pharma customers
- CCPA / CPRA compliant
- ISO 27001 in progress — certification audit scheduled Q3 2026
- Annual third-party penetration testing
- TLS 1.3 in transit, AES-256 at rest, keys rotated every 90 days
- Multi-region: US-East primary (Virginia), US-West failover (Oregon),
  EU/Frankfurt for enterprise
- 1h RPO, 4h RTO, 24/7 monitoring with sub-minute alerting
`.trim();

// ──────────────────────────────────────────────────────────────────────────
// Formatters
// ──────────────────────────────────────────────────────────────────────────

function blockToText(block) {
  if (!block) return "";
  if (block.type === "h2") return `\n### ${block.text}\n`;
  if (block.type === "h3") return `\n#### ${block.text}\n`;
  return block.text || "";
}

function formatContent(arr) {
  return (arr || []).map(blockToText).join("\n");
}

function formatBlog(post) {
  return [
    `## ${post.title}`,
    `Source: ${SITE_URL}/blog/${post.slug}`,
    post.desc ? `Summary: ${post.desc}` : null,
    "",
    formatContent(post.content),
    "",
  ]
    .filter((x) => x !== null)
    .join("\n");
}

function formatHelp(article) {
  return [
    `## ${article.title}`,
    `Source: ${SITE_URL}/help/${article.slug}`,
    "",
    formatContent(article.content),
    "",
  ].join("\n");
}

function formatIntegration([slug, data]) {
  const features = (data.features || [])
    .map((f) => `- ${f.title}: ${f.desc}`)
    .join("\n");
  return [
    `## ${data.title} integration`,
    `Source: ${SITE_URL}/integration/${slug}`,
    data.tagline ? `Tagline: ${data.tagline}` : null,
    "",
    data.desc || "",
    features ? `\nFeatures:\n${features}` : null,
    "",
  ]
    .filter((x) => x !== null)
    .join("\n");
}

function formatIndustry(ind) {
  const challenges = (ind.challenges || [])
    .map((c) => `- ${c.title}: ${c.desc}`)
    .join("\n");
  const solutions = (ind.solutions || [])
    .map((s) => `- ${s.title}: ${s.desc}`)
    .join("\n");
  return [
    `## ${ind.title}`,
    `Source: ${SITE_URL}/industry/${ind.slug}`,
    "",
    ind.heroDesc || "",
    challenges ? `\nChallenges:\n${challenges}` : null,
    solutions ? `\nHow Nautilus helps:\n${solutions}` : null,
    "",
  ]
    .filter((x) => x !== null)
    .join("\n");
}

function formatCompare([slug, data]) {
  const reasons = (data.reasons || [])
    .map((r) => `- ${r.title}: ${r.desc}`)
    .join("\n");
  const competitor = data.name || slug;
  return [
    `## Nautilus vs ${competitor}`,
    `Source: ${SITE_URL}/compare/${slug}`,
    "",
    data.heroDesc || "",
    reasons
      ? `\nWhy teams choose Nautilus over ${competitor}:\n${reasons}`
      : null,
    "",
  ]
    .filter((x) => x !== null)
    .join("\n");
}

// ──────────────────────────────────────────────────────────────────────────
// Build
// ──────────────────────────────────────────────────────────────────────────

function buildKnowledgeBase() {
  const out = [];

  out.push("# Nautilus WMS KNOWLEDGE BASE");
  out.push("");
  out.push(
    "This is the complete Nautilus content library. Each section includes a Source URL — reference it naturally when answering ('see /pricing for the breakdown'). Never invent details that aren't in here; if something isn't covered, say so plainly."
  );
  out.push("");

  out.push("# PRICING");
  out.push(`Source: ${SITE_URL}/pricing`);
  out.push("");
  out.push(PRICING_TEXT);
  out.push("");

  out.push("# FEATURES");
  out.push(`Source: ${SITE_URL}/#features`);
  out.push("");
  out.push(FEATURES_TEXT);
  out.push("");

  const blog = BLOG_POSTS ?? [];
  if (blog.length) {
    out.push("# BLOG POSTS");
    out.push("");
    blog.forEach((p) => out.push(formatBlog(p)));
  }

  const help = (HELP_CATEGORIES ?? []).flatMap((c) => c.articles ?? []);
  if (help.length) {
    out.push("# HELP ARTICLES");
    out.push("");
    help.forEach((a) => out.push(formatHelp(a)));
  }

  const integrations = Object.entries(INTEGRATIONS ?? {});
  if (integrations.length) {
    out.push("# INTEGRATIONS");
    out.push("");
    integrations.forEach((entry) => out.push(formatIntegration(entry)));
  }

  const industries = INDUSTRIES ?? [];
  if (industries.length) {
    out.push("# INDUSTRIES");
    out.push("");
    industries.forEach((ind) => out.push(formatIndustry(ind)));
  }

  const compares = Object.entries(COMPETITORS ?? {});
  if (compares.length) {
    out.push("# COMPETITOR COMPARISONS");
    out.push("");
    compares.forEach((entry) => out.push(formatCompare(entry)));
  }

  return out.join("\n");
}

export const KNOWLEDGE_BASE = buildKnowledgeBase();

// Rough token count — used by route.js for cost logging. ~4 chars per token
// is a reasonable English approximation.
export const KB_APPROX_TOKENS = Math.ceil(KNOWLEDGE_BASE.length / 4);

// Useful at startup — log once so deploys catch missing-content bugs early.
if (process.env.NODE_ENV !== "production") {
  console.log(
    `[knowledge-base] Built ${KNOWLEDGE_BASE.length.toLocaleString()} chars / ~${KB_APPROX_TOKENS.toLocaleString()} tokens`
  );
}
