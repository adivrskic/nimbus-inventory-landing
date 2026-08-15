"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";

/* ═══════════════════════════════════════════════════════════════════════
   RevealGuarantee — content is never left invisible.

   WHY
   ───
   ~149 CSS rules across 20 modules declare `opacity: 0` as the resting
   state for content that a scroll reveal is supposed to animate in. That
   is 149 chances for a user to see a blank space: if a trigger doesn't
   fire, a gated intro never releases, a component throws, or a
   reduced-motion path forgets one selector, the text is gone for good.
   The existing static-mode backstop in globals.css only rescues elements
   carrying an INLINE opacity/transform, so anything hidden purely by CSS
   (which is most of them) slips straight through it.

   WHAT THIS DOES
   ──────────────
   Whenever the viewport settles — on load, on route change, after a
   scroll, on bfcache restore — anything in the viewport that is still
   fully transparent gets forced visible. It is a safety net, not the
   animation system: in the normal case every reveal has already played
   and this finds nothing.

   HOW IT AVOIDS FIGHTING THE ANIMATIONS
   ─────────────────────────────────────
   Three guards, because a false positive here is a visible pop on a
   healthy page — worse than the bug it's insuring against:

     1. A floor of SETTLE_MS since the route mounted. Measured on the
        real site, the slowest legitimate reveal chain (the home hero
        cascade) finishes around 4 s; everything else is done inside 1 s.
        The floor sits comfortably past the slowest one.
     2. Two samples CONFIRM_MS apart — a single frame where an element
        happens to read 0 is never enough.
     3. Anything with a live GSAP tween on it is left alone; it is
        mid-flight. A *paused* tween does not count, because that is
        exactly the failure being insured against — a gated reveal whose
        gate never opened.

   Deliberately-hidden things are exempt by selector (menus, modals,
   inert layers) and the two scroll-driven canvases opt out explicitly
   via data-reveal-exempt — their stages pass through opacity 0 by design
   at the section edges.

   In development it logs what it rescued, so a real broken reveal shows
   up as a warning instead of being silently papered over.
   ═══════════════════════════════════════════════════════════════════════ */

/* Never touch chrome that is *supposed* to be invisible until the user
   opens it. `nav` covers mega-menus and mobile sheets; the role/state
   selectors cover modals, popovers and anything explicitly marked. */
const EXEMPT =
  'nav,[role="navigation"],[role="dialog"],[role="menu"],[aria-hidden="true"],' +
  "[inert],[hidden],[data-reveal-exempt]";

/* Don't judge anything until the slowest legitimate reveal chain has had
   time to finish. See the header note — measured, not guessed. */
const SETTLE_MS = 4500;
/* Gap between the two samples that must agree before we act. */
const CONFIRM_MS = 600;

/* When motion is off there is nothing to interrupt, so both delays above
   are pure downside — they'd leave a reduced-motion user staring at blank
   text for five seconds. Act almost immediately instead.
   This is also what covers the ~149 CSS `opacity: 0` resting states under
   reduced motion: the paused-mode rule in globals.css only rescues
   elements carrying an INLINE opacity, and a reveal that never ran never
   wrote one. */
const REDUCED_SETTLE_MS = 120;
const REDUCED_CONFIRM_MS = 80;

function motionIsOff() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
    document.body.classList.contains("animations-paused")
  );
}
/* After a scroll stops, give whatever just entered the viewport time to
   play before re-checking. Reveals run 0.35–0.6 s. */
const AFTER_SCROLL_MS = 900;

/* Only clear a transform when it is a pure translation — that's what the
   reveals use (translateY), and its resting state is none. Anything with
   scale/rotate/skew in the matrix might be load-bearing layout, so leave
   it alone and settle for making the element visible. */
function isPureTranslate(transform) {
  if (!transform || transform === "none") return true;
  const m = /^matrix\(([^)]+)\)$/.exec(transform);
  if (!m) return false; // matrix3d or something exotic — don't touch
  const [a, b, c, d] = m[1].split(",").map((n) => parseFloat(n));
  return a === 1 && b === 0 && c === 0 && d === 1;
}

