"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import useGlowCards from "@/lib/useGlowCards";
import { INTEGRATIONS } from "./integrationData";
import styles from "./IntegrationPage.module.css";

gsap.registerPlugin(ScrollTrigger);

const SETUP_STEPS = [
  {
    num: "01",
    title: "Connect",
    desc: "Authenticate with one click. Nimbus uses OAuth — no API keys to copy, no credentials to store.",
  },
  {
    num: "02",
    title: "Map",
    desc: "Match your products, locations, and accounts. Nimbus auto-maps by SKU where possible.",
  },
  {
    num: "03",
    title: "Sync",
    desc: "Enable bidirectional sync. Changes in either system reflect in the other within 30 seconds.",
  },
  {
    num: "04",
    title: "Verify",
    desc: "Run the sync health check. Nimbus flags any mismatches before they become problems.",
  },
];

const FAQ = [
  {
    q: "How long does setup take?",
    a: "Most integrations are fully configured in under 10 minutes. Complex ERP connections may take 30 minutes for field mapping.",
  },
  {
    q: "Is the sync real-time?",
    a: "Near real-time — changes propagate within 30 seconds. Batch operations (like bulk imports) queue and process sequentially to avoid conflicts.",
  },
  {
    q: "What happens if the connection drops?",
    a: "Nimbus queues all changes locally and replays them in order once the connection is restored. No data is lost.",
  },
  {
    q: "Can I customize what syncs?",
    a: "Yes. Every integration has granular sync controls — choose which data types, directions, and schedules work for your operation.",
  },
];

