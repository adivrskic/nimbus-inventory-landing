"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/gsap";
import { resetScroll } from "@/lib/resetScroll";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import SplitText from "@/components/shared/SplitText";
import Accordion from "@/components/shared/Accordion";
import FeatureMatrix from "@/components/shared/FeatureMatrix";
import CheckList from "@/components/shared/CheckList";
import FinalCTACard from "@/components/FinalCTACard/FinalCTACard";
import { useDemo } from "@/lib/DemoContext";
import { track } from "@/lib/analytics";
import styles from "./Pricing.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ── Pricing config — edit prices here ── */
const PRICING = {
  pro: {
    monthly: 299,
    annual: 239,
  },
};

/* Each tier carries a `topic` that's passed to openDemo() when its CTA
   fires. The modal uses that to preselect the chip, drive the Calendly
   utm_content param, and label the lead email. */
const TIERS = [
  {
    key: "pro",
    number: "01",
    name: "Pro",
    label: "For single warehouses",
    desc: "Everything you need to run one warehouse — AI scanning, voice commands, every integration, and predictive alerts.",
    featured: true,
    cta: "Request a Demo",
    ctaVariant: "primary",
    topic: "demo",
    includesLabel: "Includes",
    features: [
      "1 warehouse",
      "Unlimited active scanner users",
      "Up to 50,000 SKUs",
      "AI scanning + voice commands",
      "All 18 integrations",
      "Standard analytics & alerts",
      "Email support · 24h response",
      "99.9% uptime SLA",
    ],
  },
  {
    key: "enterprise",
    number: "02",
    name: "Enterprise",
    label: "For multi-site operations",
    desc: "Multi-warehouse orchestration, dedicated success management, and compliance-grade controls for operations at scale.",
    featured: false,
    cta: "Talk to Sales",
    ctaVariant: "ghost",
    topic: "sales",
    includesLabel: "Everything in Pro, plus",
    features: [
      "Unlimited warehouses",
      "Unlimited SKUs",
      "Spatial Intelligence",
      "Multi-warehouse orchestration",
      "Custom API integrations",
      "SSO / SAML",
      "Dedicated success manager",
      "24/7 priority support · 1h response",
      "99.99% uptime SLA",
      "SOC 2 + HIPAA reports",
    ],
  },
];

const MATRIX_ROWS = [
  { label: "Warehouses included", pro: "1", enterprise: "Unlimited" },
  { label: "SKUs", pro: "50,000", enterprise: "Unlimited" },
  { label: "Active scanner users", pro: "Unlimited", enterprise: "Unlimited" },
  { label: "AI scanning & voice", pro: true, enterprise: true },
  { label: "Spatial Intelligence", pro: false, enterprise: true },
  { label: "Multi-warehouse orchestration", pro: false, enterprise: true },
  { label: "API access", pro: "Read-only", enterprise: "Full" },
  { label: "Support response", pro: "Email · 24h", enterprise: "24/7 · 1h" },
  { label: "Uptime SLA", pro: "99.9%", enterprise: "99.99%" },
  { label: "SSO / SAML", pro: false, enterprise: true },
];

const FAQS = [
  {
    q: "What counts as a warehouse?",
    a: "A warehouse is any physical facility with its own inventory, location codes, and team. Multiple buildings on the same site managed as one logical operation count as one warehouse. Separate facilities with separate stock count as separate warehouses.",
  },
  {
    q: "Can I switch between plans?",
    a: "Yes. Upgrade from Pro to Enterprise at any time — the change takes effect immediately and you'll only be billed for the difference for the remainder of your current cycle. Downgrades take effect at the start of your next billing period.",
  },
  {
    q: "Is there a free trial?",
    a: "Pro includes a 14-day free trial — no credit card required. Enterprise customers get a tailored proof-of-concept period, typically 30 days, with hands-on support from our team.",
  },
  {
    q: "What happens if I exceed plan limits?",
    a: "Nothing breaks. We'll reach out as you approach limits and discuss options — usually that's a conversation about whether Enterprise fits your growth. We never suddenly cut off scanning or operations.",
  },
  {
    q: "Do you offer non-profit or educational discounts?",
    a: "Yes. 501(c)(3) non-profits and accredited educational institutions get 30% off Pro and Enterprise. Contact sales with documentation to apply the discount.",
  },
  {
    q: "Can I pay by invoice?",
    a: "Annual Pro plans and all Enterprise contracts can be paid by invoice with net-30 terms. Monthly Pro is credit card only.",
  },
];

