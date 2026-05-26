// ──────────────────────────────────────────────────────────────────────────
// components/SEO/JsonLd.jsx
// ──────────────────────────────────────────────────────────────────────────
// Structured-data helpers. Each function returns a plain object; the
// <JsonLd data={...} /> component serializes it into a <script type=
// "application/ld+json"> tag. Multiple JsonLd blocks per page is fine —
// Google merges them.
//
// Brand name + URLs + contact email are sourced from lib/site so there's a
// single source of truth (no more "Nautilus WMS" here vs "Nautilus Inventory"
// in the metadata, and no hardcoded https://nautilusinventory.com copies).
// ──────────────────────────────────────────────────────────────────────────

import { SITE_URL, SALES_EMAIL } from "@/lib/site";

const BRAND = "Nautilus Inventory";
const LOGO = `${SITE_URL}/logo.png`;

export default function JsonLd({ data }) {
  // Escape "<" so a value can never close the <script> tag early
  // (e.g. a "</script>" substring in any current or future dynamic field).
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

// ──────────────────────────────────────────────────────────────────────────
// orgSchema — Organization-level identity. Used on the home page.
// ──────────────────────────────────────────────────────────────────────────

export function orgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND,
    url: SITE_URL,
    logo: LOGO,
    description:
      "AI-powered warehouse management system for modern operations teams.",
    // Populate with real LinkedIn / X / etc. profile URLs when available —
    // helps search engines disambiguate the entity.
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      email: SALES_EMAIL,
      contactType: "sales",
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// softwareSchema — SoftwareApplication identity. Accepts an optional
// `offers` override so the pricing page can emit real price data.
// ──────────────────────────────────────────────────────────────────────────

export function softwareSchema({ offers } = {}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    description:
      "AI-powered warehouse management system with barcode scanning, spatial mapping, pick optimization, and predictive analytics.",
  };
  // Only attach an Offer when one is supplied (the pricing page passes real
  // price data). We do NOT emit a default price: a "0" placeholder makes
  // Google surface the product as Free, which is wrong.
  if (offers) schema.offers = offers;
  // NOTE: no aggregateRating. We're a new product with no genuine, on-page
  // reviews to back one up — and Google's structured-data policy requires
  // ratings to reflect real reviews shown to the user. Add this back only
  // when there are real, displayed reviews to source it from.
  return schema;
}

// ──────────────────────────────────────────────────────────────────────────
// websiteSchema — WebSite identity with SearchAction (points at /ask, which
// reads ?q=... to pre-fill the input).
// ──────────────────────────────────────────────────────────────────────────

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/ask?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// faqSchema — FAQPage / Question / Answer. Pass an array of { q, a }.
// ──────────────────────────────────────────────────────────────────────────

export function faqSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// articleSchema — Blog post Article. Auto-converts loose date strings like
// "Feb 18, 2026" to ISO 8601 for Google's parser.
// ──────────────────────────────────────────────────────────────────────────

function toISO(date) {
  if (!date) return undefined;
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) return date;
  try {
    const d = new Date(date);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {
    /* fall through */
  }
  return date;
}

export function articleSchema({
  title,
  description,
  slug,
  date,
  author = "Nautilus Team",
  image,
}) {
  const iso = toISO(date);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${SITE_URL}/blog/${slug}`,
    datePublished: iso,
    dateModified: iso,
    author: { "@type": "Person", name: author },
    publisher: {
      "@type": "Organization",
      name: BRAND,
      logo: { "@type": "ImageObject", url: LOGO },
    },
  };
  if (image) schema.image = image;
  return schema;
}

// ──────────────────────────────────────────────────────────────────────────
// helpArticleSchema — Article for help-center content (no date in helpData).
// ──────────────────────────────────────────────────────────────────────────

export function helpArticleSchema({ title, description, slug }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${SITE_URL}/help/${slug}`,
    author: { "@type": "Organization", name: BRAND },
    publisher: {
      "@type": "Organization",
      name: BRAND,
      logo: { "@type": "ImageObject", url: LOGO },
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// breadcrumbSchema — BreadcrumbList. Pass an array of { name, url }.
// ──────────────────────────────────────────────────────────────────────────

export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
