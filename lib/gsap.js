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

gsap.registerPlugin(ScrollTrigger);

/* ── Boundary backstop ─────────────────────────────────────────────────
   clamp() trigger starts pin any already-in-view element's start to
   scroll position 0. At scrollY exactly 0 a trigger sits ON its start
   (progress 0, never "entered"), so play-type toggleActions and
   onEnter don't fire until the user actually scrolls — above-the-fold
   reveals looked stuck until a nudge. After every global refresh
   (window load, and the body-height ResizeObserver in LenisProvider),
   play any non-scrub play-on-enter animation whose start has already
   been reached. Scrubbed/pinned triggers are skipped — their progress
   is driven by scroll position by design. */
if (typeof window !== "undefined") {
  ScrollTrigger.addEventListener("refresh", () => {
    ScrollTrigger.getAll().forEach((st) => {
      if (!st.animation || st.vars.scrub || st.vars.pin) return;
      const ta = st.vars.toggleActions || "play none none none";
      if (!ta.startsWith("play")) return;
      if (
        st.scroll() >= st.start &&
        st.animation.totalProgress() === 0 &&
        !st.animation.isActive()
      ) {
        st.animation.play();
      }
    });
  });
}

gsap.defaults({ duration: DURATION.base, ease: EASE.out });

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const MM = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
};

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
  }, deps);

  return scope;
}

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

export function useHeadlineReveal({
  selector = "[data-letter]",
  start = TRIGGER.reveal,
} = {}) {
  return useGsap(({ reduced, scope }) => {
    const letters = scope.querySelectorAll(selector);
    if (!letters.length) return;

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

export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger };
export { DURATION, EASE, STAGGER, DISTANCE, TRIGGER, SCRUB } from "./motion";
