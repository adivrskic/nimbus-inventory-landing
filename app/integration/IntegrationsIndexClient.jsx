"use client";
import Footer from "@/components/Footer/Footer";
import Integrations from "@/components/Integrations/Integrations";

/* Trivial client wrapper. The actual server-side metadata + canonical
   URL generation lives in app/integration/page.js — DO NOT paste
   page.js content into this file. If you see an `export const metadata`
   here, a `import IntegrationsIndexClient from "./IntegrationsIndexClient"`
   self-import, or a non-async page-style component, you've got the
   wrong content — restore from this version.

   Nav lives in app/layout.js and renders on every page. Don't add
   another <Nav /> here — that would duplicate the landmark, doubling
   event listeners and giving screen readers two navigation regions
   to walk through. Same for <main>: layout already wraps {children}
   in <main id="main-content">, so wrapping content here would produce
   invalid nested <main> elements.

   Reuses the existing home <Integrations /> component verbatim so the
   listing index stays in sync with the home page's integration grid.
   Demo modal is in DemoHost (layout level); Nav and Integrations both
   pull openDemo from context, nothing to wire up here. */

export default function IntegrationsIndexClient() {
  return (
    <>
      <Integrations />
      <Footer />
    </>
  );
}
