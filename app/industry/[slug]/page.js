import IndustryClient from "./IndustryClient";
import { INDUSTRIES } from "@/components/IndustryPage/industryData";
import JsonLd, { breadcrumbSchema } from "@/components/SEO/JsonLd";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const industry = INDUSTRIES.find((i) => i.slug === slug);
  if (!industry) return { title: "Industry Not Found" };
  return {
    title: `${industry.title} Warehouse Management`,
    description: `Nautilus WMS for ${industry.title.toLowerCase()} operations. ${
      industry.heroDesc
    }`,
    alternates: { canonical: `https://Nautiluswms.com/industry/${slug}` },
    openGraph: {
      title: `${industry.title} Warehouse Management | Nautilus WMS`,
      description: industry.heroDesc,
      url: `https://Nautiluswms.com/industry/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export default async function IndustryPage({ params }) {
  const { slug } = await params;
  const industry = INDUSTRIES.find((i) => i.slug === slug);
  const crumbs = [
    { name: "Home", url: "https://Nautiluswms.com" },
    { name: "Industries", url: "https://Nautiluswms.com/#industries" },
    {
      name: industry?.title || slug,
      url: `https://Nautiluswms.com/industry/${slug}`,
    },
  ];
  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <IndustryClient slug={slug} />
    </>
  );
}
