"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function LenisProvider({ children }) {
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    /**
     * Skip smooth scroll for:
     *   1. Reduced-motion users — native scroll is more accessible.
     *   2. Touch / coarse-pointer devices — Lenis's syncTouch fought the
     *      browser's own inertia and read as laggy on phones/tablets.
     *      Native momentum scroll is smoother and far lighter on mobile
     *      GPUs/battery. Every window.__lenis consumer already falls back
     *      to native scroll when __lenis is null, so this is safe.
     *
     * matchMedia at mount is fine here — device class (touch vs pointer)
     * effectively never changes mid-session.
     */
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isTouch = window.matchMedia(
      "(hover: none) and (pointer: coarse)"
    ).matches;

    if (reduceMotion || isTouch) return;

    /* smoothWheel only — touch is handled natively now, so the syncTouch
       family of options is gone. */
    const lenis = new Lenis({
      lerp: 0.06,
      smoothWheel: true,
      wheelMultiplier: 0.8,
    });
    window.__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  return children;
}
