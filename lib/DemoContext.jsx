"use client";
import { createContext, useCallback, useContext, useState } from "react";
import dynamic from "next/dynamic";
import { track } from "@/lib/analytics";

const DemoModal = dynamic(() => import("@/components/DemoModal/DemoModal"), {
  ssr: false,
});

const DemoCtx = createContext(null);

export function useDemo() {
  const ctx = useContext(DemoCtx);
  if (!ctx) {
    return {
      open: false,
      topic: "demo",
      openDemo: () => {},
      closeDemo: () => {},
    };
  }
  return ctx;
}

export default function DemoHost({ children }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("demo");
  const [source, setSource] = useState(null);

  /* openDemo(topic?, { source }) — `source` names the CTA that opened the
     modal ("hero", "pricing_tier_pro", …). It used to be dropped right
     here, so no demo request could be traced back to the button that
     produced it. It now reaches DemoModal's conversion event, and demo_open
     records the first step of the funnel. */
  const openDemo = useCallback((nextTopic, opts) => {
    const t =
      typeof nextTopic === "string" && nextTopic.length > 0 ? nextTopic : "demo";
    const src = typeof opts?.source === "string" ? opts.source : null;
    setTopic(t);
    setSource(src);
    setOpen(true);
    track("demo_open", { topic: t, cta_source: src || "unknown" });
  }, []);
  const closeDemo = useCallback(() => setOpen(false), []);

  return (
    <DemoCtx.Provider value={{ open, topic, openDemo, closeDemo }}>
      {children}
      <DemoModal
        isOpen={open}
        onClose={closeDemo}
        initialTopic={topic}
        source={source}
      />
    </DemoCtx.Provider>
  );
}
