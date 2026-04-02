"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CornerButton from "@/components/shared/CornerButton";
import styles from "./FinalCTA.module.css";

gsap.registerPlugin(ScrollTrigger);

const H_LINES = [
  [
    { t: "Your", a: false },
    { t: "warehouse", a: false },
    { t: "should", a: false },
  ],
  [
    { t: "evolve", a: true },
    { t: "with", a: false },
    { t: "it.", a: false },
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
          {H_LINES.map((line, li) => (
            <span key={li} className={styles.headLine}>
              {line.map((w, wi) => (
                <span key={wi}>
                  <span className="word">
                    {w.t.split("").map((c, ci) => (
                      <span
                        key={`${wi}-${ci}`}
                        className={`${styles.headLetter} ${
                          w.a ? styles.headLetterAccent : ""
                        }`}
                      >
                        {c}
                      </span>
                    ))}
                  </span>
                  {wi < line.length - 1 && (
                    <span className={styles.headSpace} />
                  )}
                </span>
              ))}
            </span>
          ))}
        </h2>
        <div className={styles.descWrap}>
          {DESC_LINES.map((line, li) => (
            <span key={li} className={styles.descLine}>
              {line.split(" ").map((word, wi, arr) => (
                <span key={wi}>
                  <span className="word">
                    {word.split("").map((c, ci) => (
                      <span key={ci} className={styles.descLetter}>
                        {c}
                      </span>
                    ))}
                  </span>
                  {wi < arr.length - 1 && <span className={styles.descSpace} />}
                </span>
              ))}
            </span>
          ))}
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
