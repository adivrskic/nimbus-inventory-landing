/* ═══════════════════════════════════════════════════════════════════════
   INTEGRATION DATA
   ───────────────────────────────────────────────────────────────────────
   Per-integration content for the 18 partners we support. Each entry
   feeds the IntegrationPage component (/integration/[slug]) and the
   FAQ JSON-LD schema in app/integration/[slug]/page.js.

   Schema per integration:
     title:    string          — partner name as displayed
     category: string          — must match a key in FLOW_DATA in
                                 IntegrationPage.jsx ("Accounting & ERP",
                                 "E-commerce & POS", "Shipping & Logistics")
     tagline:  string          — short hero claim, ~10-12 words
     desc:     string          — hero paragraph, ~40-60 words
     features: [{ title, desc }] × 3
     stats:    [{ val, label }] × 3
     flow:     { fromNautilus: string[], toNautilus: string[] }
                                — replaces the generic category FLOW_DATA
                                  fallback. 4-5 items per side reads well
                                  at the rendered diagram width.
     faqs:     [{ q, a }] × 4  — integration-specific. Renders in
                                  section 05 of the page AND drives the
                                  FAQ JSON-LD schema (so Google sees
                                  unique structured Q&A per page rather
                                  than the duplicate content the shared
                                  FAQ used to produce).

   If an integration omits `flow` or `faqs`, the renderer falls back to
   the category FLOW_DATA and DEFAULT_INTEGRATION_FAQS respectively. All
   18 entries below include both — fallbacks are belt-and-braces.
   ═══════════════════════════════════════════════════════════════════════ */

