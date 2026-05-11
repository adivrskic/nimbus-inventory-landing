"use client";
import { useEffect, useState } from "react";

/**
 * Returns true if the user has requested reduced motion via OS settings.
 *
 * SSR-safe: returns false during SSR, syncs to the actual preference on mount.
 * Listens for changes so the value updates if the user toggles their OS setting.
 *
 * Usage:
 *   const reduced = useReducedMotion();
 *   useEffect(() => {
 *     if (reduced) {
 *       gsap.set(letters, { opacity: 1, y: 0, rotateX: 0 });
 *       return;
 *     }
 *     // ... normal GSAP timeline
 *   }, [reduced]);
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const onChange = (e) => setReduced(e.matches);

    // Modern browsers
    if (mq.addEventListener) {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    // Safari < 14 fallback
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  return reduced;
}
