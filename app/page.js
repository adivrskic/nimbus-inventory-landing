"use client";

import { useState, useCallback } from "react";
import Nav from "@/components/Nav/Nav";
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
import DemoModal from "@/components/DemoModal/DemoModal";

export default function HomePage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  return (
    <>
      <Nav onDemo={openDemo} />
      <Hero onDemo={openDemo} />
      <AISection />
      <Features />
      <ProblemSolution onDemo={openDemo} />
      <WarehouseShowcase onDemo={openDemo} />
      <Testimonials />
      <Integrations />
      <Industries />
      <FinalCTA onDemo={openDemo} />
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
