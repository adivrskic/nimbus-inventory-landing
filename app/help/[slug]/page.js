import HelpArticleClient from "./HelpArticleClient";
import { HELP_CATEGORIES } from "@/lib/helpData";
import JsonLd, {
  breadcrumbSchema,
  helpArticleSchema,
} from "@/components/SEO/JsonLd";

function findArticle(slug) {
  for (const cat of HELP_CATEGORIES) {
    const article = cat.articles.find((a) => a.slug === slug);
    if (article) return { article, category: cat };
  }
  return null;
}

/* Pull the first paragraph from an article's content blocks for use as
   the meta description. Truncates at a word boundary near 155 chars
   (Google's typical SERP description cutoff). Falls back to a generic
   line only when an article has no prose content at all — almost never
   the case in practice. */
function firstParagraph(content, maxLen = 155) {
  const p = (content || []).find((b) => b.type === "p")?.text;
  if (!p) return null;
  if (p.length <= maxLen) return p;
  const truncated = p.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const found = findArticle(slug);
  if (!found) return { title: "Article Not Found" };

  /* Description sources from the article's first paragraph — each article
     ships with a substantive opening line that doubles as the SERP
     snippet. The fallback below only fires for articles with no prose
     content at all (effectively never in practice). */
  const description =
    firstParagraph(found.article.content) ||
    `${found.article.title} — Nautilus help guide.`;

  return {
    title: found.article.title,
    description,
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
  const article = found?.article;

  const crumbs = [
    { name: "Home", url: "https://nautilusinventory.com" },
    { name: "Help", url: "https://nautilusinventory.com/help" },
    {
      name: article?.title || slug,
      url: `https://nautilusinventory.com/help/${slug}`,
    },
  ];

  const description = article
    ? firstParagraph(article.content) ||
      `${article.title} — Nautilus help guide.`
    : null;

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      {article && (
        <JsonLd
          data={helpArticleSchema({
            title: article.title,
            description,
            slug,
          })}
        />
      )}
      <HelpArticleClient slug={slug} />
    </>
  );
}
