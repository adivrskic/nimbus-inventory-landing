"use client";

/* ──────────────────────────────────────────────────────────────────────────
   components/ProblemSolution/ProblemSolution.jsx
   ──────────────────────────────────────────────────────────────────────────
   Three-column informational section: Overview / Problem / Solution.

   Cards now use the shared glow-card system (see globals.css + lib/useGlowCards):
     - container has `glow-cards` for the shared hover context
     - each card is a `.glow-card` outer shell + `.glow-card-border` div
       + `.glow-card-content` inner with the actual content
     - useGlowCards binds mousemove tracking + per-card 3D tilt
     - hovering anywhere in the grid lights the gold border-glow on every
       card; mouse position drives where the gradient is brightest per card

   Rules (same as every other glow-card on the site):
     - The outer shell sets shape + entrance opacity only. No background,
       no border, no padding, no manual hover transforms — globals owns
       all of that.
     - The inner element holds padding + flex layout. NEVER set height —
       globals provides `height: calc(100% - 2px); margin: 1px` which is
       the mechanism that creates the 1px gap where the border-glow
       shines through. Overriding height silently kills the effect.

   Previously the Solution card had a gold border-left to mark it as the
   resolution of the narrative. Removed per request — all three cards now
   look identical (consistent with the rest of the site's glow-card grids,
   none of which single out one card). Visual hierarchy comes from the
   single CTA below the grid instead.

   ── Motion ──
   The reveal runs on the shared motion tokens (DURATION, EASE, STAGGER,
   DISTANCE, TRIGGER) re-exported by @/lib/gsap, so it inherits the same
   timing/easing vocabulary as the hero, section reveals, and Nav. gsap is
   imported FROM @/lib/gsap (not "gsap" directly) so ScrollTrigger is
   registered once and gsap.defaults apply. The eyebrow → cards → CTA
   sequence uses the same relative-offset anchoring as the IndustryPage
   hero ("<"/">" with a small negative overlap) rather than fixed start
   times, so the cadence holds regardless of the underlying token values.
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import {
  gsap,
  ScrollTrigger,
  prefersReducedMotion,
  DURATION,
  EASE,
  STAGGER,
  DISTANCE,
  TRIGGER,
} from "@/lib/gsap";
import CornerButton from "@/components/shared/CornerButton";
import useGlowCards from "@/lib/useGlowCards";
import styles from "./ProblemSolution.module.css";

const COLUMNS = [
  {
    key: "overview",
    label: "Overview",
    headline: "From clipboard to command center",
    body: "Nautilus replaces guesswork with intelligence. Three layers of transformation — from identifying the problem, to understanding the cost, to deploying the solution.",
    stats: [
      { value: "92%", label: "Accuracy improvement" },
      { value: "3x", label: "Faster operations" },
      { value: "40%", label: "Cost reduction" },
    ],
  },
  {
    key: "problem",
    label: "Problem",
    headline: "The hidden cost of manual operations",
    body: "Spreadsheets, clipboards, and tribal knowledge. The average warehouse loses $300K annually to misplaced inventory, manual counting errors, and inefficient routing.",
    stats: [
      { value: "$300K", label: "Annual shrinkage cost" },
      { value: "23%", label: "Inventory inaccuracy" },
      { value: "4.2hrs", label: "Daily time wasted" },
    ],
  },
  {
    key: "solution",
    label: "Solution",
    headline: "Intelligence at every shelf",
    body: "Nautilus deploys AI across scanning, spatial mapping, and predictive analytics. Every scan teaches the system. Every movement optimizes the next.",
    stats: [
      { value: "99.7%", label: "Inventory accuracy" },
      { value: "<200ms", label: "AI scan speed" },
      { value: "41%", label: "Less walking distance" },
    ],
  },
];

export default function ProblemSolution({ onDemo }) {
  const sectionRef = useRef(null);

  /* Glow-card wiring for the 3-card grid. useGlowCards returns a ref
     to attach to the .glow-cards container; on mount it walks the
     descendants for `.glow-card` nodes and binds the mousemove
     tracking (radial gradient + 3D tilt). Container-level hover
     lights the gold border-glow on every card at once. */
  const glowRef = useGlowCards();

  /* Mount-only animation — fires once when the section enters the
     viewport, then unbinds. No scrub, no pin, no progress mapping.
     Eyebrow → cards stagger → CTA is the same cadence the other
     editorial sections use on this site, now driven by the shared
     motion tokens so it stays in lockstep with the rest of the site. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (prefersReducedMotion()) {
      gsap.set(
        section.querySelectorAll(`.${styles.col}, .${styles.ctaRow}`),
        { opacity: 1, y: 0 }
      );
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: EASE.out },
      scrollTrigger: {
        trigger: section,
        start: TRIGGER.reveal,
        once: true,
      },
    });

    /* Cards — staggered rise; the centerpiece of the sequence. (The
       old leading eyebrow tween targeted an element this section no
       longer renders — it only produced GSAP "target not found"
       warnings.) */
    tl.fromTo(
      `.${styles.col}`,
      { opacity: 0, y: DISTANCE.sm },
      { opacity: 1, y: 0, duration: DURATION.base, stagger: STAGGER.base },
      0
    );

    /* CTA — follows the last card. */
    tl.fromTo(
      `.${styles.ctaRow}`,
      { opacity: 0, y: DISTANCE.sm },
      { opacity: 1, y: 0, duration: DURATION.fast },
      ">-0.15"
    );

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === section) t.kill();
      });
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.inner}>
        <div ref={glowRef} className={`${styles.grid} glow-cards`}>
          {COLUMNS.map((col) => (
            <article key={col.key} className={`${styles.col} glow-card`}>
              {/* Gold border-glow — gradient follows the mouse across
                  the whole grid. Hidden until container hover. */}
              <div className="glow-card-border" />

              {/* Inner content. Adds glow-card-content for the dark fill
                  + 1px inset where the border-glow shines through. We
                  add styles.colInner for our layout (flex column + pad).
                  Do NOT set height here. */}
              <div className={`${styles.colInner} glow-card-content`}>
                <div className={styles.colLabel}>{col.label}</div>
                <h3 className={styles.colHeadline}>{col.headline}</h3>
                <p className={styles.colBody}>{col.body}</p>
                <div className={styles.stats}>
                  {col.stats.map((s, i) => (
                    <div key={i} className={styles.stat}>
                      <div className={styles.statVal}>{s.value}</div>
                      <div className={styles.statLabel}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.ctaRow}>
          <CornerButton
            variant="primary"
            onClick={() => onDemo(undefined, { source: "problem_solution" })}
          >
            Start your transformation
          </CornerButton>
        </div>
      </div>
    </section>
  );
}
