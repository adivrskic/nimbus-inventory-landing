export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function orgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nimbus WMS",
    url: "https://nimbuswms.com",
    logo: "https://nimbuswms.com/logo.png",
    description:
      "AI-powered warehouse management system for modern operations teams.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      email: "sales@nimbuswms.com",
      contactType: "sales",
    },
  };
}

export function softwareSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Nimbus WMS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    description:
      "AI-powered warehouse management system with barcode scanning, spatial mapping, pick optimization, and predictive analytics.",
    offers: {
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

export function articleSchema({
  title,
  description,
  slug,
  date,
  author = "Nimbus Team",
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `https://nimbuswms.com/blog/${slug}`,
    datePublished: date,
    dateModified: date,
    author: { "@type": "Person", name: author },
    publisher: {
      "@type": "Organization",
      name: "Nimbus WMS",
      logo: { "@type": "ImageObject", url: "https://nimbuswms.com/logo.png" },
    },
  };
}

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
