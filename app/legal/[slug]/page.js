import LegalClient from "./LegalClient";
import { LEGAL_PAGES } from "@/components/LegalPage/legalData";

const TITLES = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  security: "Security",
  status: "System Status",
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const title = TITLES[slug] || "Legal";
  return {
    title,
    description: `${title} for Nautilus WMS warehouse management platform.`,
    alternates: { canonical: `https://nautilusinventory.com/legal/${slug}` },
    robots: { index: slug !== "status", follow: true },
  };
}

export async function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map((slug) => ({ slug }));
}

export default async function LegalPage({ params }) {
  const { slug } = await params;
  return <LegalClient slug={slug} />;
}
