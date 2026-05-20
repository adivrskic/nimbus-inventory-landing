"use client";

/* ──────────────────────────────────────────────────────────────────────────
   components/RouteAnnouncer/RouteAnnouncer.jsx
   ──────────────────────────────────────────────────────────────────────────
   Fills two gaps in Next.js App Router accessibility:

   1) SPA navigation is silent to screen readers. The browser's
      "page loaded" announcement only fires on hard loads — client-side
      route changes don't trigger anything. Without this component a
      blind user clicking a link gets no signal that the page changed.

   2) Focus stays on the clicked link after navigation, which is now
      stale (the link element itself may have been removed from the
      DOM). Keyboard users effectively lose their place.

   The standard fix, implemented here:

     - Watch usePathname() for changes.
     - On each change, after a small delay so the new content has
       rendered, read the new page's H1 (or aria-label if it has one).
     - Set that text on a visually-hidden aria-live="polite" region so
       AT announces it.
     - Move focus to #main-content so keyboard users land at the start
       of the new page content.

   Skipping the first render is important — the initial page load
   already gets its own browser-level announcement, so re-announcing it
   would be a double-fire.

   `preventScroll: true` on the focus() call keeps the page's scroll
   position stable while still moving the logical focus target.

   Mounted near the end of <body> in layout.js. Suspense wrap is needed
   because we'd otherwise opt the entire page tree into CSR (App Router
   rule for any component reading dynamic params).
   ────────────────────────────────────────────────────────────────────────── */

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const ANNOUNCER_STYLE = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

function RouteAnnouncerInner() {
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      /* Initial page load — the browser already announced the page
         title. Skip so we don't double-fire on first paint. */
      firstRender.current = false;
      return;
    }

    /* Defer the announcement + focus move until the new page's content
       has rendered. 100ms is enough for typical client transitions; if
       a page does heavy SSR-blocked work on mount, the announcement
       might land on stale content. In practice all pages on this site
       are SSR'd, so by the time pathname updates, the new H1 is in
       the DOM. */
    const timer = setTimeout(() => {
      if (typeof document === "undefined") return;

      const h1 = document.querySelector("h1");
      /* Prefer aria-label (which SplitText sets on its `as` path) over
         textContent (which on the legacy path includes the visible-
         but-aria-hidden letter spans). */
      const announcement =
        h1?.getAttribute("aria-label") || h1?.textContent || "";
      setMessage(announcement.trim());

      const main = document.getElementById("main-content");
      if (main) {
        main.focus({ preventScroll: true });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={ANNOUNCER_STYLE}
    >
      {message}
    </div>
  );
}

export default function RouteAnnouncer() {
  return (
    <Suspense fallback={null}>
      <RouteAnnouncerInner />
    </Suspense>
  );
}
