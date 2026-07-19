"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import FinalCTACard from "@/components/FinalCTACard/FinalCTACard";
import Accordion from "@/components/shared/Accordion";
import NumberedList from "@/components/shared/NumberedList";
import StatGrid from "@/components/shared/StatGrid";
import useGlowCards from "@/lib/useGlowCards";
import { useDemo } from "@/lib/DemoContext";
import { resetScroll } from "@/lib/resetScroll";
import SplitText from "@/components/shared/SplitText";
import { INTEGRATIONS, DEFAULT_INTEGRATION_FAQS } from "./integrationData";
import styles from "./IntegrationPage.module.css";

gsap.registerPlugin(ScrollTrigger);

/* Setup steps are shared across every integration — the actual flow
   doesn't differ by platform, since OAuth + field-mapping + sync + verify
   is the same shape whether you're connecting QuickBooks or DHL. */
const SETUP_STEPS = [
  {
    num: "01",
    title: "Connect",
    desc: "Authenticate with one click. Nautilus uses OAuth — no API keys to copy, no credentials to store.",
  },
  {
    num: "02",
    title: "Map",
    desc: "Match your products, locations, and accounts. Nautilus auto-maps by SKU where possible.",
  },
  {
    num: "03",
    title: "Sync",
    desc: "Enable bidirectional sync. Changes in either system reflect in the other within 30 seconds.",
  },
  {
    num: "04",
    title: "Verify",
    desc: "Run the sync health check. Nautilus flags any mismatches before they become problems.",
  },
];

/* Category-level fallback data-flow descriptors. Used only when an
   integration in integrationData.js doesn't supply its own per-integration
   `flow`. All 18 current integrations ship with their own; this fallback
   exists so new integrations don't render an empty diagram before someone
   has written platform-specific items. */
const FLOW_DATA = {
  "Accounting & ERP": {
    fromNautilus: [
      "Stock counts",
      "Scan events",
      "Cost basis",
      "Movement history",
    ],
    toNautilus: [
      "Journal entries",
      "PO approvals",
      "COGS posting",
      "Vendor data",
    ],
  },
  "E-commerce & POS": {
    fromNautilus: [
      "Inventory levels",
      "Reserved stock",
      "Location data",
      "Lot/serial info",
    ],
    toNautilus: ["Orders", "Returns", "Product catalog", "Channel mappings"],
  },
  "Shipping & Logistics": {
    fromNautilus: [
      "Pick lists",
      "Order weights",
      "Packing slips",
      "Bin locations",
    ],
    toNautilus: [
      "Tracking numbers",
      "Carrier rates",
      "Label data",
      "Delivery status",
    ],
  },
};

