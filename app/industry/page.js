import IndustriesIndexClient from "./IndustriesIndexClient";

export const metadata = {
  title: "Industries — Nautilus",
  description:
    "Nautilus is built for the operational quirks of every warehouse type — flooring and building materials, manufacturing, food and beverage, automotive, pharmaceuticals, e-commerce 3PL, electrical, and agriculture.",
  alternates: { canonical: "https://nautilusinventory.com/industries" },
  openGraph: {
    type: "website",
    title: "Industries Nautilus serves",
    description: "Built for the operational quirks of every warehouse type.",
    url: "https://nautilusinventory.com/industries",
  },
};

export default function IndustriesIndexPage() {
  return <IndustriesIndexClient />;
}
