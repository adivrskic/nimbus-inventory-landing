import BlogListClient from "./BlogListClient";

export const metadata = {
  title: "Blog",
  description:
    "Product updates, engineering deep dives, and warehouse intelligence insights from the Nimbus team.",
  alternates: { canonical: "https://nimbuswms.com/blog" },
};

export default function BlogPage() {
  return <BlogListClient />;
}
