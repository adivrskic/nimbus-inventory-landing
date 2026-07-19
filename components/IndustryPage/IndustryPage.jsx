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
import Accordion from "@/components/shared/Accordion";
import { useDemo } from "@/lib/DemoContext";
import { resetScroll } from "@/lib/resetScroll";
import styles from "./IndustryPage.module.css";

gsap.registerPlugin(ScrollTrigger);

/* Generic fallback workflow. Used when an industry in industryData.js
   doesn't supply its own per-industry `workflow`. All 8 current
   industries ship with their own; this fallback exists for new
   industries added in the future before someone has written
   industry-specific steps. */
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

/* All data arrives as props resolved by the server page
   (app/industry/[slug]/page.js): `industry` is the single matched entry,
   `faqs` already carries the DEFAULT_INDUSTRY_FAQS fallback (matching the
   FAQ JSON-LD), `indexNum`/`totalIndustries` feed the hero strip, and
   `others` is the trimmed 3-entry cross-link list. This component must
   NOT import industryData.js — it's a client component, and the import
   would ship the whole ~44 KB module in the route's JS chunk. */
export default function IndustryPage({
  industry,
  faqs,
  indexNum,
  totalIndustries,
  others,
}) {
  /* Demo modal lives in app/layout.js via DemoHost — pull the opener
     from context instead of expecting a prop the wrapper never passes. */
  const { openDemo } = useDemo();

  const pageRef = useRef(null);
  const heroRef = useRef(null);

  /* Two glow-cards contexts — workflow grid (§02) and cross-link grid.
     Each container needs its own ref so mousemove tracking and 3D tilt
     are scoped per-grid. */
  const workflowGlowRef = useGlowCards();
  const crossGlowRef = useGlowCards();

  useEffect(() => {
    resetScroll();
    if (!industry || !heroRef.current) return;

    /* Hoisted above the gsap.context — referenced by both the intro
       timeline's onComplete (inside) and the cleanup closure (outside). */
    let cancelled = false;

    /* Scope all GSAP work to a context. ctx.revert() on cleanup tears down
       ONLY the tweens/ScrollTriggers created here — the previous
       ScrollTrigger.getAll().forEach((t) => t.kill()) killed triggers owned
       by still-mounted siblings (FinalCTACard, Footer) when this effect
       re-ran on an industry change — and restores elements to their
       CSS-declared initial state so the intro replays cleanly for the new
       content. */
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      /* Hero intro reads strictly top-to-bottom: index strip -> title letters
         -> subtitle -> CTAs. Each step is anchored to the END of the previous
         one (">" with a small negative offset for a gentle overlap) instead of
         a fixed start time, so the lower elements never resolve before the
         per-letter title does. Order holds regardless of headline length. */

      /* Index strip (top of the hero) */
      tl.fromTo(
        `.${styles.heroIndex}`,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.3 },
        0
      );

      /* Per-letter title — starts just as the index lands. */
      const letters = heroRef.current.querySelectorAll(`.${styles.heroLetter}`);
      tl.to(
        letters,
        { opacity: 1, y: "0%", rotateX: 0, duration: 0.55, stagger: 0.018 },
        ">-0.05"
      );

      /* Subtitle — anchored to the END of the title stagger. */
      tl.fromTo(
        `.${styles.heroSub}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.42 },
        ">-0.2"
      );

      /* CTAs — follow the subtitle. */
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
      /* Build a paused reveal tween + a once-only trigger that plays it
         through the intro gate. Mirrors the original fromTo vars exactly. */
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

      /* Sections — each section's content fades up, the big numeral scales-
         and-fades. The FAQ items are now the shared Accordion's
         [data-accordion-item] elements (they previously used inline styles and
         didn't animate at all — now they reveal with their section). */
      if (!pageRef.current) return;
      const sections = pageRef.current.querySelectorAll(`.${styles.section}`);
      sections.forEach((sec) => {
        const num = sec.querySelector(`.${styles.sectionNum}`);
        const content = sec.querySelectorAll(
          `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.pair}, .${styles.workflowStep}, .${styles.stat}, .${styles.quote}, [data-accordion-item]`
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
              stagger: 0.05,
              ease: "power3.out",
            },
            sec,
            "clamp(top 90%)"
          );
        }
      });

      /* Cross-link cards */
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
  }, [industry]);

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

  /* Workflow content. Prefer the per-industry `workflow` field for
     industry-specific verbs; fall back to the generic 4-step WORKFLOW
     above only if the industry didn't ship its own. */
  const workflow = industry.workflow ?? WORKFLOW;

  /* FAQ content arrives via the `faqs` prop, already resolved with the
     DEFAULT_INDUSTRY_FAQS fallback by app/industry/[slug]/page.js — the
     same value that drives the FAQ JSON-LD schema there, so the visible
     section and the schema payload can't drift apart. */

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

          {/* Workflow grid is a glow-cards container. Each step gets the
              glow-card outer/inner pattern. Uses the per-industry workflow
              from industryData.js, falling back to the generic WORKFLOW
              const above only if the industry didn't ship its own. */}
          <div
            ref={workflowGlowRef}
            className={`${styles.workflow} glow-cards`}
          >
            {workflow.map((w, i) => (
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

      {/* ── 04 · FAQ (per-industry, with fallback) — shared Accordion ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          04
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>FAQ</div>
          <h2 className={styles.sectionTitle}>
            {industry.title} questions, answered.
          </h2>
          <p className={styles.sectionDesc}>
            The questions buyers in {industry.title.toLowerCase()} ask before
            they sign. If yours isn&apos;t here, the team can answer it on a
            discovery call.
          </p>

          {/* Was an inline-styled flat list (FAQ_STYLES); now the shared
              Accordion — interactive + consistent with every other page. */}
          <Accordion items={faqs} initiallyHidden />
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
