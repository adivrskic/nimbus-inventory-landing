"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function LenisProvider({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.06,
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: 0.04,
      touchInertiaMultiplier: 25,
      wheelMultiplier: 0.8,
    });
    // Expose for ProblemSolution to stop/start
    window.__lenis = lenis;

    // Sync Lenis with GSAP ScrollTrigger
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
