import IntegrationClient from "./IntegrationClient";
import { INTEGRATIONS } from "@/components/IntegrationPage/integrationData";
import JsonLd, { breadcrumbSchema, faqSchema } from "@/components/SEO/JsonLd";

/* The shared FAQ that every integration page renders. Mirrors the FAQ
   array in components/IntegrationPage/IntegrationPage.jsx exactly —
   if you change one, change both, or extract this to a shared module
   like app/pricing/pricingFaqs.js. (TODO: move to
   components/IntegrationPage/integrationFaqs.js and import in both
   places, same pattern the pricing page uses.) */
const INTEGRATION_FAQS = [
  {
    q: "How long does setup take?",
    a: "Most customers are syncing in under 10 minutes. Enterprise environments with custom field mappings can take 30 minutes to an hour.",
  },
  {
    q: "What if a sync fails?",
    a: "Nautilus retries with exponential backoff for 24 hours. After that, the record is flagged in your dashboard for manual review. Sync failures never block your warehouse operations.",
  },
  {
    q: "Can I limit what syncs?",
    a: "Yes. Granular controls let you sync specific products, locations, or even specific fields. Most customers start with everything on and tighten over time.",
  },
  {
    q: "Is the integration included in all plans?",
    a: "This integration is included in Pro and Enterprise. Free plans can install but with limits on sync frequency.",
  },
];

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const integration = INTEGRATIONS[slug];
  if (!integration) return { title: "Integration Not Found" };
  return {
    title: `${integration.title} Integration`,
    description: `Connect ${integration.title} to Nautilus WMS. ${integration.tagline}`,
    alternates: {
      canonical: `https://nautilusinventory.com/integration/${slug}`,
    },
    openGraph: {
      title: `${integration.title} Integration | Nautilus WMS`,
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
  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <JsonLd data={faqSchema(INTEGRATION_FAQS)} />
      <IntegrationClient slug={slug} />
    </>
  );
}
