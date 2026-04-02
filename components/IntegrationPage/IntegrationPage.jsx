"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import { INTEGRATIONS } from "./integrationData";
import styles from "./IntegrationPage.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function IntegrationPage({ slug, onDemo }) {
  const integration = INTEGRATIONS[slug];
  const heroRef = useRef(null);
  const featureRefs = useRef([]);
  const ctaRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!integration) return;
    const hero = heroRef.current;
    if (!hero) return;

    const hTitle = hero.querySelector(`.${styles.title}`);
    const desc = hero.querySelector(`.${styles.heroDesc}`);
    const stats = hero.querySelector(`.${styles.heroStats}`);

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.to(hTitle, { opacity: 1, y: 0, duration: 0.6 }, 0.2)
      .to(desc, { opacity: 1, y: 0, duration: 0.6 }, 0.4)
      .to(stats, { opacity: 1, y: 0, duration: 0.5 }, 0.6);

    featureRefs.current.forEach((card) => {
      if (!card) return;
      gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 80%" },
      });
    });

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
  }, [slug, integration]);

  if (!integration) {
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
            Integration not found
          </h1>
          <Link href="/#integrations" className={styles.backLink}>
            Back to integrations
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Nav onDemo={onDemo} />

      <div ref={heroRef} className={styles.hero}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link href="/#integrations">Integrations</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>
            {integration.title}
          </span>
        </div>

        <div className={styles.gridTag}>
          <div className={styles.gridTagDot} />
          <span>{integration.category}</span>
        </div>

        <h1
          className={styles.title}
          style={{ opacity: 0, transform: "translateY(20px)" }}
        >
          {integration.title}
        </h1>
        <p className={styles.heroDesc}>{integration.desc}</p>

        <div className={styles.heroStats}>
          {integration.stats.map((s, i) => (
            <div key={i}>
              <div className={styles.heroStatVal}>{s.val}</div>
              <div className={styles.heroStatLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.gridSection}>
        <div className={styles.gridTag}>
          <div className={styles.gridTagDot} />
          <span>Key features</span>
        </div>
        <h2 className={styles.gridTitle}>What the integration does.</h2>
        <div className={styles.grid}>
          {integration.features.map((f, i) => (
            <div
              key={i}
              ref={(el) => (featureRefs.current[i] = el)}
              className={styles.gridCard}
            >
              <div className={styles.gridCardNum}>0{i + 1}</div>
              <h3 className={styles.gridCardTitle}>{f.title}</h3>
              <p className={styles.gridCardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div ref={ctaRef} className={styles.ctaBanner}>
        <h2 className={styles.ctaTitle}>
          Connect {integration.title} to Nimbus
        </h2>
        <p className={styles.ctaDesc}>
          Get a personalized demo showing how the {integration.title}{" "}
          integration works for your operation.
        </p>
        <div className={styles.ctaBtn}>
          <CornerButton variant="primary" onClick={onDemo}>
            Request a Demo
          </CornerButton>
        </div>
        <Link href="/#integrations" className={styles.backLink}>
          Back to all integrations
        </Link>
      </div>

      <Footer />
    </div>
  );
}
