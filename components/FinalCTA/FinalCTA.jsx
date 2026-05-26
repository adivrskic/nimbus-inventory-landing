"use client";
import { useRef } from "react";
import CornerButton from "@/components/shared/CornerButton";
import SplitText from "@/components/shared/SplitText";
import { gsap, useGsap, DURATION, EASE, STAGGER, TRIGGER } from "@/lib/gsap";
import styles from "./FinalCTA.module.css";

const H_LINES = [
  [
    { t: "Take", a: false },
    { t: "your", a: false },
    { t: "warehouse", a: false },
  ],
  [
    { t: "to", a: true },
    { t: "the", a: true },
    { t: "next", a: true },
    { t: "level", a: true },
  ],
];
const DESC_LINES = [
  "AI-powered scanning. Predictive analytics.",
  "Voice commands. Interactive floor maps.",
  "The next generation of warehouse",
  "intelligence starts here.",
];

export default function FinalCTA({ onDemo }) {
  const bracketTLRef = useRef(null);
  const bracketBRRef = useRef(null);
  const ctasRef = useRef(null);
  const trustRef = useRef(null);

  /* Scroll-triggered intro. Deliberate sequence, so the timeline escape
     hatch. Scoped to the section; reduced-motion sets the end state at once. */
  const sectionRef = useGsap(({ reduced, q, scope }) => {
    const hLetters = q(`.${styles.headLetter}`);
    const dLetters = q(`.${styles.descLetter}`);

    if (reduced) {
      gsap.set([bracketTLRef.current, bracketBRRef.current], {
        width: 48,
        height: 48,
        opacity: 0.2,
      });
      gsap.set([...hLetters, ...dLetters], {
        opacity: 1,
        y: "0%",
        rotateX: 0,
      });
      gsap.set([ctasRef.current, trustRef.current], { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: scope, start: TRIGGER.reveal },
      defaults: { ease: EASE.out },
    });

    tl.to(bracketTLRef.current, {
      width: 48,
      height: 48,
      opacity: 0.2,
      duration: DURATION.base,
    })
      .to(
        bracketBRRef.current,
        { width: 48, height: 48, opacity: 0.2, duration: DURATION.base },
        "-=0.3"
      )
      /* Per-letter headline — animates TO resting; start shape from CSS. */
      .to(
        hLetters,
        {
          opacity: 1,
          y: "0%",
          rotateX: 0,
          duration: DURATION.fast,
          stagger: STAGGER.tight,
        },
        "-=0.3"
      )
      /* Description: deliberate fast micro-wash (very tight stagger), kept
         as a bespoke effect rather than a standard reveal. */
      .to(
        dLetters,
        {
          opacity: 1,
          y: "0%",
          duration: 0.3,
          stagger: 0.005,
          ease: EASE.out,
        },
        "-=0.2"
      )
      .to(
        ctasRef.current,
        { opacity: 1, y: 0, duration: DURATION.fast },
        "-=0.15"
      )
      .to(trustRef.current, { opacity: 1, duration: DURATION.fast }, "-=0.2");
  });

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className="dot-grid" />
      <div className={styles.inner}>
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
        <div className={styles.descWrap}>
          <SplitText
            lines={DESC_LINES}
            classNames={{
              line: styles.descLine,
              letter: styles.descLetter,
              space: styles.descSpace,
            }}
          />
        </div>
        <div ref={ctasRef} className={styles.ctas}>
          <CornerButton
            variant="primary"
            onClick={() => onDemo(undefined, { source: "final_cta_home" })}
          >
            Request a Demo
          </CornerButton>
          <CornerButton
            variant="ghost"
            onClick={() => {
              document
                .getElementById("warehouse")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            See How It Works
          </CornerButton>
        </div>
        <p ref={trustRef} className={styles.trust}>
          No credit card required · Set up in under 10 minutes · Cancel anytime
        </p>
      </div>
    </section>
  );
}
