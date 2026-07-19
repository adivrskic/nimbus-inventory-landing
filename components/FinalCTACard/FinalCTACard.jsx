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
// `secondaryAction` is optional. Pass `{ href, label }` for a navigation
// link (rendered with TransitionLink — the original behavior) or
// `{ onClick, label }` for an action button (e.g. opening the demo modal).
// Either way it gets the same .secondaryLink treatment.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";
import CornerButton from "@/components/shared/CornerButton";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import {
  gsap,
  useGsap,
  DURATION,
  EASE,
  DISTANCE,
  TRIGGER,
  SCRUB,
} from "@/lib/gsap";
import styles from "./FinalCTACard.module.css";

export default function FinalCTACard({
  label,
  title,
  desc,
  primaryAction,
  secondaryAction,
}) {
  const fillRef = useRef(null);

  /* Make the fill layer `inert` via the DOM property. Doing it via a
     ref-effect (rather than the `inert=""` JSX attribute) sidesteps
     React-version differences in how the attribute is recognized. */
  useEffect(() => {
    if (fillRef.current) fillRef.current.inert = true;
  }, []);

  /* Scoped animation context. Returns the ref for the section. */
  const sectionRef = useGsap(({ reduced, scope }) => {
    /* Fade-in. Runs for everyone — gentle, short, no large motion. Under
       reduced-motion it resolves instantly (duration 0, no travel). */
    gsap.fromTo(
      scope,
      { opacity: 0, y: reduced ? 0 : DISTANCE.sm },
      {
        opacity: 1,
        y: 0,
        duration: reduced ? 0 : DURATION.base,
        ease: EASE.out,
        scrollTrigger: { trigger: scope, start: TRIGGER.reveal },
      }
    );

    /* Scroll-tied wipe. Skipped under reduced-motion — the card just stays
       in its base (light) state, which is fully readable. The start/end
       bounds define the wipe's scroll range, so they stay literal; only the
       scrub smoothing comes from the shared SCRUB token. */
    if (!reduced && fillRef.current) {
      gsap.fromTo(
        fillRef.current,
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          ease: EASE.scrub,
          scrollTrigger: {
            trigger: scope,
            /* clamp() — this card closes most marketing pages, so its
               unclamped wipe range can fall below max-scroll and leave
               the wipe stuck partially open. Range starts near the fold
               and resolves by mid-viewport so the gold lands early. */
            start: "clamp(top 92%)",
            end: "clamp(top 45%)",
            scrub: SCRUB,
          },
        }
      );
    }
  });

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
          ) : secondaryAction.onClick ? (
            /* Button variant — for secondaries that trigger an action
               (e.g. opening the demo modal) rather than navigating. Styled
               identically to the link via .secondaryLink (which carries the
               button resets). */
            <button
              type="button"
              className={styles.secondaryLink}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
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
