"use client";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import Integrations from "@/components/Integrations/Integrations";

/* Reuses the existing home Integrations component verbatim — same styled
   list pattern that links to /integration/[slug]. Demo modal lives in
   app/layout.js (DemoHost) so Nav pulls openDemo from context directly;
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
