import PricingClient from "./PricingClient";

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

export default function PricingPage() {
  return <PricingClient />;
}