export const INTEGRATIONS = {
  /* ─────────────────────────────────────────────────────────────────
       ACCOUNTING & ERP
       ───────────────────────────────────────────────────────────────── */

  quickbooks: {
    title: "QuickBooks",
    category: "Accounting & ERP",
    tagline: "Inventory and POs sync to QuickBooks without manual entry.",
    desc: "Nautilus connects to QuickBooks Online and QuickBooks Desktop. Inventory counts, cost of goods sold, and purchase orders sync both directions, so when stock moves on the floor your books reflect it without anyone touching a journal entry.",
    features: [
      {
        title: "COGS posts on every move",
        desc: "Each pick, receive, and adjustment posts to your inventory and COGS accounts the same minute. No batch jobs, no end-of-month reconciliation push.",
      },
      {
        title: "Low-stock PO drafts",
        desc: "When the forecasting model flags an impending stockout, Nautilus drafts a PO in QuickBooks pre-filled with the vendor and quantities. Your buyer approves or edits before sending.",
      },
      {
        title: "Locations map to QuickBooks sites",
        desc: "Each Nautilus warehouse or section maps to a specific QuickBooks Online inventory site (or Desktop class). Reports break out cleanly by location without manual filtering.",
      },
    ],
    stats: [
      { val: "2-way", label: "Sync" },
      { val: "<30s", label: "Latency" },
      { val: "99.9%", label: "Uptime" },
    ],
    flow: {
      fromNautilus: [
        "Stock balances",
        "Receipt events",
        "COGS entries",
        "Cycle count adjustments",
        "PO receipts",
      ],
      toNautilus: [
        "Vendor records",
        "PO approvals",
        "Bill matches",
        "Item updates",
      ],
    },
    faqs: [
      {
        q: "Does this work with QuickBooks Desktop, or only Online?",
        a: "Both. QuickBooks Online uses the official OAuth API and posts events as they happen. QuickBooks Desktop syncs through the QuickBooks Web Connector, which polls every 5 minutes; Desktop customers should keep the Web Connector instance running on a workstation that stays online during business hours.",
      },
      {
        q: "What happens if QuickBooks is down?",
        a: "Nautilus operations continue. Pending journal entries, COGS posts, and PO updates queue locally on the warehouse side. Once QuickBooks is reachable again, the queue flushes in original order. Your warehouse isn't held hostage by their availability.",
      },
      {
        q: "How are month-end adjustments handled?",
        a: "Adjustments post the moment they happen, not at month-end. A cycle count adjustment on the 17th posts the corresponding journal entry that minute. Year-end inventory valuations are accurate to the day without a separate close process.",
      },
      {
        q: "Will this work with QuickBooks Enterprise Advanced Inventory?",
        a: "Yes. Nautilus handles QuickBooks Enterprise's site, bin, and lot tracking. We translate between Nautilus's location hierarchy (warehouse → section → bay → level) and QuickBooks Enterprise's site/bin structure during setup.",
      },
    ],
  },

  xero: {
    title: "Xero",
    category: "Accounting & ERP",
    tagline: "Inventory journals post to Xero on every scan.",
    desc: "Nautilus connects to Xero through the official API. Stock adjustments, write-offs, and transfers post as journals to the correct accounts in real time, with a full audit trail and BAS-ready reporting on inventory valuations.",
    features: [
      {
        title: "Journals on every event",
        desc: "Inventory adjustments, transfers, write-offs, and shrinkage post as Xero journal entries within seconds. No batch reconciliation, no manual data entry.",
      },
      {
        title: "Three-way bill matching",
        desc: "Match received goods against supplier bills against your bank feed for full reconciliation. Discrepancies surface before payment, not after.",
      },
      {
        title: "BAS and tax periods",
        desc: "Inventory valuations roll into your BAS and tax-period reports automatically. Australian and New Zealand customers get GST-aware accounting without configuration.",
      },
    ],
    stats: [
      { val: "Auto", label: "Journals" },
      { val: "3-way", label: "Matching" },
      { val: "Real-time", label: "Sync" },
    ],
    flow: {
      fromNautilus: [
        "Stock movements",
        "Adjustments",
        "Write-offs",
        "Transfer journals",
        "Receipt batches",
      ],
      toNautilus: ["Bills", "Item catalog", "Tax rates", "Tracking categories"],
    },
    faqs: [
      {
        q: "Does Nautilus respect Xero's tracking categories?",
        a: "Yes. Each Nautilus warehouse maps to a Xero tracking category during setup, so reports break out inventory by location, region, or whatever dimension you use in Xero. Up to two tracking categories per organisation are supported.",
      },
      {
        q: "What about Xero's per-item COGS limits?",
        a: "Xero limits itemized COGS to 4,000 items per period. For larger catalogs, Nautilus posts a single consolidated COGS entry per cost centre with item-level detail attached to the journal narration. The Xero limit becomes invisible.",
      },
      {
        q: "Can we use this with multi-currency?",
        a: "Yes. Nautilus stores inventory in your warehouse's base currency, and posts to Xero in your Xero base currency, with FX rates from Xero applied at posting time. Mixed-currency POs are handled separately.",
      },
      {
        q: "Does it work for accounting practices managing multiple clients?",
        a: "Yes, with one Nautilus instance per Xero organisation. Bookkeepers managing multiple clients install Nautilus per-client, then use the Nautilus admin to switch between them. Warehouse data is never shared across organisations.",
      },
    ],
  },

  freshbooks: {
    title: "FreshBooks",
    category: "Accounting & ERP",
    tagline: "Inventory-aware invoicing for service-and-product hybrids.",
    desc: "Nautilus connects to FreshBooks to add warehouse inventory data to your client invoicing. Product costs flow into invoices as they're prepared, and stock movements stay aligned with the expense categories you already use in FreshBooks.",
    features: [
      {
        title: "COGS on every invoice",
        desc: "When you invoice a client for a product, the corresponding cost of goods sold posts to FreshBooks in the same transaction. No reconciliation between two systems at month-end.",
      },
      {
        title: "Expense categorization",
        desc: "Warehouse expenses (receiving, transfers, shrinkage) map to FreshBooks categories during setup. Your books stay clean without manual category assignment per transaction.",
      },
      {
        title: "Project-level inventory",
        desc: "Attach inventory consumption to specific FreshBooks projects. Useful for service-and-product hybrids where a client engagement uses both billable hours and warehouse stock.",
      },
    ],
    stats: [
      { val: "Auto", label: "COGS" },
      { val: "Instant", label: "Sync" },
      { val: "Project", label: "Tracking" },
    ],
    flow: {
      fromNautilus: [
        "Inventory consumption",
        "COGS values",
        "Receipt costs",
        "Project allocations",
      ],
      toNautilus: [
        "Invoice line items",
        "Client records",
        "Expense categories",
        "Project IDs",
      ],
    },
    faqs: [
      {
        q: "Is this a good fit for pure service businesses with little inventory?",
        a: "Probably not. FreshBooks itself works well for service-only businesses without Nautilus. The integration becomes worth setting up when at least 20-30% of your invoices include physical products you ship from a warehouse.",
      },
      {
        q: "How does this handle the FreshBooks Lite plan?",
        a: "FreshBooks Lite is supported, but with one tradeoff: Lite's API limits prevent real-time inventory sync. Adjustments batch and post every 15 minutes instead of on each event. Upgrade to Plus or higher for real-time sync.",
      },
      {
        q: "Can I track inventory across multiple FreshBooks accounts?",
        a: "Yes. Most accounting firms managing multiple clients install one Nautilus warehouse per FreshBooks account. Bookkeepers can switch between them through Nautilus admin without re-authenticating each time.",
      },
      {
        q: "What if I don't want every warehouse event hitting FreshBooks?",
        a: "Configure event filters during setup. Most customers exclude internal transfers (which don't affect COGS), cycle count adjustments under a threshold, and zero-cost product moves. Filters are per-event-type, not per-product.",
      },
    ],
  },

  "sap-business-one": {
    title: "SAP Business One",
    category: "Accounting & ERP",
    tagline: "Warehouse operations for SAP Business One.",
    desc: "Nautilus extends SAP Business One with mobile-first warehouse operations. Inventory transactions, goods receipts, and production order consumption sync bidirectionally through SAP's Service Layer API, with no middleware required.",
    features: [
      {
        title: "Native Service Layer",
        desc: "Direct REST connection to SAP's Service Layer API. No SAP Business One integration framework, no middleware to license or maintain.",
      },
      {
        title: "Production consumption",
        desc: "Bill of materials components and production order consumption update warehouse stock in real time. WIP visibility extends from SAP into Nautilus and back.",
      },
      {
        title: "Batch and serial tracking",
        desc: "Full lot traceability from warehouse shelf to SAP document. Batch numbers, serial numbers, and quality certificates carry through to receipts, picks, and goods issues.",
      },
    ],
    stats: [
      { val: "Native", label: "API" },
      { val: "Batch", label: "Tracking" },
      { val: "Enterprise", label: "Grade" },
    ],
    flow: {
      fromNautilus: [
        "Goods receipts",
        "Goods issues",
        "Inventory transfers",
        "Production confirmations",
        "Cycle counts",
      ],
      toNautilus: [
        "Production orders",
        "Sales orders",
        "Purchase orders",
        "Bills of materials",
        "Item master",
      ],
    },
    faqs: [
      {
        q: "Which versions of SAP Business One does this support?",
        a: "SAP Business One 10.0 and later, both on-premise and SAP Business One Cloud. The Service Layer API needs to be enabled in your SAP installation. For older versions (9.x), we can fall back to the legacy DI API, but we recommend upgrading first.",
      },
      {
        q: "Do we need an SAP-certified consultant for setup?",
        a: "Not for the standard integration. Nautilus handles the connector and field mapping during a 60-minute setup call with your SAP admin. Custom workflows (multi-database scenarios, custom DocEntry numbering) may benefit from involving your SAP partner, but the baseline integration is self-service.",
      },
      {
        q: "How does this handle SAP Business One multi-database setups?",
        a: "Each SAP database maps to a separate Nautilus warehouse. Multi-tenant SAP customers (one company per database) get one Nautilus warehouse per database, with cross-database reporting available through Nautilus's admin view.",
      },
      {
        q: "What about HANA vs SQL deployments?",
        a: "Both are supported. Nautilus connects through the Service Layer API, which abstracts the underlying database. HANA-specific features (in-memory analytics, columnar storage) are available through SAP, but Nautilus doesn't depend on them.",
      },
    ],
  },

  netsuite: {
    title: "NetSuite",
    category: "Accounting & ERP",
    tagline: "Warehouse execution layer for NetSuite.",
    desc: "Nautilus acts as the warehouse execution system for NetSuite ERP. Scanning, putaway, picking, and counting happen in Nautilus on iOS and Android; the resulting transactions sync back to NetSuite's inventory and financial modules through SuiteTalk.",
    features: [
      {
        title: "SuiteTalk integration",
        desc: "Direct REST connection to NetSuite via SuiteTalk. No third-party connectors, no SuiteApp marketplace charges. Native field mapping to inventory adjustments, transfer orders, and item receipts.",
      },
      {
        title: "Bin-level inventory",
        desc: "Nautilus bin locations map directly to NetSuite Advanced Inventory Management bin records. Receipts, picks, and counts post against bins, not just locations, which keeps NetSuite's reporting accurate.",
      },
      {
        title: "Transfer order execution",
        desc: "Warehouse staff execute NetSuite transfer orders by scanning. Nautilus splits multi-line transfer orders into pick tasks, validates source bins, and posts confirmations back to NetSuite as the transfer completes.",
      },
    ],
    stats: [
      { val: "Direct", label: "Connection" },
      { val: "Bin-level", label: "Accuracy" },
      { val: "Real-time", label: "Updates" },
    ],
    flow: {
      fromNautilus: [
        "Item receipts",
        "Inventory adjustments",
        "Transfer order completions",
        "Cycle count results",
        "Sales order picks",
      ],
      toNautilus: [
        "Sales orders",
        "Transfer orders",
        "Item records",
        "Bin records",
        "Subsidiary structure",
      ],
    },
    faqs: [
      {
        q: "Does this require NetSuite WMS, or do we get warehouse features through Nautilus?",
        a: "You get warehouse features through Nautilus. NetSuite WMS isn't required, and most of our NetSuite customers don't license it. Nautilus replaces the NetSuite WMS layer with a more modern mobile-first execution layer that posts the same transaction types back into NetSuite.",
      },
      {
        q: "How are multi-subsidiary structures handled?",
        a: "Each NetSuite subsidiary maps to one or more Nautilus warehouses. The mapping is configurable: a single subsidiary can have multiple physical warehouses, or one Nautilus warehouse can post to a specific subsidiary. Intercompany transfers are handled automatically.",
      },
      {
        q: "What about NetSuite's per-API-call rate limits?",
        a: "NetSuite limits SuiteTalk to roughly 25 concurrent connections per account. Nautilus batches non-time-critical transactions (cycle count results, batch transfers) and uses a small persistent connection pool for real-time events. We have not had a customer hit the rate limit in practice.",
      },
      {
        q: "Can Nautilus and an existing SuiteApp coexist?",
        a: "Yes, with one caveat. If you have a SuiteApp that posts to the same transaction types Nautilus posts to (another warehouse SuiteApp, for example), one of them needs to be the source of truth. Most customers turn off the other SuiteApp's posting and let Nautilus drive.",
      },
    ],
  },

  sage: {
    title: "Sage",
    category: "Accounting & ERP",
    tagline: "Warehouse sync for Sage 50 and Sage Intacct.",
    desc: "Nautilus integrates with both Sage 50 (desktop) and Sage Intacct (cloud). Inventory counts, cost adjustments, and stock valuations sync to whichever Sage product you run, with a single connector that adapts to the platform.",
    features: [
      {
        title: "Both Sage platforms",
        desc: "Sage 50 connects via the Sage SDK; Sage Intacct connects via the Web Services API. One Nautilus instance can post to either, and customers migrating from Sage 50 to Sage Intacct don't reconfigure Nautilus.",
      },
      {
        title: "Dimension mapping",
        desc: "Sage Intacct's dimension model (Department, Class, Location, Project, Customer) maps to Nautilus warehouse attributes. Reports break out by any combination of dimensions without manual filtering.",
      },
      {
        title: "Auto-adjustment posting",
        desc: "Cycle count variances post as Sage inventory adjustments with the configured offset account. The accountant sets the offset accounts once during setup; subsequent counts post automatically.",
      },
    ],
    stats: [
      { val: "2 platforms", label: "Support" },
      { val: "Auto", label: "Adjustments" },
      { val: "<1min", label: "Sync" },
    ],
    flow: {
      fromNautilus: [
        "Stock counts",
        "Inventory adjustments",
        "Receipt batches",
        "Transfer journals",
        "Write-off events",
      ],
      toNautilus: [
        "Vendor master",
        "Item codes",
        "Dimensions and classes",
        "Account chart",
      ],
    },
    faqs: [
      {
        q: "Are both Sage 50 US and Sage 50 UK supported?",
        a: "Yes. Sage 50 US and Sage 50 UK (formerly Sage 50 Accounts) both work. The connector detects which edition you're running and uses the appropriate SDK calls. Sage 50 Canadian is also supported but receives feature parity on a 60-day lag.",
      },
      {
        q: "What's the migration path from Sage 50 to Sage Intacct?",
        a: "Run them in parallel during the migration window. Nautilus dual-writes to both for the cutover period, then we switch the source of truth. We've helped a half dozen customers through this migration; it adds about a week to a Sage Intacct go-live, no more.",
      },
      {
        q: "Does this handle Sage 50's password-protected company files?",
        a: "Yes. Sage 50's password is stored in the connector configuration on-prem and never leaves your environment. Nautilus itself doesn't see the file directly; the connector reads through the official Sage SDK with your credentials.",
      },
      {
        q: "What about Sage Business Cloud Accounting (the small-business product)?",
        a: "Not supported as a first-party integration today. Sage Business Cloud Accounting has a different API surface than Sage Intacct. Customers on that product use Zapier as a bridge, with the tradeoff of slower sync (15-minute intervals).",
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────
       E-COMMERCE & POS
       ───────────────────────────────────────────────────────────────── */

  shopify: {
    title: "Shopify",
    category: "E-commerce & POS",
    tagline: "Real-time stock sync across every Shopify channel.",
    desc: "Every sale on your Shopify store decrements warehouse stock the moment the order is placed. Nautilus prevents overselling across all Shopify channels (online store, POS, Markets, B2B) and routes orders into pick workflows automatically.",
    features: [
      {
        title: "Stock sync under 5 seconds",
        desc: "Shopify inventory levels reflect warehouse scans within 5 seconds, end-to-end. Verified during peak Black Friday traffic at multiple customers.",
      },
      {
        title: "Multi-location aware",
        desc: "Each Nautilus warehouse maps to a Shopify location. The Shopify checkout assigns orders to the correct location based on customer address, and Nautilus picks from the right warehouse.",
      },
      {
        title: "Fulfillment automation",
        desc: "Picked orders flow into Shopify fulfillments automatically. Tracking numbers post back to the order, customers get the standard Shopify notification email, and the order status closes.",
      },
    ],
    stats: [
      { val: "<5s", label: "Sync" },
      { val: "0%", label: "Oversells" },
      { val: "Auto", label: "Fulfillment" },
    ],
    flow: {
      fromNautilus: [
        "Stock levels",
        "Reserved quantities",
        "Location data",
        "Tracking numbers",
        "Fulfillment completions",
      ],
      toNautilus: [
        "Orders",
        "Customer records",
        "Product catalog",
        "Variants and options",
        "Location settings",
      ],
    },
    faqs: [
      {
        q: "Does this work with Shopify Plus features (Scripts, Functions, Markets)?",
        a: "Yes. Nautilus uses the same Admin REST API and webhooks for Shopify and Shopify Plus. Plus customers benefit from higher rate limits and more flexible webhook configuration, but the integration itself is identical.",
      },
      {
        q: "How does Nautilus handle Shopify's eventual-consistency inventory model?",
        a: "Shopify can take up to 60 seconds to propagate inventory changes across regions. Nautilus tracks the canonical state internally and reconciles against Shopify's view every 30 seconds. If a sale beats a sync, the oversell-prevention rule blocks the second sale of the last unit.",
      },
      {
        q: "Can this handle high-volume flash sales?",
        a: "Yes, with one recommendation: pre-warm before the sale. For a flash sale expecting 1,000+ orders/minute, a 24-hour pre-sale stock freeze where Nautilus locks the inventory level and we coordinate the burst load is best. Smaller flashes (around 100/minute) need no pre-coordination.",
      },
      {
        q: "What about Shopify Markets and multi-currency?",
        a: "Multi-currency is supported. Nautilus stores cost basis in your warehouse's base currency. Shopify Markets sells in local currency; Nautilus syncs the canonical inventory level, not the price. Pricing stays in Shopify's hands.",
      },
    ],
  },

  woocommerce: {
    title: "WooCommerce",
    category: "E-commerce & POS",
    tagline: "Warehouse inventory for WooCommerce stores.",
    desc: "Nautilus connects to WooCommerce through its REST API and webhook system, keeping product stock levels accurate across your WordPress store. Variable products, bundles, and backorder logic all sync without manual intervention.",
    features: [
      {
        title: "Per-variation tracking",
        desc: "Stock is tracked per variation (size, color, material). Each variation has its own warehouse location, count, and reorder threshold. The WooCommerce product page reflects per-variation availability.",
      },
      {
        title: "Backorder thresholds",
        desc: "Set backorder thresholds per product. Nautilus enables backorder on WooCommerce automatically when stock drops below the threshold, and disables it when stock recovers. No manual product editing.",
      },
      {
        title: "Webhook-driven",
        desc: "WooCommerce webhooks fire on every order and inventory event. Nautilus subscribes to the events it needs and ignores the rest. Push, not poll, so storefront stock reflects warehouse reality within a second or two.",
      },
    ],
    stats: [
      { val: "REST", label: "API" },
      { val: "Per-variant", label: "Tracking" },
      { val: "Webhooks", label: "Real-time" },
    ],
    flow: {
      fromNautilus: [
        "Stock levels per variation",
        "Backorder status",
        "Catalog updates",
        "Tracking numbers",
      ],
      toNautilus: [
        "Orders",
        "Customer records",
        "Product variations",
        "Coupons and discount applications",
      ],
    },
    faqs: [
      {
        q: "Does this work with major WooCommerce inventory plugins (ATUM, WPC Inventory)?",
        a: "Generally yes, but with caveats. If you have a plugin actively managing inventory in WooCommerce, you need to decide which is the source of truth. Most customers disable the plugin's inventory management and let Nautilus drive. We have tested compatibility with ATUM (Nautilus as source of truth) and WPC Inventory (read-only).",
      },
      {
        q: "What's the hosting requirement?",
        a: "WooCommerce's REST API needs HTTPS and rewrite rules to be working. Shared hosts that don't support permalink rewriting will need adjustment. We don't have hosting requirements beyond what WooCommerce itself requires.",
      },
      {
        q: "How are subscription products handled?",
        a: "WooCommerce Subscriptions is supported. Recurring orders create inventory reservations on the scheduled fulfillment date, not at the time of subscription signup. This prevents subscription customers from blocking inventory from regular sales months in advance.",
      },
      {
        q: "Can this handle high-volume WooCommerce stores?",
        a: "Yes, with the caveat that WooCommerce's database performance is the bottleneck at very high volume, not our integration. We've run successfully at 200+ orders/minute on Bedrock plus managed MySQL. Stores running default WP hosting cap out earlier.",
      },
    ],
  },

  amazon: {
    title: "Amazon",
    category: "E-commerce & POS",
    tagline: "One inventory view across your warehouse and Amazon.",
    desc: "Nautilus syncs with Amazon Seller Central and Amazon FBA, showing your inventory in one place whether it's in your warehouse, in transit to FBA, or already at an Amazon fulfillment center. AI-driven replenishment forecasts when to send more stock.",
    features: [
      {
        title: "FBA-aware stock",
        desc: "Monitor Amazon-held inventory alongside warehouse counts in a single dashboard. Inbound shipments to FBA, allocated FBA stock, and unallocated FBA stock are all visible at the SKU level.",
      },
      {
        title: "Replenishment alerts",
        desc: "The Nautilus forecast model predicts when each FBA SKU will go out of stock and recommends shipment quantities and timing. Recommendations factor in Amazon's restock limits and your historical lead times.",
      },
      {
        title: "Multi-marketplace",
        desc: "Sync inventory across Amazon US, Canada, UK, EU, and Australia marketplaces. Cross-marketplace transfers (shifting stock from FBA US to FBA EU) are tracked end-to-end as in-transit inventory.",
      },
    ],
    stats: [
      { val: "FBA+FBM", label: "Support" },
      { val: "Multi", label: "Marketplace" },
      { val: "AI", label: "Replenish" },
    ],
    flow: {
      fromNautilus: [
        "FBM inventory levels",
        "Shipment quantities to FBA",
        "Order fulfillment events",
        "Forecast values",
      ],
      toNautilus: [
        "FBA inventory snapshots",
        "Order data",
        "Returns",
        "Restock limits",
        "Marketplace catalog",
      ],
    },
    faqs: [
      {
        q: "How does this handle FBA restock limits?",
        a: "Amazon's restock limits update weekly and vary by storage type. Nautilus reads the current limit from the SP-API on each replenishment cycle and caps suggested shipment sizes accordingly. If you're hitting limits frequently, the replenishment view surfaces this so you can request a limit increase.",
      },
      {
        q: "Does this work with Amazon Vendor Central (1P), or only Seller Central (3P)?",
        a: "Seller Central is fully supported. Amazon Vendor Central support is more limited and runs through a separate integration on enterprise plans; it handles PO confirmation, ASN generation, and inventory snapshots but not the FBA-style replenishment workflow.",
      },
      {
        q: "What's the latency for FBA inventory updates?",
        a: "Amazon's FBA inventory API has variable latency, typically 1 to 4 hours. Nautilus polls every 30 minutes and reconciles to the canonical state. For real-time accuracy on FBA-only items, you're limited by Amazon's API; for FBM and warehouse stock, sync is real-time.",
      },
      {
        q: "How are AGL (Amazon Global Logistics) shipments tracked?",
        a: "AGL shipments appear in Nautilus as in-transit inventory from your warehouse to an Amazon facility, with the AGL booking ID stored on the shipment. Once Amazon receives the inbound, the inventory moves to FBA stock and the in-transit row closes.",
      },
    ],
  },

  square: {
    title: "Square",
    category: "E-commerce & POS",
    tagline: "Square POS sales decrement warehouse stock instantly.",
    desc: "Every sale on your Square POS adjusts warehouse stock in real time. Nautilus bridges Square's point-of-sale catalog and your warehouse inventory for retailers with physical locations, mixed online/in-store, or pop-up operations.",
    features: [
      {
        title: "POS sync under 5 seconds",
        desc: "Square POS sales hit warehouse counts within 5 seconds. Useful for retailers running busy storefronts where overselling between morning and afternoon shifts is a real risk.",
      },
      {
        title: "Bidirectional catalog",
        desc: "Add a product in Nautilus and it appears in Square. Add it in Square and it appears in Nautilus. Variations, modifiers, and pricing all sync. Useful for retail teams who do most catalog work in Square's POS interface.",
      },
      {
        title: "Multi-location",
        desc: "Square locations map to Nautilus warehouses or sections. Each Square POS terminal pulls stock from the correct warehouse, and stock transfers between Nautilus locations reflect in Square's location-aware views.",
      },
    ],
    stats: [
      { val: "<5s", label: "POS sync" },
      { val: "Bi-dir", label: "Catalog" },
      { val: "Multi-loc", label: "Support" },
    ],
    flow: {
      fromNautilus: [
        "Stock levels",
        "Cost basis",
        "Catalog updates",
        "Transfer movements",
      ],
      toNautilus: [
        "POS sales",
        "Refunds",
        "Catalog edits",
        "Location settings",
      ],
    },
    faqs: [
      {
        q: "Does this work with Square Online?",
        a: "Yes. Square Online is one of Square's locations from Nautilus's perspective. Stock from Square Online sales decrements the warehouse the same way as in-store sales. Square Online and Square POS share inventory by design, so they share the same Nautilus mapping.",
      },
      {
        q: "What about Square for Restaurants?",
        a: "Supported, but the use case is narrow. Restaurants typically don't need warehouse-grade inventory management. The integration is most useful for restaurants with central kitchens that prep for multiple locations, or restaurants selling retail merchandise alongside food service.",
      },
      {
        q: "How are modifiers handled?",
        a: "Square modifiers (variants on a base item, like 'Coffee + Oat Milk') don't decrement modifier-specific inventory by default. If your modifiers track stock (a paid 'add an extra scoop' modifier), enable modifier inventory tracking during setup; Nautilus will treat each modifier as its own SKU.",
      },
      {
        q: "Will Square's offline mode break the sync?",
        a: "Square POS can run in offline mode (sales queue locally during network outages). When it reconnects, queued sales sync to the cloud, and Nautilus picks them up on the next webhook. Stock counts catch up automatically. No data loss; just brief delayed accuracy during the offline period.",
      },
    ],
  },

  bigcommerce: {
    title: "BigCommerce",
    category: "E-commerce & POS",
    tagline: "Multi-channel inventory for BigCommerce stores.",
    desc: "Nautilus provides warehouse-grade inventory for BigCommerce, with real-time stock sync, automated order routing across warehouses, and multi-channel allocation rules that prevent overselling on Amazon, eBay, or other channels managed through BigCommerce Channel Manager.",
    features: [
      {
        title: "Channel allocation rules",
        desc: "Allocate stock percentages across channels. Reserve 70% for your BigCommerce storefront, 20% for Amazon, 10% for wholesale, and Nautilus enforces the split. Adjustable per SKU.",
      },
      {
        title: "Order routing",
        desc: "Route orders to the nearest warehouse based on customer ZIP code. The routing engine factors in carrier zone, stock availability, and warehouse hours, so an order doesn't get assigned to a warehouse that's closed until Monday.",
      },
      {
        title: "Bulk operations",
        desc: "Process hundreds of orders through batch picking and packing workflows. The picker carries one tote, picks from optimized routes across many orders, and packs by order at the end. Throughput roughly doubles per picker.",
      },
    ],
    stats: [
      { val: "Smart", label: "Allocation" },
      { val: "Auto", label: "Routing" },
      { val: "Batch", label: "Picking" },
    ],
    flow: {
      fromNautilus: [
        "Stock by channel",
        "Reserved quantities",
        "Fulfillment events",
        "Tracking numbers",
        "Returns processed",
      ],
      toNautilus: [
        "Orders",
        "Customer records",
        "Product catalog",
        "Channel Manager settings",
        "Promotions",
      ],
    },
    faqs: [
      {
        q: "Does this work with BigCommerce Channel Manager?",
        a: "Yes. Channel Manager is the recommended integration path for selling through BigCommerce on Amazon, eBay, Walmart, Facebook, and Google. Nautilus reads the channel-aware inventory model and applies allocation rules per channel, so you don't oversell on any one channel even when others have stock.",
      },
      {
        q: "Are headless BigCommerce sites supported?",
        a: "Yes. BigCommerce as a backend (with React, Next, Vue, or Gatsby frontends) is fully supported via the same Storefront and Admin APIs. The integration doesn't care about the frontend rendering layer.",
      },
      {
        q: "What about BigCommerce B2B Edition?",
        a: "B2B Edition is supported. Customer-specific catalogs, price lists, and shipping zones are all handled. Bulk B2B order workflows benefit substantially from Nautilus's batch picking, since B2B orders are typically larger and consolidatable.",
      },
      {
        q: "How does the order routing logic actually work?",
        a: "The router scores each candidate warehouse against four factors: stock availability for the order's items, carrier zone to the customer, warehouse capacity (current pick queue depth), and warehouse hours. The highest-scoring warehouse gets the order. The scoring weights are configurable; most customers use the defaults.",
      },
    ],
  },

  lightspeed: {
    title: "Lightspeed",
    category: "E-commerce & POS",
    tagline: "Warehouse intelligence for Lightspeed Retail and Restaurant.",
    desc: "Nautilus connects to Lightspeed Retail (X-Series) and Lightspeed Restaurant, providing warehouse-level inventory that syncs across all Lightspeed POS terminals and the integrated e-commerce storefront.",
    features: [
      {
        title: "Retail + Restaurant",
        desc: "Both Lightspeed Retail (X-Series and R-Series) and Lightspeed Restaurant (K-Series and L-Series) are supported through a single integration. One Nautilus instance can post to either product family.",
      },
      {
        title: "PO sync",
        desc: "Purchase orders generated from Nautilus's replenishment flow into Lightspeed for approval. The buyer reviews, approves, and Lightspeed sends the PO to the supplier. Receipts come back into Nautilus when goods arrive.",
      },
      {
        title: "Matrix products",
        desc: "Full support for Lightspeed's matrix product structure (size × color × material variants) and composite products. Each variant tracks separately in Nautilus, and the matrix view in Lightspeed shows live warehouse counts per variant.",
      },
    ],
    stats: [
      { val: "2 platforms", label: "Support" },
      { val: "Auto", label: "POs" },
      { val: "Matrix", label: "Products" },
    ],
    flow: {
      fromNautilus: [
        "Stock levels per variant",
        "PO drafts",
        "Receipt events",
        "Transfer movements",
        "Cycle count adjustments",
      ],
      toNautilus: [
        "Sales transactions",
        "Customer records",
        "Product matrix",
        "Supplier records",
        "POS terminal events",
      ],
    },
    faqs: [
      {
        q: "Do you support both Lightspeed Retail X-Series and R-Series?",
        a: "Yes, both. X-Series (formerly Vend) is Lightspeed's cloud-native product. R-Series (formerly Lightspeed Retail Pro) is the older product family. Each uses a different API; Nautilus handles both. Customers migrating from R to X can keep Nautilus during the migration.",
      },
      {
        q: "What about Lightspeed Restaurant K-Series and L-Series?",
        a: "K-Series (formerly iKentoo) is fully supported. L-Series (formerly Lightspeed Restaurant POS) is supported for inventory sync but doesn't expose detailed sales analytics through its API; you'll see SKU-level sales but not menu-engineering data. Most restaurants find this is enough.",
      },
      {
        q: "How are Lightspeed Loyalty and gift cards handled?",
        a: "Gift cards and loyalty redemptions don't affect inventory directly, so Nautilus ignores them for inventory purposes. The financial side is handled in Lightspeed. For loyalty programs that include 'free product' redemptions, those redemptions decrement warehouse stock the same as a regular sale.",
      },
      {
        q: "Can we run multiple Lightspeed locations through one Nautilus warehouse?",
        a: "Yes. The default is one Lightspeed location per Nautilus warehouse, but central-fulfillment setups (one warehouse ships to multiple retail stores) can map many-to-one. Stock transfers between Lightspeed locations flow through Nautilus as internal moves.",
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────
       SHIPPING & LOGISTICS
       ───────────────────────────────────────────────────────────────── */

  shipstation: {
    title: "ShipStation",
    category: "Shipping & Logistics",
    tagline: "Picked orders flow straight into ShipStation.",
    desc: "Nautilus feeds picked orders into ShipStation for label generation and carrier selection. Tracking numbers flow back into Nautilus and onward to the sales channel, so customers get notifications without anyone touching the order again.",
    features: [
      {
        title: "Auto-label on pick complete",
        desc: "When a pick is marked complete in Nautilus, the order auto-creates in ShipStation with the optimal carrier rate selected. Labels print to your designated printer, and the warehouse keeps moving.",
      },
      {
        title: "Tracking sync",
        desc: "Tracking numbers from ShipStation push back to Nautilus and to whatever sales channel originated the order (Shopify, Amazon, BigCommerce). One write, three destinations updated.",
      },
      {
        title: "Batch shipping",
        desc: "Process hundreds of labels in a batch from Nautilus pick confirmations. ShipStation's batch printing UI works as-is; Nautilus feeds the batches and tracks completion. Useful for end-of-day shipping cutoffs.",
      },
    ],
    stats: [
      { val: "Auto", label: "Labels" },
      { val: "Batch", label: "Processing" },
      { val: "Multi", label: "Carrier" },
    ],
    flow: {
      fromNautilus: [
        "Pick completions",
        "Packed weights and dimensions",
        "Order line items",
        "Customer ship-to addresses",
      ],
      toNautilus: [
        "Tracking numbers",
        "Label PDFs",
        "Carrier service selections",
        "Shipment cost data",
      ],
    },
    faqs: [
      {
        q: "How does ShipStation pick the carrier and service?",
        a: "ShipStation's rate shopping rules drive the choice. You configure rules in ShipStation (use FedEx Ground for orders under 10 lbs, USPS Priority for over); Nautilus passes the order details and ShipStation applies the rule. We don't override your rate shopping logic.",
      },
      {
        q: "What about ShipStation v3 (the new API)?",
        a: "ShipStation v3 is supported. The integration auto-detects which API version your account uses. v3 is faster on label requests (under 800ms typical vs. about 1.5s on v2) but the integration experience is otherwise the same.",
      },
      {
        q: "Can I trigger label creation before pick is complete?",
        a: "Yes, if you want to. By default Nautilus waits for pick completion before pushing the order to ShipStation. For warehouses that pre-print labels at the start of the day, you can switch to 'create on order arrival' mode. The tradeoff is that you'll generate labels you don't end up shipping if a pick fails.",
      },
      {
        q: "Are international shipments fully handled?",
        a: "Yes. International orders include customs forms (HS codes, country of origin, declared values) which Nautilus stores at the product level. ShipStation generates the commercial invoice automatically. For high-value shipments, we recommend manual review of the commercial invoice before label creation.",
      },
    ],
  },

  shippo: {
    title: "Shippo",
    category: "Shipping & Logistics",
    tagline: "Discounted multi-carrier rates from Nautilus.",
    desc: "Nautilus integrates with Shippo for discounted shipping rates and label creation. Useful for warehouses that don't have direct carrier accounts negotiated, or that want USPS commercial pricing without separately enrolling.",
    features: [
      {
        title: "Pre-negotiated discounts",
        desc: "Shippo's carrier discounts apply automatically. USPS Commercial Plus, UPS Daily Pickup, and DHL Express rates are all discounted off standard. Most customers save 10-30% on small package shipping out of the gate.",
      },
      {
        title: "50+ carriers",
        desc: "Compare rates across 50+ carriers (regional carriers, international postal services, freight providers). Nautilus surfaces the cheapest option that meets the order's service level, or you can pin a preferred carrier.",
      },
      {
        title: "Return labels",
        desc: "Generate return shipping labels for RMA workflows. The customer receives an emailed return label; when the package arrives, the warehouse scans the return label and Nautilus routes the item back into stock or quarantine based on the return reason.",
      },
    ],
    stats: [
      { val: "50+", label: "Carriers" },
      { val: "Discounted", label: "Rates" },
      { val: "Returns", label: "Support" },
    ],
    flow: {
      fromNautilus: [
        "Pick completions",
        "Package dimensions",
        "Shipping addresses",
        "Service level requests",
      ],
      toNautilus: [
        "Rate quotes",
        "Label PDFs",
        "Tracking numbers",
        "Carrier delivery events",
      ],
    },
    faqs: [
      {
        q: "Should I use Shippo or ShipStation? They look similar.",
        a: "Shippo is more API-first; ShipStation is more UI-first. If your team prefers a heavy GUI for shipping work (batch printing, rule-based carrier selection visible in a dashboard), use ShipStation. If your team is comfortable letting Nautilus drive carrier selection through Shippo's API, use Shippo. Pricing also differs; Shippo's per-label pricing scales more predictably for very high volumes.",
      },
      {
        q: "Can I use my own negotiated carrier accounts through Shippo?",
        a: "Yes. If you have your own UPS or FedEx account with negotiated rates, add your account credentials to Shippo and the integration uses your rates instead of Shippo's discounted rates. Useful when you've negotiated better rates than Shippo's pool offers.",
      },
      {
        q: "How does Shippo handle dimensional weight?",
        a: "Nautilus pushes the package dimensions and actual weight; Shippo calculates DIM weight per carrier rules and quotes the higher of actual vs. dimensional. The quotes are real-time, so you see the actual rate that will be charged, not an estimate.",
      },
      {
        q: "What's the rate-quote latency?",
        a: "Typically 200 to 600ms per quote. For high-throughput operations doing batch picking, quotes happen in parallel and don't bottleneck pick-to-pack flow. We've never seen a customer's pack throughput limited by rate quote speed.",
      },
    ],
  },

  easypost: {
    title: "EasyPost",
    category: "Shipping & Logistics",
    tagline: "Carrier-agnostic shipping through EasyPost's unified API.",
    desc: "Nautilus uses EasyPost's unified API for multi-carrier shipping, address verification, and shipment insurance. Useful for engineering teams that want shipping to be a single integration point regardless of which carriers they end up using.",
    features: [
      {
        title: "Address verification",
        desc: "Validate shipping addresses against carrier-specific databases before label creation. Catches typos, suite-number errors, and undeliverable addresses before they generate failed deliveries.",
      },
      {
        title: "Auto-insurance",
        desc: "Auto-insure high-value shipments based on configurable thresholds. Set '$500 declared value triggers $5 of insurance,' Nautilus enforces it. Insurance claims for damaged or lost shipments flow back into Nautilus as cost adjustments.",
      },
      {
        title: "Customs forms",
        desc: "International customs documentation generates automatically from product-level HS codes, country of origin, and declared value. Forms attach to the label PDF as a single print job.",
      },
    ],
    stats: [
      { val: "Unified", label: "API" },
      { val: "Auto", label: "Insurance" },
      { val: "Global", label: "Shipping" },
    ],
    flow: {
      fromNautilus: [
        "Pick completions",
        "Package dimensions",
        "Address data",
        "Declared values",
        "Insurance thresholds",
      ],
      toNautilus: [
        "Rate quotes",
        "Label PDFs",
        "Tracking numbers",
        "Address validation results",
        "Customs declarations",
      ],
    },
    faqs: [
      {
        q: "When should I use EasyPost over Shippo or ShipStation?",
        a: "EasyPost is the right choice when shipping is part of a larger engineering integration (your product has its own ship-from-our-warehouse workflow that you're surfacing in a customer-facing app). The API is documented in a way engineering teams find pleasant, and the abstraction is consistent across carriers. For pure warehouse operations without a custom engineering layer, Shippo or ShipStation are usually simpler.",
      },
      {
        q: "How is EasyPost's address verification different from carrier-specific verification?",
        a: "EasyPost cross-references USPS, FedEx, and UPS address databases plus several international postal databases. Carrier-specific verification only checks against one source. The downside: EasyPost address verification costs $0.01 per call. For high-volume operations, we recommend enabling it only on first-time customers and addresses with typo-flag signals.",
      },
      {
        q: "What about EasyPost's Smart Rate feature?",
        a: "Supported. Smart Rate predicts delivery date confidence per carrier and service. Nautilus's order routing can factor Smart Rate confidence into carrier selection ('pick the cheapest carrier with > 80% confidence of delivering by Wednesday'). Most customers leave it off; those who turn it on tend to keep it on.",
      },
      {
        q: "Does this support Latin America carriers (Correios, Estafeta)?",
        a: "Yes, through EasyPost's Latin America carrier roster. Correios (Brazil), Estafeta (Mexico), and several others are integrated. International postal services for Latin America are EasyPost's strength relative to other US-centric platforms.",
      },
    ],
  },

  fedex: {
    title: "FedEx",
    category: "Shipping & Logistics",
    tagline: "Direct FedEx integration with your negotiated rates.",
    desc: "Nautilus connects directly to the FedEx Ship Manager API for label generation, rate shopping, and tracking. Customers with their own FedEx account use their negotiated rates; everyone else gets list rates.",
    features: [
      {
        title: "All service levels",
        desc: "FedEx Ground, Express (Priority Overnight, Standard Overnight, 2Day), SmartPost, and Freight all supported natively. Service-level rules can be configured per order weight, declared value, or destination.",
      },
      {
        title: "Pickup scheduling",
        desc: "Schedule FedEx pickups from Nautilus when shipment batches are ready. The pickup time, package count, and total weight push to FedEx; the warehouse gets the FedEx pickup confirmation.",
      },
      {
        title: "Dimensional weight",
        desc: "Auto-calculate DIM weight from product dimensions stored in Nautilus. FedEx Ground and Express DIM divisors (139) are applied automatically. Rate quotes show actual vs. DIM weight side by side so packers can see when DIM is driving the cost.",
      },
    ],
    stats: [
      { val: "Direct", label: "API" },
      { val: "All tiers", label: "Service" },
      { val: "DIM", label: "Weight" },
    ],
    flow: {
      fromNautilus: [
        "Pick completions",
        "Package dimensions and weight",
        "Pickup requests",
        "Service level selections",
      ],
      toNautilus: [
        "Rate quotes",
        "Label data",
        "Tracking numbers",
        "Pickup confirmations",
        "Delivery events",
      ],
    },
    faqs: [
      {
        q: "Do I need a FedEx Developer account?",
        a: "Yes, for direct integration. Sign up for FedEx Developer Portal access, generate your API credentials, and paste them into Nautilus during setup. The whole process takes about 30 minutes. Customers without a FedEx account can use FedEx through ShipStation or Shippo instead.",
      },
      {
        q: "How does this compare to using FedEx through ShipStation?",
        a: "Direct integration is faster (one less network hop, label generation is typically 200ms vs. 800ms through ShipStation). It also uses your negotiated rates directly without ShipStation's small per-label fee. The tradeoff is that ShipStation provides a richer UI for shipping team workflows; direct FedEx integration is best when label printing is mostly automated and humans rarely look at the shipping interface.",
      },
      {
        q: "What about FedEx Office printing?",
        a: "Not currently integrated. FedEx Office (the retail printing service) has a separate API focused on print jobs rather than shipping. We've had a few customers ask for it; on the roadmap but not committed for any specific quarter.",
      },
      {
        q: "Can I use FedEx International Priority for high-value international shipments?",
        a: "Yes. International Priority, International Economy, and International First all work through the same direct integration. Customs documentation generates automatically from product-level HS codes and country of origin stored in Nautilus.",
      },
    ],
  },

  ups: {
    title: "UPS",
    category: "Shipping & Logistics",
    tagline: "Direct UPS integration with your negotiated rates.",
    desc: "Nautilus connects to the UPS Developer API for label generation, rate comparison, and tracking. Like the FedEx integration, customers with their own UPS account use their negotiated rates.",
    features: [
      {
        title: "Rate shopping",
        desc: "Compare UPS Ground, 2nd Day Air, Next Day Air Saver, and Next Day Air rates before printing. Service level rules can be configured per order weight, declared value, or required delivery date.",
      },
      {
        title: "Access Point delivery",
        desc: "Route shipments to UPS Access Points (pharmacy and convenience store locations) for customer convenience and signature-on-pickup security. Useful for high-value or apartment-complex deliveries.",
      },
      {
        title: "SurePost",
        desc: "UPS SurePost (UPS Ground Saver) is supported for lightweight residential deliveries. The package ships UPS Ground and is handed off to USPS for last-mile delivery, which is cheaper than UPS Ground but slower. Best for low-margin products.",
      },
    ],
    stats: [
      { val: "Auto", label: "Labels" },
      { val: "Rate shop", label: "Built-in" },
      { val: "Real-time", label: "Tracking" },
    ],
    flow: {
      fromNautilus: [
        "Pick completions",
        "Package dimensions and weight",
        "Service level requests",
        "Delivery preferences",
      ],
      toNautilus: [
        "Rate quotes",
        "Label data",
        "Tracking numbers",
        "Access Point locations",
        "Delivery events",
      ],
    },
    faqs: [
      {
        q: "Do I need a UPS account?",
        a: "Yes. The UPS Developer API requires a UPS account number and shipper account. Customers without one can use UPS through ShipStation or Shippo instead. The UPS account signup process is straightforward but takes about a week for approval; plan accordingly.",
      },
      {
        q: "What's the difference between UPS Ground and UPS Ground Saver (SurePost)?",
        a: "UPS Ground is end-to-end UPS delivery. UPS Ground Saver hands the last mile to USPS, which is typically a day slower and 10-20% cheaper. We have customers using both: Ground for higher-value items, Saver for low-margin items where the delivery date is less critical.",
      },
      {
        q: "Can I use UPS Worldship workflows alongside Nautilus?",
        a: "Yes, but with one rule: pick one tool to be the label generator. Most customers move all label generation into Nautilus and retire UPS Worldship for that account. If you have non-Nautilus shipments (internal transfers shipped through UPS), Worldship can handle those separately without conflicting.",
      },
      {
        q: "How does this handle UPS surcharge management (peak season, residential, fuel)?",
        a: "Surcharges come back from UPS's rate API at quote time. The quotes Nautilus shows include surcharges, so packers see the actual final rate, not a base rate that has hidden costs added later. During peak season (typically mid-November through January), UPS's peak surcharge updates weekly; Nautilus picks up the changes automatically.",
      },
    ],
  },

  dhl: {
    title: "DHL",
    category: "Shipping & Logistics",
    tagline: "International shipping through DHL Express and eCommerce.",
    desc: "Nautilus integrates with both DHL Express (international air freight, time-definite delivery) and DHL eCommerce (postal-style international parcel). Customs documentation, duties calculation, and tracking all come through a single integration.",
    features: [
      {
        title: "220+ countries",
        desc: "Ship to 220+ countries through DHL's global network. Each shipment auto-generates the required customs documentation (commercial invoice, packing list, country-of-origin declarations) at print time.",
      },
      {
        title: "Duties and taxes calculation",
        desc: "Calculate landed costs (duties, taxes, brokerage) at the time of shipment creation, using DHL's Trade Automation Services. Customers can be billed for duties upfront (DDP) or on delivery (DDU); both flows are supported.",
      },
      {
        title: "Global tracking",
        desc: "End-to-end visibility from warehouse pickup through international air freight, customs clearance, last-mile carrier handoff, and final delivery. Tracking events post back to Nautilus and to the sales channel that originated the order.",
      },
    ],
    stats: [
      { val: "220+", label: "Countries" },
      { val: "Auto", label: "Customs" },
      { val: "Global", label: "Tracking" },
    ],
    flow: {
      fromNautilus: [
        "Pick completions",
        "Package dimensions and weight",
        "Customs declarations",
        "Service level (Express vs eCommerce)",
        "DDP / DDU selection",
      ],
      toNautilus: [
        "Rate quotes",
        "Label data",
        "Commercial invoices",
        "Duties and tax calculations",
        "Tracking events",
      ],
    },
    faqs: [
      {
        q: "DHL Express vs. DHL eCommerce: which should I use?",
        a: "DHL Express is time-definite international air freight, typically 2-5 days door to door, premium pricing. DHL eCommerce is postal-style parcel, typically 7-14 days, much cheaper. Use Express for high-value or urgent international; use eCommerce for low-margin direct-to-consumer.",
      },
      {
        q: "What's the customs paperwork process?",
        a: "Nautilus generates the commercial invoice and packing list automatically at label creation. For each item, we use the HS code, country of origin, and declared value stored in your product master. The PDF prints with the label as a single job. For high-value shipments ($2,500+ to most countries), we recommend manual review before printing.",
      },
      {
        q: "How are returns handled internationally?",
        a: "Returns from international destinations are complex enough that we don't auto-generate return labels by default. The integration supports manual return label creation through the DHL API, but customers typically use a regional return aggregator (in the destination country) and surface that return option through their customer-service interface. Returns post back to Nautilus when the package is scanned at your warehouse.",
      },
      {
        q: "Does this support DHL Parcel (the European parcel network)?",
        a: "Yes. DHL Parcel (formerly DPD/DHL Parcel Europe) is supported within DHL eCommerce. European customers shipping intra-EU benefit from the Parcel network; non-EU senders shipping into Europe also have access through the eCommerce service.",
      },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════════════
     DEFAULT_INTEGRATION_FAQS
     ───────────────────────────────────────────────────────────────────────
     Fallback FAQ block, rendered when an integration in INTEGRATIONS above
     doesn't specify its own `faqs` array. Also used as the FAQ JSON-LD
     schema fallback in app/integration/[slug]/page.js.
  
     In practice all 18 integrations above ship with their own per-integration
     `faqs`, so this fallback exists for new integrations added in the future
     before someone has written platform-specific Q&As.
     ═══════════════════════════════════════════════════════════════════════ */
export const DEFAULT_INTEGRATION_FAQS = [
  {
    q: "How long does setup take?",
    a: "Most customers are syncing in under 10 minutes. Enterprise environments with custom field mappings can take 30 minutes to an hour.",
  },
  {
    q: "What if a sync fails?",
    a: "Nautilus retries with exponential backoff for 24 hours. After that, the record is flagged in your dashboard for manual review. Sync failures never block your warehouse operations.",
  },
  {
    q: "Can I limit what syncs?",
    a: "Yes. Granular controls let you sync specific products, locations, or even specific fields. Most customers start with everything on and tighten over time.",
  },
  {
    q: "Is the integration included in all plans?",
    a: "This integration is included in Pro and Enterprise. Free plans can install but with limits on sync frequency.",
  },
];
