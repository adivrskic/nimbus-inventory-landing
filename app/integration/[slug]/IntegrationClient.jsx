"use client";
import IntegrationPageContent from "@/components/IntegrationPage/IntegrationPage";

/* Trivial passthrough. page.js (server) resolves the integration, its
   FAQs and the sibling cross-links and hands them down as props, so the
   integrationData module stays out of the client chunk. Demo state lives
   in app/layout.js via DemoHost; IntegrationPage pulls openDemo from
   useDemo() internally. */
export default function IntegrationClient({
  slug,
  integration,
  faqs,
  siblings,
}) {
  return (
    <IntegrationPageContent
      slug={slug}
      integration={integration}
      faqs={faqs}
      siblings={siblings}
    />
  );
}
