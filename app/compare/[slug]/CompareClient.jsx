"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/gsap";
import { resetScroll } from "@/lib/resetScroll";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import useGlowCards from "@/lib/useGlowCards";
import { useDemo } from "@/lib/DemoContext";
import SplitText from "@/components/shared/SplitText";
import FinalCTACard from "@/components/FinalCTACard/FinalCTACard";
import FeatureMatrix from "@/components/shared/FeatureMatrix";
import CheckList from "@/components/shared/CheckList";
import NumberedList from "@/components/shared/NumberedList";
import styles from "./Compare.module.css";

gsap.registerPlugin(ScrollTrigger);

/* `competitor` (the single matched entry, full object) and `others`
   (cross-link list trimmed to slug/name/category) are resolved
   server-side in app/compare/[slug]/page.js so this client chunk never
   bundles the full compareData module. */
export default function CompareClient({ competitor, others }) {
  const pageRef = useRef(null);

  /* Compare pages are inherently about migration — every CTA here opens
     the demo modal with topic "migration" so the lead lands in sales
     with the right context already attached. */
  const { openDemo } = useDemo();

  /* Glow-card wiring for the cross-link grid at the bottom of the page. */
  const glowRef = useGlowCards();

  useEffect(() => {
    /* ──────────────────────────────────────────────────────────────────
       Reset scroll on slug change. (Load-bearing — see original notes.)

       Lenis owns the scroll position globally (window.__lenis). A plain
       window.scrollTo() gets snapped back by Lenis's RAF loop, so the
       shared resetScroll() helper goes through lenis.scrollTo
       (immediate+force), which updates both the browser and Lenis's
       internal state. The double-call (sync + rAF) covers the case
       where the transition overlay finishes fading after the new component
       mounts. Runs BEFORE the ScrollTrigger.refresh() below — triggers
       must be measured at scroll=0.
    ─────────────────────────────────────────────────────────────────── */
    resetScroll();
    const rafId = requestAnimationFrame(resetScroll);

    if (!competitor || !pageRef.current) {
      return () => cancelAnimationFrame(rafId);
    }

    /* Hoisted so the effect cleanup can reach it from outside the gsap
       context callback. */
    let cancelled = false;

    const ctx = gsap.context(() => {
      /* Reduced motion: jump every animated element to its final state and
         skip the intro choreography + gated reveals. Still cancels the
         scroll-reset rAF on cleanup. SplitText keeps the sr-only headline.
         The feature-matrix rows are the shared <FeatureMatrix>'s
         [data-matrix-row] elements (was .matrixRow). */
      if (prefersReducedMotion()) {
        gsap.set(
          pageRef.current.querySelectorAll(
            `.${styles.heroLetter}, .${styles.heroIndex}, .${styles.markBrand}, .${styles.markVs}, .${styles.markCompetitor}, .${styles.heroDesc}, .${styles.heroCTA}, .${styles.sectionNum}, .${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.quickCol}, [data-matrix-row], [data-list-item], .${styles.honestCard}, .${styles.crossCard}`
          ),
          { opacity: 1, x: 0, y: 0, scale: 1, rotateX: 0 }
        );
        return;
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
        { opacity: 1, y: 0, duration: 0.3 },
        0
      );
      tl.fromTo(
        `.${styles.markBrand}`,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.42 },
        ">-0.1"
      );
      tl.fromTo(
        `.${styles.markVs}`,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
        ">-0.25"
      );
      tl.fromTo(
        `.${styles.markCompetitor}`,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.42 },
        ">-0.2"
      );

      /* Per-letter title — start shape comes from .heroLetter CSS. */
      const letters = pageRef.current.querySelectorAll(`.${styles.heroLetter}`);
      tl.to(
        letters,
        { opacity: 1, y: "0%", rotateX: 0, duration: 0.55, stagger: 0.018 },
        ">-0.1"
      );

      tl.fromTo(
        `.${styles.heroDesc}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.42 },
        ">-0.2"
      );
      tl.fromTo(
        `.${styles.heroCTA}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4 },
        ">-0.15"
      );

      /* ── Gate the scroll reveals behind the hero intro ──────────────────
         A reveal that fires on initial load is QUEUED and released the moment
         the intro completes; a section scrolled to later plays immediately.
         Removes the initial-viewport race without delaying below-fold
         content. */
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

      /* Section reveals — content fades up, the big numeral scales-and-fades.
         The §02 matrix rows are now the shared <FeatureMatrix>'s
         [data-matrix-row] elements (was .matrixRow); everything else is
         unchanged. */
      const sections = pageRef.current.querySelectorAll(`.${styles.section}`);
      sections.forEach((sec) => {
        const num = sec.querySelector(`.${styles.sectionNum}`);
        /* .honestCard MUST stay in this list — §04's wrapper is opacity:0
           in CSS, and opacity is multiplicative, so without animating the
           wrapper its children never become visible. */
        const content = sec.querySelectorAll(
          `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.quickCol}, [data-matrix-row], [data-list-item], .${styles.honestCard}`
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

      /* Cross-link cards (only rendered when others.length > 0). */
      const crossLinks = pageRef.current.querySelector(`.${styles.crossLinks}`);
      if (crossLinks) {
        gatedReveal(
          `.${styles.crossCard}`,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power3.out" },
          crossLinks,
          "clamp(top 90%)"
        );
      }

      /* Recalc against the freshly-reset (scroll=0) layout. */
      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ctx.revert();
    };
  }, [competitor]);

  if (!competitor) {
    return (
      <div className={styles.page}>
        {/* No <Nav /> — app/layout.js renders one for every route. */}
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
      {/* No <Nav /> — app/layout.js renders one for every route; a second
          duplicated the landmark and every nav link in the tab order. */}

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
              <CheckList
                items={quickPairs.map((p) => p.Nautilus)}
                marker="check"
                tone="strong"
              />
            </div>

            {/* Competitor column */}
            <div className={`${styles.quickCol} ${styles.quickColCompetitor}`}>
              <div className={styles.quickColHead}>
                <span className={styles.quickColName}>{competitor.name}</span>
                <span className={styles.quickColTagMuted}>
                  {competitor.category}
                </span>
              </div>
              <CheckList
                items={quickPairs.map((p) => p.competitor)}
                marker="dash"
                tone="muted"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── §02 · FEATURE MATRIX — shared <FeatureMatrix> ── */}
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

          <FeatureMatrix
            columns={[
              { label: "Nautilus", tone: "accent" },
              { label: competitor.name, tone: "muted" },
            ]}
            rows={competitor.matrix.map((row) => ({
              feature: row.feature,
              values: [row.Nautilus, row.competitor],
            }))}
            initiallyHidden
          />
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

          <NumberedList items={competitor.reasons} divided initiallyHidden />
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
            <CheckList
              items={competitor.competitorStrengths}
              marker="square"
              tone="strong"
              size="lg"
              initiallyHidden
              className={styles.honestStrengths}
            />
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
