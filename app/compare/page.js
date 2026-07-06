import CompareIndexClient from "./CompareIndexClient";
import { COMPETITORS, COMPARE_SLUGS } from "./[slug]/compareData";

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
  /* Trim each competitor to only the fields the index cards render —
     name/category/heroDesc plus the first 3 Nautilus quick-compare lines
     ("Key differences"). Keeping the full compareData import out of the
     client component means the ~12.5 KB module (feature matrices, switch
     reasons, strengths...) stays on the server instead of shipping in the
     route's JS chunk + hydration payload. */
  const competitors = COMPARE_SLUGS.map((slug) => ({
    slug,
    name: COMPETITORS[slug].name,
    category: COMPETITORS[slug].category,
    heroDesc: COMPETITORS[slug].heroDesc,
    keyDifferences: COMPETITORS[slug].quickCompare.Nautilus.slice(0, 3),
  }));
  return <CompareIndexClient competitors={competitors} />;
}
