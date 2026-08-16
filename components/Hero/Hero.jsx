"use client";
import { useEffect, useRef } from "react";
import { useAnimationPaused } from "@/lib/AnimationContext";
import CornerButton from "@/components/shared/CornerButton";
import SplitText from "@/components/shared/SplitText";
import { gsap, useGsap, DURATION, EASE, STAGGER } from "@/lib/gsap";
import styles from "./Hero.module.css";

/* ═══════════════════════════════════════════════════════════════════════
   HERO — faster fade-out
   ───────────────────────────────────────────────────────────────────────
   Two timing changes from the previous version:

   1. Content + stats fade now COMPLETES by 30% scroll into the hero
      (was 70%). Headline/desc/CTAs/stats are gone by the time you've
      scrolled 30vh.

   2. Whole-section dissolve now COMPLETES by 50% scroll into the hero
      (was 90%). The entire hero is invisible by the time you're halfway
      through the section's scroll.

   Result: you scroll a small amount, the hero clears out fast and the
   next section (AISection) is ready to take over visually.

   ───────────────────────────────────────────────────────────────────────
   Intro timing (this pass): the mount cascade now uses the same
   RELATIVE-anchoring the other pages' header intros use, instead of the
   hand-counted absolute start times it had before. See the timeline below.
   ═══════════════════════════════════════════════════════════════════════ */

const HEADLINE_LINES = [
  {
    words: [
      { text: "The", accent: false },
      { text: "complete", accent: false },
    ],
  },
  {
    words: [
      { text: "solution", accent: false },
      { text: "for", accent: false },
    ],
  },
  {
    words: [
      { text: "warehouse", accent: true },
      { text: "intelligence", accent: true },
    ],
  },
];

const DESC_LINES = [
  "Nautilus unifies scanning, spatial mapping,",
  "and predictive AI into a single platform that",
  "learns your operation and optimizes it in real time.",
];

const STATS = [
  { end: 200, prefix: "<", suffix: "ms", label: "AI scan speed" },
  { end: 99.9, prefix: "", suffix: "%", label: "Uptime SLA", decimals: 1 },
  { end: 70, prefix: "", suffix: "%", label: "Faster counts" },
];

