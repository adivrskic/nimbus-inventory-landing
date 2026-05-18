"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CornerButton from "@/components/shared/CornerButton";
import SplitText from "@/components/shared/SplitText";
import styles from "./ProblemSolution.module.css";

gsap.registerPlugin(ScrollTrigger);

const BG_COLORS = ["transparent", "transparent", "transparent"];
const PROGRESS_CLASSES = [
  "progressOnLight",
  "progressOnAccent",
  "progressDark",
];

const PHASES = [
  {
    key: "intro",
    label: "Overview",
    className: styles.phaseSolution,
    headlineLines: [
      [
        { t: "From", a: false },
        { t: "clipboard", a: false },
        { t: "to", a: false },
      ],
      [
        { t: "command", a: true },
        { t: "center", a: true },
      ],
    ],
    bodyLines: [
      "Nimbus replaces guesswork with intelligence.",
      "Three layers of transformation — from identifying",
      "the problem, to understanding the cost, to",
      "deploying the solution.",
    ],
    stats: [
      {
        end: 92,
        prefix: "",
        suffix: "%",
        label: "Accuracy improvement",
        decimals: 0,
      },
      {
        end: 3,
        prefix: "",
        suffix: "x",
        label: "Faster operations",
        decimals: 0,
      },
      {
        end: 40,
        prefix: "",
        suffix: "%",
        label: "Cost reduction",
        decimals: 0,
      },
    ],
  },
  {
    key: "problem",
    label: "Problem",
    className: styles.phaseProblem,
    headlineLines: [
      [
        { t: "The", a: false },
        { t: "hidden", a: false },
        { t: "cost", a: false },
        { t: "of", a: false },
      ],
      [
        { t: "manual", a: true },
        { t: "operations", a: true },
      ],
    ],
    bodyLines: [
      "Spreadsheets, clipboards, and tribal knowledge.",
      "The average warehouse loses $300K annually to",
      "misplaced inventory, manual counting errors,",
      "and inefficient routing.",
    ],
    stats: [
      {
        end: 300,
        prefix: "$",
        suffix: "K",
        label: "Annual shrinkage cost",
        decimals: 0,
      },
      {
        end: 23,
        prefix: "",
        suffix: "%",
        label: "Inventory inaccuracy",
        decimals: 0,
      },
      {
        end: 4.2,
        prefix: "",
        suffix: "hrs",
        label: "Daily time wasted",
        decimals: 1,
      },
    ],
  },
  {
    key: "solution",
    label: "Solution",
    className: styles.phaseIntro,
    headlineLines: [
      [
        { t: "Intelligence", a: false },
        { t: "at", a: false },
      ],
      [
        { t: "every", a: true },
        { t: "shelf", a: true },
      ],
    ],
    bodyLines: [
      "Nimbus deploys AI across scanning, spatial",
      "mapping, and predictive analytics. Every scan",
      "teaches the system. Every movement optimizes",
      "the next.",
    ],
    stats: [
      {
        end: 99.7,
        prefix: "",
        suffix: "%",
        label: "Inventory accuracy",
        decimals: 1,
      },
      {
        end: 200,
        prefix: "<",
        suffix: "ms",
        label: "AI scan speed",
        decimals: 0,
      },
      {
        end: 41,
        prefix: "",
        suffix: "%",
        label: "Less walking distance",
        decimals: 0,
      },
    ],
    cta: true,
  },
];

