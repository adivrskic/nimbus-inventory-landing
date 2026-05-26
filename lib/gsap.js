// ──────────────────────────────────────────────────────────────────────────
// lib/gsap.js
// ──────────────────────────────────────────────────────────────────────────
// Central GSAP entry point + the small set of hooks that replace per-component
// animation boilerplate. Import gsap FROM HERE, not from "gsap" directly, so
// plugins are registered once and defaults are applied everywhere.
//
//   import { gsap, useReveal, useGsap } from "@/lib/gsap";
//
// What this fixes vs. the old per-file pattern:
//   1. `gsap.registerPlugin(ScrollTrigger)` was repeated in 8+ files. Now once.
//   2. Every component hand-wrote durations/eases. Now `gsap.defaults` pulls
//      from lib/motion.js, so even raw gsap.to() calls inherit the house style.
//   3. Cleanup was `ScrollTrigger.getAll().forEach(t => t.kill())` — which
//      kills EVERY trigger on the page, including sibling components'. Now
//      every hook runs inside gsap.context() and cleans up with ctx.revert(),
//      which kills ONLY the tweens/triggers created in that scope.
//   4. Reduced-motion was checked three different ways. Now it's gated once,
//      via gsap.matchMedia(), inside these hooks. (Per the decision to fold
//      everything into matchMedia, the reveal hooks no longer read
//      AnimationContext — see note at bottom re: the in-app pause toggle.)
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useRef, useLayoutEffect, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DURATION, EASE, STAGGER, DISTANCE, TRIGGER } from "./motion";

/* Register plugins exactly once, on first import of this module. */
gsap.registerPlugin(ScrollTrigger);

/* House defaults — any gsap.to/from/fromTo that doesn't specify duration/ease
   inherits these, so even bespoke timelines match the system by default. */
gsap.defaults({ duration: DURATION.base, ease: EASE.out });

/* useLayoutEffect warns during SSR. Next.js renders these "use client"
   components on the server first, so fall back to useEffect there. Animations
   only need to run after hydration anyway. */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* matchMedia conditions shared by every hook. `motion` is the no-preference
   (animate normally) branch; `reduced` is prefers-reduced-motion. Folding the
   gate in here means NOTHING animates unless it's gone through this check. */
const MM = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
};

// ──────────────────────────────────────────────────────────────────────────
// useGsap — the general escape hatch for BESPOKE animations.
// ──────────────────────────────────────────────────────────────────────────
// Runs `setup` inside a gsap.context() scoped to the returned ref, wrapped in
// gsap.matchMedia(). Use this for anything the declarative useReveal can't
// express — the Hero scroll-dissolve, the Features SVG choreography, the
// FinalCTACard wipe, count-ups, etc. You get uniform cleanup + reduced-motion
// handling for free; you just write the timeline.
//
//   const scope = useGsap(({ reduced, q }) => {
//     if (reduced) return;                 // bail or build a calm variant
//     gsap.to(q(".thing"), { x: 100, scrollTrigger: { trigger: q(".thing") }});
//   });
//   return <section ref={scope}>…</section>;
//
// `q` is the scoped selector (gsap.utils.selector(scope)) — query DOM relative
// to the scope ref instead of document-wide. `reduced` is the boolean gate.
// Return value (if any) is ignored; cleanup is automatic via ctx.revert().
// ──────────────────────────────────────────────────────────────────────────
export function useGsap(setup, deps = []) {
  const scope = useRef(null);

  useIsoLayoutEffect(() => {
    if (!scope.current) return;
    const q = gsap.utils.selector(scope);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(MM, (mc) => {
        const reduced = !!mc.conditions.reduced;
        setup({ reduced, q, scope: scope.current });
      });
    }, scope);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
}

