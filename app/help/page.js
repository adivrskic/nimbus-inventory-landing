import HelpClient from "./HelpClient";
import { HELP_CATEGORIES } from "@/lib/helpData";

export const metadata = {
  title: "Help Center",
  description:
    "Guides, tutorials, and documentation for Nautilus WMS. Get started with barcode scanning, AI features, integrations, and account management.",
  alternates: { canonical: "https://nautilusinventory.com/help" },
};

export default function HelpPage() {
  /* Trim to only the fields the list UI renders (category slug/title +
     article slug/title). Keeping the full HELP_CATEGORIES import out of
     the client component means the ~40 KB data module (article bodies
     included) stays on the server instead of shipping in the route's JS
     chunk + hydration payload. */
  const categories = HELP_CATEGORIES.map((cat) => ({
    slug: cat.slug,
    title: cat.title,
    articles: cat.articles.map((a) => ({ slug: a.slug, title: a.title })),
  }));
  return <HelpClient categories={categories} />;
}
