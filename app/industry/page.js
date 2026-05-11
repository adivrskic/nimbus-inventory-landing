import IndustriesIndexClient from "./IndustriesIndexClient";

export const metadata = {
  title: "Industries — Nimbus",
  description:
    "Nimbus is built for the operational quirks of every warehouse type — flooring and building materials, manufacturing, food and beverage, automotive, pharmaceuticals, e-commerce 3PL, electrical, and agriculture.",
  alternates: { canonical: "https://nimbuswms.com/industries" },
  openGraph: {
    type: "website",
    title: "Industries Nimbus serves",
    description: "Built for the operational quirks of every warehouse type.",
    url: "https://nimbuswms.com/industries",
  },
};

export default function IndustriesIndexPage() {
  return <IndustriesIndexClient />;
}