export default function Hero({ onDemo }) {
  const videoRef = useRef(null);
  const videoBgRef = useRef(null);
  const contentRef = useRef(null);
  const ctasRef = useRef(null);
  const sideRef = useRef(null);
  const statRefs = useRef([]);
  const valRefs = useRef([]);
  const { paused } = useAnimationPaused();

  /* Video play/pause follows the in-app animation toggle. Not a GSAP
     animation — left as a plain effect. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused]);

  /* Intro timeline + count-ups + scroll parallax, scoped to the section.
     Cleanup is ctx.revert() (was a global ScrollTrigger.getAll().kill()).

     Reduced-motion: the intro and count-ups resolve to their final state at
     once, the upward content parallax and the video zoom are dropped, and
     only the opacity dissolves remain (a fade is not vestibular motion, and
     the hero still needs to clear out so AISection can take over). */
  const sectionRef = useGsap(({ reduced, q, scope }) => {
    if (videoRef.current) videoRef.current.play().catch(() => {});

    const hLetters = q(`.${styles.letter}`);
    const dLetters = q(`.${styles.descLetter}`);

    /* ── Intro ── */
    if (reduced) {
      gsap.set(videoRef.current, { opacity: 0.3 });
      gsap.set([...hLetters, ...dLetters], { opacity: 1, y: "0%", rotateX: 0 });
      gsap.set(ctasRef.current, { opacity: 1, y: 0 });
      gsap.set(sideRef.current, { opacity: 1 });
      STATS.forEach((stat, i) => {
        gsap.set(statRefs.current[i], { opacity: 1, y: 0 });
        const valEl = valRefs.current[i];
        if (valEl) {
          const v = stat.decimals
            ? stat.end.toFixed(stat.decimals)
            : Math.round(stat.end);
          valEl.textContent = `${stat.prefix}${v}${stat.suffix}`;
        }
      });
    } else {
      const master = gsap.timeline({ defaults: { ease: EASE.out } });

      /* Ambient video reveal — runs UNDERNEATH the content cascade from
         t=0, deliberately slow; it's the scene settling, not part of the
         top-to-bottom sequence, so it gets an absolute position. */
      master.to(
        videoRef.current,
        { opacity: 0.3, duration: 1.5, ease: EASE.inOut },
        0
      );

      /* ── Top-to-bottom content cascade ──
         Headline is the first content beat; every beat after it is anchored
         RELATIVE to the end of the beat before it (">-0.x" starts it x
         seconds before the previous beat finishes, for a gentle overlap).
         This is the same relative-anchoring the header intros on the other
         pages use: the sequence reads strictly top → bottom and stays in
         sync if any single duration/stagger is later retuned, rather than
         drifting the way the old hand-counted absolute starts (0.3 / 1.1 /
         1.4 / 1.4 + i*0.35) did. */

      /* Headline — per-letter clip reveal. Animates TO resting; the hidden
         start shape comes from CSS (.letter). */
      master.to(
        hLetters,
        {
          opacity: 1,
          y: "0%",
          rotateX: 0,
          duration: DURATION.slow,
          stagger: STAGGER.tight,
          ease: EASE.out,
        },
        0.2
      );

      /* Description — fast per-letter micro-wash (very tight stagger, kept
         by design). Overlaps the tail of the headline. */
      master.to(
        dLetters,
        {
          opacity: 1,
          y: "0%",
          duration: DURATION.base,
          stagger: 0.008,
          ease: EASE.out,
        },
        ">-0.45"
      );

      /* CTAs. */
      master.to(
        ctasRef.current,
        { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.out },
        ">-0.2"
      );

      /* Stats column. A label pinned just before the end of the CTA beat
         anchors the whole group to the cascade; the container is flipped
         visible (its blocks carry their own opacity:0 → animated below) and
         each stat fades up + counts up on a relative step off that label —
         replacing the old absolute `1.4 + i*0.35` and tightening the step
         (0.35 → 0.16) so the stats don't trail a full second behind. */
      master.addLabel("stats", ">-0.05");
      master.set(sideRef.current, { opacity: 1 }, "stats-=0.1");

      STATS.forEach((stat, i) => {
        const at = `stats+=${i * 0.16}`;

        master.to(
          statRefs.current[i],
          { opacity: 1, y: 0, duration: DURATION.fast, ease: EASE.out },
          at
        );

        const counter = { val: 0 };
        const valEl = valRefs.current[i];
        master.to(
          counter,
          {
            val: stat.end,
            duration: DURATION.base,
            ease: "power2.out",
            onUpdate: () => {
              const v = stat.decimals
                ? counter.val.toFixed(stat.decimals)
                : Math.round(counter.val);
              valEl.textContent = `${stat.prefix}${v}${stat.suffix}`;
            },
          },
          at
        );
      });
    }

    /* ── Scroll: content + stats fade as you scroll into the hero. Keep the
       opacity dissolve for everyone; drop the upward slide under reduced. ── */
    gsap.fromTo(
      [contentRef.current, sideRef.current],
      { opacity: 1, y: 0 },
      {
        y: reduced ? 0 : -80,
        opacity: 0,
        ease: EASE.scrub,
        scrollTrigger: {
          trigger: scope,
          start: "top top",
          end: "40% top",
          scrub: 1,
        },
      }
    );

    /* Video bg zoom — pure parallax; skipped under reduced-motion. */
    if (!reduced) {
      gsap.to(videoBgRef.current, {
        scale: 1,
        ease: EASE.scrub,
        scrollTrigger: {
          trigger: scope,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }

    /* Whole-section dissolve — opacity only, kept for everyone. */
    gsap.to(scope, {
      opacity: 0,
      ease: "power2.in",
      scrollTrigger: {
        trigger: scope,
        start: "15% top",
        end: "60% top",
        scrub: 0.5,
      },
    });
  });

  return (
    /* data-reveal-exempt: the hero pins behind the entire page and
       dissolves itself to opacity 0 on scroll. That 0 is its correct
       resting state, so RevealGuarantee must never "fix" it — doing so
       leaves the banner painted behind every later section. */
    <section ref={sectionRef} className={styles.hero} data-reveal-exempt>
      <div ref={videoBgRef} className={styles.videoBg}>
        {/* Self-hosted 1080p loop (~3.4 MB, audio stripped — it always
            plays muted) + self-hosted poster, replacing the original
            46 MB 4K source and the third-party Unsplash poster that sat
            on the LCP path. The clip renders as dimmed/blurred background
            atmosphere, so 1080p CRF30 is visually lossless here. */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster="/hero-poster.webp"
          className={styles.video}
        >
          <source src="/hero-loop.mp4" type="video/mp4" />
        </video>
        <div className={styles.overlay} />
      </div>

      <div ref={contentRef} className={styles.content}>
        <h1 className={styles.headline}>
          <SplitText
            tokens={HEADLINE_LINES.map((line) =>
              line.words.map((w) => ({ t: w.text, a: w.accent }))
            )}
            classNames={{
              line: styles.line,
              letter: styles.letter,
              accent: styles.accentWord,
              space: styles.letterSpace,
            }}
          />
        </h1>
        <p className={styles.desc}>
          <SplitText
            lines={DESC_LINES}
            classNames={{
              line: styles.descLine,
              letter: styles.descLetter,
              space: styles.descSpace,
            }}
          />
        </p>

        <div ref={ctasRef} className={styles.ctas}>
          <CornerButton
            variant="primary"
            onClick={() => onDemo(undefined, { source: "hero" })}
          >
            Request a Demo
          </CornerButton>
          <CornerButton
            variant="ghost"
            onClick={() => {
              document
                .getElementById("warehouse")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Watch Overview
          </CornerButton>
        </div>
      </div>

      <div
        ref={sideRef}
        className={`${styles.sideData} hide-mobile`}
        style={{ opacity: 0 }}
      >
        {STATS.map((stat, i) => (
          <div
            key={i}
            ref={(el) => (statRefs.current[i] = el)}
            className={styles.statBlock}
          >
            <div
              ref={(el) => (valRefs.current[i] = el)}
              className={styles.dataVal}
            >
              {stat.prefix}0{stat.suffix}
            </div>
            <div className={styles.dataLabel}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
