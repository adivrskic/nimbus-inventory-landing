"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
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

  const togglePaused = useCallback(() => {
    setPaused((prev) => !prev);
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