export default function IntegrationPage({ slug }) {
  /* Demo modal lives in app/layout.js via DemoHost — pull the opener
     from context instead of expecting a prop the wrapper never passes. */
  const { openDemo } = useDemo();

  const integration = INTEGRATIONS[slug];
  const pageRef = useRef(null);
  const heroRef = useRef(null);

  /* Three glow-card contexts. Each section that has card-like content
     gets its own container ref so mousemove tracking is scoped per-grid.
     - flowGlowRef: the single bidirectional sync diagram card
     - stepsGlowRef: 4-step setup grid
     - crossGlowRef: 3 sibling integration cards */
  const flowGlowRef = useGlowCards();
  const stepsGlowRef = useGlowCards();
  const crossGlowRef = useGlowCards();

  /* Sibling integrations in the same category (excluding current) — up to 3 */
  const siblings = integration
    ? Object.entries(INTEGRATIONS)
        .filter(([s, i]) => s !== slug && i.category === integration.category)
        .slice(0, 3)
        .map(([s, i]) => ({ slug: s, ...i }))
    : [];

  /* Data-flow content. Prefer the per-integration `flow` field for
     specificity; fall back to the category-level FLOW_DATA only if the
     integration didn't ship its own. */
  const flow = integration
    ? integration.flow ?? FLOW_DATA[integration.category]
    : null;

  /* FAQ content. Same fallback pattern as flow — per-integration FAQs
     when present (which is the case for all 18 current integrations),
     DEFAULT_INTEGRATION_FAQS otherwise. The fallback also drives the
     JSON-LD FAQ schema in app/integration/[slug]/page.js. */
  const faqs = integration
    ? integration.faqs ?? DEFAULT_INTEGRATION_FAQS
    : DEFAULT_INTEGRATION_FAQS;

  useEffect(() => {
    resetScroll();
    if (!integration || !heroRef.current) return;

    /* Hoisted above the gsap.context — referenced by both the intro
       timeline's onComplete (inside) and the cleanup closure (outside). */
    let cancelled = false;

    /* Scope all GSAP work to a context. ctx.revert() on cleanup tears down
       ONLY the tweens/ScrollTriggers created here — the previous
       ScrollTrigger.getAll().forEach((t) => t.kill()) killed triggers owned
       by still-mounted siblings (FinalCTACard, Footer) when this effect
       re-ran on a slug change — and restores elements to their CSS-declared
       initial state so the intro replays cleanly for the new content. */
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(
        `.${styles.heroIndex}`,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.3 },
        0
      );

      /* Connection mark — Nautilus + ×/connector + Partner — staggered in.
         These three sit on one row, so they keep their own left-to-right
         choreography (brand → connector pop → partner) at fixed times. */
      tl.fromTo(
        `.${styles.markBrand}`,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.45 },
        0.15
      );
      tl.fromTo(
        `.${styles.markConnector}`,
        { opacity: 0, scale: 0.5, rotate: -30 },
        { opacity: 1, scale: 1, rotate: 0, duration: 0.4, ease: "back.out(2)" },
        0.35
      );
      tl.fromTo(
        `.${styles.markPartner}`,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.45 },
        0.45
      );

      /* From here the hero reads strictly top-to-bottom: tagline → description
         → CTA, each anchored to the END of the step above it (">" with a small
         negative offset for a gentle overlap) so the lower elements never
         resolve before the per-letter tagline does. */

      /* Per-letter tagline — begins as the connection mark lands. */
      const letters = heroRef.current.querySelectorAll(`.${styles.heroLetter}`);
      tl.to(
        letters,
        { opacity: 1, y: "0%", rotateX: 0, duration: 0.48, stagger: 0.018 },
        ">-0.1"
      );

      /* Description — anchored to the END of the tagline. */
      tl.fromTo(
        `.${styles.heroDesc}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4 },
        ">-0.2"
      );

      /* CTA — follows the description. */
      tl.fromTo(
        `.${styles.heroCTA}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4 },
        ">-0.15"
      );

      /* ── Gate the scroll reveals behind the hero intro ──────────────────
         The header intro above plays on mount; the section reveals below are
         scroll-triggered. Without a gate, any section near enough to the top
         to satisfy its trigger on initial load animates in immediately —
         racing (and finishing before) the header. So: a reveal that fires on
         initial load is QUEUED and released the moment the intro completes; a
         section scrolled to later plays immediately, exactly as before.
         Below-fold content is never delayed artificially — only the
         initial-viewport race is removed. */
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
        const tween = gsap.fromTo(targets, fromVars, {
          ...toVars,
          paused: true,
        });
        const release = () => runWhenIntroDone(() => tween.play());
        /* onEnter never fires for a trigger that is ALREADY in range when it
           is created or refreshed (ScrollTrigger adopts the state silently) —
           elements in view on load sat hidden until the first scroll. clamp()
           pins an in-view element's start to 0, and at scrollY 0 the trigger
           sits exactly ON its start (progress 0) — so compare scroll() >= start
           at creation and on every refresh and release directly.
           tween.play() is idempotent, so a later onEnter is harmless. */
        const st = ScrollTrigger.create({
          trigger,
          start,
          once: true,
          onEnter: release,
          onRefresh: (self) => self.scroll() >= self.start && release(),
        });
        if (st.scroll() >= st.start) release();
      };

      /* Sections — same numbered editorial pattern as Industry. The FAQ items
         are now the shared Accordion's [data-accordion-item] elements (was
         `.faq`), so they ride the same section reveal. */
      if (!pageRef.current) return;
      const sections = pageRef.current.querySelectorAll(`.${styles.section}`);
      sections.forEach((sec) => {
        const num = sec.querySelector(`.${styles.sectionNum}`);
        const content = sec.querySelectorAll(
          `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, [data-list-item], .${styles.flow}, .${styles.step}, [data-stat], [data-accordion-item]`
        );

        if (num) {
          gatedReveal(
            num,
            { opacity: 0, x: -20 },
            { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" },
            sec,
            "clamp(top 90%)"
          );
        }
        if (content.length > 0) {
          gatedReveal(
            content,
            { opacity: 0, y: 12 },
            {
              opacity: 1,
              y: 0,
              duration: 0.42,
              stagger: 0.06,
              ease: "power3.out",
            },
            sec,
            "clamp(top 90%)"
          );
        }
      });

      gatedReveal(
        `.${styles.crossCard}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power3.out" },
        `.${styles.crossLinks}`,
        "clamp(top 90%)"
      );
    });

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, [slug, integration]);

  if (!integration) {
    return (
      <div className={styles.page}>
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
      {/* ── HERO with CONNECTION MARK ── */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroIndex}>
          <span>Integrations</span>
          <span className={styles.heroIndexDot} />
          <span className={styles.heroIndexCategory}>
            {integration.category}
          </span>
        </div>

        {/* The signature: Nautilus × Partner */}
        <div className={styles.mark}>
          <span className={styles.markBrand}>Nautilus</span>
          <span className={styles.markConnector} aria-hidden="true">
            ×
          </span>
          <span className={styles.markPartner}>{integration.title}</span>
        </div>

        <h1 className={styles.heroTagline}>
          <SplitText
            text={integration.tagline}
            classNames={{
              line: styles.heroLine,
              lineInner: styles.heroLineInner,
              letter: styles.heroLetter,
              space: styles.heroSpace,
            }}
          />
        </h1>
        <p className={styles.heroDesc}>{integration.desc}</p>

        <div className={styles.heroCTA}>
          <CornerButton onClick={openDemo}>Talk to our team</CornerButton>
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
            Three things the {integration.title} integration does well, that
            you&apos;d otherwise be doing by hand.
          </p>

          <NumberedList items={integration.features} initiallyHidden />
        </div>
      </section>

      {/* ── 02 · DATA FLOW (glow-card wrapping the whole diagram) ── */}
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
              Data moves between Nautilus and {integration.title} in both
              directions, near-real-time.
            </p>

            {/* The flow diagram is treated as ONE glow-card containing both
                nodes + the connector. flowWrap is just the glow-cards
                container so useGlowCards has somewhere to attach. */}
            <div ref={flowGlowRef} className={`${styles.flowWrap} glow-cards`}>
              <div className={`${styles.flow} glow-card`}>
                <div className="glow-card-border" />
                <div className={`${styles.flowInner} glow-card-content`}>
                  <div className={styles.flowNode}>
                    <div className={styles.flowNodeName}>Nautilus</div>
                    <div className={styles.flowNodeRole}>Source of truth</div>
                    <ul className={styles.flowNodeData}>
                      {flow.fromNautilus.map((d) => (
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
                    <div className={styles.flowNodeName}>
                      {integration.title}
                    </div>
                    <div className={styles.flowNodeRole}>
                      {integration.category}
                    </div>
                    <ul className={styles.flowNodeData}>
                      {flow.toNautilus.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 03 · SETUP (glow-cards grid) ── */}
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

          <div ref={stepsGlowRef} className={`${styles.steps} glow-cards`}>
            {SETUP_STEPS.map((s) => (
              <div key={s.num} className={`${styles.step} glow-card`}>
                <div className="glow-card-border" />
                <div className={`${styles.stepInner} glow-card-content`}>
                  <div className={styles.stepNum}>{s.num}</div>
                  <h4 className={styles.stepTitle}>{s.title}</h4>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </div>
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

          <StatGrid items={integration.stats} initiallyHidden />
        </div>
      </section>

      {/* ── 05 · FAQ (per-integration with fallback) — shared Accordion ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          05
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>FAQ</div>
          <h2 className={styles.sectionTitle}>
            {integration.title} questions, answered.
          </h2>

          <Accordion items={faqs} initiallyHidden />
        </div>
      </section>

      {/* ── CROSS-LINKS — glow-cards ── */}
      {siblings.length > 0 && (
        <section className={styles.crossLinks}>
          <div className={styles.crossLinksLabel}>
            Other {integration.category.toLowerCase()} integrations
          </div>
          <div
            ref={crossGlowRef}
            className={`${styles.crossLinksGrid} glow-cards`}
          >
            {siblings.map((s) => (
              <TransitionLink
                key={s.slug}
                href={`/integration/${s.slug}`}
                className={`${styles.crossCard} glow-card`}
              >
                <div className="glow-card-border" />
                <div className={`${styles.crossCardInner} glow-card-content`}>
                  <div className={styles.crossCardMeta}>{s.category}</div>
                  <div className={styles.crossCardTitle}>{s.title}</div>
                  <div className={styles.crossCardTagline}>{s.tagline}</div>
                  <div className={styles.crossCardArrow}>→</div>
                </div>
              </TransitionLink>
            ))}
          </div>
        </section>
      )}

      {/* ── FINAL CTA ── */}
      <FinalCTACard
        label="Ready to connect?"
        title={`See Nautilus + ${integration.title} running on real data.`}
        desc={`30-minute walkthrough with a Nautilus engineer. We'll connect a sandbox of your ${integration.title} account and show the sync live.`}
        primaryAction={{ onClick: openDemo, label: "Request a demo" }}
        secondaryAction={{ href: "/contact", label: "Or just reach out" }}
      />

      <Footer />
    </div>
  );
}
