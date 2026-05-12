"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import {
  ResourceShell,
  useResourceBrowseAnimations,
} from "@/components/ResourceShell";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import { useDemo } from "@/lib/DemoContext";
import shellStyles from "@/components/ResourceShell/ResourceShell.module.css";
import { BLOG_POSTS } from "@/lib/blogData";

const TAGS = ["All", ...Array.from(new Set(BLOG_POSTS.map((p) => p.tag)))];

export default function BlogListClient() {
  const listRef = useRef(null);

  /* ResourceShell still gets onDemo so any in-shell CTA works. The modal
     itself is global (app/layout.js → DemoHost). */
  const { openDemo } = useDemo();

  const [activeTag, setActiveTag] = useState("All");

  const filtered = useMemo(
    () =>
      activeTag === "All"
        ? BLOG_POSTS
        : BLOG_POSTS.filter((p) => p.tag === activeTag),
    [activeTag]
  );

  /* Browse-item stagger on initial mount */
  useResourceBrowseAnimations(listRef);

  /* Re-animate when filter changes (different post set) */
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll(
      `.${shellStyles.browseItem}`
    );
    gsap.fromTo(
      items,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.04,
        ease: "power2.out",
      }
    );
  }, [activeTag]);

  return (
    <ResourceShell
      eyebrow="Blog"
      title="Notes from the warehouse."
      subtitle="Product launches, engineering deep dives, and field reports from real Nimbus operations."
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
