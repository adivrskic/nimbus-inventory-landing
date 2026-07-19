"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function LenisProvider({ children }) {
  /* Keep ScrollTrigger positions honest as the document changes height.
     The heavy home sections (AISection, WarehouseShowcase, Integrations,
     Industries, Footer) are dynamic() chunks that mount AFTER window
     load — ScrollTrigger only auto-refreshes on load/resize, so any
     trigger created before those chunks land keeps a stale position.
     That's how the bottom "Ask Nautilus" CTA could sit at opacity 0 (or
     pop in with no animation): its trigger point was computed against a
     much shorter page. A debounced refresh on body-height change fixes
     the whole class. Runs regardless of Lenis/reduced-motion. */
  useEffect(() => {
    if (typeof window === "undefined" || !("ResizeObserver" in window))
      return;
    let t = 0;
    let lastH = document.body.scrollHeight;
    const ro = new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      if (Math.abs(h - lastH) < 2) return;
      lastH = h;
      clearTimeout(t);
      t = setTimeout(() => ScrollTrigger.refresh(), 120);
    });
    ro.observe(document.body);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isTouch = window.matchMedia(
      "(hover: none) and (pointer: coarse)"
    ).matches;

    if (reduceMotion || isTouch) return;

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

    /* Back/forward navigation bypasses TransitionProvider: the browser
       restores scroll natively, but Lenis's internal position still
       points at the pre-navigation offset — the next wheel tick would
       ease the page back there (visible jump/rubber-band when going
       "back" to the home page). Re-sync Lenis to wherever the browser
       actually restored to. */
    const onPopState = () => {
      requestAnimationFrame(() => {
        lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      });
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  return children;
}
