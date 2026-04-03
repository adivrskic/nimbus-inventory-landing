"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import useGlowCards from "@/lib/useGlowCards";
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
    desc: "Orders come in. Nimbus generates the shortest pick route across your floor.",
  },
  {
    label: "Pack & Ship",
    desc: "Verify items by scan, print labels, push tracking to sales channels.",
  },
];

export default function IndustryPage({ slug, onDemo }) {
  const industry = INDUSTRIES.find((i) => i.slug === slug);
  const heroRef = useRef(null);
  const ctaRef = useRef(null);
  const challengeGlow = useGlowCards();
  const solutionGlow = useGlowCards();
  const workflowGlow = useGlowCards();
  const [activeWorkflow, setActiveWorkflow] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!industry) return;
    const hero = heroRef.current;
    if (!hero) return;

    const hLetters = hero.querySelectorAll(`.${styles.heroLetter}`);
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.to(
      hLetters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.5, stagger: 0.016 },
      0.2
    );
    tl.to(
      hero.querySelector(`.${styles.heroDesc}`),
      { opacity: 1, y: 0, duration: 0.6 },
      0.5
    );
    tl.to(
      hero.querySelector(`.${styles.heroStats}`),
      { opacity: 1, y: 0, duration: 0.5 },
      0.7
    );

    document.querySelectorAll("[data-reveal]").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 82%" },
      });
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [slug, industry]);

  if (!industry) {
    return (
      <div className={styles.page}>
        <Nav onDemo={onDemo} />
        <div style={{ padding: "200px 48px", textAlign: "center" }}>
          <h1
            style={{
              color: "var(--white)",
              fontFamily: "var(--display)",
              fontSize: 28,
            }}
          >
            Industry not found
          </h1>
          <TransitionLink href="/" className={styles.backLink}>
            Back to home
          </TransitionLink>
        </div>
        <Footer />
      </div>
    );
  }

  function renderHeadline() {
    return industry.headline.map((line, li) => (
      <span key={li} className={styles.heroLine}>
        {line.split(" ").map((word, wi, arr) => {
          const isAccent =
            word.replace(/[.,]/, "") ===
            industry.accentWord.replace(/[.,]/, "");
          return (
            <span key={wi}>
              <span className="word">
                {word.split("").map((c, ci) => (
                  <span
                    key={ci}
                    className={`${styles.heroLetter} ${
                      isAccent ? styles.heroLetterAccent : ""
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </span>
              {wi < arr.length - 1 && <span className={styles.heroSpace} />}
            </span>
          );
        })}
      </span>
    ));
  }

  // Related industries
  const related = INDUSTRIES.filter((i) => i.slug !== slug).slice(0, 3);

  return (
    <div className={styles.page}>
      <Nav onDemo={onDemo} />

      {/* Hero */}
      <div ref={heroRef} className={styles.hero}>
        <TransitionLink href="/#industries" className={styles.backNav}>
          ← Industries
        </TransitionLink>
        <h1 className="heading-lg">{renderHeadline()}</h1>
        <p className={styles.heroDesc}>{industry.heroDesc}</p>
        <div className={styles.heroStats}>
          {industry.stats.map((s, i) => (
            <div key={i} className={styles.statItem}>
              <div className={styles.heroStatVal}>{s.val}</div>
              <div className={styles.heroStatLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Challenges */}
      <div className={styles.gridSection}>
        <div className={styles.sectionTag}>
          <div className={styles.tagDot} />
          <span>The challenges</span>
        </div>
        <h2 className={styles.gridTitle}>
          What makes {industry.title.toLowerCase()} hard.
        </h2>
        <div ref={challengeGlow} className={`${styles.grid} glow-cards`}>
          {industry.challenges.map((c, i) => (
            <div
              key={i}
              data-reveal=""
              className={`${styles.gridCard} glow-card`}
              style={{ opacity: 0, transform: "translateY(24px)" }}
            >
              <div className="glow-card-border" />
              <div className={`${styles.gridCardInner} glow-card-content`}>
                <div className={styles.gridCardNum}>0{i + 1}</div>
                <h3 className={styles.gridCardTitle}>{c.title}</h3>
                <p className={styles.gridCardDesc}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow */}
      <div className={styles.gridSection}>
        <div className={styles.sectionTag}>
          <div className={styles.tagDot} />
          <span>Warehouse workflow</span>
        </div>
        <h2 className={styles.gridTitle}>
          How Nimbus handles your daily operations.
        </h2>
        <div ref={workflowGlow} className={`${styles.workflowGrid} glow-cards`}>
          {WORKFLOW.map((w, i) => (
            <div
              key={i}
              data-reveal=""
              className={`${styles.workflowCard} glow-card ${
                activeWorkflow === i ? styles.workflowActive : ""
              }`}
              style={{
                opacity: 0,
                transform: "translateY(20px)",
                cursor: "pointer",
              }}
              onMouseEnter={() => setActiveWorkflow(i)}
            >
              <div className="glow-card-border" />
              <div className={`${styles.workflowInner} glow-card-content`}>
                <div className={styles.workflowNum}>0{i + 1}</div>
                <div className={styles.workflowLabel}>{w.label}</div>
                <p className={styles.workflowDesc}>{w.desc}</p>
                {/* Progress connector */}
                {i < WORKFLOW.length - 1 && (
                  <div className={styles.workflowConnector}>
                    <div
                      className={styles.workflowConnectorLine}
                      style={{
                        background:
                          activeWorkflow > i
                            ? "var(--accent)"
                            : "rgba(255,255,255,0.06)",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Solutions */}
      <div className={styles.gridSection}>
        <div className={styles.sectionTag}>
          <div className={styles.tagDot} />
          <span>How Nimbus helps</span>
        </div>
        <h2 className={styles.gridTitle}>Purpose-built for your operation.</h2>
        <div ref={solutionGlow} className={`${styles.grid} glow-cards`}>
          {industry.solutions.map((s, i) => (
            <div
              key={i}
              data-reveal=""
              className={`${styles.gridCard} glow-card`}
              style={{ opacity: 0, transform: "translateY(24px)" }}
            >
              <div className="glow-card-border" />
              <div className={`${styles.gridCardInner} glow-card-content`}>
                <div className={styles.gridCardNum}>0{i + 1}</div>
                <h3 className={styles.gridCardTitle}>{s.title}</h3>
                <p className={styles.gridCardDesc}>{s.desc}</p>
                <div className={styles.gridCardStat}>
                  <span className={styles.gridCardStatVal}>{s.stat}</span>
                  <span className={styles.gridCardStatLabel}>
                    {s.statLabel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROI snapshot */}
      <div
        className={styles.roiSection}
        data-reveal=""
        style={{ opacity: 0, transform: "translateY(20px)" }}
      >
        <div className={styles.sectionTag}>
          <div className={styles.tagDot} />
          <span>ROI snapshot</span>
        </div>
        <div className={styles.roiGrid}>
          {[
            { val: "73%", label: "Fewer mispicks in 90 days" },
            { val: "60%", label: "Faster cycle counts" },
            { val: "2.5x", label: "ROI within first year" },
            { val: "< 1 day", label: "Team onboarding time" },
          ].map((r, i) => (
            <div key={i} className={styles.roiCard}>
              <div className={styles.roiVal}>{r.val}</div>
              <div className={styles.roiLabel}>{r.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Related */}
      <div className={styles.relatedSection}>
        <div className={styles.sectionTag}>
          <div className={styles.tagDot} />
          <span>Other industries</span>
        </div>
        <div className={styles.relatedGrid}>
          {related.map((r) => (
            <TransitionLink
              key={r.slug}
              href={`/industry/${r.slug}`}
              className={styles.relatedCard}
            >
              <div className={styles.relatedTitle}>{r.title}</div>
              <p className={styles.relatedDesc}>{r.heroDesc}</p>
            </TransitionLink>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        ref={ctaRef}
        className={styles.ctaBanner}
        data-reveal=""
        style={{ opacity: 0, transform: "translateY(24px)" }}
      >
        <h2 className={styles.ctaTitle}>{industry.cta}</h2>
        <p className={styles.ctaDesc}>
          See how Nimbus works for {industry.title.toLowerCase()} operations.
        </p>
        <CornerButton variant="primary" onClick={onDemo}>
          Request a Demo
        </CornerButton>
        <TransitionLink href="/#industries" className={styles.backLink}>
          View all industries
        </TransitionLink>
      </div>

      <Footer />
    </div>
  );
}
