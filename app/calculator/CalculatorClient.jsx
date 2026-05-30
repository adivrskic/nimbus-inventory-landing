"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/gsap";
import Footer from "@/components/Footer/Footer";
import FinalCTACard from "@/components/FinalCTACard/FinalCTACard";
import CornerButton from "@/components/shared/CornerButton";
import SplitText from "@/components/shared/SplitText";
import { useDemo } from "@/lib/DemoContext";
import { track } from "@/lib/analytics";
import styles from "./calculator-client.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────
   FORMATTING + INPUT HELPERS
───────────────────────────────────────────────────── */
const formatNumber = (n) => Math.round(n).toLocaleString("en-US");
const formatDollars = (n) => "$" + Math.round(n).toLocaleString("en-US");
const parseInput = (str) => {
  const digits = str.replace(/[^0-9]/g, "");
  return digits === "" ? 0 : parseInt(digits, 10);
};

/* Smoothly animate a number from old to new value with requestAnimationFrame.
   Used for the big computed savings numbers — gives a real-time-meter feel. */
function useAnimatedNumber(target, duration = 500) {
  const [display, setDisplay] = useState(target);
  const startRef = useRef(target);
  const targetRef = useRef(target);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === targetRef.current) return;
    startRef.current = display;
    targetRef.current = target;
    startTimeRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value =
        startRef.current + (targetRef.current - startRef.current) * eased;
      setDisplay(value);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [target, duration]);

  return display;
}

