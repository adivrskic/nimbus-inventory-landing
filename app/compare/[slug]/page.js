import CompareClient from "./CompareClient";
import { COMPETITORS, COMPARE_SLUGS } from "./compareData";
import { notFound } from "next/navigation";
import { truncateDescription, OG_IMAGE } from "@/lib/site";

export async function generateStaticParams() {
  return COMPARE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = COMPETITORS[slug];
  if (!c) return { title: "Compare" };

  return {
    title: `Nautilus vs ${c.name}`,
    description: truncateDescription(`Detailed comparison: ${c.heroDesc}`),
    alternates: { canonical: `https://nautilusinventory.com/compare/${slug}` },
    openGraph: {
      type: "website",
      siteName: "Nautilus Inventory",
      images: [OG_IMAGE],
      title: `Nautilus vs ${c.name} — Warehouse Management Compared`,
      description: truncateDescription(c.heroDesc, 200),
      url: `https://nautilusinventory.com/compare/${slug}`,
    },
  };
}

export default async function ComparePage({ params }) {
  const { slug } = await params;
  const competitor = COMPETITORS[slug];
  if (!competitor) notFound();

  /* Only the matched competitor (full object) plus a trimmed cross-link
     list of the others (slug/name/category — the fields the cards render)
     cross the server→client boundary, keeping the full compareData module
     out of the route's JS chunk + hydration payload. */
  const others = COMPARE_SLUGS.filter((s) => s !== slug).map((s) => ({
    slug: s,
    name: COMPETITORS[s].name,
    category: COMPETITORS[s].category,
  }));

  return <CompareClient competitor={competitor} others={others} />;
}