/* Headline content */
const H_LINES = [
  [
    { t: "Built", a: false },
    { t: "for", a: false },
  ],
  [
    { t: "every", a: true },
    { t: "warehouse.", a: true },
  ],
];

const SUB_TEXT =
  "Two tiers. Flat per-warehouse pricing. No per-user fees, no surprises.";

const fmt = (n) => n.toLocaleString("en-US");

export default function PricingClient() {
  const heroRef = useRef(null);
  const tierRefs = useRef([]);
  const tiersRef = useRef(null);
  const matrixSectionRef = useRef(null);
  const faqSectionRef = useRef(null);

  /* Demo modal — global, mounted in app/layout.js. openDemo accepts an
     optional topic key ("demo" | "sales" | "migration" | "integration")
     that preselects the chip and rides through into Calendly + the
     sales email, plus an options object whose `source` value flows
     into the demo_modal_open analytics event. */
  const { openDemo } = useDemo();

  const [billing, setBilling] = useState("monthly");

  /* Billing toggle handler — fires pricing_billing_toggle analytics
     event only when the mode actually changes (clicking the active pill
     should be a no-op for the data, not a duplicate event). */
  const onBillingChange = (next) => {
    if (next === billing) return;
    track("pricing_billing_toggle", { mode: next });
    setBilling(next);
  };

  /* FAQ analytics — fired by the Accordion's onOpen (open only, never on
     close), capped at 80 chars for GA4 dimension cardinality. Open/close
     state itself now lives inside the shared Accordion. */
  const onFaqOpen = (fi) => {
    track("pricing_faq_expand", { question: (FAQS[fi].q || "").slice(0, 80) });
  };

  /* ── Intro + scroll animations — uniform with Calculator/IndustryPage ──
     Hero intro reads strictly top-to-bottom: eyebrow -> headline letters
     -> subtitle -> billing toggle. Each step is anchored to the END of the
     previous one (">" with a small negative offset for a gentle overlap)
     rather than a fixed start time, so the lower elements never resolve
     before the per-letter headline does — holds regardless of headline
     length.

     The scroll reveals below (tier cards, matrix rows, FAQ items) are
     GATED behind the hero intro: a reveal whose trigger is already
     satisfied on initial load is QUEUED and released the moment the intro
     completes; a section scrolled to later plays immediately. The FAQ
     items are the shared Accordion's `[data-accordion-item]` elements. */
  useEffect(() => {
    resetScroll();
    const hero = heroRef.current;
    if (!hero) return;

    /* The Accordion + FeatureMatrix items live inside their shared
       components; grab them by the stable data attributes those components
       stamp on each item/row. */
    const faqItems = faqSectionRef.current
      ? Array.from(
          faqSectionRef.current.querySelectorAll("[data-accordion-item]")
        )
      : [];
    const matrixItems = matrixSectionRef.current
      ? Array.from(
          matrixSectionRef.current.querySelectorAll("[data-matrix-row]")
        )
      : [];

    /* Hoisted so the effect cleanup can reach it from outside the gsap
       context callback. */
    let cancelled = false;

    const ctx = gsap.context(() => {
      /* Reduced motion: skip the intro choreography and jump every animated
         element straight to its final, visible state. Without this, the hero
         letters + every scroll reveal would still animate for users who
         asked the OS for reduced motion. SplitText already renders an
         sr-only flat headline, so screen readers are unaffected either way. */
      if (prefersReducedMotion()) {
        gsap.set(hero.querySelectorAll(`.${styles.headLetter}`), {
          opacity: 1,
          y: "0%",
          rotateX: 0,
        });
        gsap.set(
          hero.querySelectorAll(
            `.${styles.heroEyebrow}, .${styles.heroSub}, .${styles.toggleWrap}`
          ),
          { opacity: 1, y: 0 }
        );
        gsap.set(tierRefs.current.filter(Boolean), { opacity: 1, y: 0 });
        if (matrixItems.length) gsap.set(matrixItems, { opacity: 1, y: 0 });
        if (faqItems.length) gsap.set(faqItems, { opacity: 1, y: 0 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      /* Eyebrow */
      tl.fromTo(
        `.${styles.heroEyebrow}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.32 },
        0
      );

      /* Per-letter headline — starts just as the eyebrow lands. */
      const hLetters = hero.querySelectorAll(`.${styles.headLetter}`);
      tl.to(
        hLetters,
        {
          opacity: 1,
          y: "0%",
          rotateX: 0,
          duration: 0.5,
          stagger: 0.016,
          ease: "power4.out",
        },
        ">-0.05"
      );

      /* Sub — anchored to the END of the headline stagger. */
      tl.fromTo(
        `.${styles.heroSub}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.42 },
        ">-0.2"
      );

      /* Billing toggle — follows the subtitle. */
      tl.to(`.${styles.toggleWrap}`, { opacity: 1, duration: 0.4 }, ">-0.15");

      /* ── Gate the scroll reveals behind the hero intro ── */
      let introDone = false;
      const queued = [];
      const runWhenIntroDone = (fn) => (introDone ? fn() : queued.push(fn));
      tl.eventCallback("onComplete", () => {
        if (cancelled) return;
        introDone = true;
        queued.forEach((fn) => fn());
        queued.length = 0;
      });
      /* Build a paused reveal tween + a once-only trigger that plays it
         through the intro gate. Mirrors the original fromTo vars exactly. */
      const gatedReveal = (targets, fromVars, toVars, trigger, start) => {
        if (!trigger) return;
        const list = Array.isArray(targets) ? targets.filter(Boolean) : targets;
        if (Array.isArray(list) && list.length === 0) return;
        const tween = gsap.fromTo(list, fromVars, { ...toVars, paused: true });
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

      /* Tier cards */
      const tiers = tierRefs.current.filter(Boolean);
      gatedReveal(
        tiers,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power3.out" },
        tiers[0],
        "clamp(top 90%)"
      );

      /* Matrix rows — the shared FeatureMatrix's [data-matrix-row] elements. */
      gatedReveal(
        matrixItems,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.035, ease: "power2.out" },
        matrixSectionRef.current,
        "clamp(top 90%)"
      );

      /* FAQ items — the shared Accordion's [data-accordion-item] elements. */
      gatedReveal(
        faqItems,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power3.out" },
        faqSectionRef.current,
        "clamp(top 90%)"
      );

      /* The bottom CTA is <FinalCTACard>, which owns its own scroll-in
         reveal + gold wipe — no page-level timeline needed here. */
    });

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, []);

  /* Price morph when toggle changes */
  const proPriceRef = useRef(null);
  useEffect(() => {
    if (!proPriceRef.current) return;
    /* Reduced motion: settle instantly instead of fading the price in. */
    if (prefersReducedMotion()) {
      gsap.set(proPriceRef.current, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      proPriceRef.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
    );
  }, [billing]);

  /* Cursor-following accent glow on the tier cards — sets --mouse-x /
     --mouse-y per card, the same mechanism the Integrations glow cards
     use. The glow's opacity is driven by :hover in CSS; this only
     positions the radial center under the pointer. */
  useEffect(() => {
    const wrap = tiersRef.current;
    if (!wrap) return;
    const cards = wrap.querySelectorAll(`.${styles.tier}`);
    if (!cards.length) return;
    const onMove = (e) => {
      cards.forEach((card) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
        card.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
      });
    };
    wrap.addEventListener("mousemove", onMove);
    return () => wrap.removeEventListener("mousemove", onMove);
  }, []);

  const proPrice =
    billing === "annual" ? PRICING.pro.annual : PRICING.pro.monthly;
  /* Yearly savings — the gap between paying monthly all year vs paying
     the discounted annual rate. Shown prominently when Annual is active. */
  const annualSavings = (PRICING.pro.monthly - PRICING.pro.annual) * 12;

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroEyebrow}>Pricing</div>

        <h1 className={styles.headline}>
          <SplitText
            tokens={H_LINES}
            classNames={{
              line: styles.headLine,
              letter: styles.headLetter,
              accent: styles.headLetterAccent,
              space: styles.headSpace,
            }}
          />
        </h1>

        <p className={styles.heroSub}>{SUB_TEXT}</p>

        {/* ─────────────────────────────────────────────────────
            BILLING SELECTOR — pill toggle with sliding gold pill
        ───────────────────────────────────────────────────── */}
        <div className={styles.toggleWrap}>
          <div
            className={styles.pillToggle}
            role="tablist"
            aria-label="Billing period"
          >
            <div
              className={styles.pillSlider}
              style={{
                transform:
                  billing === "annual" ? "translateX(100%)" : "translateX(0)",
              }}
            />
            <button
              role="tab"
              aria-selected={billing === "monthly"}
              className={`${styles.pillBtn} ${
                billing === "monthly" ? styles.pillBtnActive : ""
              }`}
              onClick={() => onBillingChange("monthly")}
            >
              Monthly
            </button>
            <button
              role="tab"
              aria-selected={billing === "annual"}
              className={`${styles.pillBtn} ${
                billing === "annual" ? styles.pillBtnActive : ""
              }`}
              onClick={() => onBillingChange("annual")}
            >
              Annual
              <span className={styles.pillBadge}>−20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          TIER CARDS — Pro (featured) + Enterprise
      ───────────────────────────────────────────────────── */}
      <section ref={tiersRef} className={styles.tiers}>
        {TIERS.map((tier, ti) => (
          <div
            key={tier.key}
            ref={(el) => (tierRefs.current[ti] = el)}
            className={`${styles.tier} ${
              tier.featured ? styles.tierFeatured : ""
            }`}
          >
            {/* Editorial section numeral in background */}
            <span className={styles.tierBigNum} aria-hidden="true">
              {tier.number}
            </span>

            <div className={styles.tierContent}>
              <div className={styles.tierNumber}>
                {tier.number} / {tier.name.toUpperCase()}
              </div>
              <div className={styles.tierName}>{tier.name}</div>
              <div className={styles.tierLabel}>{tier.label}</div>
              <p className={styles.tierDesc}>{tier.desc}</p>

              <div className={styles.priceBlock}>
                {tier.key === "pro" ? (
                  <>
                    <div ref={proPriceRef} className={styles.price}>
                      {billing === "annual" && (
                        <span className={styles.priceStrike}>
                          ${fmt(PRICING.pro.monthly)}
                        </span>
                      )}
                      <span className={styles.priceCurrency}>$</span>
                      <span className={styles.priceValue}>{fmt(proPrice)}</span>
                      <span className={styles.priceCadence}>/mo</span>
                    </div>
                    <div className={styles.priceUnit}>per warehouse</div>
                    <div className={styles.priceNote}>
                      {billing === "annual" ? (
                        <>
                          <span className={styles.priceSavings}>
                            Save ${fmt(annualSavings)}/yr
                          </span>
                          <span className={styles.priceMuted}>
                            {" "}
                            · Billed annually
                          </span>
                        </>
                      ) : (
                        "Billed monthly · Cancel anytime"
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.priceCustom}>Custom</div>
                    <div className={styles.priceUnit}>Volume pricing</div>
                    <div className={styles.priceNote}>
                      Talk to sales for a tailored quote
                    </div>
                  </>
                )}
              </div>

              <div className={styles.ctaRow}>
                <CornerButton
                  variant={tier.ctaVariant}
                  onClick={() =>
                    openDemo(tier.topic, { source: `pricing_tier_${tier.key}` })
                  }
                >
                  {tier.cta}
                </CornerButton>
              </div>

              <div className={styles.tierDivider} />

              <div className={styles.tierIncludesLabel}>
                {tier.includesLabel}
              </div>
              <CheckList
                items={tier.features}
                marker="check"
                tone="default"
                size="sm"
              />
            </div>
          </div>
        ))}
      </section>

      {/* ── Side-by-side matrix ── */}
      <section ref={matrixSectionRef} className={styles.matrixSection}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionHeadline}>
            Side by <span className={styles.sectionHeadlineAccent}>side.</span>
          </h2>
        </div>

        <FeatureMatrix
          columns={[
            { label: "Pro", tone: "default" },
            { label: "Enterprise", tone: "default" },
          ]}
          rows={MATRIX_ROWS.map((row) => ({
            feature: row.label,
            values: [row.pro, row.enterprise],
          }))}
          headerRule="neutral"
          columnLayout="even"
          initiallyHidden
        />
      </section>

      {/* ── FAQ — shared Accordion ── */}
      <section ref={faqSectionRef} className={styles.faqSection}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionHeadline}>
            Common{" "}
            <span className={styles.sectionHeadlineAccent}>questions.</span>
          </h2>
        </div>

        <Accordion
          items={FAQS}
          onOpen={onFaqOpen}
          initiallyHidden
          className={styles.faqList}
        />
      </section>

      {/* ── Final CTA ── */}
      <FinalCTACard
        label="Custom pricing"
        title="Need a custom quote?"
        desc="Tell us about your operation — warehouse count, SKU volume, integration needs — and we'll put together a tailored proposal."
        primaryAction={{
          onClick: () => openDemo("demo", { source: "final_cta_pricing" }),
          label: "Request a Demo",
        }}
        secondaryAction={{
          onClick: () => openDemo("sales", { source: "final_cta_pricing" }),
          label: "Talk to Sales",
        }}
      />

      <Footer />
    </div>
  );
}
