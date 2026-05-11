import CompareIndexClient from "./CompareIndexClient";

export const metadata = {
  title: "Compare Nimbus",
  description:
    "How does Nimbus compare to other warehouse management systems? Detailed side-by-side comparisons with Fishbowl, Sortly, and NetSuite WMS.",
  alternates: { canonical: "https://nimbuswms.com/compare" },
  openGraph: {
    type: "website",
    title: "Compare Nimbus to other WMS platforms",
    description:
      "Side-by-side comparisons with Fishbowl, Sortly, and NetSuite WMS.",
    url: "https://nimbuswms.com/compare",
  },
};

export default function CompareIndexPage() {
  return <CompareIndexClient />;
}
