// ──────────────────────────────────────────────────────────────────────────
// components/SEO/JsonLd.jsx
// ──────────────────────────────────────────────────────────────────────────
// Structured-data helpers. Each function returns a plain object; the
// <JsonLd data={...} /> component serializes it into a <script type=
// "application/ld+json"> tag. Multiple JsonLd blocks per page is fine —
// Google merges them.
// ──────────────────────────────────────────────────────────────────────────

export default function JsonLd({ data }) {
  // Escape "<" so a value can never close the <script> tag early
  // (e.g. a "</script>" substring in any current or future dynamic field).
  // Cheap, standard hardening for dangerouslySetInnerHTML + JSON-LD.
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
    name: "Nautilus WMS",
    url: "https://nautilusinventory.com",
    logo: "https://nautilusinventory.com/logo.png",
    description:
      "AI-powered warehouse management system for modern operations teams.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      email: "sales@nautilusinventory.com",
      contactType: "sales",
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// softwareSchema — SoftwareApplication identity. Accepts an optional
// `offers` override so the pricing page can emit real price data while
// other pages (home) can default to the generic "Contact for pricing".
// ──────────────────────────────────────────────────────────────────────────

export function softwareSchema({ offers } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Nautilus WMS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    description:
      "AI-powered warehouse management system with barcode scanning, spatial mapping, pick optimization, and predictive analytics.",
    offers: offers || {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Contact for pricing",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "127",
      bestRating: "5",
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// websiteSchema — WebSite identity with SearchAction. Tells Google the
// site has a query interface; the SearchAction template points at /ask
// because that's the natural search surface (the in-app chat) and it
// reads `?q=...` to pre-fill the input.
// ──────────────────────────────────────────────────────────────────────────

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Nautilus WMS",
    url: "https://nautilusinventory.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://nautilusinventory.com/ask?q={search_term_string}",
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
// articleSchema — Blog post Article. Auto-converts loose date strings
// like "Feb 18, 2026" to ISO 8601 for Google's parser. Accepts optional
// `image` (URL string or array) and `author` overrides.
// ──────────────────────────────────────────────────────────────────────────

function toISO(date) {
  if (!date) return undefined;
  // Already ISO-ish? Leave it alone.
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) return date;
  try {
    const d = new Date(date);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {
    /* fall through */
  }
  return date; // Return raw — Google parses loose formats but ISO is preferred.
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
    url: `https://nautilusinventory.com/blog/${slug}`,
    datePublished: iso,
    dateModified: iso,
    author: { "@type": "Person", name: author },
    publisher: {
      "@type": "Organization",
      name: "Nautilus WMS",
      logo: {
        "@type": "ImageObject",
        url: "https://nautilusinventory.com/logo.png",
      },
    },
  };
  if (image) {
    schema.image = image;
  }
  return schema;
}

// ──────────────────────────────────────────────────────────────────────────
// helpArticleSchema — Article for help-center content. No date (help
// articles don't carry one in lib/helpData.js), author is Organization
// (not Person — guides are produced by the team, not individuals).
// ──────────────────────────────────────────────────────────────────────────

export function helpArticleSchema({ title, description, slug }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `https://nautilusinventory.com/help/${slug}`,
    author: { "@type": "Organization", name: "Nautilus" },
    publisher: {
      "@type": "Organization",
      name: "Nautilus WMS",
      logo: {
        "@type": "ImageObject",
        url: "https://nautilusinventory.com/logo.png",
      },
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
