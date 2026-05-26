"use client";

import { useEffect } from "react";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import SplitText from "@/components/shared/SplitText";
import {
  gsap,
  useGsap,
  DURATION,
  EASE,
  STAGGER,
  DISTANCE,
  TRIGGER,
} from "@/lib/gsap";
import styles from "./ResourceShell.module.css";

/* matchMedia conditions reused by the two exported hooks below. (The shell's
   own intro uses useGsap, which already wraps matchMedia internally.) */
const MM = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
};

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
  /* Scroll reset is page logic, not animation. */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /* Mount intro timeline. Scoped to the PAGE wrapper (not the inner shell)
     because the top strip renders as a sibling of the shell — a selector
     scoped to the shell would miss it. The deliberate staged sequence
     (eyebrow → title → subtitle → metadata → sidebar) is preserved; only the
     easing/timing language is standardized to the shared tokens, so resource
     pages now match the rest of the site instead of using their own softer
     curve. Under reduced-motion everything is set to its final state at once. */
  const rootRef = useGsap(
    ({ reduced, q }) => {
      const all = [
        ...q(`.${styles.topStrip}`),
        ...q(`.${styles.headerEyebrow}`),
        ...q(`.${styles.headLetter}`),
        ...q(`.${styles.headerSub}`),
        ...q(`.${styles.specCell}`),
        ...q(`.${styles.sidebar}`),
      ];

      if (reduced) {
        gsap.set(all, { opacity: 1, x: 0, y: 0, rotateX: 0 });
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: EASE.out, duration: DURATION.base },
      });

      if (topStrip) {
        tl.fromTo(
          q(`.${styles.topStrip}`),
          { opacity: 0, y: -4 },
          { opacity: 1, y: 0 },
          0
        );
      }
      if (eyebrow) {
        tl.fromTo(
          q(`.${styles.headerEyebrow}`),
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0 },
          0.1
        );
      }

      /* Per-letter title — standardized headline timing. Animates TO the
         resting state; the hidden start (.headLetter CSS) is preserved. */
      const letters = q(`.${styles.headLetter}`);
      if (letters.length) {
        tl.to(
          letters,
          {
            opacity: 1,
            y: "0%",
            rotateX: 0,
            duration: DURATION.fast,
            stagger: STAGGER.tight,
            ease: EASE.out,
          },
          0.2
        );
      }

      if (subtitle) {
        tl.fromTo(
          q(`.${styles.headerSub}`),
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0 },
          0.5
        );
      }
      if (metadata && metadata.length > 0) {
        tl.fromTo(
          q(`.${styles.specCell}`),
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, stagger: STAGGER.base },
          0.6
        );
      }

      const sidebars = q(`.${styles.sidebar}`);
      if (sidebars.length) {
        tl.fromTo(sidebars, { opacity: 0, x: -6 }, { opacity: 1, x: 0 }, 0.7);
      }
    },
    [topStrip, eyebrow, title, subtitle, metadata]
  );

  return (
    <div ref={rootRef} className={styles.page}>
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
   Hook for Read pages. Scans the container for .section elements and applies
   scroll-triggered sequential fade-up animations to each section — a flowing
   cascade down the page (the whole cascade is gated on the first section
   entering, then plays through; that staged behavior is preserved).

   Now wrapped in gsap.context (scoped to the passed-in containerRef) +
   gsap.matchMedia, so cleanup is ctx.revert() and reduced-motion collapses
   movement/duration. Selectors and the cascade structure are unchanged.

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

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(MM, (mc) => {
        const reduced = !!mc.conditions.reduced;

        const masterTl = gsap.timeline({
          scrollTrigger: {
            trigger: sections[0],
            start: TRIGGER.section,
            end: "bottom bottom",
            scrub: false,
          },
        });

        sections.forEach((section) => {
          const targets = section.querySelectorAll(
            `.${styles.h2}, .${styles.h3}, .${styles.p}, .${styles.ul}, .${styles.codeBlock}, .${styles.codeDuo}, .${styles.dl}, .${styles.inlineNote}`
          );
          if (!targets.length) return;

          masterTl.fromTo(
            targets,
            { opacity: 0, y: reduced ? 0 : DISTANCE.sm },
            {
              opacity: 1,
              y: 0,
              duration: reduced ? 0 : DURATION.base,
              stagger: reduced ? 0 : STAGGER.base,
              ease: EASE.out,
            },
            "+=0.2" // small gap between sections for breathing room
          );
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef]);
}

/* ═══════════════════════════════════════════════════════════════════════
   useResourceBrowseAnimations
   ───────────────────────────────────────────────────────────────────────
   Hook for Browse pages (Blog list, Help list). Staggers .browseItem nodes
   up on scroll. Same modernization as above.
   ═══════════════════════════════════════════════════════════════════════ */
export function useResourceBrowseAnimations(containerRef) {
  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll(
      `.${styles.browseItem}`
    );
    if (!items.length) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(MM, (mc) => {
        const reduced = !!mc.conditions.reduced;
        gsap.fromTo(
          items,
          { opacity: 0, y: reduced ? 0 : DISTANCE.sm },
          {
            opacity: 1,
            y: 0,
            duration: reduced ? 0 : DURATION.base,
            stagger: reduced ? 0 : STAGGER.base,
            ease: EASE.out,
            scrollTrigger: { trigger: items[0], start: TRIGGER.reveal },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef]);
}
