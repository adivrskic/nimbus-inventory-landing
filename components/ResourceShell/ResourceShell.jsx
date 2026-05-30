"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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

/* ───────────────────────────────────────────────────────────────────────
   Shell intro gate
   ───────────────────────────────────────────────────────────────────────
   The shell's header intro plays on mount (in the component below). The
   body-animation hooks (useResourceSectionAnimations /
   useResourceBrowseAnimations) run from the PAGE component — separate from
   the shell — and are scroll-triggered. On a tall header the first section /
   browse item can sit close enough to the fold to satisfy its trigger on
   initial load, which makes the body animate in WHILE the header is still
   playing.

   Because the header intro and the body reveals live in different
   components, they can't share a local timeline the way the detail pages do.
   This tiny module-level gate bridges them (everything that touches it —
   the shell + both hooks — lives in this one file, so the state stays
   contained here):

     - reset()    — called when the shell intro (re)mounts. Also arms a
                    safety timeout so content can never get stuck hidden if
                    the intro is interrupted (fast nav, Strict-Mode remount).
     - resolve()  — called when the intro finishes (or immediately under
                    reduced-motion). Flushes any queued reveals.
     - whenDone() — used by the hooks: run now if the intro is already done,
                    otherwise queue until it is.

   A reveal that fires on initial load is held until the intro completes; a
   section/item scrolled to later still plays immediately. Below-fold content
   is never delayed artificially. */
const introGate = (() => {
  let done = false;
  let waiters = [];
  let safety = null;
  const clearSafety = () => {
    if (safety) {
      clearTimeout(safety);
      safety = null;
    }
  };
  const api = {
    reset() {
      done = false;
      waiters = [];
      clearSafety();
      /* Failsafe: never gate content longer than this, even if the intro's
         onComplete never fires (e.g. the timeline is reverted mid-play). */
      safety = setTimeout(() => api.resolve(), 3000);
    },
    resolve() {
      if (done) return;
      done = true;
      clearSafety();
      const fns = waiters;
      waiters = [];
      fns.forEach((fn) => fn());
    },
    whenDone(fn) {
      if (done) fn();
      else waiters.push(fn);
    },
  };
  return api;
})();

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
 * separately (most use the exported `useResourceSectionAnimations` hook),
 * which now wait for this intro to finish via the introGate above.
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
     scoped to the shell would miss it. The staged sequence now reads strictly
     top-to-bottom: topStrip → eyebrow → title → subtitle → metadata →
     sidebar. The lower three are anchored to the END of the step above them
     (">" with a small negative offset for a gentle overlap) instead of fixed
     times, so the subtitle/metadata can't settle before the per-letter title
     finishes. Under reduced-motion everything is set to its final state at
     once. Either way the introGate is resolved when the intro is done so the
     body reveals can run. */
  const rootRef = useGsap(
    ({ reduced, q }) => {
      introGate.reset();

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
        introGate.resolve();
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: EASE.out, duration: DURATION.base },
        onComplete: () => introGate.resolve(),
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

      /* Subtitle — anchored to the END of the title so it never resolves
         before the headline does. */
      if (subtitle) {
        tl.fromTo(
          q(`.${styles.headerSub}`),
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0 },
          ">-0.15"
        );
      }
      /* Metadata grid — follows the subtitle. */
      if (metadata && metadata.length > 0) {
        tl.fromTo(
          q(`.${styles.specCell}`),
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, stagger: STAGGER.base },
          ">-0.1"
        );
      }

      /* Sidebar (TOC column) — follows the header. */
      const sidebars = q(`.${styles.sidebar}`);
      if (sidebars.length) {
        tl.fromTo(
          sidebars,
          { opacity: 0, x: -6 },
          { opacity: 1, x: 0 },
          ">-0.1"
        );
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

   Now also gated behind the shell's header intro via introGate: if the first
   section is in view on load, the cascade is queued and released the moment
   the header finishes; a page scrolled into later plays at once.

   Wrapped in gsap.context (scoped to the passed-in containerRef) +
   gsap.matchMedia, so cleanup is ctx.revert() and reduced-motion collapses
   movement/duration.

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

        /* Build the cascade paused; ScrollTrigger fires it on section[0]
           entering, but the play is held until the header intro completes. */
        const masterTl = gsap.timeline({ paused: true });

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

        ScrollTrigger.create({
          trigger: sections[0],
          start: TRIGGER.section,
          once: true,
          onEnter: () => introGate.whenDone(() => masterTl.play()),
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef]);
}

