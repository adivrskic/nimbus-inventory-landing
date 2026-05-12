"use client";
import { createContext, useCallback, useContext, useState } from "react";
import DemoModal from "@/components/DemoModal/DemoModal";

/* ═══════════════════════════════════════════════════════════════════════
   DemoContext
   ───────────────────────────────────────────────────────────────────────
   Single source of truth for the demo modal's open/closed state. Lives at
   layout level so the modal survives page navigations — opening it and
   then clicking a TransitionLink no longer destroys the modal mid-fill.

   Any component, anywhere in the tree, can call useDemo().openDemo()
   to pop the modal. No more prop drilling onDemo through every page.
   ═══════════════════════════════════════════════════════════════════════ */

const DemoCtx = createContext(null);

export function useDemo() {
  const ctx = useContext(DemoCtx);
  if (!ctx) {
    /* Soft-fail in case a stray render happens outside the provider —
       returns inert callbacks so we don't crash. */
    return { open: false, openDemo: () => {}, closeDemo: () => {} };
  }
  return ctx;
}

export default function DemoHost({ children }) {
  const [open, setOpen] = useState(false);
  const openDemo = useCallback(() => setOpen(true), []);
  const closeDemo = useCallback(() => setOpen(false), []);

  return (
    <DemoCtx.Provider value={{ open, openDemo, closeDemo }}>
      {children}
      {/* Modal lives here, outside any per-page tree. It's always mounted
          (just opacity: 0 when closed) so opening it across navigations
          never re-creates form state. */}
      <DemoModal isOpen={open} onClose={closeDemo} />
    </DemoCtx.Provider>
  );
}
