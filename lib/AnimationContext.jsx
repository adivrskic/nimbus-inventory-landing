"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import gsap from "gsap";

const AnimationContext = createContext({
  paused: false,
  togglePaused: () => {},
});

export function useAnimationPaused() {
  return useContext(AnimationContext);
}

export function AnimationProvider({ children }) {
  const [paused, setPaused] = useState(false);

  /**
   * Track whether the user has manually toggled the animation state.
   * If they have, OS-level prefers-reduced-motion changes won't override
   * their explicit choice for the rest of the session.
   */
  const userToggled = useRef(false);

  const togglePaused = useCallback(() => {
    userToggled.current = true;
    setPaused((prev) => !prev);
  }, []);

  /**
   * Initial pickup of prefers-reduced-motion + live listener.
   * If the user has reduced-motion enabled at the OS level, default to paused.
   * If they toggle their OS setting mid-session, follow along — unless they've
   * already made an explicit choice via the in-app toggle.
   */
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

  /**
   * Apply / remove the body class. The class triggers the global CSS rules in
   * globals.css that force GSAP-hidden elements (inline opacity:0, "Letter"
   * class hiding, [data-anim-hidden]) to be visible.
   */
  useEffect(() => {
    if (paused) {
      document.body.classList.add("animations-paused");
      gsap.globalTimeline.pause();
    } else {
      document.body.classList.remove("animations-paused");
      gsap.globalTimeline.resume();
    }
  }, [paused]);

  return (
    <AnimationContext.Provider value={{ paused, togglePaused }}>
      {children}
    </AnimationContext.Provider>
  );
}
