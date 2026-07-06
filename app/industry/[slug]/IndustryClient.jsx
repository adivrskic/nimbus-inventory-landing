"use client";
import IndustryPageContent from "@/components/IndustryPage/IndustryPage";

/* Trivial passthrough — page.js (the server component) does the work of
   awaiting the route's async params, looking up the industry (plus its
   resolved FAQs, hero index numbers, and trimmed cross-link entries), and
   rendering the breadcrumb/FAQ JSON-LD. It hands those resolved values
   down to this client wrapper as props, which in turn renders the actual
   IndustryPage component from components/IndustryPage/. Passing resolved
   data (instead of a slug the client looks up itself) keeps the ~44 KB
   industryData.js module out of the client JS chunk.

   This file MUST stay a client component (`"use client"` at top) AND
   MUST NOT try to `await params` — that pattern only works in server
   components like page.js. If you see "Cannot destructure property
   'slug' of '(intermediate value)' as it is undefined" pointing at
   this file, it means server-component code accidentally got pasted
   in here. Restore from this version. */

export default function IndustryClient({
  industry,
  faqs,
  indexNum,
  totalIndustries,
  others,
}) {
  return (
    <IndustryPageContent
      industry={industry}
      faqs={faqs}
      indexNum={indexNum}
      totalIndustries={totalIndustries}
      others={others}
    />
  );
}
