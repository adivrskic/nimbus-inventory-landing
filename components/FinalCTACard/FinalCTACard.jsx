// ──────────────────────────────────────────────────────────────────────────
// components/FinalCTACard/FinalCTACard.jsx
// ──────────────────────────────────────────────────────────────────────────
// The card-style final CTA used at the bottom of marketing pages
// (calculator, compare/[slug], industry, integration). Replaces a copy-
// pasted JSX + CSS pattern that previously lived in each of those files'
// modules.
//
// Animation:
//   1. The whole section fades up once on scroll-in (replaces the
//      page-level `.finalCTA` opacity/translate animation each consumer
//      used to own).
//   2. A "fill" layer wipes in from left to right tied directly to scroll
//      position. The fill layer carries both the solid gold background
//      AND dark-text duplicates of the label/title/desc/secondary-link,
//      so the boundary between the light-state text and the dark-state
//      text is the same boundary as the bg wipe — seamlessly.
//
// Interactivity:
//   The fill layer is `inert` + `pointer-events: none`, so its decorative
//   button/link duplicates never receive focus or clicks. The real
//   interactive controls live in the base layer underneath; clicks on the
//   visible-but-decorative gold-state controls pass through to them.
//
// Usage:
//   <FinalCTACard
//     label="Want a precise estimate?"
//     title="Get a number based on your data."
//     desc="30 minutes with a Nautilus engineer..."
//     primaryAction={{
//       onClick: () => openDemo("sales"),
//       label: "Book the modeling call",
//     }}
//     secondaryAction={{ href: "/pricing", label: "Or see pricing →" }}
//   />
//
// `secondaryAction` is optional. The component always uses TransitionLink
// for the secondary, which is what every existing consumer was doing.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CornerButton from "@/components/shared/CornerButton";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import styles from "./FinalCTACard.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function FinalCTACard({
  label,
  title,
  desc,
  primaryAction,
  secondaryAction,
}) {
  const sectionRef = useRef(null);
  const fillRef = useRef(null);

  /* Make the fill layer `inert` via the DOM property. Doing it via a
     ref-effect (rather than the `inert=""` JSX attribute) sidesteps
     React-version differences in how the attribute is recognized. */
  useEffect(() => {
    if (fillRef.current) fillRef.current.inert = true;
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const fill = fillRef.current;
    if (!section || !fill) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /* Fade-in. Runs for everyone — gentle, short, no large motion. */
    const fadeTrigger = gsap.fromTo(
      section,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 85%" },
      }
    );

    /* Scroll-tied wipe. Skipped under reduced-motion — the card just
       stays in its base (light) state, which is fully readable. */
    let wipeTrigger = null;
    if (!reduceMotion) {
      wipeTrigger = gsap.fromTo(
        fill,
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            end: "top 25%",
            scrub: 0.6,
          },
        }
      );
    }

    /* Cleanup — kill ONLY our own triggers, not every ScrollTrigger on
       the page. The consumer pages still own their other animations. */
    return () => {
      fadeTrigger?.scrollTrigger?.kill();
      wipeTrigger?.scrollTrigger?.kill();
    };
  }, []);

  /* Helper to render the content tree. `inverted` swaps the color
     palette; `decorative` replaces interactive elements with non-
     interactive visual duplicates that match their layout exactly. */
  const renderContent = ({ inverted, decorative }) => (
    <div
      className={`${styles.content} ${inverted ? styles.contentInverted : ""}`}
    >
      <div className={styles.label}>{label}</div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.desc}>{desc}</p>
      <div className={styles.buttons}>
        {decorative ? (
          /* Decorative CornerButton — same visual treatment, no handler.
             Lives inside the inert fill layer so it can't be focused or
             clicked; it exists purely so the fill layer's layout matches
             the base layer pixel-for-pixel. */
          <CornerButton variant="primary">{primaryAction.label}</CornerButton>
        ) : (
          <CornerButton variant="primary" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </CornerButton>
        )}
        {secondaryAction &&
          (decorative ? (
            <span className={styles.secondaryLink}>
              {secondaryAction.label}
            </span>
          ) : (
            <TransitionLink
              href={secondaryAction.href}
              className={styles.secondaryLink}
            >
              {secondaryAction.label}
            </TransitionLink>
          ))}
      </div>
    </div>
  );

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.card}>
        {/* Base layer — interactive controls, light text on muted tint. */}
        {renderContent({ inverted: false, decorative: false })}

        {/* Fill layer — solid gold bg + dark text, clipped on the right
            side and scrubbed open as the user scrolls in. aria-hidden +
            inert (set via the effect above) keep it fully out of the
            accessibility tree and tab order. */}
        <div ref={fillRef} className={styles.fillLayer} aria-hidden="true">
          {renderContent({ inverted: true, decorative: true })}
        </div>
      </div>
    </section>
  );
}
