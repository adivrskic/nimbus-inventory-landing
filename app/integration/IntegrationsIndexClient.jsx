"use client";
import { useState, useCallback } from "react";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import Integrations from "@/components/Integrations/Integrations";
import DemoModal from "@/components/DemoModal/DemoModal";

/* Reuses the existing home Integrations component verbatim — same styled
   list pattern that links to /integration/[slug]. */

export default function IntegrationsIndexClient() {
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  return (
    <>
      <Nav onDemo={openDemo} />
      <main>
        <Integrations />
      </main>
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
