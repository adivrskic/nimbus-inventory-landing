"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
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
    a: "Most customers are syncing in under 10 minutes. Enterprise environments with custom field mappings can take 30 minutes to an hour.",
  },
  {
    q: "What if a sync fails?",
    a: "Nimbus retries with exponential backoff for 24 hours. After that, the record is flagged in your dashboard for manual review. Sync failures never block your warehouse operations.",
  },
  {
    q: "Can I limit what syncs?",
    a: "Yes. Granular controls let you sync specific products, locations, or even specific fields. Most customers start with everything on and tighten over time.",
  },
  {
    q: "Is the integration included in all plans?",
    a: "This integration is included in Pro and Enterprise. Free plans can install but with limits on sync frequency.",
  },
];

/* Generic data-flow descriptors for each category. These could move to
   integrationData.js per-integration if more specificity is needed. */
const FLOW_DATA = {
  "Accounting & ERP": {
    fromNimbus: [
      "Stock counts",
      "Scan events",
      "Cost basis",
      "Movement history",
    ],
    toNimbus: [
      "Journal entries",
      "PO approvals",
      "COGS posting",
      "Vendor data",
    ],
  },
  "E-commerce & POS": {
    fromNimbus: [
      "Inventory levels",
      "Reserved stock",
      "Location data",
      "Lot/serial info",
    ],
    toNimbus: ["Orders", "Returns", "Product catalog", "Channel mappings"],
  },
  "Shipping & Logistics": {
    fromNimbus: [
      "Pick lists",
      "Order weights",
      "Packing slips",
      "Bin locations",
    ],
    toNimbus: [
      "Tracking numbers",
      "Carrier rates",
      "Label data",
      "Delivery status",
    ],
  },
};

function renderHeroTitle(text) {
  const words = text.split(" ");
  return (
    <span className={styles.heroLine}>
      <span className={styles.heroLineInner}>
        {words.map((word, wi) => (
          <span key={wi}>
            <span className="word">
              {word.split("").map((c, ci) => (
                <span key={`${wi}-${ci}`} className={styles.heroLetter}>
                  {c}
                </span>
              ))}
            </span>
            {wi < words.length - 1 && <span className={styles.heroSpace} />}
          </span>
        ))}
      </span>
    </span>
  );
}

