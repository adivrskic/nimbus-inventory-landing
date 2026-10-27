// ──────────────────────────────────────────────────────────────────────────
// app/sitemap.js
// ──────────────────────────────────────────────────────────────────────────
// Generates the XML sitemap from the canonical data modules. Each templated
// page-type (integrations, industries, blog, help, compare) sources its
// slug list directly from the module that owns it, so adding a new
// integration / blog post / etc. automatically updates the sitemap.
//
// What was wrong before:
//   - Slug arrays were hand-maintained copies of the data-module arrays.
//     Adding a new integration meant a silent SEO miss unless you also
//     remembered to update this file. Source-of-truth duplication is
//     the kind of bug that's invisible until you grep production.
//   - /compare and /compare/[slug] were missing entirely.
//   - /industry (index) was missing — only the /industry/[slug] pages
//     were listed.
//   - /calculator was missing (it's a real conversion page, indexable).
//   - /trust, /api-docs, /status were listed despite being commented
//     out of Nav and Footer — unreachable pages shouldn't be in the
//     sitemap.
// ──────────────────────────────────────────────────────────────────────────

import { INTEGRATIONS } from "@/components/IntegrationPage/integrationData";
import { INDUSTRIES } from "@/components/IndustryPage/industryData";
import { BLOG_POSTS } from "@/lib/blogData";
import { HELP_CATEGORIES } from "@/lib/helpData";
import { COMPARE_SLUGS } from "@/app/compare/[slug]/compareData";
import { LEGAL_PAGES } from "@/components/LegalPage/legalData";
import { SITE_URL, toIsoDate } from "@/lib/site";

/* lastModified is only emitted where the data module carries a real date
   (blog posts, legal documents). Stamping the build time on every URL
   told crawlers all 95 pages changed on every deploy, which is noise. */

export default function sitemap() {
  /* Top-level routes that ARE in the user-facing nav/footer.
     If you re-enable /trust, /api-docs, or /status in Nav/Footer,
     add them back to this array (with the appropriate priority +
     change frequency). */
  const staticPages = [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/pricing`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/calculator`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/compare`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/industry`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/integration`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/help`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/ask`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/floor-plan`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const integrations = Object.keys(INTEGRATIONS).map((slug) => ({
    url: `${SITE_URL}/integration/${slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const industries = INDUSTRIES.map((i) => ({
    url: `${SITE_URL}/industry/${i.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const compares = COMPARE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/compare/${slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogs = BLOG_POSTS.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: toIsoDate(p.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const helpArticles = HELP_CATEGORIES.flatMap((cat) =>
    cat.articles.map((a) => ({
      url: `${SITE_URL}/help/${a.slug}`,
      changeFrequency: "monthly",
      priority: 0.5,
    }))
  );

  const legal = Object.entries(LEGAL_PAGES).map(([slug, page]) => ({
    url: `${SITE_URL}/legal/${slug}`,
    lastModified: toIsoDate(page.updated),
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  return [
    ...staticPages,
    ...integrations,
    ...industries,
    ...compares,
    ...blogs,
    ...helpArticles,
    ...legal,
  ];
}
