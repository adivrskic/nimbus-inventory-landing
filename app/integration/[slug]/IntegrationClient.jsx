"use client";
import IntegrationPageContent from "@/components/IntegrationPage/IntegrationPage";

/* Now a trivial passthrough. Demo state and DemoModal moved to
   app/layout.js via DemoHost; IntegrationPage pulls openDemo from
   useDemo() internally. */
export default function IntegrationClient({ slug }) {
  return <IntegrationPageContent slug={slug} />;
}
