"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import { useDemo } from "@/lib/DemoContext";
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

/* ─────────────────────────────────────────────────────
   PER-LETTER TITLE with optional italic-gold accent word
───────────────────────────────────────────────────── */
function renderHeadline(lines, accentWord) {
  return lines.map((line, li) => (
    <span key={li} className={styles.heroLine}>
      <span className={styles.heroLineInner}>
        {line.split(" ").map((word, wi) => {
          const isAccent =
            accentWord &&
            word.replace(/[.,!?]/g, "").toLowerCase() ===
              accentWord.toLowerCase();
          return (
            <span key={wi}>
              <span className="word">
                {word.split("").map((c, ci) => (
                  <span
                    key={`${li}-${wi}-${ci}`}
                    className={`${styles.heroLetter} ${
                      isAccent ? styles.heroLetterAccent : ""
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </span>
              {wi < line.split(" ").length - 1 && (
                <span className={styles.heroSpace} />
              )}
            </span>
          );
        })}
      </span>
    </span>
  ));
}

export default function CompareClient({ slug }) {
  const competitor = COMPETITORS[slug];
  const pageRef = useRef(null);
  const heroRef = useRef(null);

  /* Compare pages are inherently about migration — every CTA here opens
     the demo modal with topic "migration" so the lead lands in sales
     with the right context already attached. */
  const { openDemo } = useDemo();

  /* Other comparisons for cross-link grid */
  const others = COMPARE_SLUGS.filter((s) => s !== slug).map((s) => ({
    slug: s,
    ...COMPETITORS[s],
  }));

  useEffect(() => {
    /* ──────────────────────────────────────────────────────────────────
       Reset scroll on slug change.
       
       Lenis owns the scroll position globally (LenisProvider attaches it
       to window.__lenis). window.scrollTo() alone gets overridden because
       Lenis's RAF loop snaps the page back to its internal scroll value
       on the next tick. So we use lenis.scrollTo with immediate+force —
       that updates BOTH the browser scroll position and Lenis's internal
       state, making the reset stick.
       
       The double-call (sync + rAF) covers the edge case where the
       transition overlay finishes its fade-out after the new component
       has already mounted — without the rAF callback, Lenis can briefly
       restore the previous page's scroll position before settling at 0.
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

    if (!competitor || !heroRef.current) {
      return () => cancelAnimationFrame(rafId);
    }

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(
      `.${styles.heroIndex}`,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.4 },
      0
    );

    /* The Nimbus × vs × Competitor mark animates in */
    tl.fromTo(
      `.${styles.markBrand}`,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.5 },
      0.15
    );
    tl.fromTo(
      `.${styles.markVs}`,
      { opacity: 0, scale: 0.6 },
      { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" },
      0.3
    );
    tl.fromTo(
      `.${styles.markCompetitor}`,
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.5 },
      0.4
    );

    const letters = heroRef.current.querySelectorAll(`.${styles.heroLetter}`);
    tl.to(
      letters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.7, stagger: 0.02 },
      0.65
    );

    tl.fromTo(
      `.${styles.heroDesc}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5 },
      0.95
    );
    tl.fromTo(
      `.${styles.heroCTA}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5 },
      1.1
    );

    if (!pageRef.current) return;

    const sections = pageRef.current.querySelectorAll(`.${styles.section}`);
    sections.forEach((sec) => {
      const num = sec.querySelector(`.${styles.sectionNum}`);
      /* IMPORTANT: .honestCard was previously omitted from this list, which
         meant the §04 wrapper stayed at the CSS-default opacity: 0 forever
         (only .honestStrength items animated to 1, but CSS opacity is
         multiplicative — items inside an opacity:0 parent stay invisible).
         Adding .honestCard here is what makes §04 render at all. */
      const content = sec.querySelectorAll(
        `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.quickCol}, .${styles.matrixRow}, .${styles.reason}, .${styles.honestCard}, .${styles.honestStrength}`
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
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.05,
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

    /* After all triggers are created from scroll=0 (the position we just
       forced), tell ScrollTrigger to recalc against the new content. */
    ScrollTrigger.refresh();

    return () => {
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

  /* Build the quick-compare pairs (Nimbus side, competitor side, matched
     by index for visual alignment) */
  const quickPairs = competitor.quickCompare.nimbus.map((nm, i) => ({
    nimbus: nm,
    competitor: competitor.quickCompare.competitor[i],
  }));

  return (
    <div ref={pageRef} className={styles.page}>
      <Nav />

      {/* ── HERO ── */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroIndex}>
          <span>Compare</span>
          <span className={styles.heroIndexDot} />
          <span className={styles.heroIndexCategory}>
            {competitor.category}
          </span>
        </div>

        {/* The Nimbus vs Competitor mark */}
        <div className={styles.mark}>
          <span className={styles.markBrand}>Nimbus</span>
          <span className={styles.markVs} aria-hidden="true">
            vs
          </span>
          <span className={styles.markCompetitor}>{competitor.name}</span>
        </div>

        <h1 className={styles.heroTitle}>
          {renderHeadline(competitor.headline, competitor.accentWord)}
        </h1>
        <p className={styles.heroDesc}>{competitor.heroDesc}</p>

        <div className={styles.heroCTA}>
          <CornerButton onClick={() => openDemo("migration")}>
            See a live comparison
          </CornerButton>
          <TransitionLink href="/pricing" className={styles.heroSecondary}>
            See Nimbus pricing →
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
            Nimbus vs {competitor.name}, quickly.
          </h2>
          <p className={styles.sectionDesc}>
            Five positioning differences that matter most when teams are
            evaluating both.
          </p>

          <div className={styles.quickCompare}>
            {/* Nimbus column */}
            <div className={`${styles.quickCol} ${styles.quickColNimbus}`}>
              <div className={styles.quickColHead}>
                <span className={styles.quickColName}>Nimbus</span>
                <span className={styles.quickColTag}>
                  Modern · cloud-native
                </span>
              </div>
              <ul className={styles.quickList}>
                {quickPairs.map((p, i) => (
                  <li key={i} className={styles.quickItem}>
                    <span className={styles.quickCheck}>✓</span>
                    <span>{p.nimbus}</span>
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
              <div className={styles.matrixHeadBrand}>Nimbus</div>
              <div className={styles.matrixHeadCompetitor}>
                {competitor.name}
              </div>
            </div>

            {competitor.matrix.map((row, i) => (
              <div key={i} className={styles.matrixRow}>
                <div className={styles.matrixFeature}>{row.feature}</div>
                <div className={styles.matrixCol}>
                  <MatrixCell value={row.nimbus} accent />
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
              If none of these apply, you&apos;re likely a good fit for Nimbus.
              The next step is a 30-minute call where we walk through your
              actual operation.
            </div>
          </div>
        </div>
      </section>

      {/* ── CROSS-LINKS ── */}
      {others.length > 0 && (
        <section className={styles.crossLinks}>
          <div className={styles.crossLinksLabel}>Other comparisons</div>
          <div className={styles.crossLinksGrid}>
            {others.map((o) => (
              <TransitionLink
                key={o.slug}
                href={`/compare/${o.slug}`}
                className={styles.crossCard}
              >
                <div className={styles.crossCardMeta}>vs</div>
                <div className={styles.crossCardTitle}>{o.name}</div>
                <div className={styles.crossCardCategory}>{o.category}</div>
                <div className={styles.crossCardArrow}>→</div>
              </TransitionLink>
            ))}
          </div>
        </section>
      )}

      {/* ── FINAL CTA ── */}
      <section className={styles.finalCTA}>
        <div className={styles.finalCTAInner}>
          <div className={styles.finalCTALabel}>
            Ready to leave {competitor.name} behind?
          </div>
          <h2 className={styles.finalCTATitle}>
            Let&apos;s show you Nimbus running on your data.
          </h2>
          <p className={styles.finalCTADesc}>
            A 30-minute call with a Nimbus engineer. We&apos;ll walk through
            your current {competitor.name} setup and show how each piece would
            work in Nimbus — including the migration path.
          </p>
          <div className={styles.finalCTAButtons}>
            <CornerButton onClick={() => openDemo("migration")}>
              Book the demo
            </CornerButton>
            <TransitionLink href="/calculator" className={styles.heroSecondary}>
              Or run the ROI numbers →
            </TransitionLink>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
