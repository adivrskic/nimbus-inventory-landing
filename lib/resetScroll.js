// Lenis-aware instant scroll-to-top.
//
// Plain window.scrollTo(0, 0) fights the Lenis smooth-scroller: Lenis
// keeps its own internal scroll position, so after a native jump it
// eases the page BACK toward where it was — the "new page loads
// scrolled/rubber-bands to top" glitch seen when navigating between
// pages. Resetting through Lenis (immediate, no easing) keeps its
// internal state and the real scroll position in lockstep. Falls back
// to the native call when Lenis is disabled (touch devices,
// prefers-reduced-motion, SSR).
export function resetScroll() {
  if (typeof window === "undefined") return;
  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true });
  } else {
    window.scrollTo(0, 0);
  }
}
