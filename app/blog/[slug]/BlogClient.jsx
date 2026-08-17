"use client";
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import {
  ResourceShell,
  ResourceTOC,
  useResourceSectionAnimations,
} from "@/components/ResourceShell";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  gsap,
  DURATION,
  EASE,
  STAGGER,
  DISTANCE,
  TRIGGER,
  prefersReducedMotion,
} from "@/lib/gsap";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import shellStyles from "@/components/ResourceShell/ResourceShell.module.css";
import pageStyles from "./Blog.module.css";
import { useDemo } from "@/lib/DemoContext";

gsap.registerPlugin(ScrollTrigger);

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* `post` (the single matched post, full content blocks included) and
   `related` (same-tag posts trimmed to slug/title/date/readTime) are
   resolved server-side in app/blog/[slug]/page.js so this client chunk
   never bundles the full BLOG_POSTS data module. */
export default function BlogClient({ post, related }) {
  const contentRef = useRef(null);
  useResourceSectionAnimations(contentRef);

  const { openDemo: openDemoCtx } = useDemo();
  const openDemo = useCallback(
    () => openDemoCtx(undefined, { source: "blog_post" }),
    [openDemoCtx]
  );

  /* Derive sections from the post's h2 blocks for the TOC */
  const sections = useMemo(() => {
    if (!post) return [];
    return post.content
      .filter((b) => b.type === "h2")
      .map((b) => ({ id: slugify(b.text), label: b.text }));
  }, [post]);

  /* Reveal the page-specific outro blocks (the publish-meta footer + the
     related-posts list) on scroll, matching the article cascade's feel.
     These aren't `.section` content and use Blog-only classes, so
     useResourceSectionAnimations never touches them — without this they'd
     sit at full opacity while the article above animated in. They live at
     the very bottom of a multi-section post, so a plain scroll trigger is
     enough; no intro gating is needed (they're never above the fold on a
     real article, so they can't race the header intro). Tokens +
     reduced-motion handling mirror the section hook; gsap.context scoped to
     contentRef cleans the tween + trigger up on unmount / slug change. */
  useEffect(() => {
    if (!contentRef.current || !post) return;
    const footer = contentRef.current.querySelector(
      `.${pageStyles.postFooter}`
    );
    const relatedBlock = contentRef.current.querySelector(
      `.${pageStyles.related}`
    );
    const blocks = [footer, relatedBlock].filter(Boolean);
    if (!blocks.length) return;

    const ctx = gsap.context(() => {
      const reduced = prefersReducedMotion();
      gsap.fromTo(
        blocks,
        { opacity: 0, y: reduced ? 0 : DISTANCE.sm },
        {
          opacity: 1,
          y: 0,
          duration: reduced ? 0 : DURATION.base,
          stagger: reduced ? 0 : STAGGER.base,
          ease: EASE.out,
          scrollTrigger: {
            trigger: blocks[0],
            start: TRIGGER.reveal,
            once: true,
          },
        }
      );
    }, contentRef);

    return () => ctx.revert();
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
    /* <article>, not <main>: app/layout.js already wraps every route
       in <main id="main-content">, and nesting <main> is invalid HTML
       (one per document). This is the article body. */
    <article ref={contentRef} className={shellStyles.content}>
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
    </article>
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
    </>
  );
}
