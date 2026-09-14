import LegalClient from "./LegalClient";
import { LEGAL_PAGES } from "@/components/LegalPage/legalData";

const TITLES = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  security: "Security",
};

/* Only the slugs in LEGAL_PAGES exist. Without this, any other slug — the
   removed /legal/status page included — rendered LegalPage's "not found"
   view with a 200 status; now it's a real 404. */
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const title = TITLES[slug] || "Legal";
  return {
    title,
    description: `${title} for Nautilus WMS warehouse management platform.`,
    alternates: { canonical: `https://nautilusinventory.com/legal/${slug}` },
  };
}

export async function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map((slug) => ({ slug }));
}

export default async function LegalPage({ params }) {
  const { slug } = await params;
  return <LegalClient slug={slug} />;
}
