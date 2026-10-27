import LegalClient from "./LegalClient";
import { LEGAL_PAGES } from "@/components/LegalPage/legalData";
import { notFound } from "next/navigation";

const TITLES = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  security: "Security",
};

/* One real sentence per document — the old template string ("Privacy
   Policy for Nautilus WMS warehouse management platform.") read as
   boilerplate in the SERP. Keep these in step with the section headings
   in components/LegalPage/legalData.js. */
const DESCRIPTIONS = {
  privacy:
    "How Nautilus collects, uses, stores, and shares your account and warehouse data, how long it is kept, and the rights you have over it.",
  terms:
    "The terms that govern your use of the Nautilus platform: accounts, acceptable use, data ownership, availability, liability, and termination.",
  security:
    "Where your Nautilus data lives and how it is protected: encryption, per-organization isolation, sign-in and API-key controls, activity logging, and how to report a vulnerability.",
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
    description:
      DESCRIPTIONS[slug] ||
      `${title} for the Nautilus warehouse management platform.`,
    alternates: { canonical: `https://nautilusinventory.com/legal/${slug}` },
  };
}

export async function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map((slug) => ({ slug }));
}

export default async function LegalPage({ params }) {
  const { slug } = await params;
  /* Resolved here (server) and passed down, so components/LegalPage no
     longer imports the whole legalData module into the client chunk. */
  const page = LEGAL_PAGES[slug];
  if (!page) notFound();
  return <LegalClient slug={slug} page={page} />;
}
