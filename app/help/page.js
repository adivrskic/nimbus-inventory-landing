import HelpClient from "./HelpClient";

export const metadata = {
  title: "Help Center",
  description:
    "Guides, tutorials, and documentation for Nautilus WMS. Get started with barcode scanning, AI features, integrations, and account management.",
  alternates: { canonical: "https://nautilusinventory.com/help" },
};

export default function HelpPage() {
  return <HelpClient />;
}
