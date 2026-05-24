"use client";
import Hero from "@/components/Hero/Hero";
import AISection from "@/components/AISection/AISection";
import ProblemSolution from "@/components/ProblemSolution/ProblemSolution";
import Features from "@/components/Features/Features";
import WarehouseShowcase from "@/components/WarehouseShowcase/WarehouseShowcase";
import Testimonials from "@/components/Testimonials/Testimonials";
import Integrations from "@/components/Integrations/Integrations";
import Industries from "@/components/Industries/Industries";
import Footer from "@/components/Footer/Footer";
import FinalCTA from "@/components/FinalCTA/FinalCTA";
import FinalCTACard from "@/components/FinalCTACard/FinalCTACard";
import HashScroller from "@/components/HashScroller/HashScroller";
import { useDemo } from "@/lib/DemoContext";

/* Nav + DemoModal removed — both live in app/layout.js now. We still need
   openDemo to pass to home-page sections that have their own demo CTAs
   (Hero, ProblemSolution, WarehouseShowcase, FinalCTA). Pull it from
   context. */
export default function HomeClient() {
  const { openDemo } = useDemo();

  return (
    <>
      <HashScroller />
      <Hero onDemo={openDemo} />
      <AISection />
      <Features />
      <ProblemSolution onDemo={openDemo} />
      <WarehouseShowcase onDemo={openDemo} />
      {/* <Testimonials /> */}
      <Integrations />
      <Industries />
      <FinalCTA onDemo={openDemo} />
      {/* Card-style final CTA — same accent-wipe-on-scroll treatment used
          on the compare / industry / integration pages. Its primary action
          opens the Nautilus Helper AI chat drawer by dispatching the
          `open-chat` window event that ChatProvider listens for. */}
      <FinalCTACard
        label="Still have questions?"
        title="Ask Nautilus anything, right now."
        desc="Pricing, integrations, migration, whether it fits your operation — our AI assistant answers instantly with real specifics from the docs."
        primaryAction={{
          onClick: () => window.dispatchEvent(new Event("open-chat")),
          label: "Ask Nautilus",
        }}
        secondaryAction={{ href: "/pricing", label: "Or see pricing →" }}
      />
      <Footer />
    </>
  );
}
