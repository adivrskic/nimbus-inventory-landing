import HelpArticleClient from "./HelpArticleClient";
import { HELP_CATEGORIES } from "@/lib/helpData";
import JsonLd, { breadcrumbSchema } from "@/components/SEO/JsonLd";

function findArticle(slug) {
  for (const cat of HELP_CATEGORIES) {
    const article = cat.articles.find((a) => a.slug === slug);
    if (article) return { article, category: cat };
  }
  return null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const found = findArticle(slug);
  if (!found) return { title: "Article Not Found" };
  return {
    title: found.article.title,
    description: `${found.article.title} — Nautilus WMS help guide in the ${found.category.title} category.`,
    alternates: { canonical: `https://nautilusinventory.com/help/${slug}` },
  };
}

export async function generateStaticParams() {
  const slugs = [];
  for (const cat of HELP_CATEGORIES) {
    for (const a of cat.articles) slugs.push({ slug: a.slug });
  }
  return slugs;
}

export default async function HelpArticlePage({ params }) {
  const { slug } = await params;
  const found = findArticle(slug);
  const crumbs = [
    { name: "Home", url: "https://nautilusinventory.com" },
    { name: "Help", url: "https://nautilusinventory.com/help" },
    {
      name: found?.article?.title || slug,
      url: `https://nautilusinventory.com/help/${slug}`,
    },
  ];
  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <HelpArticleClient slug={slug} />
    </>
  );
}
