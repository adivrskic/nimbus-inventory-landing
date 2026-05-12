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
import { useDemo } from "@/lib/DemoContext";

/* Nav + DemoModal removed — both live in app/layout.js now. We still need
   openDemo to pass to home-page sections that have their own demo CTAs
   (Hero, ProblemSolution, WarehouseShowcase, FinalCTA). Pull it from
   context. */
export default function HomeClient() {
  const { openDemo } = useDemo();

  return (
    <>
      <Hero onDemo={openDemo} />
      <AISection />
      <Features />
      <ProblemSolution onDemo={openDemo} />
      <WarehouseShowcase onDemo={openDemo} />
      {/* <Testimonials /> */}
      <Integrations />
      <Industries />
      <FinalCTA onDemo={openDemo} />
      <Footer />
    </>
  );
}
