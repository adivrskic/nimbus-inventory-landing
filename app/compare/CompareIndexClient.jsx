"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import { useDemo } from "@/lib/DemoContext";
import useGlowCards from "@/lib/useGlowCards";
import { COMPETITORS, COMPARE_SLUGS } from "./[slug]/compareData";
import styles from "./CompareIndex.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function CompareIndexClient() {
  const heroRef = useRef(null);
  const pageRef = useRef(null);
  const gridRef = useGlowCards();

  /* All compare-index CTAs are migration conversations — visitors here
     are evaluating Nimbus against an existing tool. */
  const { openDemo } = useDemo();

  const competitors = COMPARE_SLUGS.map((slug) => ({
    slug,
    ...COMPETITORS[slug],
  }));

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!heroRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(
      `.${styles.heroEyebrow}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45 },
      0
    );

    const letters = heroRef.current.querySelectorAll(`.${styles.heroLetter}`);
    tl.to(
      letters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.75, stagger: 0.022 },
      0.15
    );

    tl.fromTo(
      `.${styles.heroSub}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55 },
      0.55
    );

    /* Card stagger on scroll */
    if (!pageRef.current) return;
    const cards = pageRef.current.querySelectorAll(`.${styles.card}`);
    gsap.fromTo(
      cards,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cards[0],
          start: "top 85%",
        },
      }
    );

    gsap.fromTo(
      `.${styles.outro}`,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: { trigger: `.${styles.outro}`, start: "top 85%" },
      }
    );

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  /* Per-letter title: "Compare Nimbus to *the alternatives.*" */
  const renderTitle = () => {
    const parts = [
      { t: "Compare", a: false },
      { t: " ", isSpace: true, a: false },
      { t: "Nimbus", a: false },
      { t: " ", isSpace: true, a: false },
      { t: "to", a: false },
      { t: " ", isSpace: true, a: true },
      { t: "the", a: true },
      { t: " ", isSpace: true, a: true },
      { t: "alternatives.", a: true },
    ];
    return (
      <span className={styles.heroLine}>
        {parts.map((p, pi) => {
          if (p.isSpace) return <span key={pi} className={styles.heroSpace} />;
          return (
            <span key={pi} className="word">
              {p.t.split("").map((c, ci) => (
                <span
                  key={`${pi}-${ci}`}
                  className={`${styles.heroLetter} ${
                    p.a ? styles.heroLetterAccent : ""
                  }`}
                >
                  {c}
                </span>
              ))}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div ref={pageRef} className={styles.page}>
      <Nav />

      {/* ── HERO ── */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroEyebrow}>Compare</div>
        <h1 className={styles.heroTitle}>{renderTitle()}</h1>
        <p className={styles.heroSub}>
          Honest side-by-side comparisons against the WMS platforms teams
          evaluate alongside Nimbus. Each one includes a feature matrix and a
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
              <ul className={styles.cardKeys}>
                {c.quickCompare.nimbus.slice(0, 3).map((point, j) => (
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
      <section className={styles.outro}>
        <div className={styles.outroInner}>
          <div className={styles.outroLabel}>Not seeing your vendor?</div>
          <h2 className={styles.outroTitle}>
            We&apos;ll run the comparison live.
          </h2>
          <p className={styles.outroDesc}>
            Tell us what you&apos;re evaluating against. We&apos;ll put together
            a tailored side-by-side using your real requirements and walk you
            through it in 30 minutes.
          </p>
          <div className={styles.outroButtons}>
            <CornerButton onClick={() => openDemo("migration")}>
              Book a comparison call
            </CornerButton>
            <TransitionLink
              href="/calculator"
              className={styles.outroSecondary}
            >
              Or run the ROI numbers →
            </TransitionLink>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
