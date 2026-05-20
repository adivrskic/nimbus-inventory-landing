"use client";
import Footer from "@/components/Footer/Footer";
import Industries from "@/components/Industries/Industries";

/* Trivial client wrapper. Same shape as IntegrationsIndexClient —
   the actual server-side metadata + canonical URL generation lives in
   app/industry/page.js. DO NOT paste page.js content into this file.

   Nav lives in app/layout.js and renders on every page. Don't add
   another <Nav /> here — that would duplicate the landmark, doubling
   event listeners and giving screen readers two navigation regions
   to walk through. Same for <main>: layout already wraps {children}
   in <main id="main-content">, so wrapping content here would produce
   invalid nested <main> elements.

   Reuses the home <Industries /> component verbatim so the listing
   index stays in sync with the home page's industry grid. */

export default function IndustriesIndexClient() {
  return (
    <>
      <Industries />
      <Footer />
    </>
  );
}
