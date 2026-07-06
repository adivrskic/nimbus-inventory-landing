"use client";
import dynamic from "next/dynamic";
import Hero from "@/components/Hero/Hero";
import Features from "@/components/Features/Features";
import ProblemSolution from "@/components/ProblemSolution/ProblemSolution";
import HashScroller from "@/components/HashScroller/HashScroller";
import FinalCTACard from "@/components/FinalCTACard/FinalCTACard";
import { useDemo } from "@/lib/DemoContext";

/* Heavy / below-the-fold sections — split into their own chunks.
   ssl:false because they're canvas/scroll-driven and add nothing to the
   server-rendered HTML or to LCP. The `loading` placeholders reserve the
   right height so deferring them doesn't introduce layout shift (CLS). */
const AISection = dynamic(() => import("@/components/AISection/AISection"), {
  ssr: false,
  // matches .space height so the page doesn't jump when it mounts
  loading: () => <div style={{ height: "440vh" }} aria-hidden="true" />,
});
const WarehouseShowcase = dynamic(
  () => import("@/components/WarehouseShowcase/WarehouseShowcase"),
  {
    ssr: false,
    // matches .scrollSpace height so the page doesn't jump when it mounts
    loading: () => <div style={{ height: "380vh" }} aria-hidden="true" />,
  }
);
const Integrations = dynamic(() =>
  import("@/components/Integrations/Integrations")
);
const Industries = dynamic(() => import("@/components/Industries/Industries"));
const Footer = dynamic(() => import("@/components/Footer/Footer"));

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
      <Integrations />
      <Industries />
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
