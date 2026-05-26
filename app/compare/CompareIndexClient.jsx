"use client";
import { useEffect } from "react";
import Footer from "@/components/Footer/Footer";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import FinalCTACard from "@/components/FinalCTACard/FinalCTACard";
import { useDemo } from "@/lib/DemoContext";
import useGlowCards from "@/lib/useGlowCards";
import SplitText from "@/components/shared/SplitText";
import {
  gsap,
  useGsap,
  useReveal,
  DURATION,
  STAGGER,
  DISTANCE,
} from "@/lib/gsap";
import { COMPETITORS, COMPARE_SLUGS } from "./[slug]/compareData";
import styles from "./CompareIndex.module.css";

export default function CompareIndexClient() {
  /* All compare-index CTAs are migration conversations — visitors here
     are evaluating Nautilus against an existing tool. */
  const { openDemo } = useDemo();

  const competitors = COMPARE_SLUGS.map((slug) => ({
    slug,
    ...COMPETITORS[slug],
  }));

  /* Scroll reset is page logic, not animation. */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /* Hero intro — deliberate sequence (eyebrow → letters → sub), so the
     timeline escape hatch. Scoped + reduced-aware via useGsap. */
  const heroRef = useGsap(({ reduced, q }) => {
    const tl = gsap.timeline();
    tl.fromTo(
      q(`.${styles.heroEyebrow}`),
      { opacity: 0, y: reduced ? 0 : DISTANCE.sm },
      { opacity: 1, y: 0, duration: reduced ? 0 : DURATION.fast },
      0
    );
    /* Per-letter title — animates TO resting; start shape from .heroLetter CSS. */
    tl.to(
      q(`.${styles.heroLetter}`),
      {
        opacity: 1,
        y: "0%",
        rotateX: 0,
        duration: reduced ? 0 : DURATION.base,
        stagger: reduced ? 0 : STAGGER.tight,
      },
      0.15
    );
    tl.fromTo(
      q(`.${styles.heroSub}`),
      { opacity: 0, y: reduced ? 0 : DISTANCE.sm },
      { opacity: 1, y: 0, duration: reduced ? 0 : DURATION.base },
      0.45
    );
  });

  /* Card grid — plain scroll stagger, declarative. Scope on the page;
     the grid is marked data-reveal="stagger" below. */
  const pageRef = useReveal();

  /* Glow-card hover context for the grid. */
  const gridRef = useGlowCards();

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
      <section
        ref={gridRef}
        data-reveal="stagger"
        className={`${styles.grid} glow-cards`}
      >
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
              <ul className={styles.cardKeys}>
                {c.quickCompare.Nautilus.slice(0, 3).map((point, j) => (
                  <li key={j} className={styles.cardKey}>
                    <span className={styles.cardKeyCheck}>✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

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
