import HomeClient from "./HomeClient";
import { SITE_URL } from "@/lib/site";
import JsonLd, {
  orgSchema,
  softwareSchema,
  websiteSchema,
} from "@/components/SEO/JsonLd";

export const metadata = {
  // `absolute` opts out of the layout's "%s | Nautilus Inventory" template —
  // otherwise the home title double-brands and runs long. This is the one
  // page whose title already contains the full brand.
  title: { absolute: "Nautilus Inventory — AI-Powered Warehouse Management" },
  description:
    "AI-powered warehouse intelligence for modern operations teams. Scanning, spatial mapping, pick optimization, and predictive analytics in a single platform.",
  alternates: { canonical: SITE_URL },
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
