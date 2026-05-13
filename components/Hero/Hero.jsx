"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAnimationPaused } from "@/lib/AnimationContext";
import CornerButton from "@/components/shared/CornerButton";
import SplitText from "@/components/shared/SplitText";
import styles from "./Hero.module.css";

gsap.registerPlugin(ScrollTrigger);

const HEADLINE_LINES = [
  {
    words: [
      { text: "The", accent: false },
      { text: "complete", accent: false },
      { text: "solution", accent: false },
      { text: "for", accent: false },
    ],
  },
  {
    words: [
      { text: "warehouse", accent: true },
      { text: "intelligence", accent: true },
    ],
  },
];

// Split description into visual lines for the overflow-hidden mask
const DESC_LINES = [
  "Nimbus unifies scanning, spatial mapping,",
  "and predictive AI into a single platform that",
  "learns your operation and optimizes it in real time.",
];

const STATS = [
  { end: 200, prefix: "<", suffix: "ms", label: "AI scan speed" },
  { end: 99.9, prefix: "", suffix: "%", label: "Uptime SLA", decimals: 1 },
  { end: 70, prefix: "", suffix: "%", label: "Faster counts" },
];

export default function Hero({ onDemo }) {
  const videoRef = useRef(null);
  const videoBgRef = useRef(null);
  const scrollDimRef = useRef(null);
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const ctasRef = useRef(null);
  const sideRef = useRef(null);
  const statRefs = useRef([]);
  const valRefs = useRef([]);
  const { paused } = useAnimationPaused();

  // Pause/resume video
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.play().catch(() => {});

    const master = gsap.timeline({ defaults: { ease: "power4.out" } });

    // Video fade
    master.to(
      videoRef.current,
      { opacity: 0.3, duration: 1.5, ease: "power2.inOut" },
      0
    );

    // Per-letter headline
    const hLetters = document.querySelectorAll(`.${styles.letter}`);
    master.to(
      hLetters,
      {
        opacity: 1,
        y: "0%",
        rotateX: 0,
        duration: 0.8,
        stagger: 0.018,
        ease: "power4.out",
      },
      0.3
    );

    // Per-letter description — starts at same time as headline
    const dLetters = document.querySelectorAll(`.${styles.descLetter}`);
    master.to(
      dLetters,
      {
        opacity: 1,
        y: "0%",
        duration: 0.6,
        stagger: 0.008,
        ease: "power3.out",
      },
      0.3
    );

    // CTAs slide up — after text lands
    master.to(
      ctasRef.current,
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
      },
      1.1
    );

    // Stats — after buttons
    master.to(sideRef.current, { opacity: 1, duration: 0.01 }, 1.4);

    STATS.forEach((stat, i) => {
      const delay = 1.4 + i * 0.35;

      // Stat block fades in + slides
      master.to(
        statRefs.current[i],
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power3.out",
        },
        delay
      );

      // Number counts up
      const counter = { val: 0 };
      const valEl = valRefs.current[i];
      master.to(
        counter,
        {
          val: stat.end,
          duration: 0.6,
          ease: "power2.out",
          onUpdate: () => {
            const v = stat.decimals
              ? counter.val.toFixed(stat.decimals)
              : Math.round(counter.val);
            valEl.textContent = `${stat.prefix}${v}${stat.suffix}`;
          },
        },
        delay
      );
    });

    // Scroll: content floats up + fades
    gsap.to(contentRef.current, {
      y: -100,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "80% top",
        scrub: 1.5,
      },
    });

    // Scroll: video bg shrinks from 1.35 → 1.0
    gsap.to(videoBgRef.current, {
      scale: 1,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    // Scroll: darken the whole section
    gsap.to(scrollDimRef.current, {
      opacity: 0.7,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <section ref={sectionRef} className={styles.hero}>
      <div ref={videoBgRef} className={styles.videoBg}>
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=85"
          className={styles.video}
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className={styles.overlay} />
      </div>
      <div ref={scrollDimRef} className={styles.scrollDim} />

      <div ref={contentRef} className={styles.content}>
        {/* AFTER */}
        <h1 className={styles.headline}>
          <SplitText
            tokens={HEADLINE_LINES.map((line) =>
              line.words.map((w) => ({ t: w.text, a: w.accent }))
            )}
            classNames={{
              line: styles.line,
              letter: styles.letter,
              accent: styles.accentWord,
              space: styles.letterSpace,
            }}
          />
        </h1>
        <p className={styles.desc}>
          <SplitText
            lines={DESC_LINES}
            classNames={{
              line: styles.descLine,
              letter: styles.descLetter,
              space: styles.descSpace,
            }}
          />
        </p>

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
            Watch Overview
          </CornerButton>
        </div>
      </div>

      <div
        ref={sideRef}
        className={`${styles.sideData} hide-mobile`}
        style={{ opacity: 0 }}
      >
        {STATS.map((stat, i) => (
          <div
            key={i}
            ref={(el) => (statRefs.current[i] = el)}
            className={styles.statBlock}
          >
            <div
              ref={(el) => (valRefs.current[i] = el)}
              className={styles.dataVal}
            >
              {stat.prefix}0{stat.suffix}
            </div>
            <div className={styles.dataLabel}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
