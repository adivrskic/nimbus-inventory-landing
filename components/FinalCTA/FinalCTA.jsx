"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CornerButton from "@/components/shared/CornerButton";
import SplitText from "@/components/shared/SplitText";
import styles from "./FinalCTA.module.css";

gsap.registerPlugin(ScrollTrigger);

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
  const sectionRef = useRef(null);
  const bracketTLRef = useRef(null);
  const bracketBRRef = useRef(null);
  const ctasRef = useRef(null);
  const trustRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const hLetters = section.querySelectorAll(`.${styles.headLetter}`);
    const dLetters = section.querySelectorAll(`.${styles.descLetter}`);

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: "top 65%" },
      defaults: { ease: "power4.out" },
    });

    tl.to(bracketTLRef.current, {
      width: 48,
      height: 48,
      opacity: 0.2,
      duration: 0.5,
    })
      .to(
        bracketBRRef.current,
        { width: 48, height: 48, opacity: 0.2, duration: 0.5 },
        "-=0.3"
      )
      .to(
        hLetters,
        { opacity: 1, y: "0%", rotateX: 0, duration: 0.4, stagger: 0.014 },
        "-=0.3"
      )
      .to(
        dLetters,
        {
          opacity: 1,
          y: "0%",
          duration: 0.3,
          stagger: 0.005,
          ease: "power3.out",
        },
        "-=0.2"
      )
      .to(ctasRef.current, { opacity: 1, y: 0, duration: 0.4 }, "-=0.15")
      .to(trustRef.current, { opacity: 1, duration: 0.3 }, "-=0.2");

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className="dot-grid" />
      <div
        ref={bracketTLRef}
        className={`${styles.bracket} ${styles.bracketTL}`}
      />
      <div
        ref={bracketBRRef}
        className={`${styles.bracket} ${styles.bracketBR}`}
      />
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
          <CornerButton variant="primary" onClick={onDemo}>
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