function findHidden() {
  const found = [];
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  for (const root of document.querySelectorAll("main, footer")) {
    for (const el of root.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      if (cs.opacity !== "0" && cs.visibility !== "hidden") continue;

      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      // in the viewport only — this is about what the user is looking at
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      // decorative layers have no text; leave them to the designer
      if (!el.textContent || !el.textContent.trim()) continue;
      if (el.closest(EXEMPT)) continue;

      found.push(el);
    }
  }
  return found;
}

/* A tween that is actually running means the reveal is in flight — leave
   it be. A paused one does not count: that's the stuck-gate case. */
function isAnimating(el) {
  try {
    return gsap.getTweensOf(el).some((t) => t.isActive());
  } catch {
    return false;
  }
}

/* Scroll-SCRUBBED opacity is a completely different animal from a reveal:
   the value is bound to scroll position, and sitting at 0 is a legitimate
   resting state, not a failure. The hero is the reason this exists — it
   pins behind the whole page and dissolves itself to 0 as you scroll past
   it. "Rescuing" it forced the banner back to full opacity, where it then
   showed through every section with a transparent background. */
function isScrubDriven(el) {
  try {
    return gsap
      .getTweensOf(el)
      .some((t) => t.scrollTrigger && t.scrollTrigger.vars?.scrub);
  } catch {
    return false;
  }
}

function reveal(el) {
  el.style.setProperty("opacity", "1", "important");
  if (getComputedStyle(el).visibility === "hidden")
    el.style.setProperty("visibility", "visible", "important");
  if (isPureTranslate(getComputedStyle(el).transform))
    el.style.setProperty("transform", "none", "important");
}

export default function RevealGuarantee() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    const mountedAt =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const sinceMount = () =>
      (typeof performance !== "undefined" ? performance.now() : Date.now()) -
      mountedAt;

    const sweep = () => {
      if (cancelled) return;
      const off = motionIsOff();
      const settle = off ? REDUCED_SETTLE_MS : SETTLE_MS;
      const confirm = off ? REDUCED_CONFIRM_MS : CONFIRM_MS;

      /* Never judge before the page has had time to animate normally —
         a sweep scheduled by an early scroll must still wait. */
      if (sinceMount() < settle) {
        timers.push(setTimeout(sweep, settle - sinceMount() + 20));
        return;
      }

      const first = findHidden();
      if (!first.length) return;

      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          const stuck = first.filter((el) => {
            if (!el.isConnected) return false;
            if (isAnimating(el)) return false; // mid-flight, leave it
            if (isScrubDriven(el)) return false; // scroll-bound, 0 is valid
            const cs = getComputedStyle(el);
            return cs.opacity === "0" || cs.visibility === "hidden";
          });
          if (!stuck.length) return;

          stuck.forEach(reveal);

          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[RevealGuarantee] forced ${stuck.length} element(s) visible on ${pathname} — ` +
                "a reveal never fired. Worth fixing at the source:",
              stuck
            );
          }
        }, confirm)
      );
    };

    /* Landing: an early attempt (which self-defers unless motion is off),
       one after things have settled, and one later in case fonts or images
       shifted layout and moved a trigger out of range. */
    timers.push(setTimeout(sweep, REDUCED_SETTLE_MS));
    timers.push(setTimeout(sweep, SETTLE_MS));
    timers.push(setTimeout(sweep, SETTLE_MS * 2));

    /* Scrolling: rescue anything that scrolls into view and stays blank. */
    let scrollTimer = 0;
    const onScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(sweep, AFTER_SCROLL_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* Back/forward cache restore repaints from a snapshot — re-check. */
    const onPageShow = (e) => e.persisted && sweep();
    window.addEventListener("pageshow", onPageShow);

    /* Fonts swapping in can move every trigger point; re-check after. */
    if (document.fonts?.ready) document.fonts.ready.then(sweep).catch(() => {});

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      clearTimeout(scrollTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [pathname]);

  return null;
}
