import PricingClient from "./PricingClient";
import JsonLd, { faqSchema, softwareSchema } from "@/components/SEO/JsonLd";
import { PRICING_FAQS } from "./pricingFaqs";

export const metadata = {
  title: "Pricing",
  description:
    "Per-warehouse pricing for Nautilus WMS. Pro from $239/warehouse/month. Enterprise custom. No per-user fees.",
  alternates: { canonical: "https://nautilusinventory.com/pricing" },
  openGraph: {
    type: "website",
    title: "Pricing — Nautilus WMS",
    description:
      "Per-warehouse pricing. Pro from $239/warehouse/month. Enterprise custom.",
    url: "https://nautilusinventory.com/pricing",
  },
};

/* Real pricing as a structured offer. AggregateOffer is the right
   schema.org type for "this product has multiple offers in a price
   range" — perfect fit for the Pro annual ($239) vs Pro monthly ($299)
   spread. Enterprise is omitted because "custom pricing" isn't
   meaningfully expressible in schema and adding a placeholder hurts
   more than it helps. Keep this in sync with PRICING in PricingClient.jsx
   if/when prices change. */
const PRICING_OFFERS = {
  "@type": "AggregateOffer",
  priceCurrency: "USD",
  lowPrice: "239",
  highPrice: "299",
  offerCount: "2",
  offers: [
    {
      "@type": "Offer",
      name: "Pro (annual billing)",
      price: "239",
      priceCurrency: "USD",
      description:
        "Per warehouse, per month, billed annually. Unlimited users, all 18 integrations.",
    },
    {
      "@type": "Offer",
      name: "Pro (monthly billing)",
      price: "299",
      priceCurrency: "USD",
      description:
        "Per warehouse, per month, billed monthly. Unlimited users, all 18 integrations.",
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      {/* SoftwareApplication with real offers. Different from the home
          page's softwareSchema() call (which uses the default "Contact
          for pricing" Offer) — pricing page emits the actual numbers
          so Google can surface them in pricing-intent queries. */}
      <JsonLd data={softwareSchema({ offers: PRICING_OFFERS })} />

      {/* FAQPage structured data — sourced from the same data module
          PricingClient renders, so JSON-LD and visible FAQ can't drift. */}
      <JsonLd data={faqSchema(PRICING_FAQS)} />

      <PricingClient />
    </>
  );
}
