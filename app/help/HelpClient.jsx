"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  gsap,
  DURATION,
  STAGGER,
  DISTANCE,
  EASE,
  prefersReducedMotion,
} from "@/lib/gsap";
import {
  ResourceShell,
  useResourceBrowseAnimations,
} from "@/components/ResourceShell";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import FinalCTACard from "@/components/FinalCTACard/FinalCTACard";
import DemoModal from "@/components/DemoModal/DemoModal";
import shellStyles from "@/components/ResourceShell/ResourceShell.module.css";
import pageStyles from "./Help.module.css";
import { HELP_CATEGORIES } from "@/lib/helpData";

export default function HelpClient() {
  const groupsRef = useRef(null);

  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  const [query, setQuery] = useState("");

  /* Filter categories + articles by query. A match in the title is kept;
     categories with no matching articles drop out entirely. */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HELP_CATEGORIES;
    return HELP_CATEGORIES.map((cat) => {
      const articles = cat.articles.filter((a) =>
        a.title.toLowerCase().includes(q)
      );
      return articles.length > 0 ? { ...cat, articles } : null;
    }).filter(Boolean);
  }, [query]);

  const totalArticles = HELP_CATEGORIES.reduce(
    (a, c) => a + c.articles.length,
    0
  );

  /* Initial reveal — the shared Browse hook. This is the same gated
     pattern every Resource page uses: it staggers the category groups up
     on scroll, but the play is HELD until the shell's header intro
     finishes (via the shell's introGate), then released. This replaces
     the old hand-rolled mount stagger with `delay: 0.7`, which was just a
     fixed guess at the header-intro duration and drifted out of sync the
     moment that timing changed. The groups are tagged with the shell's
     `browseItem` class so the hook can find them. */
  useResourceBrowseAnimations(groupsRef);

  /* Re-animate when the search filter changes. This is a re-shuffle that
     fires OUTSIDE the gated reveal hook (the hook already played once on
     mount), so per lib/gsap guidance it reads prefersReducedMotion()
     directly rather than going through matchMedia. The isFirst guard
     skips the mount render so it never double-fires with the hook above. */
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (!groupsRef.current) return;
    const groups = groupsRef.current.querySelectorAll(
      `.${pageStyles.categoryGroup}`
    );
    const reduced = prefersReducedMotion();
    gsap.fromTo(
      groups,
      { opacity: 0, y: reduced ? 0 : DISTANCE.sm },
      {
        opacity: 1,
        y: 0,
        duration: reduced ? 0 : DURATION.fast,
        stagger: reduced ? 0 : STAGGER.base,
        ease: EASE.out,
        overwrite: "auto",
      }
    );
  }, [query]);

  return (
    <>
      <ResourceShell
        eyebrow="Help Center"
        title="How can we help?"
        subtitle="Setup guides, troubleshooting, and answers to common questions. Search above or browse by category."
        onDemo={openDemo}
      >
        {/* Search bar */}
        <div className={pageStyles.searchWrap}>
          <svg
            className={pageStyles.searchIcon}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="7"
              cy="7"
              r="5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M11 11L14 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            className={pageStyles.searchInput}
            aria-label="Search help articles"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className={pageStyles.searchClear}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className={pageStyles.browseHead}>
          <span className={shellStyles.browseCount}>
            {query
              ? `${filtered.reduce(
                  (a, c) => a + c.articles.length,
                  0
                )} of ${totalArticles} articles`
              : `${totalArticles} articles · ${HELP_CATEGORIES.length} categories`}
          </span>
        </div>

        <div ref={groupsRef} className={pageStyles.categoriesWrap}>
          {filtered.length === 0 && (
            <div className={pageStyles.emptyState}>
              <div className={pageStyles.emptyStateLabel}>No results</div>
              <p className={pageStyles.emptyStateText}>
                Nothing matched &quot;<strong>{query}</strong>&quot;. Try a
                different search, or{" "}
                <TransitionLink href="/contact" className={shellStyles.link}>
                  contact support
                </TransitionLink>
                .
              </p>
            </div>
          )}

          {filtered.map((cat, ci) => (
            <section
              key={cat.slug}
              className={`${pageStyles.categoryGroup} ${shellStyles.browseItem}`}
            >
              <div className={pageStyles.categoryHeader}>
                <span className={pageStyles.categoryNum}>
                  {String(ci + 1).padStart(2, "0")}
                </span>
                <h2 className={pageStyles.categoryTitle}>{cat.title}</h2>
                <span className={pageStyles.categoryCount}>
                  {cat.articles.length}{" "}
                  {cat.articles.length === 1 ? "article" : "articles"}
                </span>
              </div>
              <ul className={pageStyles.articleList}>
                {cat.articles.map((article) => (
                  <li key={article.slug}>
                    <TransitionLink
                      href={`/help/${article.slug}`}
                      className={pageStyles.articleLink}
                    >
                      <span className={pageStyles.articleTitle}>
                        {article.title}
                      </span>
                      <span className={pageStyles.articleArrow}>→</span>
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        {/* Bottom CTA — when search doesn't help */}
        <FinalCTACard
          label="Can't find it?"
          title="Talk to a human."
          desc="Our team responds within 4 hours during business hours. Tell us what you're stuck on and we'll get back to you."
          primaryAction={{
            onClick: () => (window.location.href = "/contact"),
            label: "Contact support",
          }}
        />
      </ResourceShell>

      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
