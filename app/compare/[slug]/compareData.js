/* ─────────────────────────────────────────────────────────────────────
   COMPARE DATA — Nimbus vs competitor matrices.
   
   To add a new competitor, follow the schema:
   - slug, name, category (short label for the eyebrow)
   - headline: array of strings (lines), accentWord: italic-gold word
   - heroDesc: paragraph under the title
   - quickCompare: { nimbus[], competitor[] } — 5 pairs of positioning
       statements (each string in nimbus[] pairs with same-index in competitor[])
   - matrix: array of { feature, nimbus, competitor }
       values: "yes" | "no" | "partial" | string (used for short notes)
   - reasons: 4 reasons teams switch (title + desc)
   - competitorStrengths: 3-4 "when this competitor is actually right"
       items (honest take — builds credibility)
───────────────────────────────────────────────────────────────────────── */

export const COMPETITORS = {
  fishbowl: {
    slug: "fishbowl",
    name: "Fishbowl",
    category: "Legacy desktop WMS",
    headline: ["Modern AI vs", "legacy desktop."],
    accentWord: "legacy",
    heroDesc:
      "Fishbowl is a classic SMB inventory management product, often paired with QuickBooks Desktop. Nimbus is what teams move to when they need real-time AI, native mobile, and operations that scale beyond a single warehouse.",

    quickCompare: {
      nimbus: [
        "AI-powered route optimization, built in",
        "Cloud-native, accessible from any device",
        "iOS + Android apps included with every plan",
        "Per-warehouse pricing, predictable as you grow",
        "Modern dashboard UX, designed in 2025",
      ],
      competitor: [
        "Manual route configuration, rule-based",
        "Desktop-first with a cloud add-on",
        "Mobile app is a paid extra per-user license",
        "Per-user pricing, scales with headcount",
        "Dated UX from the early 2010s",
      ],
    },

    matrix: [
      {
        feature: "AI-powered route optimization",
        nimbus: "yes",
        competitor: "no",
      },
      {
        feature: "Native iOS + Android apps",
        nimbus: "yes",
        competitor: "partial",
      },
      {
        feature: "Real-time multi-location sync",
        nimbus: "yes",
        competitor: "partial",
      },
      {
        feature: "Multi-tenant for 3PL operators",
        nimbus: "yes",
        competitor: "no",
      },
      {
        feature: "Built-in barcode scanning",
        nimbus: "yes",
        competitor: "yes",
      },
      { feature: "Continuous cycle counting", nimbus: "yes", competitor: "no" },
      { feature: "AI demand forecasting", nimbus: "yes", competitor: "no" },
      {
        feature: "Modern REST API + webhooks",
        nimbus: "yes",
        competitor: "partial",
      },
      {
        feature: "Cloud-native deployment",
        nimbus: "yes",
        competitor: "partial",
      },
      { feature: "SOC 2 Type II certified", nimbus: "yes", competitor: "no" },
      {
        feature: "Native ERP integrations (50+)",
        nimbus: "yes",
        competitor: "partial",
      },
      {
        feature: "QuickBooks Desktop integration",
        nimbus: "partial",
        competitor: "yes",
      },
    ],

    reasons: [
      {
        title: "AI built in, not bolted on",
        desc: "Route optimization, error flagging, demand forecasting — they're core features, not paid add-ons or roadmap promises.",
      },
      {
        title: "Mobile-native, no per-user fees",
        desc: "Every warehouse worker gets a real iOS or Android app. No additional licenses, no separate scanner hardware required.",
      },
      {
        title: "Predictable pricing as you scale",
        desc: "Per-warehouse pricing means adding pickers or shifts doesn't change your bill. Fishbowl's per-user model scales differently.",
      },
      {
        title: "Dashboard your team actually likes",
        desc: "Modern UX, designed in 2025 with input from operators. Less training time, fewer mistakes, higher adoption.",
      },
    ],

    competitorStrengths: [
      "You're deeply embedded in QuickBooks Desktop and don't want to migrate that workflow",
      "You require on-premise or air-gap deployment for compliance reasons",
      "Your operation is small and stable (under 5 users, single location, simple SKU set)",
      "You need Manufacturing Resource Planning (MRP) workflows in the same product",
    ],
  },

  sortly: {
    slug: "sortly",
    name: "Sortly",
    category: "Simple inventory tracker",
    headline: ["When simple", "isn't enough."],
    accentWord: "simple",
    heroDesc:
      "Sortly is a clean, mobile-friendly inventory tracker. It works well for small teams with a few hundred items. Nimbus is what you move to when inventory tracking turns into warehouse operations — pick paths, pack workflows, multi-location, real WMS.",

    quickCompare: {
      nimbus: [
        "Full WMS: pick, pack, ship, cycle count",
        "AI-powered route and replenishment",
        "Multi-warehouse with per-location pricing",
        "Custom workflows configurable per team",
        "Enterprise security: SOC 2, SSO, RBAC",
      ],
      competitor: [
        "Inventory tracking, no workflow engine",
        "Manual quantity adjustments",
        "Single-location focus, limited multi-site",
        "Fixed workflows, light customization",
        "Basic auth, no SSO on standard plans",
      ],
    },

    matrix: [
      {
        feature: "Full WMS (pick, pack, ship)",
        nimbus: "yes",
        competitor: "no",
      },
      {
        feature: "AI-powered route optimization",
        nimbus: "yes",
        competitor: "no",
      },
      {
        feature: "Multi-warehouse support",
        nimbus: "yes",
        competitor: "partial",
      },
      { feature: "Custom workflow builder", nimbus: "yes", competitor: "no" },
      {
        feature: "Multi-tenant for 3PL operators",
        nimbus: "yes",
        competitor: "no",
      },
      { feature: "Continuous cycle counting", nimbus: "yes", competitor: "no" },
      { feature: "AI demand forecasting", nimbus: "yes", competitor: "no" },
      {
        feature: "ERP integrations (SAP, NetSuite, etc.)",
        nimbus: "yes",
        competitor: "no",
      },
      {
        feature: "Native API + webhooks",
        nimbus: "yes",
        competitor: "partial",
      },
      { feature: "SOC 2 Type II certified", nimbus: "yes", competitor: "no" },
      { feature: "SSO + RBAC", nimbus: "yes", competitor: "partial" },
      {
        feature: "Mobile-first inventory tracking",
        nimbus: "yes",
        competitor: "yes",
      },
    ],

    reasons: [
      {
        title: "You outgrew inventory tracking",
        desc: "Sortly is great at counting things. Nimbus runs the operations that move them — pick paths, pack stations, ship workflows, cycle counts.",
      },
      {
        title: "Real warehouse workflows",
        desc: "Multi-step receiving, putaway algorithms, batch picking, packing verification, shipping integrations. The full WMS, not just stock counts.",
      },
      {
        title: "Multi-warehouse without spreadsheets",
        desc: "Real-time sync across locations, transfer orders between sites, location-level reporting. Sortly handles single-site well; Nimbus handles networks.",
      },
      {
        title: "Enterprise integrations",
        desc: "Connect to your ERP, your shipping carriers, your e-commerce stack. 50+ native integrations vs. Sortly's CSV-import workflow.",
      },
    ],

    competitorStrengths: [
      "Your operation is simple inventory tracking, not warehouse operations",
      "You manage under a few hundred items in a single small location",
      "You don't have pick/pack/ship workflows — items just sit and get checked out",
      "Your budget rules out a real WMS and you'd rather track on a phone than a spreadsheet",
    ],
  },

  "netsuite-wms": {
    slug: "netsuite-wms",
    name: "NetSuite WMS",
    category: "Enterprise WMS (Oracle)",
    headline: ["Lighter than", "enterprise."],
    accentWord: "Lighter",
    heroDesc:
      "NetSuite WMS is Oracle's warehouse module for teams already running NetSuite ERP. It's powerful but heavy — typically a 6–12 month implementation led by a systems integrator. Nimbus delivers the same core warehouse operations in two weeks, works with any ERP, and costs a fraction of the implementation.",

    quickCompare: {
      nimbus: [
        "Self-serve setup, live in under 2 weeks",
        "Modern AI-first architecture",
        "Works with any ERP (NetSuite, SAP, QuickBooks, etc.)",
        "Predictable per-warehouse pricing",
        "Modern UI, designed in 2025",
      ],
      competitor: [
        "SI-led implementation, 6–12 months typical",
        "Legacy Oracle architecture",
        "Requires NetSuite ERP as the foundation",
        "Enterprise contracts, custom pricing per user",
        "UI inherited from NetSuite, dated patterns",
      ],
    },

    matrix: [
      {
        feature: "Self-serve setup (< 2 weeks)",
        nimbus: "yes",
        competitor: "no",
      },
      {
        feature: "Modern AI-first architecture",
        nimbus: "yes",
        competitor: "no",
      },
      { feature: "Works with any ERP", nimbus: "yes", competitor: "no" },
      {
        feature: "Per-warehouse predictable pricing",
        nimbus: "yes",
        competitor: "no",
      },
      {
        feature: "Native iOS + Android apps",
        nimbus: "yes",
        competitor: "partial",
      },
      {
        feature: "Real-time updates (sub-30s sync)",
        nimbus: "yes",
        competitor: "partial",
      },
      { feature: "AI route optimization", nimbus: "yes", competitor: "no" },
      {
        feature: "Modern REST API + webhooks",
        nimbus: "yes",
        competitor: "partial",
      },
      {
        feature: "Deep NetSuite ERP integration",
        nimbus: "partial",
        competitor: "yes",
      },
      { feature: "SOC 2 Type II certified", nimbus: "yes", competitor: "yes" },
      { feature: "SSO + SAML", nimbus: "yes", competitor: "yes" },
      {
        feature: "Multi-tenant for 3PL operators",
        nimbus: "yes",
        competitor: "no",
      },
    ],

    reasons: [
      {
        title: "Weeks instead of quarters",
        desc: "Most Nimbus deployments are live in under 2 weeks. NetSuite WMS implementations typically run 6 to 12 months and require a systems integrator.",
      },
      {
        title: "ERP-agnostic",
        desc: "You don't have to be on NetSuite. Nimbus connects to NetSuite, SAP, QuickBooks, Sage, and dozens of others as a first-class integration.",
      },
      {
        title: "Predictable pricing",
        desc: "Per-warehouse pricing means no surprises. NetSuite's per-user model plus implementation costs can run 5–10x what Nimbus charges.",
      },
      {
        title: "Modern AI, not legacy rules",
        desc: "Route optimization, demand forecasting, error flagging — all powered by ML models trained on real warehouse data. Not rule-based scripts.",
      },
    ],

    competitorStrengths: [
      "You're already running NetSuite ERP across the entire enterprise",
      "You need very deep ERP-level workflow integration with NetSuite's records and approval chains",
      "You have a dedicated IT implementation team and a 6–12 month deploy is acceptable",
      "Your finance team requires consolidated reporting within the NetSuite environment",
    ],
  },
};

/* Slug list, used for static generation and cross-linking */
export const COMPARE_SLUGS = Object.keys(COMPETITORS);