/* ═══════════════════════════════════════════════════════════════════════
   useResourceBrowseAnimations
   ───────────────────────────────────────────────────────────────────────
   Hook for Browse pages (Blog list, Help list). Reveals the browse block on
   scroll, gated behind the header intro the same way.

   The reveal includes the .browseHead (count + filter row, when present) as
   its first beat, then staggers the item nodes. The head lives as a SIBLING
   of the list, so it isn't reachable from a ref placed on the list itself —
   we resolve the shared .browse ancestor with closest() and query both the
   head and the items from there. This works whether the page hands us a ref
   on .browseList or on .browse. Head + items are passed as node references,
   so the gsap.context scope (containerRef) still governs cleanup via
   ctx.revert() regardless of where the nodes sit relative to the ref.

   ITEM SELECTOR
   -------------
   By default the item nodes are `.browseItem` (blog list). But that class
   also carries a 2-column card layout, which is wrong for pages whose items
   have their own markup (e.g. Help's full-width category groups). Such pages
   pass `{ itemSelector }` — the resolved CSS-module class name for their own
   item — so they get the gated reveal WITHOUT borrowing the card layout, and
   give that class its own `opacity: 0` start state. Backward compatible: the
   blog list passes nothing and still defaults to `.browseItem`.
   ═══════════════════════════════════════════════════════════════════════ */
export function useResourceBrowseAnimations(containerRef, options = {}) {
  const { itemSelector } = options;

  useEffect(() => {
    if (!containerRef.current) return;

    /* Climb to the shared .browse wrapper so we can see the head, which is a
       sibling of the list. Falls back to the container itself if the ancestor
       isn't found (Help has none — its container is the groups wrapper). */
    const scope =
      containerRef.current.closest(`.${styles.browse}`) || containerRef.current;
    const head = scope.querySelector(`.${styles.browseHead}`);
    const itemClass = itemSelector || styles.browseItem;
    const items = scope.querySelectorAll(`.${itemClass}`);
    if (!head && !items.length) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(MM, (mc) => {
        const reduced = !!mc.conditions.reduced;

        const tl = gsap.timeline({ paused: true });

        /* Head first — the count + filters fade up as the lead-in. */
        if (head) {
          tl.fromTo(
            head,
            { opacity: 0, y: reduced ? 0 : DISTANCE.sm },
            {
              opacity: 1,
              y: 0,
              duration: reduced ? 0 : DURATION.base,
              ease: EASE.out,
            },
            0
          );
        }

        /* Then the item stagger, overlapping slightly with the head so the
           two read as one gesture rather than two separate reveals. */
        if (items.length) {
          tl.fromTo(
            items,
            { opacity: 0, y: reduced ? 0 : DISTANCE.sm },
            {
              opacity: 1,
              y: 0,
              duration: reduced ? 0 : DURATION.base,
              stagger: reduced ? 0 : STAGGER.base,
              ease: EASE.out,
            },
            head ? ">-0.1" : 0
          );
        }

        /* Trigger on the head when present (it sits above the list) so the
           whole block is gated as a unit; fall back to the first item. */
        ScrollTrigger.create({
          trigger: head || items[0],
          start: TRIGGER.reveal,
          once: true,
          onEnter: () => introGate.whenDone(() => tl.play()),
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef, itemSelector]);
}
