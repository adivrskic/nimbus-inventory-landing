import PricingClient from "./PricingClient";

export const metadata = {
  title: "Pricing",
  description:
    "Per-warehouse pricing for Nimbus WMS. Pro from $239/warehouse/month. Enterprise custom. No per-user fees.",
  alternates: { canonical: "https://nimbuswms.com/pricing" },
  openGraph: {
    type: "website",
    title: "Pricing — Nimbus WMS",
    description:
      "Per-warehouse pricing. Pro from $239/warehouse/month. Enterprise custom.",
    url: "https://nimbuswms.com/pricing",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
