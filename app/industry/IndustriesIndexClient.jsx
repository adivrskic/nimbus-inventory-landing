"use client";
import { useState, useCallback } from "react";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import Industries from "@/components/Industries/Industries";
import DemoModal from "@/components/DemoModal/DemoModal";

/* Reuses the existing home Industries component verbatim — that component
   already renders the per-letter "Built for your industry" heading, the
   glow-card list, and navigates to /industry/[slug] on click. */

export default function IndustriesIndexClient() {
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  return (
    <>
      <Nav onDemo={openDemo} />
      <main>
        <Industries />
      </main>
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
