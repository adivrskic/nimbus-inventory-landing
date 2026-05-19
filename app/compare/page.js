import CompareIndexClient from "./CompareIndexClient";

export const metadata = {
  title: "Compare Nautilus",
  description:
    "How does Nautilus compare to other warehouse management systems? Detailed side-by-side comparisons with Fishbowl, Sortly, and NetSuite WMS.",
  alternates: { canonical: "https://nautilusinventory.com/compare" },
  openGraph: {
    type: "website",
    title: "Compare Nautilus to other WMS platforms",
    description:
      "Side-by-side comparisons with Fishbowl, Sortly, and NetSuite WMS.",
    url: "https://nautilusinventory.com/compare",
  },
};

export default function CompareIndexPage() {
  return <CompareIndexClient />;
}
