"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import useGlowCards from "@/lib/useGlowCards";
import SplitText from "@/components/shared/SplitText";
import FinalCTACard from "@/components/FinalCTACard/FinalCTACard";
import { useDemo } from "@/lib/DemoContext";
import { INDUSTRIES } from "./industryData";
import styles from "./IndustryPage.module.css";

gsap.registerPlugin(ScrollTrigger);

const WORKFLOW = [
  {
    label: "Receive",
    desc: "Goods arrive. Scan to verify quantities against PO, flag discrepancies instantly.",
  },
  {
    label: "Putaway",
    desc: "AI suggests optimal locations based on velocity, weight, and spatial proximity.",
  },
  {
    label: "Pick",
    desc: "Orders come in. Nautilus generates the shortest pick route across your floor.",
  },
  {
    label: "Pack & Ship",
    desc: "Verify items by scan, print labels, push tracking to sales channels.",
  },
];

export default function IndustryPage({ slug }) {
  /* Demo modal lives in app/layout.js via DemoHost — pull the opener
     from context instead of expecting a prop the wrapper never passes. */
  const { openDemo } = useDemo();

  const industry = INDUSTRIES.find((i) => i.slug === slug);
  const pageRef = useRef(null);
  const heroRef = useRef(null);

  /* Two glow-cards contexts — workflow grid (§02) and cross-link grid.
     Each container needs its own ref so mousemove tracking and 3D tilt
     are scoped per-grid. */
  const workflowGlowRef = useGlowCards();
  const crossGlowRef = useGlowCards();

  const indexNum = industry
    ? INDUSTRIES.findIndex((i) => i.slug === slug) + 1
    : 0;
  const totalIndustries = INDUSTRIES.length;

  /* 3 other industries to cross-link */
  const others = industry
    ? INDUSTRIES.filter((i) => i.slug !== slug).slice(0, 3)
    : [];

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!industry || !heroRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    /* Hero index strip */
    tl.fromTo(
      `.${styles.heroIndex}`,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.4 },
      0
    );

    /* Per-letter title */
    const letters = heroRef.current.querySelectorAll(`.${styles.heroLetter}`);
    tl.to(
      letters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.75, stagger: 0.018 },
      0.15
    );

    /* Sub */
    tl.fromTo(
      `.${styles.heroSub}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55 },
      0.55
    );

    /* CTAs */
    tl.fromTo(
      `.${styles.heroCTA}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5 },
      0.7
    );

    /* Sections — each section's content fades up, the big numeral scales-and-fades */
    if (!pageRef.current) return;
    const sections = pageRef.current.querySelectorAll(`.${styles.section}`);
    sections.forEach((sec) => {
      const num = sec.querySelector(`.${styles.sectionNum}`);
      const content = sec.querySelectorAll(
        `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.pair}, .${styles.workflowStep}, .${styles.stat}, .${styles.quote}`
      );

      if (num) {
        gsap.fromTo(
          num,
          { opacity: 0, x: -20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: sec, start: "top 80%" },
          }
        );
      }
      if (content.length > 0) {
        gsap.fromTo(
          content,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.07,
            ease: "power3.out",
            scrollTrigger: { trigger: sec, start: "top 78%" },
          }
        );
      }
    });

    /* Cross-link cards */
    gsap.fromTo(
      `.${styles.crossCard}`,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: `.${styles.crossLinks}`,
          start: "top 80%",
        },
      }
    );

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [slug, industry]);

  if (!industry) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <div className={styles.notFoundLabel}>404</div>
          <h1>Industry not found.</h1>
          <TransitionLink href="/" className={styles.backLink}>
            ← Back to home
          </TransitionLink>
        </div>
        <Footer />
      </div>
    );
  }

  /* Pair challenges with solutions by index */
  const pairs = industry.challenges.map((ch, i) => ({
    challenge: ch,
    solution: industry.solutions[i],
  }));

  return (
    <div ref={pageRef} className={styles.page}>
      {/* ── HERO ── */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroIndex}>
          <span>Industries</span>
          <span className={styles.heroIndexDot} />
          <span>
            {String(indexNum).padStart(2, "0")} /{" "}
            {String(totalIndustries).padStart(2, "0")}
          </span>
          <span className={styles.heroIndexDot} />
          <span className={styles.heroIndexCategory}>{industry.title}</span>
        </div>

        <h1 className={styles.heroTitle}>
          <SplitText
            lines={industry.headline}
            accentWord={industry.accentWord}
            classNames={{
              line: styles.heroLine,
              lineInner: styles.heroLineInner,
              letter: styles.heroLetter,
              accent: styles.heroLetterAccent,
              space: styles.heroSpace,
            }}
          />
        </h1>

        <p className={styles.heroSub}>{industry.heroDesc}</p>

        <div className={styles.heroCTA}>
          <CornerButton onClick={openDemo}>Talk to our team</CornerButton>
          <TransitionLink href="/pricing" className={styles.heroSecondary}>
            See pricing →
          </TransitionLink>
        </div>
      </section>

      {/* ── 01 · THE FIT ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          01
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>The fit</div>
          <h2 className={styles.sectionTitle}>
            Every industry has its quirks. Here are yours.
          </h2>
          <p className={styles.sectionDesc}>
            We&apos;ve mapped the operational quirks of{" "}
            {industry.title.toLowerCase()} against Nautilus capabilities. Each
            challenge here pairs with how we handle it.
          </p>

          <div className={styles.pairs}>
            {pairs.map((pair, i) => (
              <div key={i} className={styles.pair}>
                <div className={styles.pairChallenge}>
                  <div className={styles.pairLabel}>The challenge</div>
                  <h3 className={styles.pairTitle}>{pair.challenge.title}</h3>
                  <p className={styles.pairText}>{pair.challenge.desc}</p>
                </div>
                <div className={styles.pairDivider}>
                  <span className={styles.pairArrow}>→</span>
                </div>
                <div className={styles.pairSolution}>
                  <div className={styles.pairLabelAccent}>
                    How Nautilus handles it
                  </div>
                  {pair.solution && (
                    <>
                      <div className={styles.pairStatRow}>
                        <span className={styles.pairStatVal}>
                          {pair.solution.stat}
                        </span>
                        <span className={styles.pairStatLabel}>
                          {pair.solution.statLabel}
                        </span>
                      </div>
                      <h3 className={styles.pairTitle}>
                        {pair.solution.title}
                      </h3>
                      <p className={styles.pairText}>{pair.solution.desc}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 02 · THE WORKFLOW ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          02
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>The workflow</div>
          <h2 className={styles.sectionTitle}>From dock to door.</h2>
          <p className={styles.sectionDesc}>
            Every action a {industry.title.toLowerCase()} warehouse takes,
            mapped to a Nautilus flow — running on phones, tablets, or rugged
            scanners.
          </p>

          {/* Workflow grid is now a glow-cards container.
              Each step gets the glow-card outer/inner pattern. */}
          <div
            ref={workflowGlowRef}
            className={`${styles.workflow} glow-cards`}
          >
            {WORKFLOW.map((w, i) => (
              <div key={i} className={`${styles.workflowStep} glow-card`}>
                <div className="glow-card-border" />
                <div
                  className={`${styles.workflowStepInner} glow-card-content`}
                >
                  <div className={styles.workflowStepNum}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h4 className={styles.workflowStepTitle}>{w.label}</h4>
                  <p className={styles.workflowStepDesc}>{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 03 · BY THE NUMBERS ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          03
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>By the numbers</div>
          <h2 className={styles.sectionTitle}>What customers see.</h2>
          <p className={styles.sectionDesc}>
            Averages across {industry.title} customers in their first 12 months.
          </p>

          <div className={styles.stats}>
            {industry.stats.map((s, i) => (
              <div key={i} className={styles.stat}>
                <div className={styles.statVal}>{s.val}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CROSS-LINKS — glow-cards container ── */}
      <section className={styles.crossLinks}>
        <div className={styles.crossLinksLabel}>
          Industries similar to yours
        </div>
        <div
          ref={crossGlowRef}
          className={`${styles.crossLinksGrid} glow-cards`}
        >
          {others.map((o) => (
            <TransitionLink
              key={o.slug}
              href={`/industry/${o.slug}`}
              className={`${styles.crossCard} glow-card`}
            >
              <div className="glow-card-border" />
              <div className={`${styles.crossCardInner} glow-card-content`}>
                <div className={styles.crossCardMeta}>{o.title}</div>
                <div className={styles.crossCardTitle}>
                  {o.headline.join(" ")}
                </div>
                <div className={styles.crossCardArrow}>→</div>
              </div>
            </TransitionLink>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <FinalCTACard
        label="Ready when you are"
        title={`See Nautilus running in a ${industry.title.toLowerCase()} warehouse.`}
        desc="Live demo with a warehouse engineer. 30 minutes. We bring the data, you bring the questions."
        primaryAction={{ onClick: openDemo, label: "Request a demo" }}
        secondaryAction={{ href: "/contact", label: "Or just reach out →" }}
      />

      <Footer />
    </div>
  );
}
