"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
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

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    if (topStrip) {
      tl.fromTo(
        `.${styles.topStrip}`,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.4 },
        0
      );
    }

    if (eyebrow) {
      tl.fromTo(
        `.${styles.headerEyebrow}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45 },
        0.1
      );
    }

    /* Per-letter title reveal — brand signature, kept across all types */
    const letters = shellRef.current.querySelectorAll(`.${styles.headLetter}`);
    if (letters.length > 0) {
      tl.to(
        letters,
        {
          opacity: 1,
          y: "0%",
          rotateX: 0,
          duration: 0.7,
          stagger: 0.022,
        },
        0.2
      );
    }

    if (subtitle) {
      tl.fromTo(
        `.${styles.headerSub}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5 },
        0.5
      );
    }

    if (metadata && metadata.length > 0) {
      tl.fromTo(
        `.${styles.specCell}`,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.06 },
        0.65
      );
    }

    /* If a sidebar is present in children, fade it in */
    const sidebars = shellRef.current.querySelectorAll(`.${styles.sidebar}`);
    if (sidebars.length > 0) {
      tl.fromTo(
        sidebars,
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.5 },
        0.8
      );
    }
  }, [topStrip, eyebrow, title, subtitle, metadata]);

  /* Per-letter title rendering helper */
  const renderTitle = (text) => {
    const words = text.split(" ");
    return (
      <span className={styles.headLine}>
        {words.map((word, wi) => (
          <span key={wi}>
            <span className="word">
              {word.split("").map((c, ci) => (
                <span key={`${wi}-${ci}`} className={styles.headLetter}>
                  {c}
                </span>
              ))}
            </span>
            {wi < words.length - 1 && <span className={styles.headSpace} />}
          </span>
        ))}
      </span>
    );
  };

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
            <h1 className={styles.headerTitle}>{renderTitle(title)}</h1>
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
   applies scroll-triggered fade-up animations to each section's content
   children (h2, p, codeBlock, codeDuo, dl, inlineNote, h3).
   
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
    const triggers = [];

    sections.forEach((section) => {
      const targets = section.querySelectorAll(
        `.${styles.h2}, .${styles.h3}, .${styles.p}, .${styles.codeBlock}, .${styles.codeDuo}, .${styles.dl}, .${styles.inlineNote}`
      );
      if (!targets.length) return;

      const tween = gsap.fromTo(
        targets,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
          },
        }
      );
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    });

    return () => triggers.forEach((t) => t.kill());
  }, [containerRef]);
}

/* ═══════════════════════════════════════════════════════════════════════
   useResourceBrowseAnimations
   ───────────────────────────────────────────────────────────────────────
   Hook for Browse pages (Blog list, Help list). Scans the container for
   .browseItem elements and staggers them up on scroll.
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
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power3.out",
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
