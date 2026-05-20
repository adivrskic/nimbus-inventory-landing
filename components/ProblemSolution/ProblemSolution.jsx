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
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CornerButton from "@/components/shared/CornerButton";
import useGlowCards from "@/lib/useGlowCards";
import styles from "./ProblemSolution.module.css";

gsap.registerPlugin(ScrollTrigger);

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
     editorial sections use on this site. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      gsap.set(
        section.querySelectorAll(
          `.${styles.eyebrow}, .${styles.col}, .${styles.ctaRow}`
        ),
        { opacity: 1, y: 0 }
      );
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: {
        trigger: section,
        start: "top 78%",
        once: true,
      },
    });

    tl.fromTo(
      `.${styles.eyebrow}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45 },
      0
    );

    tl.fromTo(
      `.${styles.col}`,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
      0.15
    );

    tl.fromTo(
      `.${styles.ctaRow}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5 },
      0.55
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
