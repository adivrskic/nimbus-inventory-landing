"use client";

import { useState, useCallback, use } from "react";
import IndustryPageContent from "@/components/IndustryPage/IndustryPage";
import DemoModal from "@/components/DemoModal/DemoModal";

export default function IndustryRoute({ params }) {
  const { slug } = use(params);
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  return (
    <>
      <IndustryPageContent slug={slug} onDemo={openDemo} />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
