import IndustriesIndexClient from "./IndustriesIndexClient";

/* Canonical / OG URL fixed to match the actual route (/industry, not
   /industries). The previous self-referencing canonical pointed at a
   non-existent /industries URL — Google would have either dropped the
   page from the index or treated /industry as a duplicate of a 404. */

export const metadata = {
  title: "Industries — Nautilus",
  description:
    "Nautilus is built for the operational quirks of every warehouse type — flooring and building materials, manufacturing, food and beverage, automotive, pharmaceuticals, e-commerce 3PL, electrical, and agriculture.",
  alternates: { canonical: "https://nautilusinventory.com/industry" },
  openGraph: {
    type: "website",
    title: "Industries Nautilus serves",
    description: "Built for the operational quirks of every warehouse type.",
    url: "https://nautilusinventory.com/industry",
  },
};

export default function IndustriesIndexPage() {
  return <IndustriesIndexClient />;
}
