export const HELP_CATEGORIES = [
  {
    title: "Getting Started",
    slug: "getting-started",
    articles: [
      {
        slug: "creating-your-first-warehouse",
        title: "Creating your first warehouse",
        content: [
          {
            type: "p",
            text: "After signing up, you'll be prompted to create your first warehouse. Tap 'Create Warehouse' and enter a name (e.g., 'Main Distribution Center').",
          },
          { type: "h2", text: "Setting up the layout" },
          {
            type: "p",
            text: "Define your warehouse structure using Sections (large areas), Bays (shelving units), and Levels (individual shelves). You can add these manually or import from a CSV template.",
          },
          {
            type: "p",
            text: "For most warehouses, we recommend starting with sections that match your physical zones (Receiving, Storage, Shipping) and adding bays as you barcode each location.",
          },
        ],
      },
      {
        slug: "adding-products-and-skus",
        title: "Adding products and SKUs",
        content: [
          {
            type: "p",
            text: "Products can be added three ways: scanning a barcode, manual entry, or CSV import.",
          },
          { type: "h2", text: "Scanning to add" },
          {
            type: "p",
            text: "Scan any barcode not yet in your system and Nautilus will prompt you to create a new product. Fill in the name, SKU, and optional fields — the barcode is automatically linked.",
          },
          { type: "h2", text: "CSV import" },
          {
            type: "p",
            text: "Go to Settings → Import/Export → Import Products. Download the CSV template, fill in your product data, and upload. Nautilus will validate the file and show a preview before importing.",
          },
        ],
      },
      {
        slug: "setting-up-barcode-scanning",
        title: "Setting up barcode scanning",
        content: [
          {
            type: "p",
            text: "Nautilus scanning works with your device's built-in camera — no special hardware required. For best results, ensure your camera lens is clean and you have adequate lighting.",
          },
          { type: "h2", text: "Supported formats" },
          {
            type: "p",
            text: "Nautilus supports Code 128, Code 39, EAN-13, UPC-A, QR codes, and Data Matrix. The scanner automatically detects the format — no configuration needed.",
          },
          {
            type: "p",
            text: "For damaged or low-contrast barcodes, enable 'Enhanced Recognition' in Settings → Scanning. This uses the AI model for improved accuracy at the cost of slightly higher battery usage.",
          },
        ],
      },
      {
        slug: "inviting-team-members",
        title: "Inviting team members",
        content: [
          {
            type: "p",
            text: "Go to Settings → Team → Invite Member. Enter their email address and select a role: Admin, Manager, or Staff.",
          },
          { type: "h2", text: "Role permissions" },
          {
            type: "p",
            text: "Admins have full access including billing and team management. Managers can configure warehouse settings and view reports. Staff can perform scan actions and view inventory but cannot change settings.",
          },
          {
            type: "p",
            text: "Invited members receive an email with a link to create their account. They'll be automatically added to your warehouse once they sign up.",
          },
        ],
      },
      {
        slug: "configuring-sections-bays-levels",
        title: "Configuring sections, bays, and levels",
        content: [
          {
            type: "p",
            text: "Your warehouse structure has three tiers: Sections are the top level (e.g., 'A', 'B', 'Receiving'). Bays are shelving units within a section. Levels are individual shelves within a bay.",
          },
          { type: "h2", text: "Naming conventions" },
          {
            type: "p",
            text: "We recommend a consistent format like A-01-3 (Section A, Bay 01, Level 3). This maps cleanly to barcode labels and is easy for staff to locate physically.",
          },
          {
            type: "p",
            text: "You can print location barcode labels directly from the Locations page — select the locations you need and tap 'Print Labels'.",
          },
        ],
      },
      {
        slug: "your-first-cycle-count",
        title: "Your first cycle count",
        content: [
          {
            type: "p",
            text: "A cycle count verifies that your digital inventory matches what's physically on the shelves. Go to Cycle Counts → New Count and select which sections to include.",
          },
          { type: "h2", text: "Counting process" },
          {
            type: "p",
            text: "Walk to each location and scan the location barcode. Nautilus shows the expected quantity — enter the actual count. If they match, the location is confirmed. If they differ, it's flagged for review.",
          },
          {
            type: "p",
            text: "After counting, review discrepancies on the Reconciliation screen. You can accept the physical count (adjusting digital records) or flag items for further investigation.",
          },
        ],
      },
    ],
  },
  {
    title: "Scanning & Inventory",
    slug: "scanning-inventory",
    articles: [
      {
        slug: "supported-barcode-formats",
        title: "Supported barcode formats",
        content: [
          {
            type: "p",
            text: "Nautilus recognizes all major barcode formats automatically: Code 128, Code 39, EAN-13, EAN-8, UPC-A, UPC-E, QR Code, Data Matrix, ITF-14, and Codabar.",
          },
          {
            type: "p",
            text: "The scanner detects the format in the image and decodes it — you never need to specify which type you're scanning. Multiple barcodes in a single frame are handled sequentially.",
          },
        ],
      },
      {
        slug: "scan-actions-explained",
        title: "Scan actions explained",
        content: [
          {
            type: "p",
            text: "Nautilus supports eight scan actions: Pick (remove from location for order), Putaway (place into location), Receive (add new stock), Relocate (move between locations), Count (cycle count verification), Adjust (manual quantity change), Ship (mark as shipped), and Return (process incoming return).",
          },
          {
            type: "p",
            text: "Select the action before scanning, or let Nautilus auto-detect based on context. If you're in a cycle count session, scans automatically register as counts.",
          },
        ],
      },
      {
        slug: "registering-new-products-via-scan",
        title: "Registering new products via scan",
        content: [
          {
            type: "p",
            text: "When you scan a barcode that doesn't match any existing product, Nautilus prompts you to create a new one. Enter the product name, SKU, and any custom fields.",
          },
          {
            type: "p",
            text: "The barcode is permanently linked to the product. Future scans of the same barcode will immediately pull up the product record. Multiple barcodes can be linked to a single product if needed.",
          },
        ],
      },
      {
        slug: "relocating-inventory",
        title: "Relocating inventory",
        content: [
          {
            type: "p",
            text: "To move inventory between locations: select 'Relocate' as your scan action, scan the product barcode, scan the source location, enter quantity (or 'all'), then scan the destination location.",
          },
          {
            type: "p",
            text: "Nautilus updates both locations instantly. The activity log records who moved what, when, from where, and to where — providing a complete audit trail.",
          },
        ],
      },
      {
        slug: "adjusting-quantities",
        title: "Adjusting quantities",
        content: [
          {
            type: "p",
            text: "Use the Adjust action when you need to change a quantity without a corresponding movement — for example, writing off damaged goods or correcting a data entry error.",
          },
          {
            type: "p",
            text: "Adjustments require a reason code (Damaged, Expired, Correction, Other) and an optional note. All adjustments are logged and visible in the activity feed and reports.",
          },
        ],
      },
      {
        slug: "bulk-import-via-csv",
        title: "Bulk import via CSV",
        content: [
          {
            type: "p",
            text: "Navigate to Settings → Import/Export. Download the appropriate template (Products, Inventory, or Locations), fill in your data, and upload.",
          },
          { type: "h2", text: "Validation" },
          {
            type: "p",
            text: "Nautilus validates every row before importing. Common issues: duplicate SKUs, missing required fields, invalid location codes. The preview screen shows exactly what will be created or updated, with errors highlighted in red.",
          },
        ],
      },
    ],
  },
  {
    title: "AI Features",
    slug: "ai-features",
    articles: [
      {
        slug: "voice-commands-reference",
        title: "Voice commands reference",
        content: [
          {
            type: "p",
            text: "Enable voice commands in Settings → AI Features → Voice Commands. Supported commands include: 'Scan this', 'Where is [SKU]', 'Count section [name]', 'Move to [location]', 'How many [product]', 'Pick order [number]'.",
          },
          {
            type: "p",
            text: "Voice commands work best with a headset microphone in noisy environments. The AI adapts to your voice over time for improved accuracy.",
          },
        ],
      },
      {
        slug: "setting-up-spatial-mapping",
        title: "Setting up spatial mapping",
        content: [
          {
            type: "p",
            text: "Spatial mapping builds automatically from your team's scan activity. No additional setup is required — just use Nautilus normally and the map refines itself.",
          },
          {
            type: "p",
            text: "You can view the spatial map in Analytics → Warehouse Map. The map shows activity heatmaps, congestion zones, and walking distance estimates between any two locations.",
          },
        ],
      },
      {
        slug: "using-intelligent-search",
        title: "Using intelligent search",
        content: [
          {
            type: "p",
            text: "The search bar at the top of every screen supports natural language queries. Type 'low stock in section A' or 'products received this week' or 'items not counted in 30 days'.",
          },
          {
            type: "p",
            text: "Search results include products, locations, orders, and team activity. Results are ranked by relevance and recency.",
          },
        ],
      },
      {
        slug: "predictive-analytics-dashboard",
        title: "Predictive analytics dashboard",
        content: [
          {
            type: "p",
            text: "The Predictions tab in Analytics shows AI-generated forecasts: stock depletion timelines, reorder suggestions, demand patterns, and anomaly alerts.",
          },
          {
            type: "p",
            text: "Each prediction includes a confidence score and the reasoning behind it. You can accept suggestions (which generate purchase orders or alerts) or dismiss them to improve future accuracy.",
          },
        ],
      },
      {
        slug: "low-stock-alert-configuration",
        title: "Low stock alert configuration",
        content: [
          {
            type: "p",
            text: "Go to Settings → Alerts → Low Stock. Set global thresholds or per-product minimums. When stock drops below the threshold, Nautilus sends a push notification and email to designated team members.",
          },
          {
            type: "p",
            text: "For AI-powered alerts, enable 'Predictive Alerts' which warn you before stock actually hits the minimum — typically 2-3 days in advance based on consumption velocity.",
          },
        ],
      },
      {
        slug: "ai-prioritized-cycle-counting",
        title: "AI-prioritized cycle counting",
        content: [
          {
            type: "p",
            text: "Instead of counting every section on a fixed schedule, AI-prioritized counting tells you which locations are most likely to have discrepancies. Factors include: time since last count, transaction volume, value of items, and historical accuracy.",
          },
          {
            type: "p",
            text: "Enable in Settings → Cycle Counts → AI Priority. The dashboard will show a ranked list of locations to count, updated daily.",
          },
        ],
      },
    ],
  },
  {
    title: "Integrations",
    slug: "integrations",
    articles: [
      {
        slug: "connecting-quickbooks",
        title: "Connecting QuickBooks",
        content: [
          {
            type: "p",
            text: "Go to Settings → Integrations → QuickBooks. Click 'Connect' and sign in to your QuickBooks Online account. Grant Nautilus permission to read and write inventory data.",
          },
          {
            type: "p",
            text: "After connecting, map your Nautilus products to QuickBooks inventory items. Nautilus will auto-match by SKU where possible. Inventory movements will then automatically create journal entries in QuickBooks.",
          },
        ],
      },
      {
        slug: "shopify-inventory-sync",
        title: "Shopify inventory sync",
        content: [
          {
            type: "p",
            text: "Connect your Shopify store in Settings → Integrations → Shopify. Enter your store URL and authorize the connection. Nautilus syncs inventory levels bidirectionally every 30 seconds.",
          },
          {
            type: "p",
            text: "When a Shopify order is placed, warehouse stock decrements instantly. When you receive new stock in Nautilus, Shopify product availability updates automatically. Multi-location Shopify stores are fully supported.",
          },
        ],
      },
      {
        slug: "shipstation-setup-guide",
        title: "ShipStation setup guide",
        content: [
          {
            type: "p",
            text: "Navigate to Settings → Integrations → ShipStation. Enter your ShipStation API key (found in ShipStation under Account → API Settings). Click 'Connect'.",
          },
          {
            type: "p",
            text: "Once connected, picked orders in Nautilus automatically create shipments in ShipStation. Tracking numbers from ShipStation push back to Nautilus and connected sales channels.",
          },
        ],
      },
      {
        slug: "api-authentication",
        title: "API authentication",
        content: [
          {
            type: "p",
            text: "The Nautilus API uses Bearer token authentication. Generate an API key in Settings → API → Generate Key. Include the key in every request header: Authorization: Bearer YOUR_API_KEY.",
          },
          {
            type: "p",
            text: "API keys can be scoped to specific permissions (read-only, write, admin). Revoke compromised keys immediately from the same settings page. Rate limits are 100 requests per minute for standard plans.",
          },
        ],
      },
      {
        slug: "webhook-configuration",
        title: "Webhook configuration",
        content: [
          {
            type: "p",
            text: "Register webhook endpoints in Settings → API → Webhooks. Specify the URL and which events to subscribe to: inventory.updated, order.created, scan.completed, count.finished, and alert.triggered.",
          },
          {
            type: "p",
            text: "Webhooks are sent as POST requests with a JSON payload. Each includes a signature header for verification. Failed deliveries are retried 3 times with exponential backoff.",
          },
        ],
      },
      {
        slug: "zapier-integration",
        title: "Zapier integration",
        content: [
          {
            type: "p",
            text: "Search for 'Nautilus WMS' in the Zapier app directory. Connect your account using your API key. Available triggers: New Scan, Low Stock Alert, Order Complete, Count Finished.",
          },
          {
            type: "p",
            text: "Popular Zaps include: sending a Slack message when stock is low, creating a Google Sheet row for every scan, and triggering a reorder in your supplier's portal when inventory hits minimum levels.",
          },
        ],
      },
    ],
  },
  {
    title: "Account & Billing",
    slug: "account-billing",
    articles: [
      {
        slug: "plan-comparison",
        title: "Plan comparison",
        content: [
          {
            type: "p",
            text: "Nautilus has two plans. Pro is $239 per warehouse per month on annual billing ($299 on monthly), covers a single warehouse with unlimited scanner users and up to 50,000 SKUs, and includes AI scanning, voice commands, and all 18 integrations. A 14-day free trial is available, no credit card required.",
          },
          {
            type: "p",
            text: "Enterprise is custom-priced and built for multi-site operations: unlimited warehouses, unlimited SKUs, Spatial Intelligence, multi-warehouse orchestration, full read/write API access, SSO/SAML, a dedicated success manager, 24/7 priority support, and a 99.99% uptime SLA. Talk to sales for a quote and a 30-day tailored proof-of-concept.",
          },
        ],
      },
      {
        slug: "upgrading-your-plan",
        title: "Upgrading your plan",
        content: [
          {
            type: "p",
            text: "Go to Settings → Billing → Change Plan. Select your new plan and confirm. Upgrades from Pro to Enterprise take effect immediately — you'll only be billed for the difference for the remainder of your current cycle. Downgrades take effect at the start of your next billing period.",
          },
          {
            type: "p",
            text: "When upgrading to Enterprise, Spatial Intelligence, multi-warehouse orchestration, full API access, and SSO/SAML are enabled as part of onboarding. Your existing data, warehouse configurations, and team members carry over unchanged.",
          },
        ],
      },
      {
        slug: "managing-team-roles",
        title: "Managing team roles",
        content: [
          {
            type: "p",
            text: "View and edit team roles in Settings → Team. Click any team member to change their role between Admin, Manager, and Staff.",
          },
          {
            type: "p",
            text: "You can also deactivate accounts (preserving their activity history) or remove them entirely. At least one Admin must remain on every account.",
          },
        ],
      },
      {
        slug: "two-factor-authentication",
        title: "Two-factor authentication",
        content: [
          {
            type: "p",
            text: "Enable 2FA in Settings → Security → Two-Factor Authentication. Nautilus supports authenticator apps (Google Authenticator, Authy) and SMS codes.",
          },
          {
            type: "p",
            text: "On Enterprise plans, admins can require 2FA for all team members. A set of backup codes is provided during setup in case you lose access to your authenticator.",
          },
        ],
      },
      {
        slug: "data-export-and-portability",
        title: "Data export and portability",
        content: [
          {
            type: "p",
            text: "Export all your data at any time from Settings → Import/Export → Export All. This generates CSV files for products, inventory, locations, activity logs, and team members.",
          },
          {
            type: "p",
            text: "Exports are available in CSV and JSON formats. Enterprise plans also support direct database exports and API-based bulk data access.",
          },
        ],
      },
      {
        slug: "cancellation-and-refunds",
        title: "Cancellation and refunds",
        content: [
          {
            type: "p",
            text: "Cancel your subscription in Settings → Billing → Cancel Plan. Your account remains active until the end of the current billing cycle. After that, your account is closed and access to the platform ends.",
          },
          {
            type: "p",
            text: "All your data is preserved for 90 days after cancellation so you can reactivate at any time during that window. Refunds are available for annual plans within the first 30 days of the term — contact billing@nautilusinventory.com to request one.",
          },
        ],
      },
    ],
  },
];
