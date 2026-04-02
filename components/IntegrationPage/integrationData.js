export const INTEGRATIONS = {
  quickbooks: {
    title: "QuickBooks",
    category: "Accounting & ERP",
    tagline: "Sync inventory valuations and purchase orders in real time.",
    desc: "Nimbus connects directly to QuickBooks Online and Desktop, syncing inventory counts, cost of goods sold, and purchase orders bidirectionally. When stock moves in your warehouse, your books update automatically.",
    features: [
      {
        title: "Real-time COGS sync",
        desc: "Every inventory movement updates your cost of goods sold ledger automatically.",
      },
      {
        title: "Purchase order generation",
        desc: "Nimbus AI detects low stock and drafts POs directly in QuickBooks for approval.",
      },
      {
        title: "Multi-location mapping",
        desc: "Map warehouse sections to QuickBooks inventory sites for accurate location tracking.",
      },
    ],
    stats: [
      { val: "2-way", label: "Sync" },
      { val: "<30s", label: "Latency" },
      { val: "99.9%", label: "Uptime" },
    ],
  },
  xero: {
    title: "Xero",
    category: "Accounting & ERP",
    tagline: "Automated inventory accounting for Xero-powered businesses.",
    desc: "Connect Nimbus to Xero and eliminate manual inventory journal entries. Stock adjustments, write-offs, and transfers automatically post to the correct accounts with full audit trails.",
    features: [
      {
        title: "Automatic journal entries",
        desc: "Inventory adjustments create corresponding Xero journals without manual input.",
      },
      {
        title: "Bill matching",
        desc: "Match received goods against supplier bills for three-way reconciliation.",
      },
      {
        title: "Tax-ready reporting",
        desc: "Inventory valuations stay current for BAS and year-end reporting.",
      },
    ],
    stats: [
      { val: "Auto", label: "Journals" },
      { val: "3-way", label: "Matching" },
      { val: "Real-time", label: "Sync" },
    ],
  },
  freshbooks: {
    title: "FreshBooks",
    category: "Accounting & ERP",
    tagline: "Inventory-aware invoicing and expense tracking.",
    desc: "Nimbus enriches FreshBooks with warehouse-level inventory data. Product costs flow into invoices automatically, and expense categories stay aligned with physical stock movements.",
    features: [
      {
        title: "Invoice cost tracking",
        desc: "Product COGS auto-populates on FreshBooks invoices from warehouse data.",
      },
      {
        title: "Expense categorization",
        desc: "Warehouse expenses map to FreshBooks categories for cleaner books.",
      },
      {
        title: "Client inventory reports",
        desc: "Generate inventory summaries attached to client projects.",
      },
    ],
    stats: [
      { val: "Auto", label: "COGS" },
      { val: "Instant", label: "Sync" },
      { val: "Simple", label: "Setup" },
    ],
  },
  "sap-business-one": {
    title: "SAP Business One",
    category: "Accounting & ERP",
    tagline: "Enterprise-grade warehouse intelligence for SAP environments.",
    desc: "Nimbus extends SAP Business One with AI-powered warehouse operations. Inventory transactions, goods receipts, and production orders sync bidirectionally through SAP's Service Layer API.",
    features: [
      {
        title: "Service Layer integration",
        desc: "Native API connection — no middleware required.",
      },
      {
        title: "Production order sync",
        desc: "Bill of materials and production consumption update warehouse stock in real time.",
      },
      {
        title: "Batch & serial tracking",
        desc: "Full lot traceability from warehouse shelf to SAP document.",
      },
    ],
    stats: [
      { val: "Native", label: "API" },
      { val: "Batch", label: "Tracking" },
      { val: "Enterprise", label: "Grade" },
    ],
  },
  netsuite: {
    title: "NetSuite",
    category: "Accounting & ERP",
    tagline: "Warehouse execution layer for NetSuite ERP.",
    desc: "Nimbus acts as the warehouse execution system for NetSuite, handling scanning, putaway, and picking while syncing transactions back to NetSuite's inventory and financial modules via SuiteTalk.",
    features: [
      {
        title: "SuiteTalk integration",
        desc: "Direct SOAP/REST connection to NetSuite without third-party connectors.",
      },
      {
        title: "Bin management",
        desc: "Warehouse bin locations in Nimbus map to NetSuite inventory locations.",
      },
      {
        title: "Transfer order execution",
        desc: "Warehouse staff execute NetSuite transfer orders with barcode scanning.",
      },
    ],
    stats: [
      { val: "Direct", label: "Connection" },
      { val: "Bin-level", label: "Accuracy" },
      { val: "Real-time", label: "Updates" },
    ],
  },
  sage: {
    title: "Sage",
    category: "Accounting & ERP",
    tagline: "Warehouse automation for Sage 50 and Sage Intacct.",
    desc: "Nimbus integrates with Sage 50 and Sage Intacct, syncing inventory counts, adjustments, and valuations. Stock movements on the warehouse floor immediately reflect in your Sage accounts.",
    features: [
      {
        title: "Dual platform support",
        desc: "Works with both Sage 50 (desktop) and Sage Intacct (cloud).",
      },
      {
        title: "Dimension mapping",
        desc: "Warehouse zones map to Sage Intacct dimensions for multi-dimensional reporting.",
      },
      {
        title: "Automated adjustments",
        desc: "Cycle count variances auto-post as inventory adjustments in Sage.",
      },
    ],
    stats: [
      { val: "2 platforms", label: "Support" },
      { val: "Auto", label: "Adjustments" },
      { val: "<1min", label: "Sync" },
    ],
  },
  shopify: {
    title: "Shopify",
    category: "E-commerce & POS",
    tagline: "Real-time inventory sync across every Shopify channel.",
    desc: "Every sale on your Shopify store decrements warehouse stock instantly. Nimbus prevents overselling across all channels and automates fulfillment workflows from pick to ship.",
    features: [
      {
        title: "Instant stock sync",
        desc: "Shopify inventory levels update within seconds of warehouse scans.",
      },
      {
        title: "Multi-location",
        desc: "Manage inventory across multiple Shopify locations from one warehouse view.",
      },
      {
        title: "Fulfillment automation",
        desc: "Orders flow into Nimbus pick queues automatically with optimized routing.",
      },
    ],
    stats: [
      { val: "<5s", label: "Sync" },
      { val: "0%", label: "Oversells" },
      { val: "Auto", label: "Fulfillment" },
    ],
  },
  woocommerce: {
    title: "WooCommerce",
    category: "E-commerce & POS",
    tagline: "Warehouse-powered inventory for WooCommerce stores.",
    desc: "Nimbus connects to WooCommerce via REST API, keeping product stock levels accurate across your store. Variable products, bundles, and backorder logic all sync seamlessly.",
    features: [
      {
        title: "Variable product support",
        desc: "Stock tracked per variation — size, color, material all managed independently.",
      },
      {
        title: "Backorder automation",
        desc: "Nimbus manages backorder thresholds and auto-enables when stock drops.",
      },
      {
        title: "Webhook-driven",
        desc: "Real-time webhooks ensure zero delay between warehouse and storefront.",
      },
    ],
    stats: [
      { val: "REST", label: "API" },
      { val: "Per-variant", label: "Tracking" },
      { val: "Webhooks", label: "Real-time" },
    ],
  },
  amazon: {
    title: "Amazon",
    category: "E-commerce & POS",
    tagline: "Unified inventory across Amazon and your warehouse.",
    desc: "Nimbus syncs with Amazon Seller Central and FBA, providing a single view of inventory whether it's in your warehouse, in transit, or at Amazon fulfillment centers.",
    features: [
      {
        title: "FBA inventory tracking",
        desc: "Monitor Amazon-held stock alongside warehouse inventory in one dashboard.",
      },
      {
        title: "Replenishment alerts",
        desc: "AI predicts when to send more stock to FBA based on velocity data.",
      },
      {
        title: "Multi-marketplace",
        desc: "Sync inventory across Amazon US, CA, UK, and EU marketplaces.",
      },
    ],
    stats: [
      { val: "FBA+FBM", label: "Support" },
      { val: "Multi", label: "Marketplace" },
      { val: "AI", label: "Replenish" },
    ],
  },
  square: {
    title: "Square",
    category: "E-commerce & POS",
    tagline: "Connect your Square POS to warehouse-level inventory.",
    desc: "Every Square transaction adjusts warehouse stock in real time. Nimbus bridges the gap between point-of-sale and warehouse management for retailers with physical locations.",
    features: [
      {
        title: "POS sync",
        desc: "Square POS sales instantly decrement warehouse inventory counts.",
      },
      {
        title: "Catalog mapping",
        desc: "Square item catalog maps to Nimbus product database bidirectionally.",
      },
      {
        title: "Multi-location",
        desc: "Manage inventory for multiple Square locations from one warehouse.",
      },
    ],
    stats: [
      { val: "Instant", label: "POS sync" },
      { val: "Bi-dir", label: "Catalog" },
      { val: "Multi-loc", label: "Support" },
    ],
  },
  bigcommerce: {
    title: "BigCommerce",
    category: "E-commerce & POS",
    tagline: "Enterprise e-commerce inventory powered by Nimbus.",
    desc: "Nimbus provides warehouse-grade inventory management for BigCommerce stores, with real-time stock sync, automated fulfillment, and multi-channel inventory allocation.",
    features: [
      {
        title: "Channel inventory rules",
        desc: "Allocate stock percentages across channels to prevent overselling.",
      },
      {
        title: "Order routing",
        desc: "Automatically route orders to the nearest warehouse for fastest fulfillment.",
      },
      {
        title: "Bulk operations",
        desc: "Process hundreds of orders through optimized batch picking workflows.",
      },
    ],
    stats: [
      { val: "Smart", label: "Allocation" },
      { val: "Auto", label: "Routing" },
      { val: "Batch", label: "Picking" },
    ],
  },
  lightspeed: {
    title: "Lightspeed",
    category: "E-commerce & POS",
    tagline: "Warehouse intelligence for Lightspeed retailers.",
    desc: "Nimbus connects to Lightspeed Retail and Restaurant, providing warehouse-level inventory visibility that syncs across all your Lightspeed POS terminals and e-commerce channels.",
    features: [
      {
        title: "Retail + Restaurant",
        desc: "Supports both Lightspeed Retail and Lightspeed Restaurant platforms.",
      },
      {
        title: "Supplier management",
        desc: "Purchase orders generated from Nimbus AI flow directly into Lightspeed.",
      },
      {
        title: "Matrix products",
        desc: "Full support for Lightspeed's matrix product variants and composites.",
      },
    ],
    stats: [
      { val: "2 platforms", label: "Support" },
      { val: "Auto", label: "POs" },
      { val: "Matrix", label: "Products" },
    ],
  },
  shipstation: {
    title: "ShipStation",
    category: "Shipping & Logistics",
    tagline: "From pick to ship — fully automated.",
    desc: "Nimbus feeds picked orders directly into ShipStation for label generation and carrier selection. Tracking numbers flow back to update order status and customer notifications.",
    features: [
      {
        title: "Auto label generation",
        desc: "Picked orders auto-create ShipStation shipments with optimal carrier rates.",
      },
      {
        title: "Tracking sync",
        desc: "Tracking numbers push back to Nimbus and connected sales channels.",
      },
      {
        title: "Batch shipping",
        desc: "Process hundreds of labels in batch from Nimbus pick confirmations.",
      },
    ],
    stats: [
      { val: "Auto", label: "Labels" },
      { val: "Batch", label: "Processing" },
      { val: "Multi", label: "Carrier" },
    ],
  },
  shippo: {
    title: "Shippo",
    category: "Shipping & Logistics",
    tagline: "Discounted shipping rates connected to your warehouse.",
    desc: "Nimbus integrates with Shippo to provide discounted shipping rates, automated label creation, and carrier comparison directly from the warehouse floor.",
    features: [
      {
        title: "Rate comparison",
        desc: "Compare rates across carriers before printing labels.",
      },
      {
        title: "Discounted rates",
        desc: "Access Shippo's pre-negotiated carrier discounts from Nimbus.",
      },
      {
        title: "Return labels",
        desc: "Generate return shipping labels for RMA workflows.",
      },
    ],
    stats: [
      { val: "50+", label: "Carriers" },
      { val: "Discounted", label: "Rates" },
      { val: "Returns", label: "Support" },
    ],
  },
  easypost: {
    title: "EasyPost",
    category: "Shipping & Logistics",
    tagline: "Developer-friendly shipping API for warehouse automation.",
    desc: "Nimbus leverages EasyPost's unified API to provide carrier-agnostic shipping, address verification, and insurance across all major carriers from a single integration.",
    features: [
      {
        title: "Address verification",
        desc: "Validate shipping addresses before label creation to reduce returns.",
      },
      {
        title: "Insurance automation",
        desc: "Auto-insure high-value shipments based on configurable thresholds.",
      },
      {
        title: "Customs forms",
        desc: "International customs documentation generated automatically.",
      },
    ],
    stats: [
      { val: "Unified", label: "API" },
      { val: "Auto", label: "Insurance" },
      { val: "Global", label: "Shipping" },
    ],
  },
  fedex: {
    title: "FedEx",
    category: "Shipping & Logistics",
    tagline: "Direct FedEx integration from warehouse to doorstep.",
    desc: "Nimbus connects directly to FedEx Ship Manager API for label generation, rate shopping, and real-time tracking. Ground, Express, and Freight services all supported.",
    features: [
      {
        title: "All service levels",
        desc: "Ground, Express, SmartPost, and Freight supported natively.",
      },
      {
        title: "Pickup scheduling",
        desc: "Schedule FedEx pickups from Nimbus when shipment batches are ready.",
      },
      {
        title: "Dimensional weight",
        desc: "Auto-calculate DIM weight from product dimensions in Nimbus.",
      },
    ],
    stats: [
      { val: "Direct", label: "API" },
      { val: "All tiers", label: "Service" },
      { val: "DIM", label: "Weight" },
    ],
  },
  ups: {
    title: "UPS",
    category: "Shipping & Logistics",
    tagline: "UPS shipping intelligence built into warehouse operations.",
    desc: "Nimbus integrates with UPS Developer API for automated label generation, rate comparison, and end-to-end tracking from warehouse scan to customer delivery.",
    features: [
      {
        title: "Rate shopping",
        desc: "Compare UPS Ground, 2nd Day, and Next Day rates before shipping.",
      },
      {
        title: "Access Point delivery",
        desc: "Route shipments to UPS Access Points for customer convenience.",
      },
      {
        title: "SurePost integration",
        desc: "Leverage UPS SurePost for lightweight residential deliveries.",
      },
    ],
    stats: [
      { val: "Auto", label: "Labels" },
      { val: "Rate shop", label: "Built-in" },
      { val: "Real-time", label: "Tracking" },
    ],
  },
  dhl: {
    title: "DHL",
    category: "Shipping & Logistics",
    tagline: "Global logistics connected to your warehouse floor.",
    desc: "Nimbus integrates with DHL Express and DHL eCommerce for international shipping, customs documentation, and global tracking from a single warehouse interface.",
    features: [
      {
        title: "International shipping",
        desc: "Ship to 220+ countries with automated customs documentation.",
      },
      {
        title: "Duties & taxes",
        desc: "Calculate landed costs and duties at time of shipment creation.",
      },
      {
        title: "Global tracking",
        desc: "End-to-end visibility from warehouse to international destination.",
      },
    ],
    stats: [
      { val: "220+", label: "Countries" },
      { val: "Auto", label: "Customs" },
      { val: "Global", label: "Tracking" },
    ],
  },
};
