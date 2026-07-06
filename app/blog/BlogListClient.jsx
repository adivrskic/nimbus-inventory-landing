"use client";
import { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
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
import { useDemo } from "@/lib/DemoContext";
import shellStyles from "@/components/ResourceShell/ResourceShell.module.css";

/* useLayoutEffect on the client, useEffect on the server. The filter
   re-animation has to set its from-state (opacity 0) BEFORE the browser
   paints the newly-filtered list, otherwise the new posts flash in at full
   opacity for a frame and then snap to 0 to animate. useLayoutEffect fires
   before paint and kills that flicker; the isomorphic guard avoids React's
   server-side useLayoutEffect warning during SSR. */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* `posts` arrives pre-trimmed from the server page (app/blog/page.js):
   only slug/tag/date/readTime/title/desc — never full post bodies. */
export default function BlogListClient({ posts }) {
  const listRef = useRef(null);

  /* ResourceShell still gets onDemo so any in-shell CTA works. The modal
     itself is global (app/layout.js → DemoHost). */
  const { openDemo } = useDemo();

  const [activeTag, setActiveTag] = useState("All");

  const TAGS = useMemo(
    () => ["All", ...Array.from(new Set(posts.map((p) => p.tag)))],
    [posts]
  );

  const filtered = useMemo(
    () =>
      activeTag === "All" ? posts : posts.filter((p) => p.tag === activeTag),
    [activeTag, posts]
  );

  /* Initial browse-item stagger on mount — owned by the shared hook so it
     stays uniform with every other ResourceShell page (and gated behind the
     shell's hero intro there, not here). */
  useResourceBrowseAnimations(listRef);

  /* Re-animate the list when the filter changes (a different post set).
     Runs as a pre-paint layout effect so the incoming items never flash in
     at full opacity before being reset to their from-state. Wrapped in a
     gsap.context scoped to the list: the selector is resolved within
     listRef, and the returned revert() cleans the tween up before the next
     filter change so rapid tag-clicking can't stack half-finished reveals
     (overwrite: "auto" is a second guard for the same race). Tokens +
     reduced-motion handling are unchanged. */
  const isFirst = useRef(true);
  useIsoLayoutEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (!listRef.current) return;

    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        `.${shellStyles.browseItem}`,
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
    }, listRef);

    return () => ctx.revert();
  }, [activeTag]);

  return (
    <ResourceShell
      eyebrow="Blog"
      title="Notes from the warehouse."
      subtitle="Product launches, engineering deep dives, and field reports from real Nautilus operations."
      onDemo={openDemo}
    >
      <div className={shellStyles.browse}>
        <div className={shellStyles.browseHead}>
          <span className={shellStyles.browseCount}>
            {String(filtered.length).padStart(2, "0")}{" "}
            {filtered.length === 1 ? "post" : "posts"}
            {activeTag !== "All" && <> · {activeTag}</>}
          </span>
          <div className={shellStyles.browseFilters}>
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag)}
                className={`${shellStyles.browseFilter} ${
                  activeTag === tag ? shellStyles.browseFilterActive : ""
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div ref={listRef} className={shellStyles.browseList}>
          {filtered.map((post) => (
            <TransitionLink
              key={post.slug}
              href={`/blog/${post.slug}`}
              className={shellStyles.browseItem}
            >
              <div className={shellStyles.browseItemMain}>
                <div className={shellStyles.browseItemCategory}>{post.tag}</div>
                <h2 className={shellStyles.browseItemTitle}>{post.title}</h2>
                <p className={shellStyles.browseItemDesc}>{post.desc}</p>
              </div>
              <div className={shellStyles.browseItemMeta}>
                <span className={shellStyles.browseItemDate}>{post.date}</span>
                <span className={shellStyles.browseItemReadTime}>
                  {post.readTime} read
                </span>
              </div>
            </TransitionLink>
          ))}
        </div>
      </div>
    </ResourceShell>
  );
}