// ──────────────────────────────────────────────────────────────────────────
// useReveal — the declarative "fade up on scroll" used almost everywhere.
// ──────────────────────────────────────────────────────────────────────────
// Attach the returned ref to a container. Then in your JSX, mark what should
// reveal with data attributes — no per-component useEffect, no magic numbers:
//
//   const scope = useReveal();
//   return (
//     <section ref={scope}>
//       <h2 data-reveal>Heading</h2>           // single element fades up
//       <p  data-reveal>Subhead</p>
//       <div data-reveal="stagger">            // children stagger up in order
//         <Card /><Card /><Card />
//       </div>
//     </section>
//   );
//
// Reduced-motion: elements appear instantly (opacity 1, no travel, duration 0)
// but ARE made visible — they never get stuck at opacity 0. Each reveal owns
// its own ScrollTrigger; revert() on unmount kills only these.
//
// Options (all optional):
//   start       — ScrollTrigger start position. Default TRIGGER.reveal.
//   distance    — travel px for single-element reveals. Default DISTANCE.sm.
//   stagger     — seconds between staggered children. Default STAGGER.base.
//   once        — play once and stop (default true). false = replay on re-entry.
// ──────────────────────────────────────────────────────────────────────────
export function useReveal({
  start = TRIGGER.reveal,
  distance = DISTANCE.sm,
  stagger = STAGGER.base,
  once = true,
} = {}) {
  return useGsap(({ reduced, scope }) => {
    const nodes = scope.querySelectorAll("[data-reveal]");

    nodes.forEach((el) => {
      const isStagger = el.dataset.reveal === "stagger";
      const targets = isStagger ? el.children : el;

      gsap.fromTo(
        targets,
        { opacity: 0, y: reduced ? 0 : distance },
        {
          opacity: 1,
          y: 0,
          duration: reduced ? 0 : DURATION.base,
          stagger: isStagger ? stagger : 0,
          overwrite: "auto",
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: once
              ? "play none none none"
              : "play none none reverse",
          },
        }
      );
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// useHeadlineReveal — per-letter headline animation (Hero, Industries, Compare
// index, etc. all did this slightly differently). Pairs with the SplitText
// component. Mark the wrapping element with data-headline; SplitText should
// render each letter with a `data-letter` attribute (one-line change — see
// the migration guide). Letters rotate/lift into place with STAGGER.tight.
//
//   const scope = useHeadlineReveal();
//   <h1 ref={scope} data-headline><SplitText … /></h1>
//
// If your SplitText emits a class instead of data-letter, pass { selector }:
//   useHeadlineReveal({ selector: `.${styles.letter}` })
// ──────────────────────────────────────────────────────────────────────────
export function useHeadlineReveal({
  selector = "[data-letter]",
  start = TRIGGER.reveal,
} = {}) {
  return useGsap(({ reduced, scope }) => {
    const letters = scope.querySelectorAll(selector);
    if (!letters.length) return;

    /* Animate TO the resting state. The hidden start state (opacity 0 +
       per-headline transform like translateY(100%) rotateX(35deg)) lives in
       each component's CSS, so each headline keeps its designed entrance
       SHAPE — we only standardize the TIMING here. Under reduced-motion this
       still resolves to the resting state instantly, so letters are visible
       and never stuck at opacity 0. */
    gsap.to(letters, {
      opacity: 1,
      y: "0%",
      rotateX: 0,
      duration: reduced ? 0 : DURATION.fast,
      stagger: reduced ? 0 : STAGGER.tight,
      ease: EASE.out,
      scrollTrigger: { trigger: scope, start },
    });
  });
}

/* prefersReducedMotion — one-shot boolean read for NON-scroll animations:
   mount intros and filter re-shuffles that fire outside the reveal hooks (so
   they can't lean on gsap.matchMedia, which is wired into useReveal/useGsap).
   Scroll reveals do NOT need this — they're already gated inside the hooks.

     const reduced = prefersReducedMotion();
     gsap.fromTo(items, { opacity: 0, y: reduced ? 0 : DISTANCE.sm }, { ... duration: reduced ? 0 : DURATION.fast });

   Returns false during SSR (no window). */
export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Re-export the configured singletons so the rest of the app imports gsap and
   ScrollTrigger from one place (and never re-registers the plugin). Also
   re-export tokens for bespoke timelines that want EASE/DURATION directly. */
export { gsap, ScrollTrigger };
export { DURATION, EASE, STAGGER, DISTANCE, TRIGGER, SCRUB } from "./motion";

// ──────────────────────────────────────────────────────────────────────────
// NOTE on the in-app pause toggle (AnimationContext):
//   Per the chosen approach, reduced-motion is now gated purely through
//   gsap.matchMedia() here. Your existing AnimationProvider still works as a
//   global play/pause (it calls gsap.globalTimeline.pause()/resume()), so the
//   toggle button keeps functioning. What changes: these reveal hooks no
//   longer READ the context — they only respect the OS prefers-reduced-motion
//   setting. If you later want the in-app toggle to also suppress reveals,
//   that's a small addition (gate `reduced ||= context.paused`); say the word.
// ──────────────────────────────────────────────────────────────────────────
