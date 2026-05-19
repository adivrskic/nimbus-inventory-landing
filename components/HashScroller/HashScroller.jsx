"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Hash-aware scroll helper for App Router.
 *
 * Why this exists: when a link like `/#ai-engine` is clicked from another
 * page, Next's default behavior is to navigate to `/` and scroll to the
 * top of the new route. The hash target either doesn't exist yet (client
 * components still mounting / lazy-loaded sections) or its layout hasn't
 * settled, so the browser's native hash scroll misses. This component
 * polls for the target element after the route resolves, waits for its
 * position to stabilize across consecutive frames, then scrolls.
 *
 * Mount once near the top of the home page (or in the root layout if you
 * want it everywhere).
 */
export default function HashScroller() {
  const pathname = usePathname();

  /* Cross-page navigation — fires on every pathname change.
     Uses an instant scroll because the page just mounted at top and we
     want to "land" at the target, not animate a kilometer of scroll. */
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    let id;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      id = hash.slice(1);
    }
    if (!id) return;

    let raf;
    let attempts = 0;
    const maxAttempts = 180; // ~3 seconds at 60fps before giving up
    let stableCount = 0;
    let lastY = Number.NaN;

    const tick = () => {
      attempts++;
      const el = document.getElementById(id);

      if (el) {
        const targetY = el.getBoundingClientRect().top + window.scrollY;

        /* Has the element's position stopped moving? Children mounting,
           images loading, or fonts swapping can all shift it after first
           paint. Waiting for 3 consecutive frames with the same position
           gives layout time to settle without arbitrary fixed timeouts. */
        if (targetY === lastY) {
          stableCount++;
        } else {
          stableCount = 0;
          lastY = targetY;
        }

        if (stableCount >= 3) {
          /* Explicit "instant" overrides any global CSS `scroll-behavior:
             smooth` so first-landing nav doesn't animate the whole page
             past the user. scroll-margin-top on the target is respected. */
          el.scrollIntoView({ behavior: "instant", block: "start" });
          return;
        }
      }

      if (attempts < maxAttempts) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  /* In-page hash navigation — when the user clicks a hash link while
     already on the home page. Smooth scroll is nicer here since the
     target is already laid out and the user has context. */
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      if (!hash || hash.length < 2) return;
      let id;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        id = hash.slice(1);
      }
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
