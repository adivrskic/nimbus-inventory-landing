"use client";
import IndustryPageContent from "@/components/IndustryPage/IndustryPage";

/* Trivial passthrough — see IntegrationClient note. */
export default function IndustryClient({ slug }) {
  return <IndustryPageContent slug={slug} />;
}
