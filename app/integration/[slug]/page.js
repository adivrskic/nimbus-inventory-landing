import IntegrationClient from "./IntegrationClient";
import { INTEGRATIONS } from "@/components/IntegrationPage/integrationData";
import JsonLd, { breadcrumbSchema } from "@/components/SEO/JsonLd";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const integration = INTEGRATIONS[slug];
  if (!integration) return { title: "Integration Not Found" };
  return {
    title: `${integration.title} Integration`,
    description: `Connect ${integration.title} to Nimbus WMS. ${integration.tagline}`,
    alternates: { canonical: `https://nimbuswms.com/integration/${slug}` },
    openGraph: {
      title: `${integration.title} Integration | Nimbus WMS`,
      description: integration.tagline,
      url: `https://nimbuswms.com/integration/${slug}`,
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
    { name: "Home", url: "https://nimbuswms.com" },
    { name: "Integrations", url: "https://nimbuswms.com/#integrations" },
    {
      name: integration?.title || slug,
      url: `https://nimbuswms.com/integration/${slug}`,
    },
  ];
  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <IntegrationClient slug={slug} />
    </>
  );
}
