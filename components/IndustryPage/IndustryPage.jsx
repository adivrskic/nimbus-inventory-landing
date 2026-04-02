"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import { INDUSTRIES } from "./industryData";
import styles from "./IndustryPage.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function IndustryPage({ slug, onDemo }) {
  const industry = INDUSTRIES.find((i) => i.slug === slug);
  const heroRef = useRef(null);
  const challengeRefs = useRef([]);
  const solutionRefs = useRef([]);
  const ctaRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!industry) return;
    const hero = heroRef.current;
    if (!hero) return;

    // Hero letters
    const hLetters = hero.querySelectorAll(`.${styles.heroLetter}`);
    const desc = hero.querySelector(`.${styles.heroDesc}`);
    const stats = hero.querySelector(`.${styles.heroStats}`);

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.to(
      hLetters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.5, stagger: 0.016 },
      0.2
    )
      .to(desc, { opacity: 1, y: 0, duration: 0.6 }, 0.5)
      .to(stats, { opacity: 1, y: 0, duration: 0.5 }, 0.7);

    // Challenge cards stagger
    challengeRefs.current.forEach((card) => {
      if (!card) return;
      gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 80%" },
      });
    });

    // Solution cards stagger
    solutionRefs.current.forEach((card) => {
      if (!card) return;
      gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 80%" },
      });
    });

    // CTA
    if (ctaRef.current) {
      const ctaTitle = ctaRef.current.querySelector(`.${styles.ctaTitle}`);
      const ctaDesc = ctaRef.current.querySelector(`.${styles.ctaDesc}`);
      const ctaBtn = ctaRef.current.querySelector(`.${styles.ctaBtn}`);
      gsap.to(ctaTitle, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        scrollTrigger: { trigger: ctaRef.current, start: "top 70%" },
      });
      gsap.to(ctaDesc, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        scrollTrigger: { trigger: ctaRef.current, start: "top 65%" },
      });
      gsap.to(ctaBtn, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        scrollTrigger: { trigger: ctaRef.current, start: "top 60%" },
      });
    }

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
              fontSize: 32,
            }}
          >
            Industry not found
          </h1>
          <Link href="/" className={styles.backLink}>
            Back to home
          </Link>
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

  return (
    <div className={styles.page}>
      <Nav onDemo={onDemo} />

      <div ref={heroRef} className={styles.hero}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link href="/#industries">Industries</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>
            {industry.title}
          </span>
        </div>

        <h1 className="heading-lg">{renderHeadline()}</h1>
        <p className={styles.heroDesc}>{industry.heroDesc}</p>

        <div className={styles.heroStats}>
          {industry.stats.map((s, i) => (
            <div key={i}>
              <div className={styles.heroStatVal}>{s.val}</div>
              <div className={styles.heroStatLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Challenges */}
      <div className={styles.gridSection}>
        <div className={styles.gridTag}>
          <div className={styles.gridTagDot} />
          <span>The challenges</span>
        </div>
        <h2 className={styles.gridTitle}>
          What makes {industry.title.toLowerCase()} hard.
        </h2>
        <div className={styles.grid}>
          {industry.challenges.map((c, i) => (
            <div
              key={i}
              ref={(el) => (challengeRefs.current[i] = el)}
              className={styles.gridCard}
            >
              <div className={styles.gridCardNum}>0{i + 1}</div>
              <h3 className={styles.gridCardTitle}>{c.title}</h3>
              <p className={styles.gridCardDesc}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.divider}>
        <div className={styles.dividerLine} />
      </div>

      {/* Solutions */}
      <div className={styles.gridSection}>
        <div className={styles.gridTag}>
          <div className={styles.gridTagDot} />
          <span>How Nimbus helps</span>
        </div>
        <h2 className={styles.gridTitle}>Purpose-built for your operation.</h2>
        <div className={styles.grid}>
          {industry.solutions.map((s, i) => (
            <div
              key={i}
              ref={(el) => (solutionRefs.current[i] = el)}
              className={styles.gridCard}
            >
              <div className={styles.gridCardNum}>0{i + 1}</div>
              <h3 className={styles.gridCardTitle}>{s.title}</h3>
              <p className={styles.gridCardDesc}>{s.desc}</p>
              <div className={styles.gridCardStat}>
                <div className={styles.gridCardStatVal}>{s.stat}</div>
                <div className={styles.gridCardStatLabel}>{s.statLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div ref={ctaRef} className={styles.ctaBanner}>
        <h2 className={styles.ctaTitle}>{industry.cta}</h2>
        <p className={styles.ctaDesc}>
          Get a personalized demo showing how Nimbus works for{" "}
          {industry.title.toLowerCase()} operations.
        </p>
        <div className={styles.ctaBtn}>
          <CornerButton variant="primary" onClick={onDemo}>
            Request a Demo
          </CornerButton>
        </div>
        <Link href="/" className={styles.backLink}>
          Back to all industries
        </Link>
      </div>

      <Footer />
    </div>
  );
}
