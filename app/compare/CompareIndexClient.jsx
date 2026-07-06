"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/gsap";
import Footer from "@/components/Footer/Footer";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import FinalCTACard from "@/components/FinalCTACard/FinalCTACard";
import { useDemo } from "@/lib/DemoContext";
import useGlowCards from "@/lib/useGlowCards";
import SplitText from "@/components/shared/SplitText";
import CheckList from "@/components/shared/CheckList";
import styles from "./CompareIndex.module.css";

gsap.registerPlugin(ScrollTrigger);

/* `competitors` arrives pre-trimmed from the server page
   (app/compare/page.js): slug/name/category/heroDesc plus the first 3
   quick-compare lines as `keyDifferences` — never the full compareData. */
export default function CompareIndexClient({ competitors }) {
  /* All compare-index CTAs are migration conversations — visitors here
     are evaluating Nautilus against an existing tool. */
  const { openDemo } = useDemo();

  const pageRef = useRef(null);
  const heroRef = useRef(null);

  /* Glow-card hover context for the grid. */
  const gridRef = useGlowCards();

  /* ── Animations — uniform with IndustryPage ──────────────────────────
     Hero intro reads strictly top-to-bottom (eyebrow -> title letters ->
     subtitle), each step anchored to the END of the previous one (">" with
     a small negative overlap) rather than a fixed start time, so the lower
     elements never resolve before the per-letter title does.

     The card grid reveal is gated behind the hero intro: cards visible on
     initial load are QUEUED and released the moment the intro completes;
     if the grid is scrolled to later it plays immediately. Removes the
     initial-viewport race without delaying below-fold content. */
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!heroRef.current || !pageRef.current) return;

    /* Reduced motion: jump hero + grid straight to visible, skip the
       choreography. SplitText keeps the sr-only flat headline. */
    if (prefersReducedMotion()) {
      gsap.set(heroRef.current.querySelectorAll(`.${styles.heroLetter}`), {
        opacity: 1,
        y: "0%",
        rotateX: 0,
      });
      gsap.set(
        pageRef.current.querySelectorAll(
          `.${styles.heroEyebrow}, .${styles.heroSub}, .${styles.card}`
        ),
        { opacity: 1, y: 0 }
      );
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    /* Eyebrow */
    tl.fromTo(
      `.${styles.heroEyebrow}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.4 },
      0
    );

    /* Per-letter title — starts just as the eyebrow lands. */
    const letters = heroRef.current.querySelectorAll(`.${styles.heroLetter}`);
    tl.to(
      letters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.75, stagger: 0.018 },
      ">-0.05"
    );

    /* Subtitle — anchored to the END of the title stagger. */
    tl.fromTo(
      `.${styles.heroSub}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55 },
      ">-0.2"
    );

    /* ── Gate the grid reveal behind the hero intro ── */
    let cancelled = false;
    let introDone = false;
    const queued = [];
    const runWhenIntroDone = (fn) => (introDone ? fn() : queued.push(fn));
    tl.eventCallback("onComplete", () => {
      if (cancelled) return;
      introDone = true;
      queued.forEach((fn) => fn());
      queued.length = 0;
    });
    const gatedReveal = (targets, fromVars, toVars, trigger, start) => {
      if (!trigger) return;
      const tween = gsap.fromTo(targets, fromVars, { ...toVars, paused: true });
      ScrollTrigger.create({
        trigger,
        start,
        once: true,
        onEnter: () => runWhenIntroDone(() => tween.play()),
      });
    };

    /* Competitor cards — same stagger/feel as the Industry cross-link grid. */
    const grid = pageRef.current.querySelector(`.${styles.grid}`);
    gatedReveal(
      `.${styles.card}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" },
      grid,
      "top 80%"
    );

    return () => {
      cancelled = true;
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={pageRef} className={styles.page}>
      {/* ── HERO ── */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroEyebrow}>Compare</div>
        <h1 className={styles.heroTitle}>
          <SplitText
            text="Compare Nautilus to the alternatives."
            accentWord="alternatives"
            classNames={{
              line: styles.heroLine,
              letter: styles.heroLetter,
              accent: styles.heroLetterAccent,
              space: styles.heroSpace,
            }}
          />
        </h1>
        <p className={styles.heroSub}>
          Honest side-by-side comparisons against the WMS platforms teams
          evaluate alongside Nautilus. Each one includes a feature matrix and a
          note on when the alternative is actually the better fit.
        </p>
      </section>

      {/* ── COMPETITOR CARDS ── */}
      <section ref={gridRef} className={`${styles.grid} glow-cards`}>
        {competitors.map((c, i) => (
          <TransitionLink
            key={c.slug}
            href={`/compare/${c.slug}`}
            className={`${styles.card} glow-card`}
          >
            <div className="glow-card-border" />
            <div className={`${styles.cardInner} glow-card-content`}>
              <div className={styles.cardHead}>
                <span className={styles.cardVs}>vs</span>
                <span className={styles.cardName}>{c.name}</span>
              </div>

              <div className={styles.cardCategory}>{c.category}</div>

              <p className={styles.cardDesc}>{c.heroDesc}</p>

              <div className={styles.cardDivider} />

              <div className={styles.cardKeysLabel}>Key differences</div>
              <CheckList
                items={c.keyDifferences}
                marker="check"
                tone="strong"
              />

              <div className={styles.cardFoot}>
                <span className={styles.cardFootText}>
                  Read the full comparison
                </span>
                <span className={styles.cardFootArrow}>→</span>
              </div>

              {/* Card index number — small detail in top right */}
              <div className={styles.cardIndex}>
                {String(i + 1).padStart(2, "0")} /{" "}
                {String(competitors.length).padStart(2, "0")}
              </div>
            </div>
          </TransitionLink>
        ))}
      </section>

      {/* ── OUTRO ── */}
      <FinalCTACard
        label="Not seeing your vendor?"
        title="We'll run the comparison live."
        desc="Tell us what you're evaluating against. We'll put together a tailored side-by-side using your real requirements and walk you through it in 30 minutes."
        primaryAction={{
          onClick: () => openDemo("migration"),
          label: "Book a comparison call",
        }}
        secondaryAction={{
          href: "/calculator",
          label: "Or run the ROI numbers →",
        }}
      />

      <Footer />
    </div>
  );
}
