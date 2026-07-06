"use client";
import { useEffect, useRef, useState } from "react";
import { INDUSTRIES_INDEX } from "./industriesIndex";
import useGlowCards from "@/lib/useGlowCards";
import { usePageTransition } from "@/components/TransitionProvider/TransitionProvider";
import { useReveal, useHeadlineReveal } from "@/lib/gsap";
import SplitText from "@/components/shared/SplitText";
import styles from "./Industries.module.css";

/* This is a home-page client section, so it deliberately imports the small
   standalone industriesIndex.js (title/desc/slug only) instead of the full
   components/IndustryPage/industryData.js — importing the full module here
   would bundle ~44 KB of detail-page content into the home-page JS chunk.
   The two files must be kept in sync (see the note in industriesIndex.js). */
const INDUSTRIES = INDUSTRIES_INDEX;

const H_LINES = [
  [
    { t: "Built", a: false },
    { t: "for", a: false },
  ],
  [
    { t: "your", a: true },
    { t: "industry", a: true },
  ],
];

export default function Industries() {
  const [active, setActive] = useState(null);
  const isMobileRef = useRef(false);
  const navigateTo = usePageTransition();

  /* Glow-card hover context for the list. */
  const glowRef = useGlowCards();

  /* Headline letters cascade in (timing standardized; entrance shape still
     comes from .headLetter's CSS transform). Attach to the header. */
  const headScope = useHeadlineReveal({ selector: `.${styles.headLetter}` });

  /* Standard scroll reveal scope for the section. The list below is marked
     data-reveal="stagger", so its .item children stagger up on scroll. */
  const revealScope = useReveal();

  function handleEnter(idx) {
    if (isMobileRef.current) return;
    setActive(idx);
  }

  function handleLeave() {
    if (isMobileRef.current) return;
    setActive(null);
  }

  // Check mobile (unchanged — not an animation concern)
  useEffect(() => {
    const check = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <section ref={revealScope} id="industries" className={styles.section}>
      <div ref={headScope} className={styles.header}>
        <h2 className="heading-lg">
          <SplitText
            tokens={H_LINES}
            classNames={{
              line: styles.headLine,
              letter: styles.headLetter,
              accent: styles.headLetterAccent,
              space: styles.headSpace,
            }}
          />
        </h2>
      </div>

      <div className={styles.listWrap}>
        <div
          ref={glowRef}
          data-reveal="stagger"
          className={`${styles.list} glow-cards`}
        >
          {INDUSTRIES.map((ind, i) => (
            <div
              key={i}
              className={`${styles.item} glow-card ${
                active === i ? styles.active : ""
              }`}
              onMouseEnter={() => handleEnter(i)}
              onMouseLeave={handleLeave}
              onClick={() => {
                navigateTo(`/industry/${ind.slug}`);
              }}
              style={{ cursor: "pointer" }}
            >
              <div className={styles.titleWrap}>
                <div className={styles.title}>{ind.title}</div>
                <div className={styles.titleGhost}>{ind.title}</div>
              </div>
              <div className={styles.descWrap}>
                <p className={styles.desc}>{ind.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
