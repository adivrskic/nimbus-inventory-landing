import IndustryClient from "./IndustryClient";
import {
  INDUSTRIES,
  DEFAULT_INDUSTRY_FAQS,
} from "@/components/IndustryPage/industryData";
import JsonLd, { breadcrumbSchema, faqSchema } from "@/components/SEO/JsonLd";

/* Per-industry FAQs live on each industry in industryData.js as `faqs`.
   DEFAULT_INDUSTRY_FAQS is the fallback for any industry that omits its
   own. The visible FAQ rendering happens in
   components/IndustryPage/IndustryPage.jsx (section 04), which uses the
   same fallback pattern so the FAQ JSON-LD payload below stays in sync
   with what visitors actually see on the page — a requirement for FAQ
   rich-result eligibility in Google. */

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const industry = INDUSTRIES.find((i) => i.slug === slug);
  if (!industry) return { title: "Industry Not Found" };
  return {
    title: `${industry.title} Warehouse Management`,
    description: `Nautilus for ${industry.title.toLowerCase()} operations. ${
      industry.heroDesc
    }`,
    alternates: { canonical: `https://nautilusinventory.com/industry/${slug}` },
    openGraph: {
      title: `${industry.title} Warehouse Management | Nautilus`,
      description: industry.heroDesc,
      url: `https://nautilusinventory.com/industry/${slug}`,
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
    { name: "Home", url: "https://nautilusinventory.com" },
    /* Breadcrumb now points at the real /industry index page instead of
       a /#industries home-page anchor. Google prefers schema URLs that
       resolve to actual pages, and the index page now exists with a
       correct canonical. */
    { name: "Industries", url: "https://nautilusinventory.com/industry" },
    {
      name: industry?.title || slug,
      url: `https://nautilusinventory.com/industry/${slug}`,
    },
  ];

  /* Per-industry FAQs drive the JSON-LD schema. Each /industry/[slug]
     page now emits a unique FAQPage payload, which makes the FAQ rich
     result eligible in Google's SERP. Previously industry pages had
     breadcrumb schema only — adding FAQ schema is net-new SEO surface. */
  const faqs = industry?.faqs ?? DEFAULT_INDUSTRY_FAQS;

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <JsonLd data={faqSchema(faqs)} />
      <IndustryClient slug={slug} />
    </>
  );
}
