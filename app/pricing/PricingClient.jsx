"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";
import CornerButton from "@/components/shared/CornerButton";
import styles from "./Pricing.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ── Pricing config — edit prices here ── */
const PRICING = {
  pro: {
    monthly: 299,
    annual: 239,
  },
};

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

const FINAL_H_LINES = [
  [
    { t: "Need", a: false },
    { t: "a", a: false },
    { t: "custom", a: false },
  ],
  [{ t: "quote?", a: true }],
];

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
  const bracketTLRef = useRef(null);
  const bracketBRRef = useRef(null);
  const tierRefs = useRef([]);
  const matrixSectionRef = useRef(null);
  const matrixRowRefs = useRef([]);
  const faqSectionRef = useRef(null);
  const faqItemRefs = useRef([]);
  const finalCtaRef = useRef(null);
  const finalBracketTLRef = useRef(null);
  const finalBracketBRRef = useRef(null);

  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  const [billing, setBilling] = useState("monthly");
  const [openFaq, setOpenFaq] = useState(null);

  /* Toggle underline positioning */
  const toggleRowRef = useRef(null);
  const monthlyBtnRef = useRef(null);
  const annualBtnRef = useRef(null);
  const underlineRef = useRef(null);

  const moveUnderline = useCallback(() => {
    if (!toggleRowRef.current || !underlineRef.current) return;
    const targetBtn =
      billing === "monthly" ? monthlyBtnRef.current : annualBtnRef.current;
    if (!targetBtn) return;
    const rowPos = toggleRowRef.current.getBoundingClientRect();
    const btnPos = targetBtn.getBoundingClientRect();
    underlineRef.current.style.left = `${btnPos.left - rowPos.left}px`;
    underlineRef.current.style.width = `${btnPos.width}px`;
  }, [billing]);

  useEffect(() => {
    moveUnderline();
    window.addEventListener("resize", moveUnderline);
    return () => window.removeEventListener("resize", moveUnderline);
  }, [moveUnderline]);

  /* Intro + scroll animations */
  useEffect(() => {
    window.scrollTo(0, 0);
    const hero = heroRef.current;
    if (!hero) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    /* Hero brackets */
    tl.to(
      bracketTLRef.current,
      { width: 56, height: 56, opacity: 0.25, duration: 0.6 },
      0
    ).to(
      bracketBRRef.current,
      { width: 56, height: 56, opacity: 0.25, duration: 0.6 },
      0.1
    );

    /* Headline letters */
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
      0.2
    );

    /* Sub letters */
    const sLetters = hero.querySelectorAll(`.${styles.subLetter}`);
    tl.to(
      sLetters,
      {
        opacity: 1,
        y: "0%",
        duration: 0.4,
        stagger: 0.006,
        ease: "power3.out",
      },
      0.45
    );

    /* Toggle */
    tl.to(`.${styles.toggleWrap}`, { opacity: 1, duration: 0.5 }, 0.85);

    /* Tier cards */
    const tiers = tierRefs.current.filter(Boolean);
    gsap.to(tiers, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: tiers[0],
        start: "top 82%",
      },
    });

    /* Matrix rows */
    const rows = matrixRowRefs.current.filter(Boolean);
    gsap.fromTo(
      rows,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.035,
        ease: "power2.out",
        scrollTrigger: {
          trigger: matrixSectionRef.current,
          start: "top 75%",
        },
      }
    );

    /* FAQ items */
    const faqs = faqItemRefs.current.filter(Boolean);
    gsap.fromTo(
      faqs,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: {
          trigger: faqSectionRef.current,
          start: "top 78%",
        },
      }
    );

    /* Final CTA — brackets + content */
    const ctl = gsap.timeline({
      scrollTrigger: { trigger: finalCtaRef.current, start: "top 65%" },
      defaults: { ease: "power4.out" },
    });
    ctl
      .to(finalBracketTLRef.current, {
        width: 48,
        height: 48,
        opacity: 0.25,
        duration: 0.5,
      })
      .to(
        finalBracketBRRef.current,
        { width: 48, height: 48, opacity: 0.25, duration: 0.5 },
        "-=0.3"
      )
      .to(
        finalCtaRef.current?.querySelectorAll(`.${styles.headLetter}`),
        { opacity: 1, y: "0%", rotateX: 0, duration: 0.5, stagger: 0.014 },
        "-=0.3"
      )
      .to(`.${styles.finalSub}`, { opacity: 1, y: 0, duration: 0.4 }, "-=0.2")
      .to(
        `.${styles.finalCtas}`,
        { opacity: 1, y: 0, duration: 0.4 },
        "-=0.15"
      );

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  /* Price morph when toggle changes */
  const proPriceRef = useRef(null);
  useEffect(() => {
    if (!proPriceRef.current) return;
    gsap.fromTo(
      proPriceRef.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
    );
  }, [billing]);

  const proPrice =
    billing === "annual" ? PRICING.pro.annual : PRICING.pro.monthly;
  const proAnnualTotal = PRICING.pro.annual * 12;

  /* Render helpers */
  const renderHeadline = (lines, lineCls, letterCls, accentCls, spaceCls) =>
    lines.map((line, li) => (
      <span key={li} className={lineCls}>
        {line.map((w, wi) => (
          <span key={wi}>
            <span className="word">
              {w.t.split("").map((c, ci) => (
                <span
                  key={`${wi}-${ci}`}
                  className={`${letterCls} ${w.a ? accentCls : ""}`}
                >
                  {c}
                </span>
              ))}
            </span>
            {wi < line.length - 1 && <span className={spaceCls} />}
          </span>
        ))}
      </span>
    ));

  const renderSub = (text) => {
    const words = text.split(" ");
    return (
      <span className={styles.subLine}>
        {words.map((word, wi) => (
          <span key={wi}>
            <span className="word">
              {word.split("").map((c, ci) => (
                <span key={ci} className={styles.subLetter}>
                  {c}
                </span>
              ))}
            </span>
            {wi < words.length - 1 && <span className={styles.subSpace} />}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className={styles.page}>
      <Nav onDemo={openDemo} />

      {/* ── Hero ── */}
      <section ref={heroRef} className={styles.hero}>
        <div
          ref={bracketTLRef}
          className={`${styles.bracket} ${styles.bracketTL}`}
        />
        <div
          ref={bracketBRRef}
          className={`${styles.bracket} ${styles.bracketBR}`}
        />

        <h1 className={styles.headline}>
          {renderHeadline(
            H_LINES,
            styles.headLine,
            styles.headLetter,
            styles.headLetterAccent,
            styles.headSpace
          )}
        </h1>

        <div className={styles.subWrap}>{renderSub(SUB_TEXT)}</div>

        <div className={styles.toggleWrap}>
          <div
            ref={toggleRowRef}
            className={styles.toggleRow}
            role="tablist"
            aria-label="Billing period"
          >
            <button
              ref={monthlyBtnRef}
              role="tab"
              aria-selected={billing === "monthly"}
              className={`${styles.toggleBtn} ${
                billing === "monthly" ? styles.toggleBtnActive : ""
              }`}
              onClick={() => setBilling("monthly")}
            >
              Monthly
            </button>
            <span className={styles.toggleDivider} />
            <button
              ref={annualBtnRef}
              role="tab"
              aria-selected={billing === "annual"}
              className={`${styles.toggleBtn} ${
                billing === "annual" ? styles.toggleBtnActive : ""
              }`}
              onClick={() => setBilling("annual")}
            >
              Annual
            </button>
            <div ref={underlineRef} className={styles.toggleUnderline} />
          </div>
          <span className={styles.toggleSave}>— Save 20% annually —</span>
        </div>
      </section>

      {/* ── Tier cards ── */}
      <section className={styles.tiers}>
        {TIERS.map((tier, ti) => (
          <div
            key={tier.key}
            ref={(el) => (tierRefs.current[ti] = el)}
            className={`${styles.tier} ${
              tier.featured ? styles.tierFeatured : ""
            }`}
          >
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
                    <span className={styles.priceCurrency}>$</span>
                    <span className={styles.priceValue}>{fmt(proPrice)}</span>
                  </div>
                  <div className={styles.priceUnit}>per warehouse / month</div>
                  <div className={styles.priceNote}>
                    {billing === "annual"
                      ? `Billed annually · $${fmt(proAnnualTotal)}/yr`
                      : "Billed monthly · Cancel anytime"}
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
              <CornerButton variant={tier.ctaVariant} onClick={openDemo}>
                {tier.cta}
              </CornerButton>
            </div>

            <div className={styles.tierDivider} />

            <div className={styles.tierIncludesLabel}>{tier.includesLabel}</div>
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
                  onClick={() => setOpenFaq(isOpen ? null : fi)}
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
      <section ref={finalCtaRef} className={styles.finalCta}>
        <div className="dot-grid" />
        <div ref={finalBracketTLRef} className={styles.finalBracketTL} />
        <div ref={finalBracketBRRef} className={styles.finalBracketBR} />

        <div className={styles.finalInner}>
          <h2 className={styles.finalHeadline}>
            {renderHeadline(
              FINAL_H_LINES,
              styles.headLine,
              styles.headLetter,
              styles.finalHeadlineAccent,
              styles.headSpace
            )}
          </h2>
          <p className={styles.finalSub}>
            Tell us about your operation — warehouse count, SKU volume,
            integration needs — and we&apos;ll put together a tailored proposal.
          </p>
          <div className={styles.finalCtas}>
            <CornerButton variant="primary" onClick={openDemo}>
              Request a Demo
            </CornerButton>
            <CornerButton variant="ghost" onClick={openDemo}>
              Talk to Sales
            </CornerButton>
          </div>
        </div>
      </section>

      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
