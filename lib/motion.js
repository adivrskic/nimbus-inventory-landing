// The ONLY place motion values live. Every animation across the site —
// reveals, staggers, headline letters, page transitions, bespoke timelines —
// references these tokens instead of hand-written numbers.
//
// Why this exists:
//   Before this file, the same "fade up on scroll" reveal was reimplemented
//   in ~10 components with drifting values (durations 0.5–0.9, eases
//   power3.out / power4.out / sine.inOut, starts "top 65%"–"top 88%",
//   staggers 0.014–0.1, y-offsets 10–30). That drift is exactly why motion
//   felt inconsistent. Centralizing it makes "uniform" the default and the
//   only way to retune the whole site is to edit this one file.
//
// Naming rule: tokens are named by INTENT, not by value. Components ask for
// `DURATION.base` or `TRIGGER.reveal`, never `0.6` or `"top 85%"`.
// ──────────────────────────────────────────────────────────────────────────

/* Tuned 2026-07 for a snappier feel: reveals fire as soon as an element
   clears the fold (92%), run ~25% shorter, travel less, and stagger
   tighter. Change here, not per-component. */
export const DURATION = {
  fast: 0.35,
  base: 0.45,
  slow: 0.6,
};

export const EASE = {
  out: "power3.out",
  inOut: "power2.inOut",
  scrub: "none",
};

export const STAGGER = {
  tight: 0.02,
  base: 0.055,
};

export const DISTANCE = {
  sm: 10,
  md: 18,
};

export const TRIGGER = {
  /* clamp() keeps the trigger point inside the page's real scroll range.
     Without it, a section near the bottom of a short page gets a start
     position below max-scroll — the trigger never fires and the element
     stays at its hidden "from" state (opacity 0). */
  reveal: "clamp(top 92%)",
  section: "clamp(top 90%)",
};

export const SCRUB = 0.6;
