"use client";
import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import gsap from "gsap";
import styles from "./TransitionProvider.module.css";

const TransitionContext = createContext(null);

export function usePageTransition() {
  return useContext(TransitionContext);
}

/* ═══════════════════════════════════════════════════════════════════════
   TransitionProvider — shelf-style transition
   ───────────────────────────────────────────────────────────────────────
   The overlay starts below the Nav (top: 72px desktop, 60px mobile) and
   z-index sits below Nav's 100. Result: during page transitions, the
   Nav stays continuously visible while only the page content area is
   covered by the dark overlay.

   The "content to fade" is identified by the data-page-content attribute,
   set by app/layout.js on the <main> wrapper around {children}.

   ── Reduced-motion handling (Wave 1 a11y) ──
   When the user has prefers-reduced-motion enabled, every animation in
   this provider is bypassed:
     - No overlay fade-in/out
     - No content fade-out on navigate
     - No fade-in on new page render
   The actual navigation (router.push) still happens, just instantly.
   This satisfies WCAG 2.3.3 (Animation from Interactions): non-essential
   motion triggered by user interaction must respect the OS-level
   reduced-motion preference.

   The check is dynamic (re-evaluated on every navigation) rather than
   cached at mount, because:
     - macOS / iOS users can toggle the setting without restarting apps
     - Some assistive tech changes it on the fly
     - Caching at mount means the page would have to be reloaded for a
       toggle to take effect, which is a worse UX
   ═══════════════════════════════════════════════════════════════════════ */

/* Read the OS-level preference each time. Returns false during SSR (no
   window.matchMedia available); the first navigation post-hydration
   reads accurately. */
function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function TransitionProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef(null);
  const isAnimating = useRef(false);
  const prevPathname = useRef(pathname);

  /* Helper — find the page content area set up in layout.js. Falls back
     to body so we never crash if the attribute is missing (e.g. during
     dev hot-reload weirdness). */
  const getContent = () =>
    document.querySelector("[data-page-content]") || document.body;

  /* Fade content in when pathname changes (the new page just rendered).
     Skipped under reduced-motion — the new page is visible immediately
     instead of fading in. */
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      const content = getContent();
      if (!content) return;

      if (prefersReducedMotion()) {
        /* Hard-set to opaque in case a previous tween left it at 0. */
        gsap.set(content, { opacity: 1, clearProps: "opacity" });
        return;
      }

      gsap.fromTo(
        content,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.05 }
      );
    }
  }, [pathname]);

  const navigateTo = useCallback(
    (href) => {
      if (isAnimating.current) return;

      /* Same exact page — scroll to top. Smooth scroll still respects
         the user's scroll-behavior preference (Lenis bypasses RM
         globally too), so no special branch needed here. */
      if (href === pathname) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      /* External / mailto */
      if (href.startsWith("http") || href.startsWith("mailto:")) {
        window.open(href, "_blank");
        return;
      }

      /* Parse hash if present */
      const hashIdx = href.indexOf("#");
      const basePath = hashIdx >= 0 ? href.slice(0, hashIdx) || "/" : href;
      const hash = hashIdx >= 0 ? href.slice(hashIdx + 1) : null;
      const samePage =
        basePath === pathname || (basePath === "/" && pathname === "/");

      /* ─── Reduced-motion branch ───
         Skip every animation and do an instant navigation. The visual
         "shelf" transition is decorative — the meaningful interaction
         is the navigation itself, which still happens. */
      if (prefersReducedMotion()) {
        if (samePage && hash) {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: "instant" });
          return;
        }
        router.push(basePath);
        window.scrollTo(0, 0);
        if (hash) {
          /* Wait for the new page to render before resolving the hash.
             The delay matches the non-RM branch so behavior is
             consistent — just without the visible fade wrapping it. */
          setTimeout(() => {
            const el = document.getElementById(hash);
            if (el) el.scrollIntoView({ behavior: "instant" });
          }, 350);
        }
        return;
      }

      /* ─── Animated branch (motion enabled) ─── */
      isAnimating.current = true;
      const overlay = overlayRef.current;
      const content = getContent();

      if (samePage && hash) {
        /* Same page hash — quick fade, scroll, fade back */
        const tl = gsap.timeline({
          onComplete: () => {
            isAnimating.current = false;
          },
        });
        tl.to(overlay, { opacity: 0.6, duration: 0.2, ease: "power2.in" });
        tl.call(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: "instant" });
        });
        tl.to(overlay, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
          delay: 0.05,
        });
        return;
      }

      /* Full page transition */
      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating.current = false;
        },
      });

      if (content) {
        tl.to(content, { opacity: 0, duration: 0.25, ease: "power2.in" }, 0);
      }
      tl.to(overlay, { opacity: 1, duration: 0.3, ease: "power2.inOut" }, 0.05);

      tl.call(() => {
        router.push(basePath);
        window.scrollTo(0, 0);
        /* Scroll to hash after the new page renders */
        if (hash) {
          setTimeout(() => {
            const el = document.getElementById(hash);
            if (el) el.scrollIntoView({ behavior: "instant" });
          }, 350);
        }
      });

      tl.to(overlay, {
        opacity: 0,
        duration: 0.35,
        ease: "power2.out",
        delay: 0.1,
      });
    },
    [router, pathname]
  );

  return (
    <TransitionContext.Provider value={navigateTo}>
      {children}
      {/* Overlay — class-based so we can use a media query for the
          mobile nav height. Always rendered, opacity-controlled by GSAP. */}
      <div
        ref={overlayRef}
        data-transition-overlay=""
        className={styles.overlay}
      />
    </TransitionContext.Provider>
  );
}