export default function ProblemSolution({ onDemo }) {
  const sectionRef = useRef(null);
  const pinnedRef = useRef(null);
  const bgRef = useRef(null);
  const dotGridRef = useRef(null);
  const phaseRefs = useRef([]);
  const progressRef = useRef(null);
  const [activePhase, setActivePhase] = useState(0);
  const phaseRef = useRef(0);
  const animatingRef = useRef(false);
  const pinnedActiveRef = useRef(false);

  const showPhase = useCallback((idx) => {
    const el = phaseRefs.current[idx];
    if (!el) return;

    animatingRef.current = true;

    // Make visible
    gsap.set(el, { visibility: "visible", opacity: 1 });

    const tl = gsap.timeline({
      defaults: { ease: "power4.out" },
      onComplete: () => {
        animatingRef.current = false;
      },
    });

    /* Big decorative label fires first — fades up from below, drifts to
       its low-opacity resting state. Slow + early so it's settled in
       place by the time the per-letter headline lands on top of it. */
    const bigLabel = el.querySelector(`.${styles.bigLabel}`);
    if (bigLabel) {
      tl.fromTo(
        bigLabel,
        { opacity: 0, y: 60 },
        { opacity: 0.08, y: 0, duration: 0.9, ease: "power3.out" },
        0
      );
    }

    // Per-letter headline
    const hLetters = el.querySelectorAll(`.${styles.phaseLetter}`);
    tl.fromTo(
      hLetters,
      { opacity: 0, y: "100%", rotateX: 35 },
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.5, stagger: 0.014 },
      0.05
    );

    // Per-letter body
    const bLetters = el.querySelectorAll(`.${styles.phaseBodyLetter}`);
    tl.fromTo(
      bLetters,
      { opacity: 0, y: "110%" },
      {
        opacity: 1,
        y: "0%",
        duration: 0.3,
        stagger: 0.004,
        ease: "power3.out",
      },
      0.15
    );

    // Accent line
    const line = el.querySelector(`.${styles.accentLine}`);
    if (line)
      tl.fromTo(
        line,
        { width: 0, opacity: 0 },
        { width: 60, opacity: 1, duration: 0.4 },
        0.2
      );

    // Stats slide up + count
    const statsWrap = el.querySelector(`.${styles.stats}`);
    const statEls = el.querySelectorAll(`.${styles.statVal}`);
    const phase = PHASES[idx];
    if (statsWrap) {
      tl.fromTo(
        statsWrap,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5 },
        0.3
      );
    }
    if (phase.stats) {
      phase.stats.forEach((stat, i) => {
        const counter = { val: 0 };
        tl.to(
          counter,
          {
            val: stat.end,
            duration: 0.8,
            ease: "power2.out",
            onUpdate: () => {
              const v = stat.decimals
                ? counter.val.toFixed(stat.decimals)
                : Math.round(counter.val);
              if (statEls[i])
                statEls[i].textContent = `${stat.prefix}${v}${stat.suffix}`;
            },
          },
          0.35
        );
      });
    }

    // CTA
    const ctaWrap = el.querySelector(`.${styles.ctaWrap}`);
    if (ctaWrap)
      tl.fromTo(
        ctaWrap,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4 },
        0.45
      );
  }, []);

  const hidePhase = useCallback((idx) => {
    const el = phaseRefs.current[idx];
    if (!el) return Promise.resolve();

    // Kill any running tweens on children
    gsap.killTweensOf(el.querySelectorAll("*"));

    return new Promise((resolve) => {
      gsap.to(el, {
        opacity: 0,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(el, { visibility: "hidden" });
          // Reset letter states
          gsap.set(el.querySelectorAll(`.${styles.phaseLetter}`), {
            opacity: 0,
            y: "100%",
            rotateX: 35,
          });
          gsap.set(el.querySelectorAll(`.${styles.phaseBodyLetter}`), {
            opacity: 0,
            y: "110%",
          });
          gsap.set(el.querySelectorAll(`.${styles.stats}`), {
            opacity: 0,
            y: 16,
          });
          gsap.set(el.querySelectorAll(`.${styles.ctaWrap}`), {
            opacity: 0,
            y: 16,
          });
          gsap.set(el.querySelectorAll(`.${styles.bigLabel}`), {
            opacity: 0,
            y: 60,
          });
          resolve();
        },
      });
    });
  }, []);

  const goToPhase = useCallback(
    async (idx) => {
      if (idx === phaseRef.current || animatingRef.current) return;
      if (idx < 0 || idx >= PHASES.length) return;

      const prev = phaseRef.current;
      phaseRef.current = idx;
      setActivePhase(idx);

      gsap.to(bgRef.current, {
        backgroundColor: BG_COLORS[idx],
        duration: 0.5,
        ease: "power2.inOut",
      });
      gsap.to(dotGridRef.current, {
        opacity: idx === 2 ? 1 : 0,
        duration: 0.3,
      });

      await hidePhase(prev);
      showPhase(idx);
    },
    [showPhase, hidePhase]
  );

  useEffect(() => {
    const section = sectionRef.current;
    const pinned = pinnedRef.current;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: `+=${PHASES.length * 100}vh`,
      pin: pinned,
      anticipatePin: 1,
      onEnter: () => {
        pinnedActiveRef.current = true;
      },
      onLeave: () => {
        pinnedActiveRef.current = false;
      },
      onEnterBack: () => {
        pinnedActiveRef.current = true;
      },
      onLeaveBack: () => {
        pinnedActiveRef.current = false;
      },
    });

    // Show first phase
    setTimeout(() => showPhase(0), 300);

    // Wheel control — blocks ALL scroll while pinned, only releases at boundaries
    let accumulated = 0;
    const THRESHOLD = 80;
    const onWheel = (e) => {
      if (!pinnedActiveRef.current) return;
      e.preventDefault(); // always prevent while pinned
      if (animatingRef.current) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      accumulated += Math.abs(e.deltaY);
      if (accumulated >= THRESHOLD) {
        accumulated = 0;
        const next = phaseRef.current + dir;
        if (next >= 0 && next < PHASES.length) {
          goToPhase(next);
        } else if (next >= PHASES.length) {
          // Past last phase — release pin by scrolling past
          pinnedActiveRef.current = false;
          window.scrollBy({ top: 100, behavior: "smooth" });
        } else if (next < 0) {
          pinnedActiveRef.current = false;
          window.scrollBy({ top: -100, behavior: "smooth" });
        }
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    let touchStartY = 0;
    const onTS = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTM = (e) => {
      if (!pinnedActiveRef.current) return;
      e.preventDefault(); // block scroll while pinned
      if (animatingRef.current) return;
      const dy = touchStartY - e.touches[0].clientY;
      if (Math.abs(dy) > 40) {
        const next = phaseRef.current + (dy > 0 ? 1 : -1);
        if (next >= 0 && next < PHASES.length) {
          goToPhase(next);
          touchStartY = e.touches[0].clientY;
        } else if (next >= PHASES.length) {
          pinnedActiveRef.current = false;
          window.scrollBy({ top: 80, behavior: "smooth" });
        } else if (next < 0) {
          pinnedActiveRef.current = false;
          window.scrollBy({ top: -80, behavior: "smooth" });
        }
      }
    };
    window.addEventListener("touchstart", onTS, { passive: true });
    window.addEventListener("touchmove", onTM, { passive: false });

    return () => {
      st.kill();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchmove", onTM);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [showPhase, goToPhase]);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div ref={pinnedRef} className={styles.pinned}>
        <div
          ref={bgRef}
          className={styles.bgLayer}
          style={{ backgroundColor: BG_COLORS[0] }}
        />
        <div className={styles.glassLayer} />
        <div ref={dotGridRef} className={styles.dotGrid} />

        {PHASES.map((phase, i) => (
          <div
            key={phase.key}
            ref={(el) => (phaseRefs.current[i] = el)}
            className={`${styles.phase} ${phase.className}`}
          >
            {/* Large decorative label — sits behind content via z-index:-1 */}
            <div className={styles.bigLabel}>{phase.label}</div>

            {/* AFTER */}
            <h2 className={styles.headline}>
              <SplitText
                tokens={phase.headlineLines}
                classNames={{
                  line: styles.phaseLine,
                  letter: styles.phaseLetter,
                  accent: styles.headlineAccent,
                  space: styles.phaseSpace,
                }}
              />
            </h2>
            <div className={styles.body}>
              <SplitText
                lines={phase.bodyLines}
                classNames={{
                  line: styles.phaseBodyLine,
                  letter: styles.phaseBodyLetter,
                  space: styles.phaseBodySpace,
                }}
              />
            </div>

            {phase.stats && (
              <div className={styles.stats}>
                {phase.stats.map((stat, si) => (
                  <div key={si} className={styles.stat}>
                    <div className={styles.statVal}>
                      {stat.prefix}0{stat.suffix}
                    </div>
                    <div className={styles.statLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {phase.cta && (
              <div className={styles.ctaWrap}>
                <CornerButton variant="primary" onClick={onDemo}>
                  Start Your Transformation
                </CornerButton>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
