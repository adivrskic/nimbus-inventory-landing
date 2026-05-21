import IntegrationClient from "./IntegrationClient";
import {
  INTEGRATIONS,
  DEFAULT_INTEGRATION_FAQS,
} from "@/components/IntegrationPage/integrationData";
import JsonLd, { breadcrumbSchema, faqSchema } from "@/components/SEO/JsonLd";

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
    description: `Connect ${integration.title} to Nautilus. ${integration.tagline}`,
    alternates: {
      canonical: `https://nautilusinventory.com/integration/${slug}`,
    },
    openGraph: {
      title: `${integration.title} Integration | Nautilus`,
      description: integration.tagline,
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

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <JsonLd data={faqSchema(faqs)} />
      <IntegrationClient slug={slug} />
    </>
  );
}
