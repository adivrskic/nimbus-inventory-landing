"use client";

/* ──────────────────────────────────────────────────────────────────────────
   components/Analytics/PageviewTracker.jsx
   ──────────────────────────────────────────────────────────────────────────
   Fires a GA4 page_view event on every route change in App Router.

   Why this is needed: Next.js App Router does NOT auto-fire pageviews
   on client-side navigation. The initial hard load fires once via the
   gtag config call, but every subsequent in-app nav is silent. This
   component closes that gap by watching pathname + searchParams and
   firing a manual page_view on each change. Combined with
   `send_page_view: false` in <GoogleAnalytics>, the result is:
     - exactly one page_view per page, on every page
     - no double-fire on first load
     - no missed pageviews on SPA navigation

   Wrapped in Suspense because useSearchParams() in App Router opts
   the entire page into client-side rendering UNLESS its consumer is
   inside a Suspense boundary. The fallback is null (this component
   renders nothing visible anyway), so the Suspense boundary is purely
   structural — it stops the CSR opt-in from propagating up the tree.
   ────────────────────────────────────────────────────────────────────────── */

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function PageviewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* gtag's dataLayer shim queues calls made before the actual gtag.js
     script loads, so we can safely call from useEffect on first render
     even if the script is still in flight. */
  const firedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;

    /* Build the path the same way GA's automatic tracking would, so the
       reports stay consistent: path + querystring, no origin. */
    const query = searchParams?.toString();
    const path = pathname + (query ? `?${query}` : "");

    /* Guard against double-firing the same path twice in quick succession
       (React strict mode in dev re-runs effects; rapid replaceState calls
       can also trigger it). */
    const key = `${path}`;
    if (firedRef.current === key) return;
    firedRef.current = key;

    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.origin + path,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function PageviewTracker() {
  return (
    <Suspense fallback={null}>
      <PageviewTrackerInner />
    </Suspense>
  );
}
