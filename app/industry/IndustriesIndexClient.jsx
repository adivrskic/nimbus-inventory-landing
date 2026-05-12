"use client";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import Industries from "@/components/Industries/Industries";

/* Reuses the existing home Industries component verbatim — that component
   already renders the per-letter "Built for your industry" heading, the
   glow-card list, and navigates to /industry/[slug] on click. Demo modal
   lives in app/layout.js (DemoHost); nothing to wire up here. */

export default function IndustriesIndexClient() {
  return (
    <>
      <Nav />
      <main>
        <Industries />
      </main>
      <Footer />
    </>
  );
}
