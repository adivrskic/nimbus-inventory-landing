"use client";
import { useState, useCallback } from "react";
import IndustryPageContent from "@/components/IndustryPage/IndustryPage";
import DemoModal from "@/components/DemoModal/DemoModal";

export default function IndustryClient({ slug }) {
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);
  return (
    <>
      <IndustryPageContent slug={slug} onDemo={openDemo} />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
