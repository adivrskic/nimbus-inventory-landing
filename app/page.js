import HomeClient from "./HomeClient";
import JsonLd, {
  orgSchema,
  softwareSchema,
  websiteSchema,
} from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Nautilus WMS — AI-Powered Warehouse Management",
  description:
    "AI-powered warehouse intelligence for modern operations teams. Scanning, spatial mapping, pick optimization, and predictive analytics in a single platform.",
  alternates: { canonical: "https://nautilusinventory.com" },
};

export default function HomePage() {
  return (
    <>
      {/* Three site-level identity schemas. Google merges these — having
          all three on the canonical home URL is the cleanest place to
          declare them. Per-page schemas (FAQPage, Article, BreadcrumbList,
          etc.) live on their individual pages. */}
      <JsonLd data={orgSchema()} />
      <JsonLd data={softwareSchema()} />
      <JsonLd data={websiteSchema()} />
      <HomeClient />
    </>
  );
}
