import HelpClient from "./HelpClient";

export const metadata = {
  title: "Help Center",
  description:
    "Guides, tutorials, and documentation for Nimbus WMS. Get started with barcode scanning, AI features, integrations, and account management.",
  alternates: { canonical: "https://nimbuswms.com/help" },
};

export default function HelpPage() {
  return <HelpClient />;
}
