"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import SplitText from "@/components/shared/SplitText";
import styles from "./ResourceShell.module.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Shared shell for all Resource page-type pages (Read AND Browse).
 *
 * Renders:
 *  - Page wrapper (dark theme)
 *  - Nav (forwarding onDemo)
 *  - Optional top status strip
 *  - Header (eyebrow + per-letter title + subtitle + optional metadata grid)
 *  - Children (the page-specific body)
 *  - Footer
 *
 * Animations: Mount timeline for header chrome. Pages handle body animations
 * separately (most use the exported `useResourceSectionAnimations` hook).
 *
 * Props:
 *  - topStrip?: { text, link?: { href, text } }
 *  - eyebrow?: string
 *  - title: string                  // rendered per-letter automatically
 *  - subtitle?: string
 *  - metadata?: [{ label, value }]  // renders as 4-cell grid below header
 *  - onDemo?: () => void            // passed to Nav for the demo button
 *  - children: ReactNode            // body content
 */
export default function ResourceShell({
  topStrip,
  eyebrow,
  title,
  subtitle,
  metadata,
  onDemo,
  children,
}) {
  const shellRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!shellRef.current) return;

    // Gentle, floating entrance with soft easing
    const tl = gsap.timeline({
      defaults: { ease: "sine.inOut", duration: 0.8 },
    });

    if (topStrip) {
      tl.fromTo(
        `.${styles.topStrip}`,
        { opacity: 0, y: -4 },
        { opacity: 1, y: 0 },
        0
      );
    }

    if (eyebrow) {
      tl.fromTo(
        `.${styles.headerEyebrow}`,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0 },
        0.1
      );
    }

    /* Per-letter title reveal — softer stagger, gentle rotation */
    const letters = shellRef.current.querySelectorAll(`.${styles.headLetter}`);
    if (letters.length > 0) {
      tl.to(
        letters,
        {
          opacity: 1,
          y: "0%",
          rotateX: 0,
          duration: 0.9,
          stagger: 0.03,
          ease: "sine.inOut",
        },
        0.2
      );
    }

    if (subtitle) {
      tl.fromTo(
        `.${styles.headerSub}`,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0 },
        0.6
      );
    }

    if (metadata && metadata.length > 0) {
      tl.fromTo(
        `.${styles.specCell}`,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, stagger: 0.08 },
        0.8
      );
    }

    /* If a sidebar is present in children, fade it in smoothly */
    const sidebars = shellRef.current.querySelectorAll(`.${styles.sidebar}`);
    if (sidebars.length > 0) {
      tl.fromTo(sidebars, { opacity: 0, x: -6 }, { opacity: 1, x: 0 }, 0.9);
    }
  }, [topStrip, eyebrow, title, subtitle, metadata]);

  return (
    <div className={styles.page}>
      <Nav onDemo={onDemo} />

      {topStrip && (
        <div className={styles.topStrip}>
          <div className={styles.topStripInner}>
            <span className={styles.topStripDot} />
            <span className={styles.topStripText}>{topStrip.text}</span>
            {topStrip.link && (
              <a href={topStrip.link.href} className={styles.topStripLink}>
                {topStrip.link.text}
              </a>
            )}
          </div>
        </div>
      )}

      <div
        ref={shellRef}
        className={`${styles.shell} ${!topStrip ? styles.shellNoStrip : ""}`}
      >
        <header className={styles.header}>
          {eyebrow && <div className={styles.headerEyebrow}>{eyebrow}</div>}
          {title && (
            <h1 className={styles.headerTitle}>
              <SplitText
                text={title}
                classNames={{
                  line: styles.headLine,
                  letter: styles.headLetter,
                  space: styles.headSpace,
                }}
              />
            </h1>
          )}
          {subtitle && <p className={styles.headerSub}>{subtitle}</p>}
          {metadata && metadata.length > 0 && (
            <div className={styles.specGrid}>
              {metadata.map((m) => (
                <div key={m.label} className={styles.specCell}>
                  <div className={styles.specLabel}>{m.label}</div>
                  <div className={styles.specValue}>{m.value}</div>
                </div>
              ))}
            </div>
          )}
        </header>

        {children}
      </div>

      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   useResourceSectionAnimations
   ───────────────────────────────────────────────────────────────────────
   Hook for Read pages. Scans the container for .section elements and
   applies scroll-triggered sequential fade-up animations to each section.
   
   Sections animate one after another — each section's content fades in
   only after the previous section's last element has started animating.
   This creates a flowing cascade down the page as the user scrolls.
   
   Usage:
     const contentRef = useRef(null);
     useResourceSectionAnimations(contentRef);
     return <div ref={contentRef}>...</div>;
   ═══════════════════════════════════════════════════════════════════════ */
export function useResourceSectionAnimations(containerRef) {
  useEffect(() => {
    if (!containerRef.current) return;
    const sections = containerRef.current.querySelectorAll(
      `.${styles.section}`
    );

    if (!sections.length) return;

    // Create a single master timeline for sequential section animations
    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: sections[0],
        start: "top 82%",
        end: "bottom bottom",
        scrub: false,
      },
    });

    sections.forEach((section) => {
      const targets = section.querySelectorAll(
        `.${styles.h2}, .${styles.h3}, .${styles.p}, .${styles.ul}, .${styles.codeBlock}, .${styles.codeDuo}, .${styles.dl}, .${styles.inlineNote}`
      );

      if (!targets.length) return;

      // Each section starts with a small delay after the previous section
      // The stagger within each section creates internal flow
      masterTl.fromTo(
        targets,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "sine.inOut",
        },
        "+=0.2" // Small gap between sections for breathing room
      );
    });

    return () => {
      if (masterTl.scrollTrigger) masterTl.scrollTrigger.kill();
    };
  }, [containerRef]);
}

/* ═══════════════════════════════════════════════════════════════════════
   useResourceBrowseAnimations
   ───────────────────────────────────────────────────────────────────────
   Hook for Browse pages (Blog list, Help list). Staggers items up
   on scroll with sequential flow.
   ═══════════════════════════════════════════════════════════════════════ */
export function useResourceBrowseAnimations(containerRef) {
  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll(
      `.${styles.browseItem}`
    );
    if (!items.length) return;

    const tween = gsap.fromTo(
      items,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.1, // Slightly wider stagger for list items to feel more sequential
        ease: "sine.inOut",
        scrollTrigger: {
          trigger: items[0],
          start: "top 88%",
        },
      }
    );

    return () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
    };
  }, [containerRef]);
}
