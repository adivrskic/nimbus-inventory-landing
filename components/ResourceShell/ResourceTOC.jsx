"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import styles from "./ResourceShell.module.css";

/**
 * Sticky TOC sidebar with IntersectionObserver-based scroll-spy.
 * Use inside a ResourceShell body for Read-type pages (API Docs, Blog post,
 * Help article).
 *
 * Props:
 *  - sections: [{ id, label }]
 *  - label?: string  (default: "On this page")
 *  - scrollOffset?: number  (default 90 — clears the fixed nav)
 */
export default function ResourceTOC({
  sections,
  label = "On this page",
  scrollOffset = 90,
}) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  /* Scroll-spy via IntersectionObserver */
  useEffect(() => {
    if (typeof window === "undefined" || !window.IntersectionObserver) return;

    const visible = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        }
        if (visible.size > 0) {
          /* Pick the topmost visible section */
          let best = null;
          for (const [id, top] of visible) {
            if (best === null || top < best.top) best = { id, top };
          }
          if (best) setActiveSection(best.id);
        }
      },
      {
        rootMargin: "-120px 0px -55% 0px",
        threshold: 0,
      }
    );

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [sectionIds]);

  const handleClick = useCallback(
    (e, id) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (!el) return;
      const top =
        el.getBoundingClientRect().top + window.scrollY - scrollOffset;
      window.scrollTo({ top, behavior: "smooth" });
      history.replaceState(null, "", `#${id}`);
    },
    [scrollOffset]
  );

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarSticky}>
        <div className={styles.sidebarLabel}>{label}</div>
        <ul className={styles.sidebarList}>
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => handleClick(e, s.id)}
                className={`${styles.sidebarLink} ${
                  activeSection === s.id ? styles.sidebarLinkActive : ""
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