export default function IntegrationPage({ slug, onDemo }) {
  const integration = INTEGRATIONS[slug];
  const pageRef = useRef(null);
  const heroRef = useRef(null);

  /* Sibling integrations in the same category (excluding current) — up to 3 */
  const siblings = integration
    ? Object.entries(INTEGRATIONS)
        .filter(([s, i]) => s !== slug && i.category === integration.category)
        .slice(0, 3)
        .map(([s, i]) => ({ slug: s, ...i }))
    : [];

  const flow = integration ? FLOW_DATA[integration.category] : null;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!integration || !heroRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(
      `.${styles.heroIndex}`,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.4 },
      0
    );

    /* Connection mark — Nimbus + ×/connector + Partner — staggered in */
    tl.fromTo(
      `.${styles.markBrand}`,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.6 },
      0.15
    );
    tl.fromTo(
      `.${styles.markConnector}`,
      { opacity: 0, scale: 0.5, rotate: -30 },
      { opacity: 1, scale: 1, rotate: 0, duration: 0.5, ease: "back.out(2)" },
      0.35
    );
    tl.fromTo(
      `.${styles.markPartner}`,
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.6 },
      0.45
    );

    /* Per-letter tagline */
    const letters = heroRef.current.querySelectorAll(`.${styles.heroLetter}`);
    tl.to(
      letters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.65, stagger: 0.018 },
      0.7
    );

    tl.fromTo(
      `.${styles.heroDesc}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5 },
      1.0
    );
    tl.fromTo(
      `.${styles.heroCTA}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5 },
      1.15
    );

    /* Sections — same numbered editorial pattern as Industry */
    if (!pageRef.current) return;
    const sections = pageRef.current.querySelectorAll(`.${styles.section}`);
    sections.forEach((sec) => {
      const num = sec.querySelector(`.${styles.sectionNum}`);
      const content = sec.querySelectorAll(
        `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.feature}, .${styles.flow}, .${styles.step}, .${styles.stat}, .${styles.faq}`
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
            stagger: 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: sec, start: "top 78%" },
          }
        );
      }
    });

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

    gsap.fromTo(
      `.${styles.finalCTA}`,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: `.${styles.finalCTA}`, start: "top 85%" },
      }
    );

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [slug, integration]);

  if (!integration) {
    return (
      <div className={styles.page}>
        <Nav onDemo={onDemo} />
        <div className={styles.notFound}>
          <div className={styles.notFoundLabel}>404</div>
          <h1>Integration not found.</h1>
          <TransitionLink href="/" className={styles.backLink}>
            ← Back to home
          </TransitionLink>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div ref={pageRef} className={styles.page}>
      <Nav onDemo={onDemo} />

      {/* ── HERO with CONNECTION MARK ── */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroIndex}>
          <span>Integrations</span>
          <span className={styles.heroIndexDot} />
          <span className={styles.heroIndexCategory}>
            {integration.category}
          </span>
        </div>

        {/* The signature: Nimbus × Partner */}
        <div className={styles.mark}>
          <span className={styles.markBrand}>Nimbus</span>
          <span className={styles.markConnector} aria-hidden="true">
            ×
          </span>
          <span className={styles.markPartner}>{integration.title}</span>
        </div>

        <h1 className={styles.heroTagline}>
          {renderHeroTitle(integration.tagline)}
        </h1>
        <p className={styles.heroDesc}>{integration.desc}</p>

        <div className={styles.heroCTA}>
          <CornerButton onClick={onDemo}>Talk to our team</CornerButton>
          <TransitionLink href="/api-docs" className={styles.heroSecondary}>
            See API docs →
          </TransitionLink>
        </div>
      </section>

      {/* ── 01 · FEATURES ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          01
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>What works together</div>
          <h2 className={styles.sectionTitle}>
            Inventory data, where you need it.
          </h2>
          <p className={styles.sectionDesc}>
            Three things the {integration.title} integration does well — and
            that you&apos;d otherwise be doing manually.
          </p>

          <div className={styles.features}>
            {integration.features.map((f, i) => (
              <div key={i} className={styles.feature}>
                <div className={styles.featureLeft}>
                  <span className={styles.featureNum}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.featureMark} />
                </div>
                <div className={styles.featureRight}>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 02 · DATA FLOW ── */}
      {flow && (
        <section className={styles.section}>
          <div className={styles.sectionNum} aria-hidden="true">
            02
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.sectionLabel}>How it flows</div>
            <h2 className={styles.sectionTitle}>
              Bidirectional sync. No manual entry.
            </h2>
            <p className={styles.sectionDesc}>
              Data moves between Nimbus and {integration.title} in both
              directions, near-real-time.
            </p>

            <div className={styles.flow}>
              <div className={styles.flowNode}>
                <div className={styles.flowNodeName}>Nimbus</div>
                <div className={styles.flowNodeRole}>Source of truth</div>
                <ul className={styles.flowNodeData}>
                  {flow.fromNimbus.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.flowConnector}>
                <div className={styles.flowArrowRight}>
                  <span className={styles.flowArrowLine} />
                  <span className={styles.flowArrowHead}>▶</span>
                </div>
                <div className={styles.flowLatency}>{"<"} 30s</div>
                <div className={styles.flowArrowLeft}>
                  <span className={styles.flowArrowHead}>◀</span>
                  <span className={styles.flowArrowLine} />
                </div>
              </div>

              <div className={styles.flowNode}>
                <div className={styles.flowNodeName}>{integration.title}</div>
                <div className={styles.flowNodeRole}>
                  {integration.category}
                </div>
                <ul className={styles.flowNodeData}>
                  {flow.toNimbus.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 03 · SETUP ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          03
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Setup</div>
          <h2 className={styles.sectionTitle}>Four steps to live.</h2>
          <p className={styles.sectionDesc}>
            Under 10 minutes for most teams. The full health check takes longer
            but doesn&apos;t block sync.
          </p>

          <div className={styles.steps}>
            {SETUP_STEPS.map((s) => (
              <div key={s.num} className={styles.step}>
                <div className={styles.stepNum}>{s.num}</div>
                <h4 className={styles.stepTitle}>{s.title}</h4>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 04 · STATS ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          04
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>By the numbers</div>
          <h2 className={styles.sectionTitle}>
            What the integration does, in numbers.
          </h2>

          <div className={styles.stats}>
            {integration.stats.map((s, i) => (
              <div key={i} className={styles.stat}>
                <div className={styles.statVal}>{s.val}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 05 · FAQ ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          05
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>FAQ</div>
          <h2 className={styles.sectionTitle}>Quick answers.</h2>

          <div className={styles.faqList}>
            {FAQ.map((item, i) => (
              <div key={i} className={styles.faq}>
                <h3 className={styles.faqQ}>{item.q}</h3>
                <p className={styles.faqA}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CROSS-LINKS ── */}
      {siblings.length > 0 && (
        <section className={styles.crossLinks}>
          <div className={styles.crossLinksLabel}>
            Other {integration.category.toLowerCase()} integrations
          </div>
          <div className={styles.crossLinksGrid}>
            {siblings.map((s) => (
              <TransitionLink
                key={s.slug}
                href={`/integrations/${s.slug}`}
                className={styles.crossCard}
              >
                <div className={styles.crossCardMeta}>{s.category}</div>
                <div className={styles.crossCardTitle}>{s.title}</div>
                <div className={styles.crossCardTagline}>{s.tagline}</div>
                <div className={styles.crossCardArrow}>→</div>
              </TransitionLink>
            ))}
          </div>
        </section>
      )}

      {/* ── FINAL CTA ── */}
      <section className={styles.finalCTA}>
        <div className={styles.finalCTAInner}>
          <div className={styles.finalCTALabel}>Ready to connect?</div>
          <h2 className={styles.finalCTATitle}>
            See Nimbus + {integration.title} running on real data.
          </h2>
          <p className={styles.finalCTADesc}>
            30-minute walkthrough with a Nimbus engineer. We&apos;ll connect a
            sandbox of your {integration.title} account and show the sync live.
          </p>
          <div className={styles.finalCTAButtons}>
            <CornerButton onClick={onDemo}>Request a demo</CornerButton>
            <TransitionLink href="/contact" className={styles.heroSecondary}>
              Or just reach out →
            </TransitionLink>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
