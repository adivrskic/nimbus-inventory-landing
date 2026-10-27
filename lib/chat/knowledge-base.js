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
// (scan / spatial / search / forecast), Features.jsx (the 6-card grid),
// and the integration/industry/compliance data the rest of the site
// renders. Same sync rule applies.
// ──────────────────────────────────────────────────────────────────────────

import { BLOG_POSTS } from "@/lib/blogData";
import { HELP_CATEGORIES } from "@/lib/helpData";
import { INTEGRATIONS } from "@/components/IntegrationPage/integrationData";
import { INDUSTRIES } from "@/components/IndustryPage/industryData";
import { COMPETITORS } from "@/app/compare/[slug]/compareData";
import { SITE_URL } from "@/lib/site";

const PRICING_TEXT = `
Nautilus has two tiers, both priced per warehouse. No per-user fees, no
hidden modules. Annual billing saves 20% over monthly.

# Pro — for single warehouses
- $239 per warehouse / month (annual billing)
- $299 per warehouse / month (monthly billing)
- 1 warehouse
- Unlimited active scanner users
- Up to 50,000 SKUs
- AI features: plain-English search, demand forecasting with purchase-order
  drafts, anomaly alerts
- All 18 integrations included (QuickBooks, Xero, FreshBooks,
  SAP Business One, NetSuite, Sage, Shopify, WooCommerce, Amazon, Square,
  BigCommerce, Lightspeed, ShipStation, Shippo, EasyPost, FedEx, UPS, DHL)
- Standard analytics and alerts
- API access (read-only)
- Email support · 24-hour response
- 7-day free trial, no credit card required — sign up at
  https://app.nautilusinventory.com/signup

# Enterprise — for multi-site operations
- Custom pricing — contact sales
- Unlimited warehouses
- Unlimited SKUs
- Everything in Pro, plus:
  - Spatial Intelligence (real-time warehouse mapping)
  - Multi-warehouse orchestration
  - Custom API integrations (full read/write API access)
  - Dedicated success manager
  - 24/7 priority support · 1-hour response
- Typically 30-day tailored proof-of-concept with hands-on team support

# What Nautilus does NOT have (never claim these)
- No voice-command feature.
- No SSO / SAML.
- No SOC 2, ISO 27001, or HIPAA certification of its own, and no BAA.
- No published uptime figures and no uptime SLA on standard plans.
- No customer results, case studies, or measured performance figures yet.
- Native iOS and Android apps are not released yet (coming soon).

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
Nautilus is a warehouse management system with AI-assisted features built
into the core product, a web app that runs in any modern browser, and native
iOS + Android apps coming soon.

# AI engine — the four surfaces on the home page
- Scanning: a scan updates the item's count, its location, and the audit
  log in one step.
- Spatial: build your warehouse layout (sections, bays, levels) in the
  facility builder — or import it from an image of your floor plan — and
  view it in 2D or 3D. (Spatial Intelligence is Enterprise-only.)
- Plain-English search: type a question the way you'd say it ("products low
  on stock in aisle 3", "where is the blue widget", "what was picked
  yesterday") and Nautilus turns it into a precise search across products,
  locations, scans, and orders.
- Forecasting: demand forecasts that account for trend and day-of-week
  seasonality, reorder points with safety stock, purchase-order drafts for
  review, and anomaly alerts with plain-English explanations.

# Core scanning and inventory
- Barcode scanning in the web app for receiving, picking, transfers, and
  counts, with every action recorded in the audit log.
- Facility builder with 2D and 3D views of sections, bays, and levels.
- Pick waves grouped by zone and sequenced in walk order.
- Cycle counts ranked by discrepancy risk; scan at your pace and Nautilus
  handles reconciliation.
- Label printing — location barcode labels generated directly from the app.
- Lot tracking with expiration dates, FEFO picking, and QC quarantine.
- Spreadsheet import and CSV export, plus sample data to explore on day one.
- Roles (owner, admin, member) with granular permissions and an audit log.

# Integrations (all 18 included on Pro and up)
- Accounting / ERP: QuickBooks, Xero, FreshBooks, SAP Business One,
  NetSuite, Sage
- E-commerce: Shopify, WooCommerce, Amazon, BigCommerce
- POS: Square, Lightspeed
- Shipping: ShipStation, Shippo, EasyPost, FedEx, UPS, DHL
- Plus: Zapier (5,000+ no-code workflows), REST API + webhooks (API in
  early access, v1 GA Q3 2026).

# Industries served
Built around 8 industry contexts with specific workflows and language:
flooring & building materials, manufacturing & assembly, food & beverage
(FEFO + lot tracking), automotive & parts, pharmaceuticals & medical
(compliance-first), e-commerce & 3PL (multi-tenant), electrical & plumbing
supply, and agriculture & seed.

# Platforms
- Web app (any modern browser, including phones and tablets)
- Native iOS and Android apps — coming soon, not yet released
- REST API with scoped API keys (v1 in preview, GA Q3 2026)
- Webhooks
- Official Node and Python SDKs (with API)

# Security and trust
- Data is stored in a managed Postgres database on Supabase; the app is
  hosted on Netlify. Both providers maintain SOC 2 Type II reports.
- HTTPS for every connection (with HSTS); data encrypted at rest by the
  database provider.
- Each organization's data is isolated with row-level security.
- Two-factor authentication (authenticator app), roles with granular
  permissions, and an audit log.
- API keys are shown once, stored as SHA-256 hashes, and limited to the
  scopes they're granted.
- AI features send the relevant records to an AI provider to generate
  results; customer data isn't used to train AI models.
- Nautilus does not hold its own SOC 2, ISO 27001, or HIPAA certification,
  offers no BAA, and has no uptime SLA on standard plans. Security
  questionnaires: hello@nautilusinventory.com.
`.trim();

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

export const KB_APPROX_TOKENS = Math.ceil(KNOWLEDGE_BASE.length / 4);

if (process.env.NODE_ENV !== "production") {
  console.log(
    `[knowledge-base] Built ${KNOWLEDGE_BASE.length.toLocaleString()} chars / ~${KB_APPROX_TOKENS.toLocaleString()} tokens`
  );
}
