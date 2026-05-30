"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/gsap";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import SplitText from "@/components/shared/SplitText";
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

/* Icons */
const CheckIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M3.5 8.5L6.5 11.5L12.5 5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M7 1V13M1 7H13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const fmt = (n) => n.toLocaleString("en-US");

export default function PricingClient() {
  const heroRef = useRef(null);
  const tierRefs = useRef([]);
  const tiersRef = useRef(null);
  const matrixSectionRef = useRef(null);
  const matrixRowRefs = useRef([]);
  const faqSectionRef = useRef(null);
  const faqItemRefs = useRef([]);

  /* Demo modal — global, mounted in app/layout.js. openDemo accepts an
     optional topic key ("demo" | "sales" | "migration" | "integration")
     that preselects the chip and rides through into Calendly + the
     sales email, plus an options object whose `source` value flows
     into the demo_modal_open analytics event. */
  const { openDemo } = useDemo();

  const [billing, setBilling] = useState("monthly");
  const [openFaq, setOpenFaq] = useState(null);

  /* Billing toggle handler — fires pricing_billing_toggle analytics
     event only when the mode actually changes (clicking the active pill
     should be a no-op for the data, not a duplicate event). */
  const onBillingChange = (next) => {
    if (next === billing) return;
    track("pricing_billing_toggle", { mode: next });
    setBilling(next);
  };

  /* FAQ click handler — fires pricing_faq_expand only on OPEN (not on
     close), and caps the question at 80 chars for GA4 dimension
     cardinality. */
  const onFaqClick = (fi) => {
    const isOpen = openFaq === fi;
    if (!isOpen) {
      track("pricing_faq_expand", {
        question: (FAQS[fi].q || "").slice(0, 80),
      });
    }
    setOpenFaq(isOpen ? null : fi);
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
     completes; a section scrolled to later plays immediately, exactly as
     before. This removes the initial-viewport race (e.g. tier cards firing
     at "top 82%" on a short viewport) without artificially delaying
     below-fold content. */
  useEffect(() => {
    window.scrollTo(0, 0);
    const hero = heroRef.current;
    if (!hero) return;

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
      gsap.set(matrixRowRefs.current.filter(Boolean), { opacity: 1, y: 0 });
      gsap.set(faqItemRefs.current.filter(Boolean), { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    /* Eyebrow */
    tl.fromTo(
      `.${styles.heroEyebrow}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45 },
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
        duration: 0.7,
        stagger: 0.016,
        ease: "power4.out",
      },
      ">-0.05"
    );

    /* Sub — anchored to the END of the headline stagger. */
    tl.fromTo(
      `.${styles.heroSub}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55 },
      ">-0.2"
    );

    /* Billing toggle — follows the subtitle. */
    tl.to(`.${styles.toggleWrap}`, { opacity: 1, duration: 0.5 }, ">-0.15");

    /* ── Gate the scroll reveals behind the hero intro ── */
    let cancelled = false;
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
      ScrollTrigger.create({
        trigger,
        start,
        once: true,
        onEnter: () => runWhenIntroDone(() => tween.play()),
      });
    };

    /* Tier cards */
    const tiers = tierRefs.current.filter(Boolean);
    gatedReveal(
      tiers,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" },
      tiers[0],
      "top 82%"
    );

    /* Matrix rows */
    const rows = matrixRowRefs.current.filter(Boolean);
    gatedReveal(
      rows,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.035, ease: "power2.out" },
      matrixSectionRef.current,
      "top 75%"
    );

    /* FAQ items */
    const faqs = faqItemRefs.current.filter(Boolean);
    gatedReveal(
      faqs,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" },
      faqSectionRef.current,
      "top 78%"
    );

    /* The bottom CTA is <FinalCTACard>, which owns its own scroll-in
       reveal + gold wipe — no page-level timeline needed here. */

    return () => {
      cancelled = true;
      ScrollTrigger.getAll().forEach((t) => t.kill());
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

            The pill background slides between Monthly and Annual via a
            CSS transform driven by inline style. When Annual is active,
            the pill is on the right (gold), the Annual button text goes
            dark (visible against gold), and the −20% badge contrasts.
            On Monthly, the pill sits on the left and the −20% badge is
            visible in gold as a teaser for the alternative.
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

          Each card has a big editorial section numeral in the background
          (very low opacity, behind content via z-index:-1 inside an
          isolated stacking context). Pro carries a "Most Popular" pill
          badge above its number prefix and a subtle gold tint on the
          card background. When billing=annual, Pro's price block shows
          a strike-through of the monthly price + a "Save $X/yr" call-out
          in gold.
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
              <ul className={styles.tierList}>
                {tier.features.map((f, i) => (
                  <li key={i} className={styles.tierItem}>
                    <span className={styles.tierItemMark}>
                      <CheckIcon size={12} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
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

        <div className={styles.matrix}>
          <div className={styles.matrixHeader}>
            <div className={styles.matrixHeaderCell}>Feature</div>
            <div className={styles.matrixHeaderCell}>Pro</div>
            <div className={styles.matrixHeaderCell}>Enterprise</div>
          </div>
          {MATRIX_ROWS.map((row, ri) => (
            <div
              key={ri}
              ref={(el) => (matrixRowRefs.current[ri] = el)}
              className={styles.matrixRow}
            >
              <div className={styles.matrixLabel}>{row.label}</div>
              <div className={styles.matrixCell}>
                {row.pro === true ? (
                  <span className={styles.matrixCheck}>
                    <CheckIcon size={14} />
                  </span>
                ) : row.pro === false ? (
                  <span className={styles.matrixDash}>—</span>
                ) : (
                  row.pro
                )}
              </div>
              <div className={styles.matrixCell}>
                {row.enterprise === true ? (
                  <span className={styles.matrixCheck}>
                    <CheckIcon size={14} />
                  </span>
                ) : row.enterprise === false ? (
                  <span className={styles.matrixDash}>—</span>
                ) : (
                  row.enterprise
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section ref={faqSectionRef} className={styles.faqSection}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionHeadline}>
            Common{" "}
            <span className={styles.sectionHeadlineAccent}>questions.</span>
          </h2>
        </div>

        <div className={styles.faqList}>
          {FAQS.map((faq, fi) => {
            const isOpen = openFaq === fi;
            return (
              <div
                key={fi}
                ref={(el) => (faqItemRefs.current[fi] = el)}
                className={styles.faqItem}
              >
                <button
                  type="button"
                  className={styles.faqHeader}
                  onClick={() => onFaqClick(fi)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.faqQuestion}>{faq.q}</span>
                  <span
                    className={`${styles.faqIcon} ${
                      isOpen ? styles.faqIconOpen : ""
                    }`}
                  >
                    <PlusIcon />
                  </span>
                </button>
                <div
                  className={`${styles.faqBody} ${
                    isOpen ? styles.faqBodyOpen : ""
                  }`}
                >
                  <p className={styles.faqAnswer}>{faq.a}</p>
                </div>
              </div>
            );
          })}
        </div>
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
