// industriesIndex.js
//
// Trimmed, standalone copy of the industry list fields the home-page
// <Industries /> section actually renders: title, desc (= heroDesc in the
// full data), and slug.
//
// WHY THIS FILE EXISTS: Industries.jsx is a client component rendered from
// app/HomeClient.jsx (also a client component), so it can't receive server
// props. If it imported components/IndustryPage/industryData.js directly,
// the bundler would ship the entire ~44 KB module (challenges, solutions,
// workflows, FAQs, stats...) in the home-page JS chunk. This module keeps
// the client payload to just the three fields the grid renders.
//
// KEEP IN SYNC: this file MUST be updated together with
// components/IndustryPage/industryData.js — same industries, same order.
// `title` and `slug` are copied verbatim; `desc` is the industry's
// `heroDesc`. Do NOT import industryData.js from here (that would pull the
// whole module back into the client bundle).

export const INDUSTRIES_INDEX = [
  {
    title: "Flooring & Building Materials",
    desc: "Hardwood, tile, carpet rolls, and adhesive across warehouses that span an acre or more. Lot numbers, linear footage, partial pallets, and condition grading all tracked from receipt to job-site delivery.",
    slug: "flooring-building-materials",
  },
  {
    title: "Manufacturing & Assembly",
    desc: "Parts tracking from raw-material intake through WIP to finished goods. Bills of materials decrement as assemblies complete, and component shortages surface days before they stop a line.",
    slug: "manufacturing-assembly",
  },
  {
    title: "Food & Beverage",
    desc: "Expiration tracking, FEFO-aware picking, temperature-zone discipline, and lot-level recall. Built for operations where one bad date or a wrong-zone putaway becomes an FDA conversation.",
    slug: "food-beverage",
  },
  {
    title: "Automotive & Parts",
    desc: "Thousands of SKUs across makes, models, model years, and supersession chains. AI part matching resolves OEM, aftermarket, and universal numbers from a plain-English description.",
    slug: "automotive-parts",
  },
  {
    title: "Pharmaceuticals & Medical",
    desc: "Serialized DSCSA tracking, cold-chain logging with excursion alerts, and audit trails ready for FDA, DEA, or state-board review. Every scan timestamps and attributes to a named operator.",
    slug: "pharmaceuticals-medical",
  },
  {
    title: "E-commerce & 3PL",
    desc: "Multi-tenant inventory isolation, wave picking for high-volume order batches, and stock sync across every sales channel a client uses. Black Friday capacity that doesn't need pre-coordination.",
    slug: "ecommerce-3pl",
  },
  {
    title: "Electrical & Plumbing Supply",
    desc: "Pipe lengths, wire spools, and small-parts bins, all on one bin-mapped warehouse. Reorder points adjust for seasonal demand patterns instead of relying on static minimums.",
    slug: "electrical-plumbing",
  },
  {
    title: "Agriculture & Seed",
    desc: "Bulk storage with scale-integrated receipts and lot-level traceability from field to customer. Treatment records and certificates travel with each lot through storage, processing, and shipment.",
    slug: "agriculture-seed",
  },
];
