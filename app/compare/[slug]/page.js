import CompareClient from "./CompareClient";
import { COMPETITORS, COMPARE_SLUGS } from "./compareData";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return COMPARE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = COMPETITORS[slug];
  if (!c) return { title: "Compare" };

  return {
    title: `Nautilus vs ${c.name}`,
    description: `Detailed comparison: ${c.heroDesc}`,
    alternates: { canonical: `https://Nautiluswms.com/compare/${slug}` },
    openGraph: {
      type: "website",
      title: `Nautilus vs ${c.name} — Warehouse Management Compared`,
      description: c.heroDesc,
      url: `https://Nautiluswms.com/compare/${slug}`,
    },
  };
}

export default async function ComparePage({ params }) {
  const { slug } = await params;
  if (!COMPETITORS[slug]) notFound();
  return <CompareClient slug={slug} />;
}
