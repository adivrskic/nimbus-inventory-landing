// ──────────────────────────────────────────────────────────────────────────
// app/pricing/pricingFaqs.js
// ──────────────────────────────────────────────────────────────────────────
// Single source of truth for the pricing FAQ. Used by:
//   - PricingClient.jsx (renders the accordion)
//   - page.js (emits FAQPage structured data)
//
// Previously the array lived inside PricingClient.jsx, which prevented
// the server-component page.js from emitting JSON-LD that matched what
// was actually rendered. Centralizing the data keeps the visible FAQ
// and the schema in lockstep — no drift, no Google warnings about
// "structured data not matching visible content".
// ──────────────────────────────────────────────────────────────────────────

export const PRICING_FAQS = [
  {
    q: "What counts as a warehouse?",
    a: "A warehouse is any physical facility with its own inventory, location codes, and team. Multiple buildings on the same site managed as one logical operation count as one warehouse. Separate facilities with separate stock count as separate warehouses.",
  },
  {
    q: "Can I switch between plans?",
    a: "Yes. Upgrade from Pro to Enterprise at any time — the change takes effect immediately and you'll only be billed for the difference for the remainder of your current cycle. Downgrades take effect at the start of your next billing period.",
  },
  {
    q: "Is there a free trial?",
    a: "Pro includes a 14-day free trial — no credit card required. Enterprise customers get a tailored proof-of-concept period, typically 30 days, with hands-on support from our team.",
  },
  {
    q: "What happens if I exceed plan limits?",
    a: "Nothing breaks. We'll reach out as you approach limits and discuss options — usually that's a conversation about whether Enterprise fits your growth. We never suddenly cut off scanning or operations.",
  },
  {
    q: "Do you offer non-profit or educational discounts?",
    a: "Yes. 501(c)(3) non-profits and accredited educational institutions get 30% off Pro and Enterprise. Contact sales with documentation to apply the discount.",
  },
  {
    q: "Can I pay by invoice?",
    a: "Annual Pro plans and all Enterprise contracts can be paid by invoice with net-30 terms. Monthly Pro is credit card only.",
  },
];
