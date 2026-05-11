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
import pageStyles from "./HelpArticle.module.css";
import { HELP_CATEGORIES } from "@/lib/helpData";

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* Flatten + index articles for easy lookup + cross-category links */
function findArticle(slug) {
  for (const cat of HELP_CATEGORIES) {
    const article = cat.articles.find((a) => a.slug === slug);
    if (article) return { article, category: cat };
  }
  return null;
}

export default function HelpArticleClient({ slug }) {
  const contentRef = useRef(null);
  useResourceSectionAnimations(contentRef);

  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  const [feedback, setFeedback] = useState(null);

  const found = findArticle(slug);
  const post = found?.article;
  const category = found?.category;

  /* Sections derived from h2 blocks */
  const sections = useMemo(() => {
    if (!post) return [];
    return post.content
      .filter((b) => b.type === "h2")
      .map((b) => ({ id: slugify(b.text), label: b.text }));
  }, [post]);

  /* Related articles: same category, excluding current, first 4 */
  const related = useMemo(() => {
    if (!category || !post) return [];
    return category.articles.filter((a) => a.slug !== post.slug).slice(0, 4);
  }, [category, post]);

  if (!post) {
    return (
      <ResourceShell
        eyebrow="Help Center"
        title="Article not found."
        subtitle="The article you're looking for may have moved or been renamed."
        onDemo={openDemo}
      >
        <div className={pageStyles.notFoundCta}>
          <TransitionLink href="/help" className={shellStyles.link}>
            ← Back to all articles
          </TransitionLink>
        </div>
      </ResourceShell>
    );
  }

  /* Group content blocks into sections (intro + one per h2) */
  const grouped = [];
  let current = { id: "overview", heading: null, blocks: [] };
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
    return null;
  };

  const hasTOC = sections.length > 0;

  /* Single content block, used in both layouts (with TOC and without) */
  const content = (
    <main ref={contentRef} className={shellStyles.content}>
      {grouped.map((group) => (
        <section key={group.id} id={group.id} className={shellStyles.section}>
          {group.heading && <h2 className={shellStyles.h2}>{group.heading}</h2>}
          {group.blocks.map((b, i) => renderBlock(b, i))}
        </section>
      ))}

      {/* Was this helpful? */}
      <div className={pageStyles.feedback}>
        {feedback === null ? (
          <>
            <div className={pageStyles.feedbackLabel}>
              Was this article helpful?
            </div>
            <div className={pageStyles.feedbackButtons}>
              <button
                type="button"
                onClick={() => setFeedback("yes")}
                className={pageStyles.feedbackBtn}
              >
                Yes, it helped
              </button>
              <button
                type="button"
                onClick={() => setFeedback("no")}
                className={pageStyles.feedbackBtn}
              >
                Not really
              </button>
            </div>
          </>
        ) : feedback === "yes" ? (
          <div className={pageStyles.feedbackResult}>
            <span className={pageStyles.feedbackResultDot} />
            <span>Thanks for the feedback.</span>
          </div>
        ) : (
          <div className={pageStyles.feedbackResultRow}>
            <div className={pageStyles.feedbackResult}>
              <span className={pageStyles.feedbackResultDot} />
              <span>Sorry this didn&apos;t help.</span>
            </div>
            <TransitionLink
              href="/contact"
              className={pageStyles.feedbackContactLink}
            >
              Talk to support →
            </TransitionLink>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div className={pageStyles.related}>
          <div className={pageStyles.relatedLabel}>
            Other articles in {category.title}
          </div>
          <div className={pageStyles.relatedList}>
            {related.map((r) => (
              <TransitionLink
                key={r.slug}
                href={`/help/${r.slug}`}
                className={pageStyles.relatedItem}
              >
                <span className={pageStyles.relatedItemTitle}>{r.title}</span>
                <span className={pageStyles.relatedItemArrow}>→</span>
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
          text: `Help · ${category.title}`,
          link: { href: "/help", text: "All articles →" },
        }}
        eyebrow={category.title}
        title={post.title}
        onDemo={openDemo}
      >
        {hasTOC ? (
          <div className={shellStyles.body}>
            <ResourceTOC sections={sections} label="In this article" />
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
