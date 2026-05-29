"use client";
import { createContext, useCallback, useContext, useState } from "react";
import dynamic from "next/dynamic";

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

  const openDemo = useCallback((nextTopic) => {
    if (typeof nextTopic === "string" && nextTopic.length > 0) {
      setTopic(nextTopic);
    } else {
      setTopic("demo");
    }
    setOpen(true);
  }, []);
  const closeDemo = useCallback(() => setOpen(false), []);

  return (
    <DemoCtx.Provider value={{ open, topic, openDemo, closeDemo }}>
      {children}
      <DemoModal isOpen={open} onClose={closeDemo} initialTopic={topic} />
    </DemoCtx.Provider>
  );
}