/* ─────────────────────────────────────────────────────
   INPUT RANGES + DEFAULTS
───────────────────────────────────────────────────── */
const RANGES = {
  size: { min: 1000, max: 500000, default: 35000 },
  pickers: { min: 1, max: 250, default: 20 },
  accuracy: { min: 70, max: 99, default: 92 },
  wage: { min: 12, max: 60, default: 22 },
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/* ─────────────────────────────────────────────────────
   ROI MATH
───────────────────────────────────────────────────── */
function calculate({ size, pickers, accuracy, wage }) {
  /* Picking time saved — assume 600hrs/yr of pick activity per picker,
     optimized routes cut that by 20%. */
  const pickingSavings = pickers * 600 * 0.2 * wage;

  /* Error reduction — at lower accuracy, more errors. Each error costs
     ~6% of order value. Assume ~2 orders/sqft/year at ~$180 avg. */
  const errorRate = (100 - accuracy) / 100;
  const annualOrders = size * 2;
  const errorSavings = annualOrders * 180 * 0.06 * (errorRate * 0.7);

  /* Shrinkage / inventory accuracy — baseline ~$1.50/sqft/year,
     Nautilus cuts 60%. */
  const shrinkageSavings = size * 1.5 * 0.6;

  /* Cycle counting — saves ~40hrs/yr per picker through continuous
     counting. */
  const cycleCountSavings = pickers * 40 * wage;

  const total =
    pickingSavings + errorSavings + shrinkageSavings + cycleCountSavings;

  /* "Current loss" framing — assume some inefficiency persists, so the
     current annual cost is ~1.4x what Nautilus recovers. Used in the
     headline "you're losing" line. */
  const currentLoss = total * 1.4;

  return {
    pickingSavings,
    errorSavings,
    shrinkageSavings,
    cycleCountSavings,
    total,
    currentLoss,
  };
}

/* ─────────────────────────────────────────────────────
   INLINE EDITABLE NUMBER COMPONENT
───────────────────────────────────────────────────── */
function InlineNumber({
  value,
  onChange,
  range,
  prefix = "",
  suffix = "",
  formatFn = formatNumber,
}) {
  const [focused, setFocused] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const inputRef = useRef(null);

  /* When focused, show raw editable digits. When not, show formatted. */
  const displayed = focused ? rawInput : formatFn(value);

  const handleFocus = () => {
    setRawInput(String(Math.round(value)));
    setFocused(true);
    /* Select all on focus for quick replacement */
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const handleBlur = () => {
    const parsed = parseInput(rawInput);
    const clamped = clamp(parsed, range.min, range.max);
    onChange(clamped);
    setFocused(false);
  };

  const handleChange = (e) => {
    setRawInput(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setRawInput(String(Math.round(value)));
      inputRef.current?.blur();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const dir = e.key === "ArrowUp" ? 1 : -1;
      const step = (e.shiftKey ? 10 : 1) * dir;
      /* Base the nudge on the live edited value when focused (rawInput)
         so repeated presses compound correctly and don't read a stale
         `value` prop; fall back to the committed value otherwise. */
      const base = focused ? parseInput(rawInput) : value;
      const next = clamp(base + step, range.min, range.max);
      /* Keep BOTH in sync. rawInput is what the focused field shows;
         value drives the recalculation and is what handleBlur commits.
         The old handler updated only `value`, so while focused the field
         kept showing the pre-nudge number AND blur then overwrote the
         nudge with the stale rawInput — i.e. the arrows appeared dead. */
      setRawInput(String(next));
      onChange(next);
    }
  };

  return (
    <span className={styles.editable}>
      {prefix && <span className={styles.editablePrefix}>{prefix}</span>}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayed}
        /* Explicit ch-based width so sizing works in EVERY browser, not
           just ones supporting field-sizing. The field uses tabular-nums,
           so every digit is exactly 1ch wide — meaning (length + slack)ch
           always covers the actual rendered advance. The +2 slack is what
           leaves room for the italic glyph's right-side overhang and the
           caret, so the last digit no longer clips. min/max-width in CSS
           still clamp the extremes. */
        style={{ width: `${displayed.length + 2}ch` }}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-label={`Edit value (range ${range.min} to ${range.max})`}
        className={`${styles.editableInput} ${
          focused ? styles.editableInputFocused : ""
        }`}
      />
      {suffix && <span className={styles.editableSuffix}>{suffix}</span>}
    </span>
  );
}

/* ─────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────── */
export default function CalculatorClient() {
  const pageRef = useRef(null);
  const heroRef = useRef(null);

  /* Single demo opener — used to be a separate openCalendly that bypassed
     the modal, but the modal now hosts Calendly natively with topic
     context. "sales" makes the most sense here: visitors who reach this
     CTA have just modeled their own ROI and want a pricing conversation. */
  const { openDemo } = useDemo();

  const [size, setSize] = useState(RANGES.size.default);
  const [pickers, setPickers] = useState(RANGES.pickers.default);
  const [accuracy, setAccuracy] = useState(RANGES.accuracy.default);
  const [wage, setWage] = useState(RANGES.wage.default);

  const computed = useMemo(
    () => calculate({ size, pickers, accuracy, wage }),
    [size, pickers, accuracy, wage]
  );

  /* Smooth display values (count-up effect on every change) */
  const animLoss = useAnimatedNumber(computed.currentLoss);
  const animTotal = useAnimatedNumber(computed.total);
  const animPicking = useAnimatedNumber(computed.pickingSavings);
  const animError = useAnimatedNumber(computed.errorSavings);
  const animShrinkage = useAnimatedNumber(computed.shrinkageSavings);
  const animCycle = useAnimatedNumber(computed.cycleCountSavings);

  /* For the bar chart — compute max of the four for bar scaling */
  const maxLineItem = Math.max(
    computed.pickingSavings,
    computed.errorSavings,
    computed.shrinkageSavings,
    computed.cycleCountSavings,
    1
  );

  const resetDefaults = () => {
    setSize(RANGES.size.default);
    setPickers(RANGES.pickers.default);
    setAccuracy(RANGES.accuracy.default);
    setWage(RANGES.wage.default);
  };

  /* ── Analytics: engagement + compute events ──
     Fires `calculator_engaged` once per mount on the first non-default
     state, then fires `calculator_compute` 1s after the last input
     change so we capture the user's "settled" numbers without
     per-keystroke noise. Skipping when all values are at defaults
     means a user who lands on the page and bounces doesn't fire either
     event. resetDefaults() doesn't reset engagedRef — once engaged,
     always engaged for this session. */
  const engagedRef = useRef(false);
  useEffect(() => {
    const isDefault =
      size === RANGES.size.default &&
      pickers === RANGES.pickers.default &&
      accuracy === RANGES.accuracy.default &&
      wage === RANGES.wage.default;

    if (isDefault) return;

    if (!engagedRef.current) {
      engagedRef.current = true;
      track("calculator_engaged");
    }

    const t = setTimeout(() => {
      track("calculator_compute", {
        warehouse_size: size,
        pickers,
        accuracy,
        wage,
        total_savings: Math.round(computed.total),
      });
    }, 1000);

    return () => clearTimeout(t);
  }, [size, pickers, accuracy, wage, computed.total]);

  /* ── Animations — uniform with IndustryPage ──────────────────────────
     Hero intro reads strictly top-to-bottom: eyebrow -> title letters ->
     subtitle -> editable story. Each step is anchored to the END of the
     previous one (">" with a small negative offset for a gentle overlap)
     instead of a fixed start time, so the lower elements never resolve
     before the per-letter title does — holds regardless of headline length.

     Scroll reveals below are gated behind the hero intro: a reveal that
     fires on initial load is QUEUED and released the moment the intro
     completes; a section scrolled to later plays immediately, exactly as
     before. This removes the initial-viewport race without artificially
     delaying below-fold content. */
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!heroRef.current) return;

    /* Reduced motion: skip the intro choreography and jump every animated
       element straight to its final, visible state. Without this, hero
       letters + section reveals would still animate on load for users who
       asked the OS for reduced motion. SplitText already renders an sr-only
       flat headline, so screen readers are unaffected either way. */
    if (prefersReducedMotion()) {
      gsap.set(heroRef.current.querySelectorAll(`.${styles.heroLetter}`), {
        opacity: 1,
        y: "0%",
        rotateX: 0,
      });
      gsap.set(
        heroRef.current.querySelectorAll(
          `.${styles.heroEyebrow}, .${styles.heroSub}, .${styles.story}`
        ),
        { opacity: 1, y: 0 }
      );
      if (pageRef.current) {
        gsap.set(
          pageRef.current.querySelectorAll(
            `.${styles.sectionNum}, .${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.breakdownRow}, .${styles.assumption}, .${styles.totalBar}`
          ),
          { opacity: 1, x: 0, y: 0 }
        );
      }
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    /* Eyebrow */
    tl.fromTo(
      `.${styles.heroEyebrow}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.4 },
      0
    );

    /* Per-letter title — starts just as the eyebrow lands. */
    const letters = heroRef.current.querySelectorAll(`.${styles.heroLetter}`);
    tl.to(
      letters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.75, stagger: 0.018 },
      ">-0.05"
    );

    /* Subtitle — anchored to the END of the title stagger. */
    tl.fromTo(
      `.${styles.heroSub}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55 },
      ">-0.2"
    );

    /* Editable story block — follows the subtitle. */
    tl.fromTo(
      `.${styles.story}`,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7 },
      ">-0.15"
    );

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
      const tween = gsap.fromTo(targets, fromVars, { ...toVars, paused: true });
      ScrollTrigger.create({
        trigger,
        start,
        once: true,
        onEnter: () => runWhenIntroDone(() => tween.play()),
      });
    };

    /* Section reveals — content fades up, the big numeral scales-and-fades */
    if (!pageRef.current) {
      return () => {
        cancelled = true;
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    }
    const sections = pageRef.current.querySelectorAll(`.${styles.section}`);
    sections.forEach((sec) => {
      const num = sec.querySelector(`.${styles.sectionNum}`);
      const content = sec.querySelectorAll(
        `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.breakdownRow}, .${styles.assumption}, .${styles.totalBar}`
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

    return () => {
      cancelled = true;
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const breakdown = [
    {
      num: "01",
      label: "Picking time saved",
      desc: "Optimized pick routes run about 20% shorter than manual paths",
      value: computed.pickingSavings,
      animValue: animPicking,
    },
    {
      num: "02",
      label: "Error reduction",
      desc: "70% fewer pick and ship errors",
      value: computed.errorSavings,
      animValue: animError,
    },
    {
      num: "03",
      label: "Inventory accuracy",
      desc: "60% less shrinkage and fewer stockouts",
      value: computed.shrinkageSavings,
      animValue: animShrinkage,
    },
    {
      num: "04",
      label: "Cycle counting",
      desc: "Continuous counts replace the annual freeze",
      value: computed.cycleCountSavings,
      animValue: animCycle,
    },
  ];

  return (
    <div ref={pageRef} className={styles.page}>
      {/* ── HERO ── */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroEyebrow}>ROI Calculator</div>
        <h1 className={styles.heroTitle}>
          <SplitText
            text="See what Nautilus is worth to you."
            accentWord="you"
            classNames={{
              line: styles.heroLine,
              letter: styles.heroLetter,
              accent: styles.heroLetterAccent,
              space: styles.heroSpace,
            }}
          />
        </h1>
        <p className={styles.heroSub}>
          Every number in the paragraph below is editable. Click one, type a new
          value, and the estimate recalculates as you type. No signup, no email.
        </p>
      </section>

      {/* ── THE STORY (editable paragraph) ── */}
      <section className={styles.story}>
        <div className={styles.storyLabel}>
          <span className={styles.storyLabelDot} />
          <span>Editable estimate · click any number</span>
        </div>

        <p className={styles.storyText}>
          You run a{" "}
          <InlineNumber
            value={size}
            onChange={setSize}
            range={RANGES.size}
            suffix=" sq ft"
          />{" "}
          warehouse with{" "}
          <InlineNumber
            value={pickers}
            onChange={setPickers}
            range={RANGES.pickers}
          />{" "}
          pickers,{" "}
          <InlineNumber
            value={accuracy}
            onChange={setAccuracy}
            range={RANGES.accuracy}
            suffix="%"
          />{" "}
          inventory accuracy, and{" "}
          <InlineNumber
            value={wage}
            onChange={setWage}
            range={RANGES.wage}
            prefix="$"
            suffix="/hr"
          />{" "}
          average labor. That setup costs about{" "}
          <span className={styles.storyLoss}>{formatDollars(animLoss)}</span> a
          year in errors, rework, and slow picking.
        </p>

        <p className={styles.storyTextSecondary}>
          Nautilus typically recovers about{" "}
          <span className={styles.storySavings}>
            {formatDollars(animTotal)}
          </span>{" "}
          of that in year one. Similar amounts every year after.
        </p>

        <div className={styles.storyControls}>
          <CornerButton onClick={resetDefaults}>
            ↺ Reset to defaults
          </CornerButton>
          <div className={styles.storyHint}>
            <span className={styles.storyHintKbd}>↑ ↓</span> to nudge ·{" "}
            <span className={styles.storyHintKbd}>Shift</span> + arrows to step
            by 10
          </div>
        </div>
      </section>

      {/* ── §01 BREAKDOWN ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          01
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Where the savings come from</div>
          <h2 className={styles.sectionTitle}>Four lines of savings.</h2>
          <p className={styles.sectionDesc}>
            Bars scale relative to the largest source. They update when you
            change the inputs above.
          </p>

          <div className={styles.breakdown}>
            {breakdown.map((item) => {
              const widthPct = (item.value / maxLineItem) * 100;
              return (
                <div key={item.num} className={styles.breakdownRow}>
                  <div className={styles.breakdownTop}>
                    <span className={styles.breakdownNum}>{item.num}</span>
                    <span className={styles.breakdownLabel}>{item.label}</span>
                    <span className={styles.breakdownValue}>
                      {formatDollars(item.animValue)}
                    </span>
                  </div>
                  <div className={styles.breakdownBar}>
                    <div
                      className={styles.breakdownBarFill}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <div className={styles.breakdownDesc}>{item.desc}</div>
                </div>
              );
            })}
          </div>

          <div className={styles.totalBar}>
            <div className={styles.totalLabel}>Total year-one savings</div>
            <div className={styles.totalValue}>{formatDollars(animTotal)}</div>
          </div>
        </div>
      </section>

      {/* ── §02 ASSUMPTIONS ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          02
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>How the math works</div>
          <h2 className={styles.sectionTitle}>The assumptions.</h2>
          <p className={styles.sectionDesc}>
            Conservative averages from customer data and published WMS
            benchmarks. Your numbers will vary. For a precise estimate, book a
            call and we run the model on your real data.
          </p>

          <dl className={styles.assumptions}>
            <div className={styles.assumption}>
              <dt className={styles.assumptionTerm}>Picker hours on picking</dt>
              <dd className={styles.assumptionDef}>
                600 hours per picker per year (≈30% of paid hours)
              </dd>
            </div>
            <div className={styles.assumption}>
              <dt className={styles.assumptionTerm}>Route optimization</dt>
              <dd className={styles.assumptionDef}>
                20% reduction in pick travel time vs. manual route planning
              </dd>
            </div>
            <div className={styles.assumption}>
              <dt className={styles.assumptionTerm}>Error cost</dt>
              <dd className={styles.assumptionDef}>
                6% of order value (rework, returns, expedited reships)
              </dd>
            </div>
            <div className={styles.assumption}>
              <dt className={styles.assumptionTerm}>Error reduction</dt>
              <dd className={styles.assumptionDef}>
                70% fewer errors than current accuracy rate
              </dd>
            </div>
            <div className={styles.assumption}>
              <dt className={styles.assumptionTerm}>Baseline shrinkage</dt>
              <dd className={styles.assumptionDef}>
                $1.50 per sq ft per year of recoverable shrinkage
              </dd>
            </div>
            <div className={styles.assumption}>
              <dt className={styles.assumptionTerm}>Order density</dt>
              <dd className={styles.assumptionDef}>
                2 orders per sq ft per year, $180 average order value
              </dd>
            </div>
            <div className={styles.assumption}>
              <dt className={styles.assumptionTerm}>Cycle count efficiency</dt>
              <dd className={styles.assumptionDef}>
                40 hours per picker per year recovered through continuous
                counting
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <FinalCTACard
        label="Want a precise estimate?"
        title="Get a number based on your data."
        desc="30 minutes with a Nautilus engineer. We use your real operational data to build a more detailed estimate for your specific operation."
        primaryAction={{
          onClick: () => {
            track("calculator_demo_click", {
              warehouse_size: size,
              total_savings: Math.round(computed.total),
            });
            openDemo("sales", { source: "final_cta_calculator" });
          },
          label: "Book the modeling call",
        }}
        secondaryAction={{ href: "/pricing", label: "Or see pricing →" }}
      />

      <Footer />
    </div>
  );
}
