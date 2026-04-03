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
    alternates: { canonical: `https://nimbuswms.com/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.desc,
      url: `https://nimbuswms.com/blog/${slug}`,
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
  const crumbs = [
    { name: "Home", url: "https://nimbuswms.com" },
    { name: "Blog", url: "https://nimbuswms.com/blog" },
    { name: post?.title || slug, url: `https://nimbuswms.com/blog/${slug}` },
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
      <BlogClient slug={slug} />
    </>
  );
}
