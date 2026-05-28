"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import useGlowCards from "@/lib/useGlowCards";
import { useDemo } from "@/lib/DemoContext";
import SplitText from "@/components/shared/SplitText";
import FinalCTACard from "@/components/FinalCTACard/FinalCTACard";
import { COMPETITORS, COMPARE_SLUGS } from "./compareData";
import styles from "./Compare.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────
   MATRIX CELL — gold check, muted dash, or amber half-circle
───────────────────────────────────────────────────── */
function MatrixCell({ value, accent = false }) {
  if (value === "yes") {
    return (
      <span
        className={`${styles.matrixMark} ${
          accent ? styles.matrixMarkYesAccent : styles.matrixMarkYes
        }`}
        aria-label="Supported"
      >
        ✓
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span
        className={`${styles.matrixMark} ${styles.matrixMarkPartial}`}
        aria-label="Partial"
      >
        ◐
      </span>
    );
  }
  if (value === "no") {
    return (
      <span
        className={`${styles.matrixMark} ${styles.matrixMarkNo}`}
        aria-label="Not supported"
      >
        —
      </span>
    );
  }
  /* fallthrough — display as text label */
  return <span className={styles.matrixMarkText}>{value}</span>;
}

export default function CompareClient({ slug }) {
  const competitor = COMPETITORS[slug];
  const pageRef = useRef(null);

  /* Compare pages are inherently about migration — every CTA here opens
     the demo modal with topic "migration" so the lead lands in sales
     with the right context already attached. */
  const { openDemo } = useDemo();

  /* Glow-card wiring for the cross-link grid at the bottom of the page. */
  const glowRef = useGlowCards();

  /* Other comparisons for cross-link grid */
  const others = COMPARE_SLUGS.filter((s) => s !== slug).map((s) => ({
    slug: s,
    ...COMPETITORS[s],
  }));

  useEffect(() => {
    /* ──────────────────────────────────────────────────────────────────
       Reset scroll on slug change. (Load-bearing — see original notes.)

       Lenis owns the scroll position globally (window.__lenis). A plain
       window.scrollTo() gets snapped back by Lenis's RAF loop, so we use
       lenis.scrollTo(immediate+force) which updates both the browser and
       Lenis's internal state. The double-call (sync + rAF) covers the case
       where the transition overlay finishes fading after the new component
       mounts. Kept inline so it runs BEFORE the ScrollTrigger.refresh()
       below — triggers must be measured at scroll=0.
    ─────────────────────────────────────────────────────────────────── */
    const resetScroll = () => {
      if (typeof window === "undefined") return;
      const lenis = window.__lenis;
      if (lenis) {
        lenis.scrollTo(0, { immediate: true, force: true });
      } else {
        window.scrollTo(0, 0);
      }
    };
    resetScroll();
    const rafId = requestAnimationFrame(resetScroll);

    if (!competitor || !pageRef.current) {
      return () => cancelAnimationFrame(rafId);
    }

    /* ── Hero intro — uniform with IndustryPage ──────────────────────────
       Reads strictly top-to-bottom: index strip -> "Nautilus vs X" mark ->
       per-letter title -> description -> CTAs. Each step is anchored to the
       END of the previous one (">" with a small negative overlap) rather
       than a fixed start time, so the lower elements never resolve before
       the per-letter title does — order holds regardless of headline
       length. The mark keeps its signature beat (brand slides in, "vs"
       pops, competitor slides in) but is now chained relatively. */
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(
      `.${styles.heroIndex}`,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.4 },
      0
    );
    tl.fromTo(
      `.${styles.markBrand}`,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.55 },
      ">-0.1"
    );
    tl.fromTo(
      `.${styles.markVs}`,
      { opacity: 0, scale: 0.6 },
      { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" },
      ">-0.25"
    );
    tl.fromTo(
      `.${styles.markCompetitor}`,
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.55 },
      ">-0.2"
    );

    /* Per-letter title — start shape comes from .heroLetter CSS. */
    const letters = pageRef.current.querySelectorAll(`.${styles.heroLetter}`);
    tl.to(
      letters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.75, stagger: 0.018 },
      ">-0.1"
    );

    tl.fromTo(
      `.${styles.heroDesc}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55 },
      ">-0.2"
    );
    tl.fromTo(
      `.${styles.heroCTA}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5 },
      ">-0.15"
    );

    /* ── Gate the scroll reveals behind the hero intro ──────────────────
       A reveal that fires on initial load is QUEUED and released the moment
       the intro completes; a section scrolled to later plays immediately.
       Removes the initial-viewport race without delaying below-fold
       content. */
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
    const gatedReveal = (targets, fromVars, toVars, trigger, start) => {
      if (!trigger) return;
      const tween = gsap.fromTo(targets, fromVars, { ...toVars, paused: true });
      ScrollTrigger.create({
        trigger,
        start,
        once: true,
        onEnter: () => runWhenIntroDone(() => tween.play()),
      });
    };

    /* Section reveals — content fades up, the big numeral scales-and-fades. */
    const sections = pageRef.current.querySelectorAll(`.${styles.section}`);
    sections.forEach((sec) => {
      const num = sec.querySelector(`.${styles.sectionNum}`);
      /* .honestCard MUST stay in this list — §04's wrapper is opacity:0
         in CSS, and opacity is multiplicative, so without animating the
         wrapper its children never become visible. */
      const content = sec.querySelectorAll(
        `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.quickCol}, .${styles.matrixRow}, .${styles.reason}, .${styles.honestCard}, .${styles.honestStrength}`
      );

      if (num) {
        gatedReveal(
          num,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.9, ease: "power3.out" },
          sec,
          "top 80%"
        );
      }
      if (content.length > 0) {
        gatedReveal(
          content,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.07,
            ease: "power3.out",
          },
          sec,
          "top 78%"
        );
      }
    });

    /* Cross-link cards (only rendered when others.length > 0). */
    const crossLinks = pageRef.current.querySelector(`.${styles.crossLinks}`);
    if (crossLinks) {
      gatedReveal(
        `.${styles.crossCard}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" },
        crossLinks,
        "top 80%"
      );
    }

    /* Recalc against the freshly-reset (scroll=0) layout. */
    ScrollTrigger.refresh();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [slug, competitor]);

  if (!competitor) {
    return (
      <div className={styles.page}>
        <Nav />
        <div className={styles.notFound}>
          <div className={styles.notFoundLabel}>404</div>
          <h1>Comparison not found.</h1>
          <TransitionLink href="/" className={styles.backLink}>
            ← Back to home
          </TransitionLink>
        </div>
        <Footer />
      </div>
    );
  }

  /* Build the quick-compare pairs (Nautilus side, competitor side, matched
     by index for visual alignment) */
  const quickPairs = competitor.quickCompare.Nautilus.map((nm, i) => ({
    Nautilus: nm,
    competitor: competitor.quickCompare.competitor[i],
  }));

  return (
    <div ref={pageRef} className={styles.page}>
      <Nav />

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroIndex}>
          <span>Compare</span>
          <span className={styles.heroIndexDot} />
          <span className={styles.heroIndexCategory}>
            {competitor.category}
          </span>
        </div>

        {/* The Nautilus vs Competitor mark */}
        <div className={styles.mark}>
          <span className={styles.markBrand}>Nautilus</span>
          <span className={styles.markVs} aria-hidden="true">
            vs
          </span>
          <span className={styles.markCompetitor}>{competitor.name}</span>
        </div>

        <h1 className={styles.heroTitle}>
          <SplitText
            lines={competitor.headline}
            accentWord={competitor.accentWord}
            classNames={{
              line: styles.heroLine,
              lineInner: styles.heroLineInner,
              letter: styles.heroLetter,
              accent: styles.heroLetterAccent,
              space: styles.heroSpace,
            }}
          />
        </h1>
        <p className={styles.heroDesc}>{competitor.heroDesc}</p>

        <div className={styles.heroCTA}>
          <CornerButton onClick={() => openDemo("migration")}>
            See a live comparison
          </CornerButton>
          <TransitionLink href="/pricing" className={styles.heroSecondary}>
            See Nautilus pricing →
          </TransitionLink>
        </div>
      </section>

      {/* ── §01 · AT A GLANCE ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          01
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>At a glance</div>
          <h2 className={styles.sectionTitle}>
            Nautilus vs {competitor.name}, quickly.
          </h2>
          <p className={styles.sectionDesc}>
            Five positioning differences that matter most when teams are
            evaluating both.
          </p>

          <div className={styles.quickCompare}>
            {/* Nautilus column */}
            <div className={`${styles.quickCol} ${styles.quickColNautilus}`}>
              <div className={styles.quickColHead}>
                <span className={styles.quickColName}>Nautilus</span>
                <span className={styles.quickColTag}>
                  Modern · cloud-native
                </span>
              </div>
              <ul className={styles.quickList}>
                {quickPairs.map((p, i) => (
                  <li key={i} className={styles.quickItem}>
                    <span className={styles.quickCheck}>✓</span>
                    <span>{p.Nautilus}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Competitor column */}
            <div className={`${styles.quickCol} ${styles.quickColCompetitor}`}>
              <div className={styles.quickColHead}>
                <span className={styles.quickColName}>{competitor.name}</span>
                <span className={styles.quickColTagMuted}>
                  {competitor.category}
                </span>
              </div>
              <ul className={styles.quickList}>
                {quickPairs.map((p, i) => (
                  <li key={i} className={styles.quickItemMuted}>
                    <span className={styles.quickDash}>—</span>
                    <span>{p.competitor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── §02 · FEATURE MATRIX ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          02
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Feature matrix</div>
          <h2 className={styles.sectionTitle}>Where the difference shows.</h2>
          <p className={styles.sectionDesc}>
            {competitor.matrix.length} features, side-by-side. ✓ supported, ◐
            partial, — not supported.
          </p>

          <div className={styles.matrix}>
            <div className={styles.matrixHead}>
              <div className={styles.matrixHeadFeature}>Feature</div>
              <div className={styles.matrixHeadBrand}>Nautilus</div>
              <div className={styles.matrixHeadCompetitor}>
                {competitor.name}
              </div>
            </div>

            {competitor.matrix.map((row, i) => (
              <div key={i} className={styles.matrixRow}>
                <div className={styles.matrixFeature}>{row.feature}</div>
                <div className={styles.matrixCol}>
                  <MatrixCell value={row.Nautilus} accent />
                </div>
                <div className={styles.matrixCol}>
                  <MatrixCell value={row.competitor} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── §03 · WHY TEAMS SWITCH ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          03
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Why teams switch</div>
          <h2 className={styles.sectionTitle}>
            Common reasons teams move from {competitor.name}.
          </h2>
          <p className={styles.sectionDesc}>
            The four patterns we hear most in onboarding conversations with
            customers migrating off {competitor.name}.
          </p>

          <div className={styles.reasons}>
            {competitor.reasons.map((r, i) => (
              <div key={i} className={styles.reason}>
                <div className={styles.reasonLeft}>
                  <span className={styles.reasonNum}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.reasonMark} />
                </div>
                <div className={styles.reasonRight}>
                  <h3 className={styles.reasonTitle}>{r.title}</h3>
                  <p className={styles.reasonDesc}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── §04 · HONEST TAKE ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          04
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Honest take</div>
          <h2 className={styles.sectionTitle}>
            When {competitor.name} might fit you better.
          </h2>
          <p className={styles.sectionDesc}>
            We&apos;re not the right choice for everyone. If any of these match
            your situation, {competitor.name} is likely the better call —
            we&apos;d rather tell you that up front than waste a sales cycle.
          </p>

          <div className={styles.honestCard}>
            <div className={styles.honestCardLabel}>
              Stay with {competitor.name} if:
            </div>
            <ul className={styles.honestList}>
              {competitor.competitorStrengths.map((s, i) => (
                <li key={i} className={styles.honestStrength}>
                  <span className={styles.honestStrengthMark} />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <div className={styles.honestCardFoot}>
              If none of these apply, you&apos;re likely a good fit for
              Nautilus. The next step is a 30-minute call where we walk through
              your actual operation.
            </div>
          </div>
        </div>
      </section>

      {/* ── CROSS-LINKS — glow-card grid ── */}
      {others.length > 0 && (
        <section className={styles.crossLinks}>
          <div className={styles.crossLinksLabel}>Other comparisons</div>
          <div ref={glowRef} className={`${styles.crossLinksGrid} glow-cards`}>
            {others.map((o) => (
              <TransitionLink
                key={o.slug}
                href={`/compare/${o.slug}`}
                className={`${styles.crossCard} glow-card`}
              >
                <div className="glow-card-border" />
                <div className={`${styles.crossCardInner} glow-card-content`}>
                  <div className={styles.crossCardMeta}>vs</div>
                  <div className={styles.crossCardTitle}>{o.name}</div>
                  <div className={styles.crossCardCategory}>{o.category}</div>
                  <div className={styles.crossCardArrow}>→</div>
                </div>
              </TransitionLink>
            ))}
          </div>
        </section>
      )}

      {/* ── FINAL CTA ── */}
      <FinalCTACard
        label="Ready when you are"
        title="Let's show you Nautilus running on your data."
        desc={`A 30-minute call with a Nautilus engineer. We'll walk through your current ${competitor.name} setup and show how each piece would work in Nautilus — including the migration path.`}
        primaryAction={{
          onClick: () => openDemo("migration"),
          label: "Book the demo",
        }}
        secondaryAction={{
          href: "/calculator",
          label: "Or run the ROI numbers →",
        }}
      />

      <Footer />
    </div>
  );
}
