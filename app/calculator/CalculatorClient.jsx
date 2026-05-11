"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import DemoModal from "@/components/DemoModal/DemoModal";
import styles from "./Calculator.module.css";

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
     AI routes cut that by 20%. */
  const pickingSavings = pickers * 600 * 0.2 * wage;

  /* Error reduction — at lower accuracy, more errors. Each error costs
     ~6% of order value. Assume ~2 orders/sqft/year at ~$180 avg. */
  const errorRate = (100 - accuracy) / 100;
  const annualOrders = size * 2;
  const errorSavings = annualOrders * 180 * 0.06 * (errorRate * 0.7);

  /* Shrinkage / inventory accuracy — baseline ~$1.50/sqft/year,
     Nimbus cuts 60%. */
  const shrinkageSavings = size * 1.5 * 0.6;

  /* Cycle counting — saves ~40hrs/yr per picker through continuous
     counting. */
  const cycleCountSavings = pickers * 40 * wage;

  const total =
    pickingSavings + errorSavings + shrinkageSavings + cycleCountSavings;

  /* "Current loss" framing — assume some inefficiency persists, so the
     current annual cost is ~1.4x what Nimbus recovers. Used in the
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
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const next = clamp(value + step, range.min, range.max);
      onChange(next);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const next = clamp(value - step, range.min, range.max);
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

  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

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

  /* Animations */
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!heroRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(
      `.${styles.heroEyebrow}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45 },
      0
    );

    const letters = heroRef.current.querySelectorAll(`.${styles.heroLetter}`);
    tl.to(
      letters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.75, stagger: 0.022 },
      0.1
    );

    tl.fromTo(
      `.${styles.heroSub}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55 },
      0.5
    );

    tl.fromTo(
      `.${styles.story}`,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7 },
      0.65
    );

    if (!pageRef.current) return;

    /* Section reveals */
    const sections = pageRef.current.querySelectorAll(`.${styles.section}`);
    sections.forEach((sec) => {
      const num = sec.querySelector(`.${styles.sectionNum}`);
      const content = sec.querySelectorAll(
        `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.breakdownRow}, .${styles.assumption}, .${styles.totalBar}`
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
            stagger: 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: sec, start: "top 78%" },
          }
        );
      }
    });

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
  }, []);

  /* Per-letter title: "See what Nimbus is worth to *you.*" */
  const renderTitle = () => {
    const parts = [
      { t: "See", a: false },
      { t: " ", isSpace: true, a: false },
      { t: "what", a: false },
      { t: " ", isSpace: true, a: false },
      { t: "Nimbus", a: false },
      { t: " ", isSpace: true, a: false },
      { t: "is", a: false },
      { t: " ", isSpace: true, a: false },
      { t: "worth", a: false },
      { t: " ", isSpace: true, a: false },
      { t: "to", a: false },
      { t: " ", isSpace: true, a: true },
      { t: "you.", a: true },
    ];
    return (
      <span className={styles.heroLine}>
        {parts.map((p, pi) => {
          if (p.isSpace) return <span key={pi} className={styles.heroSpace} />;
          return (
            <span key={pi} className="word">
              {p.t.split("").map((c, ci) => (
                <span
                  key={`${pi}-${ci}`}
                  className={`${styles.heroLetter} ${
                    p.a ? styles.heroLetterAccent : ""
                  }`}
                >
                  {c}
                </span>
              ))}
            </span>
          );
        })}
      </span>
    );
  };

  const breakdown = [
    {
      num: "01",
      label: "Picking time saved",
      desc: "AI routes are 20% shorter than manual paths",
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
      desc: "60% less shrinkage and stockouts",
      value: computed.shrinkageSavings,
      animValue: animShrinkage,
    },
    {
      num: "04",
      label: "Cycle counting",
      desc: "Continuous counts replace annual freezes",
      value: computed.cycleCountSavings,
      animValue: animCycle,
    },
  ];

  return (
    <div ref={pageRef} className={styles.page}>
      <Nav onDemo={openDemo} />

      {/* ── HERO ── */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroEyebrow}>ROI Calculator</div>
        <h1 className={styles.heroTitle}>{renderTitle()}</h1>
        <p className={styles.heroSub}>
          The numbers in the paragraph below are editable. Click any of them,
          type a new value, and the whole estimate recalculates. No signup, no
          email — just the math.
        </p>
      </section>

      {/* ── THE STORY (editable paragraph) ── */}
      <section className={styles.story}>
        <div className={styles.storyLabel}>
          <span className={styles.storyLabelDot} />
          <span>Editable estimate · drag or type to change</span>
        </div>

        <p className={styles.storyText}>
          You operate a{" "}
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
          pickers running at{" "}
          <InlineNumber
            value={accuracy}
            onChange={setAccuracy}
            range={RANGES.accuracy}
            suffix="%"
          />{" "}
          inventory accuracy at{" "}
          <InlineNumber
            value={wage}
            onChange={setWage}
            range={RANGES.wage}
            prefix="$"
            suffix="/hr"
          />{" "}
          labor. That setup is leaking about{" "}
          <span className={styles.storyLoss}>{formatDollars(animLoss)}</span> a
          year to errors, rework, and slow picking.
        </p>

        <p className={styles.storyTextSecondary}>
          Nimbus recovers about{" "}
          <span className={styles.storySavings}>
            {formatDollars(animTotal)}
          </span>{" "}
          of that in year one — and the same again every year after.
        </p>

        <div className={styles.storyControls}>
          <button
            type="button"
            onClick={resetDefaults}
            className={styles.storyReset}
          >
            ↺ Reset to defaults
          </button>
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
          <h2 className={styles.sectionTitle}>Four sources, one estimate.</h2>
          <p className={styles.sectionDesc}>
            Each bar scales to the largest source. Watch them shift as you
            change your warehouse profile above.
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
          <div className={styles.sectionLabel}>How we calculate</div>
          <h2 className={styles.sectionTitle}>The assumptions, openly.</h2>
          <p className={styles.sectionDesc}>
            These are conservative industry averages drawn from Nimbus customer
            data and published WMS benchmarks. Your real numbers will vary —
            book a demo and we&apos;ll model it precisely against your
            operation.
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
      <section className={styles.finalCTA}>
        <div className={styles.finalCTAInner}>
          <div className={styles.finalCTALabel}>Like the number?</div>
          <h2 className={styles.finalCTATitle}>
            Let&apos;s model it against your real data.
          </h2>
          <p className={styles.finalCTADesc}>
            A 30-minute call with a Nimbus engineer. We&apos;ll plug your actual
            operational metrics into a more detailed version of this model and
            walk you through what changes.
          </p>
          <div className={styles.finalCTAButtons}>
            <CornerButton onClick={openDemo}>
              Book the modeling call
            </CornerButton>
            <TransitionLink href="/#pricing" className={styles.heroSecondary}>
              Or see pricing →
            </TransitionLink>
          </div>
        </div>
      </section>

      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
