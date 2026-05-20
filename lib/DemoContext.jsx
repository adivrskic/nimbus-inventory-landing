"use client";
import { createContext, useCallback, useContext, useState } from "react";
import dynamic from "next/dynamic";

/* DemoModal is large (~700 lines of JSX + 4 SVG icon components +
   GSAP timelines + form validation + Calendly URL builder). It's
   only needed when the user actually clicks a "Request demo" or
   "Talk to sales" trigger.

   Dynamic-importing it means:
   - The main bundle on every page shrinks by ~25-40KB minified
   - The first openDemo() call pays the chunk-fetch cost (~50-150ms
     on a warm connection, more on cold). Subsequent opens are
     instant because the chunk is cached.
   - ssr: false because the modal does WebGL-adjacent things
     (focus management, document.activeElement, addEventListener)
     that don't need to run on the server. Skipping SSR avoids
     React's strictness about useEffect-in-server-render.

   Trade-off: the very first user who clicks "Request demo" sees
   a tiny delay before the modal appears. That's fine — they're
   already committed to opening it.

   If first-open latency becomes a UX issue, you can warm the
   chunk on idle:
     useEffect(() => {
       const id = window.requestIdleCallback?.(() =>
         import("@/components/DemoModal/DemoModal")
       );
       return () => window.cancelIdleCallback?.(id);
     }, []);
   But for now, the simple dynamic import is enough. */
const DemoModal = dynamic(() => import("@/components/DemoModal/DemoModal"), {
  ssr: false,
});

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
      {/* Modal lives here, outside any per-page tree. It's always
          referenced (dynamic-import resolves on demand), so opening
          it across navigations never re-creates form state — the
          chunk loads once per session, then mounts/unmounts off the
          isOpen prop like before. initialTopic seeds the topic chip
          selection each time the modal opens. */}
      <DemoModal isOpen={open} onClose={closeDemo} initialTopic={topic} />
    </DemoCtx.Provider>
  );
}
