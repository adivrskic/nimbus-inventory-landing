// ──────────────────────────────────────────────────────────────────────────
// lib/chat/knowledge-base.js
// ──────────────────────────────────────────────────────────────────────────
// Assembles a single text representation of all site content (blog, help,
// integrations, industries, comparisons, plus hand-written pricing and
// features sections). Built once at module load — Node caches the module
// for the lifetime of the process. Sent with every chat request as the
// system prompt and cached via Anthropic's prompt caching.
//
// IMPORTANT: Fill in the PRICING_TEXT and FEATURES_TEXT constants below
// with your real copy. The bot will use this content VERBATIM when answering,
// and will refuse to invent numbers if it's not here. If your data modules
// export under different names, adjust the imports below — the `?? []`
// fallbacks mean missing modules log "0 entries" rather than crashing.
// ──────────────────────────────────────────────────────────────────────────

import { BLOG_POSTS } from "@/lib/blogData";
import { HELP_CATEGORIES } from "@/lib/helpData";
import { INTEGRATIONS } from "@/components/IntegrationPage/integrationData";
import { INDUSTRIES } from "@/components/IndustryPage/industryData";
import { COMPETITORS } from "@/app/compare/[slug]/compareData";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://Nautiluswms.com";

// ──────────────────────────────────────────────────────────────────────────
// HAND-WRITTEN SECTIONS — edit these to match your real copy
// ──────────────────────────────────────────────────────────────────────────

const PRICING_TEXT = `
[REPLACE THIS WITH YOUR REAL PRICING COPY]

Example structure — delete and replace:

Nautilus uses per-warehouse pricing across three plans. All plans include
unlimited users, native iOS + Android apps, 99.9% uptime SLA, and a
7-day free trial.

Starter — $X/mo
  - 1 warehouse
  - Core inventory + scanning
  - Basic integrations (list them)
  - Email support

Growth — $X/mo per warehouse (2-10 warehouses)
  - Everything in Starter
  - All 50+ integrations
  - AI features (cycle counting, anomaly detection, voice commands)
  - Priority support

Enterprise — Custom
  - 10+ warehouses
  - SSO + custom roles
  - Dedicated CSM
  - Custom integrations
  - White-glove migration
`.trim();

const FEATURES_TEXT = `
[REPLACE THIS WITH YOUR REAL FEATURE OVERVIEW]

This is the canonical reference for what Nautilus does. Cover the headline
capabilities so Claude can answer "what is Nautilus" / "what does it do"
questions confidently:

- Inventory management (multi-location, multi-warehouse, real-time sync)
- Native iOS + Android apps (offline-capable, sub-200ms barcode scanning)
- AI cycle counting (anomaly detection, route optimization)
- Voice commands (hands-free pick + receive workflows)
- 50+ integrations (Shopify, Amazon, Square, Sage, NetSuite, QuickBooks, etc.)
- Label printing (Zebra, Brother, DYMO, generic ZPL/EPL)
- API + webhooks (REST, cursor pagination)
- SOC 2 Type II, GDPR-compliant, 99.95% historical uptime
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
