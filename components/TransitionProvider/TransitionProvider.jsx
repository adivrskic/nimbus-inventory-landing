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

const TransitionContext = createContext(null);

export function usePageTransition() {
  return useContext(TransitionContext);
}

export default function TransitionProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const isAnimating = useRef(false);
  const prevPathname = useRef(pathname);

  // Fade content in when pathname changes
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      const content = contentRef.current;
      if (content) {
        gsap.fromTo(
          content,
          { opacity: 0 },
          { opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.05 }
        );
      }
    }
  }, [pathname]);

  const navigateTo = useCallback(
    (href) => {
      if (isAnimating.current) return;

      // Same exact page — scroll to top
      if (href === pathname) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // External / mailto
      if (href.startsWith("http") || href.startsWith("mailto:")) {
        window.open(href, "_blank");
        return;
      }

      isAnimating.current = true;
      const overlay = overlayRef.current;
      const content = contentRef.current;

      // Parse hash if present
      const hashIdx = href.indexOf("#");
      const basePath = hashIdx >= 0 ? href.slice(0, hashIdx) || "/" : href;
      const hash = hashIdx >= 0 ? href.slice(hashIdx + 1) : null;
      const samePage =
        basePath === pathname || (basePath === "/" && pathname === "/");

      if (samePage && hash) {
        // Same page hash — quick fade, scroll, fade back
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

      // Full page transition
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
        // Scroll to hash after page loads
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
      <div ref={contentRef} style={{ opacity: 1 }}>
        {children}
      </div>
      <div
        ref={overlayRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "#000",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </TransitionContext.Provider>
  );
}
