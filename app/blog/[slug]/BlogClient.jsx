"use client";
import { useRef, useState, useCallback, useMemo } from "react";
import {
  ResourceShell,
  ResourceTOC,
  useResourceSectionAnimations,
} from "@/components/ResourceShell";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import DemoModal from "@/components/DemoModal/DemoModal";
import shellStyles from "@/components/ResourceShell/ResourceShell.module.css";
import pageStyles from "./Blog.module.css";
import { BLOG_POSTS } from "@/lib/blogData";

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function BlogClient({ slug }) {
  const contentRef = useRef(null);
  useResourceSectionAnimations(contentRef);

  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  const post = BLOG_POSTS.find((p) => p.slug === slug);

  /* Derive sections from the post's h2 blocks for the TOC */
  const sections = useMemo(() => {
    if (!post) return [];
    return post.content
      .filter((b) => b.type === "h2")
      .map((b) => ({ id: slugify(b.text), label: b.text }));
  }, [post]);

  /* Related posts: same tag, excluding current, first 3 */
  const related = useMemo(() => {
    if (!post) return [];
    return BLOG_POSTS.filter(
      (p) => p.slug !== post.slug && p.tag === post.tag
    ).slice(0, 3);
  }, [post]);

  if (!post) {
    return (
      <ResourceShell
        eyebrow="Blog"
        title="Post not found."
        subtitle="The article you're looking for may have moved or been removed."
        onDemo={openDemo}
      >
        <div className={pageStyles.notFoundCta}>
          <TransitionLink href="/blog" className={shellStyles.link}>
            ← Back to all posts
          </TransitionLink>
        </div>
      </ResourceShell>
    );
  }

  /* Render the post body — split content into a single intro section and
     one section per h2. This gives the scroll-animation hook discrete
     `.section` blocks to animate, and the TOC anchors line up cleanly. */
  const grouped = [];
  let current = { id: "intro", heading: null, blocks: [] };
  for (const block of post.content) {
    if (block.type === "h2") {
      if (current.blocks.length > 0 || current.heading) grouped.push(current);
      current = {
        id: slugify(block.text),
        heading: block.text,
        blocks: [],
      };
    } else {
      current.blocks.push(block);
    }
  }
  if (current.blocks.length > 0 || current.heading) grouped.push(current);

  const renderBlock = (b, i) => {
    if (b.type === "p")
      return (
        <p key={i} className={shellStyles.p}>
          {b.text}
        </p>
      );
    if (b.type === "h3")
      return (
        <h3 key={i} className={shellStyles.h3}>
          {b.text}
        </h3>
      );
    if (b.type === "code")
      return (
        <div key={i} className={shellStyles.codeBlock}>
          {b.label && (
            <div className={shellStyles.codeBar}>
              <span className={shellStyles.codeBarLabel}>{b.label}</span>
            </div>
          )}
          <pre className={shellStyles.codePre}>{b.text}</pre>
        </div>
      );
    return null;
  };

  const hasTOC = sections.length > 0;

  const content = (
    <main ref={contentRef} className={shellStyles.content}>
      {grouped.map((group) => (
        <section key={group.id} id={group.id} className={shellStyles.section}>
          {group.heading && <h2 className={shellStyles.h2}>{group.heading}</h2>}
          {group.blocks.map((b, i) => renderBlock(b, i))}
        </section>
      ))}

      <div className={pageStyles.postFooter}>
        <div className={pageStyles.postFooterRow}>
          <div className={pageStyles.postFooterMeta}>
            <span className={pageStyles.postFooterLabel}>Published</span>
            <span className={pageStyles.postFooterValue}>{post.date}</span>
          </div>
          <div className={pageStyles.postFooterMeta}>
            <span className={pageStyles.postFooterLabel}>Category</span>
            <span className={pageStyles.postFooterValue}>{post.tag}</span>
          </div>
          <div className={pageStyles.postFooterMeta}>
            <span className={pageStyles.postFooterLabel}>Read time</span>
            <span className={pageStyles.postFooterValue}>{post.readTime}</span>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className={pageStyles.related}>
          <div className={pageStyles.relatedLabel}>More from {post.tag}</div>
          <div className={pageStyles.relatedList}>
            {related.map((r) => (
              <TransitionLink
                key={r.slug}
                href={`/blog/${r.slug}`}
                className={pageStyles.relatedItem}
              >
                <span className={pageStyles.relatedItemTitle}>{r.title}</span>
                <span className={pageStyles.relatedItemMeta}>
                  {r.date} · {r.readTime}
                </span>
              </TransitionLink>
            ))}
          </div>
        </div>
      )}
    </main>
  );

  return (
    <>
      <ResourceShell
        topStrip={{
          text: `${post.tag} · ${post.date} · ${post.readTime} read`,
          link: { href: "/blog", text: "All posts →" },
        }}
        eyebrow={post.tag}
        title={post.title}
        subtitle={post.desc}
        onDemo={openDemo}
      >
        {hasTOC ? (
          <div className={shellStyles.body}>
            <ResourceTOC sections={sections} label="In this post" />
            {content}
          </div>
        ) : (
          content
        )}
      </ResourceShell>

      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
