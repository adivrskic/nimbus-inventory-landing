"use client";
import IndustryPageContent from "@/components/IndustryPage/IndustryPage";

/* Trivial passthrough — page.js (the server component) does the work of
   awaiting the route's async params, looking up the industry, and
   rendering the breadcrumb JSON-LD. It then hands the resolved slug
   down to this client wrapper as a prop, which in turn renders the
   actual IndustryPage component from components/IndustryPage/.

   This file MUST stay a client component (`"use client"` at top) AND
   MUST NOT try to `await params` — that pattern only works in server
   components like page.js. If you see "Cannot destructure property
   'slug' of '(intermediate value)' as it is undefined" pointing at
   this file, it means server-component code accidentally got pasted
   in here. Restore from this version. */

export default function IndustryClient({ slug }) {
  return <IndustryPageContent slug={slug} />;
}
