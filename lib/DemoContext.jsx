"use client";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import DemoModal from "@/components/DemoModal/DemoModal";
import { track } from "@/lib/analytics";

/* ═══════════════════════════════════════════════════════════════════════
   DemoContext
   ───────────────────────────────────────────────────────────────────────
   Single source of truth for the demo modal's open/closed state and the
   currently-selected meeting topic. Lives at layout level so the modal
   survives page navigations.

   Any component, anywhere in the tree, can call:

     useDemo().openDemo(topic, { source })

   to pop the modal. Pass an optional topic string to pre-select what
   the meeting is about — e.g. openDemo("sales", { source: "pricing_tier_enterprise" })
   on a "Talk to Sales" CTA. The `source` value flows into the GA4
   `demo_modal_open` event so we can attribute demo opens to specific
   CTAs. See analytics-audit.md for the canonical source vocabulary.

   Valid topic keys (see DemoModal TOPICS): "demo" | "sales" |
   "migration" | "integration". Unknown keys fall back to "demo".

   Analytics events fired:
     - demo_modal_open  { topic, source } — when openDemo() is called
     - demo_modal_close { topic, outcome } — when closeDemo() is called
                                              outcome defaults to 'abandoned';
                                              DemoModal overrides it on
                                              submit ('submitted') and on
                                              Calendly click ('calendly').
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

  /* Tracks the last-open's source + topic for the close event. Used so
     demo_modal_close carries the same topic that demo_modal_open did,
     even if the user changed the chip mid-modal. */
  const lastOpenRef = useRef({ topic: "demo", source: "unknown" });

  const openDemo = useCallback((nextTopic, options = {}) => {
    const resolvedTopic =
      typeof nextTopic === "string" && nextTopic.length > 0
        ? nextTopic
        : "demo";
    const resolvedSource =
      typeof options?.source === "string" && options.source.length > 0
        ? options.source
        : "unknown";

    setTopic(resolvedTopic);
    setOpen(true);

    lastOpenRef.current = { topic: resolvedTopic, source: resolvedSource };

    track("demo_modal_open", {
      topic: resolvedTopic,
      source: resolvedSource,
    });
  }, []);

  /* closeDemo accepts an optional outcome so DemoModal can mark the
     close as a successful submit or a Calendly redirect. Default
     ("abandoned") covers backdrop/Escape/X-button closes. */
  const closeDemo = useCallback((outcome = "abandoned") => {
    setOpen(false);
    track("demo_modal_close", {
      topic: lastOpenRef.current.topic,
      outcome,
    });
  }, []);

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
