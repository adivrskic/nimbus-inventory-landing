"use client";
import { useState, useCallback } from "react";
import IntegrationPageContent from "@/components/IntegrationPage/IntegrationPage";
import DemoModal from "@/components/DemoModal/DemoModal";

export default function IntegrationClient({ slug }) {
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);
  return (
    <>
      <IntegrationPageContent slug={slug} onDemo={openDemo} />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
