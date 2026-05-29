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
