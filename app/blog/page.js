import BlogListClient from "./BlogListClient";
import { BLOG_POSTS } from "@/lib/blogData";

export const metadata = {
  title: "Blog",
  description:
    "Product updates, engineering deep dives, and warehouse intelligence insights from the Nautilus team.",
  alternates: { canonical: "https://nautilusinventory.com/blog" },
};

export default function BlogPage() {
  /* Trim each post to only the fields the list UI renders. Keeping the
     full BLOG_POSTS import out of the client component means the ~53 KB
     data module (post bodies included) stays on the server instead of
     shipping in the route's JS chunk + hydration payload. */
  const posts = BLOG_POSTS.map((p) => ({
    slug: p.slug,
    tag: p.tag,
    date: p.date,
    readTime: p.readTime,
    title: p.title,
    desc: p.desc,
  }));
  return <BlogListClient posts={posts} />;
}
