"use client";
import { useEffect, useRef } from "react";
import { useAnimationPaused } from "@/lib/AnimationContext";
import CornerButton from "@/components/shared/CornerButton";
import SplitText from "@/components/shared/SplitText";
import { gsap, useGsap, DURATION, EASE, STAGGER } from "@/lib/gsap";
import { track } from "@/lib/analytics";
import { signupUrl } from "@/lib/site";
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

/* The side column states facts, not performance claims. It used to count
   up to "<200ms AI scan speed", "99.9% uptime SLA" and "70% faster counts",
   none of which had anything measured behind them. Entries with `end`
   still count up; entries with `text` just fade in with their block. */
const STATS = [
  { end: 7, prefix: "", suffix: "-day", label: "Free trial" },
  { text: "No card", label: "Needed to start" },
  { text: "Sample data", label: "Ready at signup" },
];

const statText = (stat, v) => stat.text ?? `${stat.prefix}${v}${stat.suffix}`;
/* The settled value — what the server HTML (and any no-JS / reduced-motion
   reader) shows. The count-up only runs after mount, from 0 to this. */
const statFinal = (stat) =>
  statText(
    stat,
    stat.decimals ? Number(stat.end).toFixed(stat.decimals) : stat.end
  );

export default function Hero({ onDemo }) {
  const videoRef = useRef(null);
  const videoBgRef = useRef(null);
  const contentRef = useRef(null);
  const ctasRef = useRef(null);
  const sideRef = useRef(null);
  const statRefs = useRef([]);
  const valRefs = useRef([]);
  const { paused } = useAnimationPaused();

  /* The 3.4 MB loop only loads where it's seen large. On phones, and for
     Save-Data visitors, the poster stays up as a still: the clip is dimmed
     background atmosphere, and a first visit on cellular shouldn't spend
     megabytes on it. Declared before the pause effect so the source is in
     place by the time that effect first runs. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const wide = window.matchMedia("(min-width: 769px)").matches;
    const saveData = navigator.connection?.saveData === true;
    if (!wide || saveData) return;
    v.src = "/hero-loop.mp4";
    v.play().catch(() => {});
  }, []);

  /* Video play/pause follows the in-app animation toggle. Not a GSAP
     animation — left as a plain effect. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !v.src) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused]);

  /* "See it in action" lands just inside the intelligence engine below —
     10% into its scroll, past the stage's edge fade, where the first beat
     is fully drawn. Through Lenis when it's running (a native smooth scroll
     fights Lenis's own position), a plain smooth scroll otherwise. */
  const scrollToEngine = () => {
    const space = document.querySelector("#ai-engine > div");
    if (!space) return;
    const top = space.getBoundingClientRect().top + window.scrollY;
    const y = top + 0.1 * Math.max(0, space.offsetHeight - window.innerHeight);
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  /* Intro timeline + count-ups + scroll parallax, scoped to the section.
     Cleanup is ctx.revert() (was a global ScrollTrigger.getAll().kill()).

     Reduced-motion: the intro and count-ups resolve to their final state at
     once, the upward content parallax and the video zoom are dropped, and
     only the opacity dissolves remain (a fade is not vestibular motion, and
     the hero still needs to clear out so AISection can take over). */
  const sectionRef = useGsap(({ reduced, q, scope }) => {
    if (videoRef.current?.src) videoRef.current.play().catch(() => {});

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
          valEl.textContent = statText(stat, v);
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

      /* CTAs — start with the description rather than after it. The letter
         wash takes about a second, and on a throttled phone the primary
         button (the hero's largest text block, so its LCP element) used to
         appear only once the wash had finished. */
      master.to(
        ctasRef.current,
        { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.out },
        "<0.15"
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

        /* Text entries have nothing to count. */
        if (stat.text) return;
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
              valEl.textContent = statText(stat, v);
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
            atmosphere, so 1080p CRF30 is visually lossless here. Its
            source is attached by the first effect above, wide screens
            only. */}
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          poster="/hero-poster.webp"
          className={styles.video}
        />
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
            href={signupUrl("hero")}
            onClick={() => track("start_trial_click", { cta_source: "hero" })}
          >
            Start free trial
          </CornerButton>
          <CornerButton
            variant="ghost"
            onClick={() => onDemo(undefined, { source: "hero" })}
          >
            Request a demo
          </CornerButton>
          <button
            type="button"
            className={styles.tourLink}
            onClick={scrollToEngine}
          >
            See it in action <span aria-hidden="true">↓</span>
          </button>
          {/* Phones only — the stats column that says this is hidden there. */}
          <p className={styles.trialNote}>7-day free trial · No credit card</p>
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
              {statFinal(stat)}
            </div>
            <div className={styles.dataLabel}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
