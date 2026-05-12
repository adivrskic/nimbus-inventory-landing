"use client";
import { createContext, useCallback, useContext, useState } from "react";
import DemoModal from "@/components/DemoModal/DemoModal";

/* ═══════════════════════════════════════════════════════════════════════
   DemoContext
   ───────────────────────────────────────────────────────────────────────
   Single source of truth for the demo modal's open/closed state and the
   currently-selected meeting topic. Lives at layout level so the modal
   survives page navigations.

   Any component, anywhere in the tree, can call useDemo().openDemo()
   to pop the modal. Pass an optional topic string to pre-select what
   the meeting is about — e.g. openDemo("sales") on a "Talk to Sales"
   CTA. The user can still change the topic from inside the modal.

   Valid topic keys (see DemoModal TOPICS): "demo" | "sales" |
   "migration" | "integration". Unknown keys fall back to "demo".
   ═══════════════════════════════════════════════════════════════════════ */

const DemoCtx = createContext(null);

export function useDemo() {
  const ctx = useContext(DemoCtx);
  if (!ctx) {
    /* Soft-fail in case a stray render happens outside the provider —
       returns inert callbacks so we don't crash. */
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
      {/* Modal lives here, outside any per-page tree. It's always mounted
          (just opacity: 0 when closed) so opening it across navigations
          never re-creates form state. initialTopic seeds the topic chip
          selection each time the modal opens. */}
      <DemoModal isOpen={open} onClose={closeDemo} initialTopic={topic} />
    </DemoCtx.Provider>
  );
}