export default function IntegrationPage({ slug, onDemo }) {
  const integration = INTEGRATIONS[slug];
  const heroRef = useRef(null);
  const ctaRef = useRef(null);
  const glowRef = useGlowCards();
  const setupGlow = useGlowCards();
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!integration) return;
    const hero = heroRef.current;
    if (!hero) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.to(
      hero.querySelector(`.${styles.tag}`),
      { opacity: 1, y: 0, duration: 0.4 },
      0.15
    );
    tl.to(
      hero.querySelector(`.${styles.title}`),
      { opacity: 1, y: 0, duration: 0.6 },
      0.25
    );
    tl.to(
      hero.querySelector(`.${styles.tagline}`),
      { opacity: 1, y: 0, duration: 0.5 },
      0.4
    );
    tl.to(
      hero.querySelector(`.${styles.heroDesc}`),
      { opacity: 1, y: 0, duration: 0.5 },
      0.5
    );
    tl.to(
      hero.querySelector(`.${styles.heroStats}`),
      { opacity: 1, y: 0, duration: 0.5 },
      0.6
    );

    // Scroll-triggered sections
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
              fontSize: 28,
            }}
          >
            Integration not found
          </h1>
          <TransitionLink href="/#integrations" className={styles.backLink}>
            Back to integrations
          </TransitionLink>
        </div>
        <Footer />
      </div>
    );
  }

  // Find related integrations (same category, different slug)
  const related = Object.entries(INTEGRATIONS)
    .filter(([k, v]) => v.category === integration.category && k !== slug)
    .slice(0, 3);

  return (
    <div className={styles.page}>
      <Nav onDemo={onDemo} />

      {/* Hero */}
      <div ref={heroRef} className={styles.hero}>
        <TransitionLink href="/#integrations" className={styles.backNav}>
          ← Integrations
        </TransitionLink>

        <div
          className={styles.tag}
          style={{ opacity: 0, transform: "translateY(12px)" }}
        >
          <div className={styles.tagDot} />
          <span>{integration.category}</span>
        </div>
        <h1
          className={styles.title}
          style={{ opacity: 0, transform: "translateY(20px)" }}
        >
          {integration.title}
        </h1>
        <p
          className={styles.tagline}
          style={{ opacity: 0, transform: "translateY(14px)" }}
        >
          {integration.tagline}
        </p>
        <p
          className={styles.heroDesc}
          style={{ opacity: 0, transform: "translateY(14px)" }}
        >
          {integration.desc}
        </p>

        <div
          className={styles.heroStats}
          style={{ opacity: 0, transform: "translateY(16px)" }}
        >
          {integration.stats.map((s, i) => (
            <div key={i} className={styles.statItem}>
              <div className={styles.heroStatVal}>{s.val}</div>
              <div className={styles.heroStatLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className={styles.gridSection}>
        <div className={styles.sectionTag}>
          <div className={styles.tagDot} />
          <span>Key features</span>
        </div>
        <div ref={glowRef} className={`${styles.grid} glow-cards`}>
          {integration.features.map((f, i) => (
            <div
              key={i}
              data-reveal=""
              className={`${styles.gridCard} glow-card`}
              style={{ opacity: 0, transform: "translateY(24px)" }}
            >
              <div className="glow-card-border" />
              <div className={`${styles.gridCardInner} glow-card-content`}>
                <div className={styles.gridCardNum}>0{i + 1}</div>
                <h3 className={styles.gridCardTitle}>{f.title}</h3>
                <p className={styles.gridCardDesc}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className={styles.gridSection}>
        <div className={styles.sectionTag}>
          <div className={styles.tagDot} />
          <span>How it works</span>
        </div>
        <h2 className={styles.gridTitle}>Up and running in minutes.</h2>
        <div ref={setupGlow} className={`${styles.stepsGrid} glow-cards`}>
          {SETUP_STEPS.map((step, i) => (
            <div
              key={i}
              data-reveal=""
              className={`${styles.stepCard} glow-card`}
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              <div className="glow-card-border" />
              <div className={`${styles.stepInner} glow-card-content`}>
                <div className={styles.stepNum}>{step.num}</div>
                <div className={styles.stepTitle}>{step.title}</div>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data flow */}
      <div
        className={styles.flowSection}
        data-reveal=""
        style={{ opacity: 0, transform: "translateY(20px)" }}
      >
        <div className={styles.sectionTag}>
          <div className={styles.tagDot} />
          <span>Data flow</span>
        </div>
        <div className={styles.flowRow}>
          <div className={styles.flowBox}>
            <div className={styles.flowBoxLabel}>Nimbus</div>
            <div className={styles.flowBoxItems}>
              Scans · Movements · Counts · Orders
            </div>
          </div>
          <div className={styles.flowArrow}>
            <svg width="48" height="16" viewBox="0 0 48 16" fill="none">
              <path
                d="M0 8H44M38 2L44 8L38 14"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M48 8H4M10 2L4 8L10 14"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className={styles.flowBox}>
            <div className={styles.flowBoxLabel}>{integration.title}</div>
            <div className={styles.flowBoxItems}>
              Inventory · Orders · Invoices · Reports
            </div>
          </div>
        </div>
        <p className={styles.flowNote}>
          Bidirectional sync — changes in either system propagate automatically
          within 30 seconds.
        </p>
      </div>

      {/* FAQ */}
      <div className={styles.faqSection}>
        <div className={styles.sectionTag}>
          <div className={styles.tagDot} />
          <span>Common questions</span>
        </div>
        <div className={styles.faqList}>
          {FAQ.map((item, i) => (
            <div
              key={i}
              data-reveal=""
              className={styles.faqItem}
              style={{ opacity: 0, transform: "translateY(12px)" }}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className={styles.faqQ}>
                <span>{item.q}</span>
                <span
                  className={`${styles.faqToggle} ${
                    openFaq === i ? styles.faqOpen : ""
                  }`}
                >
                  +
                </span>
              </div>
              {openFaq === i && <p className={styles.faqA}>{item.a}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className={styles.relatedSection}>
          <div className={styles.sectionTag}>
            <div className={styles.tagDot} />
            <span>Related integrations</span>
          </div>
          <div className={styles.relatedGrid}>
            {related.map(([rSlug, r]) => (
              <TransitionLink
                key={rSlug}
                href={`/integration/${rSlug}`}
                className={styles.relatedCard}
              >
                <div className={styles.relatedTitle}>{r.title}</div>
                <p className={styles.relatedDesc}>{r.tagline}</p>
              </TransitionLink>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div
        ref={ctaRef}
        className={styles.ctaBanner}
        data-reveal=""
        style={{ opacity: 0, transform: "translateY(24px)" }}
      >
        <h2 className={styles.ctaTitle}>
          Connect {integration.title} to Nimbus
        </h2>
        <p className={styles.ctaDesc}>
          See how the {integration.title} integration works for your operation.
        </p>
        <CornerButton variant="primary" onClick={onDemo}>
          Request a Demo
        </CornerButton>
        <TransitionLink href="/#integrations" className={styles.backLink}>
          View all integrations
        </TransitionLink>
      </div>

      <Footer />
    </div>
  );
}
