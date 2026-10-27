"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

const AnimationContext = createContext({
  paused: false,
  togglePaused: () => {},
});

export function useAnimationPaused() {
  return useContext(AnimationContext);
}

export function AnimationProvider({ children }) {
  const [paused, setPaused] = useState(false);

  const userToggled = useRef(false);

  const togglePaused = useCallback(() => {
    userToggled.current = true;
    setPaused((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) setPaused(true);

    const onChange = (e) => {
      if (!userToggled.current) setPaused(e.matches);
    };

    if (mq.addEventListener) {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  /* Only the body class. The old gsap.globalTimeline.pause() froze EVERY
     tween mid-flight under reduced motion — including the matchMedia
     reduced branches in lib/gsap that already render final state with
     duration 0 — and the page-transition fades, so content stuck at
     opacity 0. The CSS `.animations-paused` rules in globals.css plus
     the per-hook reduced branches cover motion suppression. */
  useEffect(() => {
    document.body.classList.toggle("animations-paused", paused);
  }, [paused]);

  return (
    <AnimationContext.Provider value={{ paused, togglePaused }}>
      {children}
    </AnimationContext.Provider>
  );
}
