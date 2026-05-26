// ──────────────────────────────────────────────────────────────────────────
// lib/motion.js
// ──────────────────────────────────────────────────────────────────────────
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

/* Durations (seconds). Three steps is deliberately few — more options just
   reintroduce drift. `fast` = small UI / text, `base` = the default for
   nearly everything, `slow` = large hero moments. */
export const DURATION = {
  fast: 0.45,
  base: 0.6,
  slow: 0.8,
};

/* Easing. `out` is the standard entrance curve (decelerate into place).
     `inOut` is for symmetric motion like overlays / page transitions.
     `scrub` is literally "none" — anything tied to scroll position must be
     linear so it tracks the scrollbar 1:1. Named so intent is explicit. */
export const EASE = {
  out: "power3.out",
  inOut: "power2.inOut",
  scrub: "none",
};

/* Stagger (seconds between siblings). `tight` for per-letter headline
     reveals; `base` for cards / list items / section children. */
export const STAGGER = {
  tight: 0.025,
  base: 0.08,
};

/* Travel distance (px) for "fade UP" reveals. `sm` for text, `md` for cards
     and bigger blocks. Kept small on purpose — large translate distances are
     the main cause of janky, heavy-feeling scroll reveals. */
export const DISTANCE = {
  sm: 12,
  md: 24,
};

/* ScrollTrigger positions, named by what's entering. `reveal` is a single
     element/group crossing into view; `section` fires a touch earlier for a
     whole section block so its first row isn't already on-screen when it
     animates. Add new named positions here rather than inlining "top NN%". */
export const TRIGGER = {
  reveal: "top 85%",
  section: "top 80%",
};

/* Scrub smoothing for scroll-tied (non-discrete) animations — the catch-up
     lag between scroll and animation. A small number feels responsive; larger
     feels floaty. One value keeps every scrubbed effect feeling the same. */
export const SCRUB = 0.6;
