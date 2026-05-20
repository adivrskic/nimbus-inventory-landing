"use client";

/* ──────────────────────────────────────────────────────────────────────────
   components/SkipLink/SkipLink.jsx
   ──────────────────────────────────────────────────────────────────────────
   Standard "Skip to main content" link for keyboard users. Visually
   hidden until it receives focus (Tab from the address bar), at which
   point it slides into view at the top-left.

   Mounted as the first child of <body> in app/layout.js so it's the
   first interactive element in the tab order on every page. Without
   this, keyboard users have to Tab through the entire Nav (logo +
   mega-menu items + animation toggle + demo CTA + hamburger) before
   reaching the page content. This is the WCAG 2.4.1 (Bypass Blocks)
   fix.

   Behavior notes:

   - The site uses Lenis smooth-scroll, which intercepts wheel/touch
     gestures. Native anchor links bypass Lenis but trigger the browser
     default smooth scroll, which is slower than instant. We use
     `scrollIntoView({ behavior: 'instant' })` so the user lands at
     content immediately — that's the entire point of a skip link.

   - After scrolling, we also focus the target. Setting tabindex="-1"
     on #main-content (done in layout.js) makes it programmatically
     focusable without putting it in the tab order. Once focused,
     subsequent Tab presses move to the next focusable element after
     main, which is the start of the actual page content.

   - preventDefault() on the click guards against the browser's
     default `#main-content` jump (which would scroll smoothly via
     Lenis or interfere with our explicit handling).

   Style is in globals.css so consumers can theme it via CSS variables
   without props gymnastics. The .skip-link class is the only contract.
   ────────────────────────────────────────────────────────────────────────── */

export default function SkipLink() {
  const handleClick = (e) => {
    e.preventDefault();
    if (typeof document === "undefined") return;
    const target = document.getElementById("main-content");
    if (!target) return;
    target.scrollIntoView({ behavior: "instant", block: "start" });
    target.focus({ preventScroll: true });
  };

  return (
    <a href="#main-content" className="skip-link" onClick={handleClick}>
      Skip to main content
    </a>
  );
}
