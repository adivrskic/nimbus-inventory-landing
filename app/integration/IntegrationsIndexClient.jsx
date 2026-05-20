"use client";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import Integrations from "@/components/Integrations/Integrations";

/* Trivial client wrapper. The actual server-side metadata + canonical
   URL generation lives in app/integration/page.js — DO NOT paste
   page.js content into this file. If you see an `export const metadata`
   here, a `import IntegrationsIndexClient from "./IntegrationsIndexClient"`
   self-import, or a non-async page-style component, you've got the
   wrong content — restore from this version.

   The page is intentionally thin: reuses the existing home
   <Integrations /> component verbatim so the listing index stays in
   sync with the home page's integration grid. Demo modal lives in
   app/layout.js (DemoHost); Nav pulls openDemo from context directly,
   nothing to wire up here. */

export default function IntegrationsIndexClient() {
  return (
    <>
      <Nav />
      <main>
        <Integrations />
      </main>
      <Footer />
    </>
  );
}
