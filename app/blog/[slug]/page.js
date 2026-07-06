import BlogClient from "./BlogClient";
import { BLOG_POSTS } from "@/lib/blogData";
import JsonLd, {
  articleSchema,
  breadcrumbSchema,
} from "@/components/SEO/JsonLd";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.desc,
    alternates: { canonical: `https://nautilusinventory.com/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.desc,
      url: `https://nautilusinventory.com/blog/${slug}`,
      publishedTime: post.date,
    },
  };
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  /* Related posts: same tag, excluding current, first 3 — computed here
     (server) and trimmed to the fields the related-list UI renders, so
     the client component never needs the full BLOG_POSTS module. */
  const related = post
    ? BLOG_POSTS.filter((p) => p.slug !== post.slug && p.tag === post.tag)
        .slice(0, 3)
        .map((r) => ({
          slug: r.slug,
          title: r.title,
          date: r.date,
          readTime: r.readTime,
        }))
    : [];
  const crumbs = [
    { name: "Home", url: "https://nautilusinventory.com" },
    { name: "Blog", url: "https://nautilusinventory.com/blog" },
    {
      name: post?.title || slug,
      url: `https://nautilusinventory.com/blog/${slug}`,
    },
  ];
  return (
    <>
      {post && (
        <JsonLd
          data={articleSchema({
            title: post.title,
            description: post.desc,
            slug,
            date: post.date,
          })}
        />
      )}
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <BlogClient post={post ?? null} related={related} />
    </>
  );
}
