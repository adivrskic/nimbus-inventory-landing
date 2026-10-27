import IntegrationClient from "./IntegrationClient";
import {
  INTEGRATIONS,
  DEFAULT_INTEGRATION_FAQS,
} from "@/components/IntegrationPage/integrationData";
import JsonLd, { breadcrumbSchema, faqSchema } from "@/components/SEO/JsonLd";
import { truncateDescription, OG_IMAGE } from "@/lib/site";

/* Only the slugs in integrationData.js exist. Without this, a removed or
   mistyped slug rendered a Not Found page with a 200 instead of a 404. */
export const dynamicParams = false;

/* The per-integration FAQ block now lives on each integration in
   integrationData.js as `faqs`. DEFAULT_INTEGRATION_FAQS is the fallback
   for any integration that omits its own. This file is the consumer side
   for the FAQ JSON-LD schema; the visible FAQ rendering happens in
   components/IntegrationPage/IntegrationPage.jsx, which uses the same
   fallback pattern so the structured data and visible page stay in sync. */

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const integration = INTEGRATIONS[slug];
  if (!integration) return { title: "Integration Not Found" };
  return {
    title: `${integration.title} Integration`,
    description: truncateDescription(
      `Connect ${integration.title} to Nautilus. ${integration.tagline}`
    ),
    alternates: {
      canonical: `https://nautilusinventory.com/integration/${slug}`,
    },
    openGraph: {
      type: "website",
      siteName: "Nautilus Inventory",
      images: [OG_IMAGE],
      title: `${integration.title} Integration | Nautilus`,
      description: truncateDescription(integration.tagline, 200),
      url: `https://nautilusinventory.com/integration/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(INTEGRATIONS).map((slug) => ({ slug }));
}

export default async function IntegrationPage({ params }) {
  const { slug } = await params;
  const integration = INTEGRATIONS[slug];
  const crumbs = [
    { name: "Home", url: "https://nautilusinventory.com" },
    {
      name: "Integrations",
      url: "https://nautilusinventory.com/integration",
    },
    {
      name: integration?.title || slug,
      url: `https://nautilusinventory.com/integration/${slug}`,
    },
  ];

  /* Per-integration FAQs drive the JSON-LD schema. This gives every
     /integration/[slug] page a unique FAQPage payload, which is what
     makes the FAQ rich result eligible in Google's SERP and avoids the
     duplicate-content signal the shared FAQ used to produce. */
  const faqs = integration?.faqs ?? DEFAULT_INTEGRATION_FAQS;

  /* Everything the client tree needs is resolved HERE (server) and passed
     as props, so components/IntegrationPage/IntegrationPage.jsx no longer
     imports the whole integrationData.js module into the client chunk:
     - integration: the single matched entry (full object)
     - faqs: resolved with the same fallback that drives the JSON-LD above
     - siblings: up to 3 same-category cross-links, trimmed to the fields
       the cards render */
  const siblings = integration
    ? Object.entries(INTEGRATIONS)
        .filter(([s, i]) => s !== slug && i.category === integration.category)
        .slice(0, 3)
        .map(([s, i]) => ({
          slug: s,
          title: i.title,
          category: i.category,
          tagline: i.tagline,
        }))
    : [];

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <JsonLd data={faqSchema(faqs)} />
      <IntegrationClient
        slug={slug}
        integration={integration}
        faqs={faqs}
        siblings={siblings}
      />
    </>
  );
}
