"use client";

import { useState, useCallback, use } from "react";
import LegalPageContent from "@/components/LegalPage/LegalPage";
import DemoModal from "@/components/DemoModal/DemoModal";

export default function LegalRoute({ params }) {
  const { slug } = use(params);
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  return (
    <>
      <LegalPageContent slug={slug} onDemo={openDemo} />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
