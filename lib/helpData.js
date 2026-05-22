/* ──────────────────────────────────────────────────────────────────────────
   lib/helpData.js
   ──────────────────────────────────────────────────────────────────────────
   Source of truth for the Help Center.

   Shape:
     HELP_CATEGORIES: [
       {
         title: string,            // display name, shown on the browse page
         slug:  string,            // category id (not currently routed alone)
         articles: [
           {
             slug:  string,        // URL: /help/<slug> — STABLE CONTRACT
             title: string,        // <h1> + breadcrumb + schema headline
             content: [            // block list, rendered top to bottom
               { type: "p",  text }            // paragraph
               { type: "h2", text }            // section heading (TOC anchor)
               { type: "h3", text }            // sub-heading inside a section
               { type: "ul", items: [string] } // bullet list
               { type: "code", text, label? }  // fixed-width block, optional label
             ],
           },
         ],
       },
     ]

   IMPORTANT — article slugs are a contract, not just data:
     • /help/[slug] static params are generated from them (app/help/[slug]/page.js)
     • JSON-LD Article + breadcrumb schema key off them
     • scripts/ingest-kb.js embeds each article by slug for the Ask Nautilus
       chat — renaming a slug orphans its KB chunks until the next ingest
     • the sitemap and any external links point at them
   Rename a slug only with a redirect in place. Adding articles is always safe.

   Renderer: app/help/[slug]/HelpArticleClient.jsx understands p / h2 / h3 / ul
   / code. All of these styles live in ResourceShell.module.css and are revealed
   by useResourceSectionAnimations, so keep content in those block types.
   ────────────────────────────────────────────────────────────────────────── */

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
            text: "When you sign up, Nautilus takes you straight into creating your first warehouse. Give it a name you'll recognize on a busy floor, like 'Main Distribution Center' or 'Dallas DC', and save. You can rename it later from Settings, and add more warehouses on an Enterprise plan.",
          },
          { type: "h2", text: "Setting up the layout" },
          {
            type: "p",
            text: "A warehouse in Nautilus is built from three tiers. Sections are large areas, bays are the shelving units inside them, and levels are the individual shelves on each bay. Build the structure by hand for a small space, or import it from a CSV template if you already have a location list to work from.",
          },
          {
            type: "p",
            text: "You don't have to map the whole building on day one. Most teams start with a few sections that mirror their physical zones, such as Receiving, Storage, and Shipping, then add bays and levels as they label each location. Barcoding as you go keeps the digital layout matched to what's actually on the floor.",
          },
        ],
      },
      {
        slug: "installing-the-mobile-app",
        title: "Installing the mobile app",
        content: [
          {
            type: "p",
            text: "Nautilus runs on the phones and tablets your team already carries. Download Nautilus from the App Store on iOS or Google Play on Android, then sign in with the same email and password you use on the web.",
          },
          { type: "h2", text: "Device requirements" },
          {
            type: "p",
            text: "Scanning needs a rear camera and runs on iOS 15 or later and Android 10 or later. Any mid-range phone from the last few years handles it comfortably, and there's no dedicated scanner hardware to buy or pair.",
          },
          {
            type: "p",
            text: "Signing in carries your role and warehouse access over for you. Staff land on the scan screen, while admins and managers see the full dashboard. If your company requires two-factor authentication, you'll confirm it once on each new device.",
          },
        ],
      },
      {
        slug: "adding-products-and-skus",
        title: "Adding products and SKUs",
        content: [
          {
            type: "p",
            text: "There are three ways to add products: scan a barcode, type the details in by hand, or import a spreadsheet. Most teams scan for day-to-day additions and use a CSV for the initial catalog load.",
          },
          { type: "h2", text: "Scanning to add" },
          {
            type: "p",
            text: "Point the scanner at any barcode Nautilus doesn't recognize yet and it offers to create a product on the spot. Enter a name and SKU, fill in any optional fields your operation uses, and save. The barcode links to that product, so the next scan pulls it straight up.",
          },
          { type: "h2", text: "CSV import" },
          {
            type: "p",
            text: "For a larger catalog, open Settings → Import/Export → Import Products. Download the template, drop your data into it, and upload. Nautilus checks every row and shows a preview of what it will create before anything is saved, so you can fix mistakes first.",
          },
        ],
      },
      {
        slug: "setting-up-barcode-scanning",
        title: "Setting up barcode scanning",
        content: [
          {
            type: "p",
            text: "Scanning uses your device's built-in camera, so there's nothing extra to buy. For the fastest, most reliable reads, keep the lens clean and make sure the area is reasonably well lit. Hold the code steady in frame and Nautilus does the rest, usually in under a fifth of a second.",
          },
          { type: "h2", text: "Supported formats" },
          {
            type: "p",
            text: "Nautilus reads every common retail and logistics barcode, including Code 128, Code 39, EAN-13, UPC-A, QR codes, and Data Matrix. It detects the format on its own, so you never pick a type before scanning. The full list is in the Supported barcode formats article.",
          },
          {
            type: "p",
            text: "Worn, smudged, or partly torn labels are the usual reason a read stalls. Turn on Enhanced Recognition in Settings → Scanning to push those through. It leans on the AI model for tougher codes and uses a little more battery, so most teams enable it only where label quality is a known problem.",
          },
        ],
      },
      {
        slug: "inviting-team-members",
        title: "Inviting team members",
        content: [
          {
            type: "p",
            text: "Open Settings → Team → Invite Member, enter the person's email, and pick a role: Admin, Manager, or Staff. They'll get an email with a link to set up their account.",
          },
          { type: "h2", text: "What each role can do" },
          {
            type: "p",
            text: "Admins can do everything, including billing and team management. Managers configure warehouse settings and read reports but can't touch billing. Staff handle the floor work, scanning and viewing inventory, without access to settings.",
          },
          {
            type: "p",
            text: "Once someone accepts the invite and creates their account, they join your warehouse on their own. You can change anyone's role or remove them later from the same Team screen.",
          },
        ],
      },
      {
        slug: "configuring-sections-bays-levels",
        title: "Configuring sections, bays, and levels",
        content: [
          {
            type: "p",
            text: "Every location in Nautilus sits in a three-tier hierarchy. Sections are the top level, like 'A', 'B', or 'Receiving'. Bays are the shelving units inside a section, and levels are the individual shelves on a bay. Together they give each spot in the building a unique address.",
          },
          { type: "h2", text: "Naming conventions" },
          {
            type: "p",
            text: "A consistent code like A-01-3 (Section A, Bay 01, Level 3) pays off quickly. It prints cleanly onto labels and tells staff exactly where to walk without opening the app. Settle on a format before you label the first bay and stick with it.",
          },
          {
            type: "p",
            text: "When you're ready to label, go to the Locations page, select the spots you want, and tap Print Labels. Nautilus generates a barcode for each one so you can tag the physical shelves to match the system.",
          },
        ],
      },
      {
        slug: "your-first-cycle-count",
        title: "Your first cycle count",
        content: [
          {
            type: "p",
            text: "A cycle count checks that the numbers in Nautilus match what's actually on the shelves. Instead of shutting down for a full physical inventory, you verify a slice of the warehouse at a time. Start one from Cycle Counts → New Count and choose the sections to include.",
          },
          { type: "h2", text: "How counting works" },
          {
            type: "p",
            text: "Walk to a location and scan its barcode. Nautilus shows the quantity it expects, you enter what you actually find, and it either confirms the match or flags the difference. Move to the next location and repeat. You can pause and pick up where you left off whenever the floor gets busy.",
          },
          {
            type: "p",
            text: "When you finish, the Reconciliation screen lists every discrepancy in one place. Accept the physical count to update your records, or flag an item for a second look before adjusting. Either way, the change is logged with your name and the time.",
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
            text: "Nautilus recognizes every major barcode format on its own, with no setup. If your products carry standard retail or shipping labels, they scan straight away. The supported symbologies are:",
          },
          {
            type: "ul",
            items: [
              "Code 128",
              "Code 39",
              "EAN-13 and EAN-8",
              "UPC-A and UPC-E",
              "QR Code",
              "Data Matrix",
              "ITF-14",
              "Codabar",
            ],
          },
          {
            type: "p",
            text: "You never tell Nautilus which type you're scanning. It identifies the symbology from the image and decodes it. When more than one barcode lands in the same frame, it reads them one after another rather than getting confused.",
          },
        ],
      },
      {
        slug: "scan-actions-explained",
        title: "Scan actions explained",
        content: [
          {
            type: "p",
            text: "Nautilus has eight scan actions, one for each thing you do to stock:",
          },
          {
            type: "ul",
            items: [
              "Pick: removes product from a location for an order.",
              "Putaway: places product into a location.",
              "Receive: logs new stock as it arrives.",
              "Relocate: moves product between locations.",
              "Count: verifies a quantity during a cycle count.",
              "Adjust: corrects a quantity by hand, with a reason code.",
              "Ship: marks an order as sent.",
              "Return: processes incoming product back into stock.",
            ],
          },
          {
            type: "p",
            text: "Set the action before you start scanning, or let Nautilus read the context and choose for you. Inside a cycle count session, for example, every scan registers as a count without your switching modes.",
          },
        ],
      },
      {
        slug: "picking-and-packing-orders",
        title: "Picking and packing orders",
        content: [
          {
            type: "p",
            text: "Picking pulls stock for an order, and packing readies it to ship. Both run off the scanner in Nautilus, so quantities stay accurate the moment product leaves the shelf.",
          },
          { type: "h2", text: "Picking an order" },
          {
            type: "p",
            text: "Open the order, set your scan action to Pick, and work the list. Nautilus points you to each item's location, you scan the product and confirm the quantity, and stock comes off that location right away. If a spot is short, flag it and Nautilus suggests the next location holding the same SKU.",
          },
          { type: "h2", text: "Packing and handoff" },
          {
            type: "p",
            text: "Once everything is picked, mark the order packed. If you use a shipping integration like ShipStation, the packed order becomes a shipment and a tracking number flows back into Nautilus and your sales channel. The full pick-to-ship history stays attached to the order for later reference.",
          },
        ],
      },
      {
        slug: "registering-new-products-via-scan",
        title: "Registering new products via scan",
        content: [
          {
            type: "p",
            text: "Scan a barcode that isn't in your catalog yet and Nautilus stops to ask whether you want to create a product from it. Add the name, SKU, and any custom fields you track, then save. The whole thing takes a few seconds at the shelf.",
          },
          {
            type: "p",
            text: "From then on, that barcode belongs to the product. Scanning it again jumps straight to the product record. If a single item ships under more than one barcode, link all of them to the same product so every version scans correctly.",
          },
        ],
      },
      {
        slug: "relocating-inventory",
        title: "Relocating inventory",
        content: [
          {
            type: "p",
            text: "To move stock from one spot to another, set your scan action to Relocate. Scan the product, scan the location you're taking it from, enter the quantity (or choose 'all'), then scan the destination. That's the whole sequence.",
          },
          {
            type: "p",
            text: "Both locations update the moment you finish. The activity log records who moved the product, how much, and between which locations, so there's always a clear trail if a number looks off later.",
          },
        ],
      },
      {
        slug: "adjusting-quantities",
        title: "Adjusting quantities",
        content: [
          {
            type: "p",
            text: "Reach for the Adjust action when a quantity needs to change but nothing physically moved. Writing off damaged goods, clearing expired stock, or fixing a typo from an earlier entry all call for an adjustment rather than a pick or relocate.",
          },
          {
            type: "p",
            text: "Every adjustment needs a reason code (Damaged, Expired, Correction, or Other) and lets you add a note. Both show up in the activity feed and in reports, which keeps shrink and corrections honest and easy to audit at month-end.",
          },
        ],
      },
      {
        slug: "bulk-import-via-csv",
        title: "Bulk import via CSV",
        content: [
          {
            type: "p",
            text: "When you have a lot of records to load at once, a CSV import beats typing. Go to Settings → Import/Export and download the template that fits what you're adding: Products, Inventory, or Locations. Fill it in and upload.",
          },
          { type: "h2", text: "Validation and preview" },
          {
            type: "p",
            text: "Nautilus checks every row before it writes anything. The usual snags are duplicate SKUs, blank required fields, and location codes that don't exist yet. The preview screen shows exactly what will be created or updated and highlights errors in red, so you can correct the file and re-upload before committing.",
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
            text: "Turn on voice in Settings → AI Features → Voice Commands and you can run common actions without touching the screen. The core commands are:",
          },
          {
            type: "ul",
            items: [
              "'Scan this' to capture whatever the camera is pointed at",
              "'Where is [SKU]' to locate a product",
              "'Count section [name]' to start a count",
              "'Move to [location]' to relocate the current item",
              "'How many [product]' to check a quantity on hand",
              "'Pick order [number]' to begin picking",
            ],
          },
          {
            type: "p",
            text: "On a loud floor, a headset microphone makes a real difference in accuracy. Voice is built to keep you hands-free while you hold product, and recognition gets better the more your team uses it.",
          },
        ],
      },
      {
        slug: "setting-up-spatial-mapping",
        title: "Setting up spatial mapping",
        content: [
          {
            type: "p",
            text: "Spatial mapping builds itself from the scans your team is already doing. There's no survey to run or floor plan to draw. Keep using Nautilus normally and the model sharpens on its own, reaching close accuracy after roughly two weeks of regular activity.",
          },
          {
            type: "p",
            text: "See the result in Analytics → Warehouse Map. The map shows where activity concentrates, where aisles get congested, and the walking distance between any two locations. That's the same picture that feeds smarter putaway suggestions and pick routing.",
          },
          {
            type: "p",
            text: "Spatial Intelligence is part of the Enterprise plan. If you're on Pro and want it, upgrading switches it on during onboarding, and the map starts building from your existing scan history right away.",
          },
        ],
      },
      {
        slug: "using-intelligent-search",
        title: "Using intelligent search",
        content: [
          {
            type: "p",
            text: "The search bar at the top of every screen understands plain English. Type what you actually want to know, like 'low stock in section A', 'products received this week', or 'items not counted in 30 days', instead of building a filter.",
          },
          {
            type: "p",
            text: "Results pull from products, locations, orders, and team activity in one place, ordered by how relevant and recent they are. It's usually the fastest way to answer a quick question without leaving the screen you're on.",
          },
        ],
      },
      {
        slug: "predictive-analytics-dashboard",
        title: "Predictive analytics dashboard",
        content: [
          {
            type: "p",
            text: "The Predictions tab under Analytics is where Nautilus looks ahead. It forecasts when each product will run out, suggests what to reorder, surfaces demand patterns, and flags anomalies worth a second look.",
          },
          {
            type: "p",
            text: "Each prediction comes with a confidence score and a short note on what's driving it, so you're not asked to trust a black box. Accept a suggestion to turn it into a purchase order or alert, or dismiss it. Your responses feed back in and tighten future forecasts.",
          },
        ],
      },
      {
        slug: "low-stock-alert-configuration",
        title: "Low stock alert configuration",
        content: [
          {
            type: "p",
            text: "Set up low-stock warnings in Settings → Alerts → Low Stock. Use one global threshold across the catalog, or set per-product minimums for the items you can't afford to run out of. When stock falls below the line, Nautilus pushes a notification and emails whoever you've designated.",
          },
          {
            type: "p",
            text: "For earlier warning, turn on Predictive Alerts. Rather than waiting for stock to hit the minimum, it watches how fast each product is moving and flags a likely stockout two to three days ahead. That's usually enough lead time to reorder at normal cost instead of paying to expedite.",
          },
        ],
      },
      {
        slug: "ai-prioritized-cycle-counting",
        title: "AI-prioritized cycle counting",
        content: [
          {
            type: "p",
            text: "Counting every section on a fixed rotation spends a lot of time on shelves that are already correct. AI-prioritized counting points you at the locations most likely to be wrong instead. It weighs how long since each spot was last counted, how much product has moved through it, the value of what's stored there, and its past accuracy.",
          },
          {
            type: "p",
            text: "Switch it on in Settings → Cycle Counts → AI Priority. The dashboard then shows a ranked list of where to count next, refreshed daily, so a short count session catches the discrepancies that actually matter.",
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
            text: "Open Settings → Integrations → QuickBooks and click Connect. Sign in to QuickBooks Online and give Nautilus permission to read and write inventory data. The handshake takes a minute and only happens once.",
          },
          {
            type: "p",
            text: "After connecting, match your Nautilus products to QuickBooks inventory items. Nautilus auto-matches by SKU wherever it can and leaves the rest for you to confirm. From there, inventory movements post to QuickBooks as journal entries on their own, so your books and your shelves stay in agreement.",
          },
        ],
      },
      {
        slug: "shopify-inventory-sync",
        title: "Shopify inventory sync",
        content: [
          {
            type: "p",
            text: "Connect your store in Settings → Integrations → Shopify by entering your store URL and authorizing the link. Once it's live, Nautilus keeps inventory levels in step with Shopify in both directions, checking about every 30 seconds.",
          },
          {
            type: "p",
            text: "A Shopify sale drops the matching warehouse count almost immediately, and receiving new stock in Nautilus raises availability on your storefront the same way. If you sell from several Shopify locations, each one maps to its Nautilus counterpart.",
          },
        ],
      },
      {
        slug: "shipstation-setup-guide",
        title: "ShipStation setup guide",
        content: [
          {
            type: "p",
            text: "Go to Settings → Integrations → ShipStation and paste in your ShipStation API key, which lives under Account → API Settings in ShipStation. Click Connect to finish the link.",
          },
          {
            type: "p",
            text: "With the connection active, every order you pick in Nautilus turns into a shipment in ShipStation. When ShipStation generates a tracking number, it flows back into Nautilus and out to the sales channel the order came from, so the customer sees it without anyone copying it across by hand.",
          },
        ],
      },
      {
        slug: "api-authentication",
        title: "API authentication",
        content: [
          {
            type: "p",
            text: "The Nautilus API uses bearer-token authentication. Create a key under Settings → API → Generate Key, then send it in the Authorization header on every request. Requests without a valid key are rejected.",
          },
          {
            type: "code",
            label: "Example request",
            text: `curl https://api.nautilusinventory.com/v1/products \\
    -H "Authorization: Bearer YOUR_API_KEY"`,
          },
          {
            type: "p",
            text: "Scope each key to only what it needs: read-only, write, or admin. If a key is ever exposed, revoke it from the same screen and the old value stops working at once. Standard plans allow 100 requests per minute, so if you're regularly bumping that ceiling, talk to us about a higher limit.",
          },
        ],
      },
      {
        slug: "webhook-configuration",
        title: "Webhook configuration",
        content: [
          {
            type: "p",
            text: "Webhooks let Nautilus notify your systems the moment something happens, instead of you polling for changes. Register an endpoint under Settings → API → Webhooks, give it a URL, and subscribe to the events you care about:",
          },
          {
            type: "ul",
            items: [
              "inventory.updated: a product's quantity changed at a location",
              "order.created: a new order entered the system",
              "scan.completed: a scan action finished",
              "count.finished: a cycle count was reconciled",
              "alert.triggered: a low-stock or other alert fired",
            ],
          },
          {
            type: "p",
            text: "Each event arrives as a POST request with a JSON body and a signature header you can use to confirm it came from Nautilus. If your endpoint is unreachable, Nautilus retries up to three times with exponential backoff before giving up, so a brief outage won't cost you an event.",
          },
          {
            type: "code",
            label: "Example payload",
            text: `{
    "event": "inventory.updated",
    "data": {
      "sku": "WIDGET-001",
      "location": "A-01-3",
      "quantity": 142,
      "delta": -8
    },
    "timestamp": "2026-05-22T14:21:00Z"
  }`,
          },
        ],
      },
      {
        slug: "zapier-integration",
        title: "Zapier integration",
        content: [
          {
            type: "p",
            text: "Find Nautilus in the Zapier app directory and connect it with your API key. From there you can build no-code automations off four triggers:",
          },
          {
            type: "ul",
            items: [
              "New Scan",
              "Low Stock Alert",
              "Order Complete",
              "Count Finished",
            ],
          },
          {
            type: "p",
            text: "Teams use these to wire Nautilus into the rest of their stack. Common setups include posting a Slack message when stock runs low, logging every scan to a Google Sheet, and kicking off a reorder in a supplier portal when inventory hits its minimum.",
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
            text: "Nautilus comes in two plans. Pro runs $239 per warehouse per month billed annually, or $299 month to month. It covers one warehouse with unlimited scanner users and up to 50,000 SKUs, and it includes AI scanning, voice commands, and all 18 integrations. Every account starts with a 14-day free trial, and no credit card is needed to begin.",
          },
          {
            type: "p",
            text: "Enterprise is custom-priced for operations running more than one site. It removes the limits to unlimited warehouses and SKUs and adds Spatial Intelligence, multi-warehouse orchestration, full read/write API access, SSO and SAML, a dedicated success manager, 24/7 priority support, and a 99.99% uptime SLA. Talk to sales for a quote and a 30-day proof-of-concept built around your own data.",
          },
        ],
      },
      {
        slug: "upgrading-your-plan",
        title: "Upgrading your plan",
        content: [
          {
            type: "p",
            text: "Change plans under Settings → Billing → Change Plan. Pick the plan you want and confirm. Moving from Pro to Enterprise takes effect right away, and you're charged only the prorated difference for the rest of the current cycle. A downgrade waits until your next billing period starts, so you keep what you've already paid for.",
          },
          {
            type: "p",
            text: "When you move up to Enterprise, the extras switch on as part of onboarding: Spatial Intelligence, multi-warehouse orchestration, full API access, and SSO/SAML. Your data, warehouse setup, and team carry over exactly as they were. Nothing is reset or re-imported.",
          },
        ],
      },
      {
        slug: "updating-payment-method",
        title: "Updating your payment method",
        content: [
          {
            type: "p",
            text: "Update the card on file under Settings → Billing → Payment Method. Enter the new card and save it, and Nautilus uses it for the next charge. The change doesn't trigger an immediate payment, and your billing date stays the same.",
          },
          {
            type: "p",
            text: "If a renewal payment fails, Nautilus retries it over the next few days and emails the account's billing contact each time. Your warehouse keeps running during that window. Switching to a working card clears the past-due balance on the following retry. For receipts or invoices, billing@nautilusinventory.com can send copies for any period.",
          },
        ],
      },
      {
        slug: "managing-team-roles",
        title: "Managing team roles",
        content: [
          {
            type: "p",
            text: "Manage who can do what from Settings → Team. Click any member to switch their role among Admin, Manager, and Staff. The change applies the next time that person opens the app.",
          },
          {
            type: "p",
            text: "You can also deactivate a member, which keeps their past activity intact while blocking new sign-ins, or remove them outright. One rule holds on every account: at least one Admin has to remain, so you can't lock yourself out.",
          },
        ],
      },
      {
        slug: "two-factor-authentication",
        title: "Two-factor authentication",
        content: [
          {
            type: "p",
            text: "Add a second layer to sign-in under Settings → Security → Two-Factor Authentication. Nautilus works with authenticator apps like Google Authenticator and Authy, and it can send codes by SMS if you'd rather.",
          },
          {
            type: "p",
            text: "On Enterprise plans, admins can make 2FA mandatory for the whole team. Whichever method you choose, save the backup codes you're given during setup somewhere safe. They're how you get back in if you ever lose your phone or authenticator.",
          },
        ],
      },
      {
        slug: "data-export-and-portability",
        title: "Data export and portability",
        content: [
          {
            type: "p",
            text: "Your data is yours to take whenever you want it. From Settings → Import/Export → Export All, Nautilus generates files covering products, inventory, locations, activity logs, and team members.",
          },
          {
            type: "p",
            text: "Exports come in CSV and JSON. Enterprise plans add direct database exports and bulk access through the API, for teams that want to pipe Nautilus data into a warehouse or BI tool on a schedule.",
          },
        ],
      },
      {
        slug: "cancellation-and-refunds",
        title: "Cancellation and refunds",
        content: [
          {
            type: "p",
            text: "Cancel under Settings → Billing → Cancel Plan. Your account stays fully active through the end of the cycle you've already paid for. After that date it closes and platform access ends.",
          },
          {
            type: "p",
            text: "We hold your data for 90 days after cancellation, so reactivating within that window picks up right where you left off. Annual plans qualify for a refund within the first 30 days of the term. Email billing@nautilusinventory.com and we'll take care of it.",
          },
        ],
      },
    ],
  },
  {
    title: "Troubleshooting",
    slug: "troubleshooting",
    articles: [
      {
        slug: "scanner-not-recognizing-barcodes",
        title: "Scanner not recognizing barcodes",
        content: [
          {
            type: "p",
            text: "When the camera won't lock onto a barcode, the cause is almost always physical. Clean the lens, add light if the area is dim, and hold the code flat and fully inside the frame. Glare from overhead lighting or shrink-wrap is a frequent culprit, so tilt the product slightly to kill the reflection.",
          },
          { type: "h2", text: "When the label is the problem" },
          {
            type: "p",
            text: "Worn, faded, or torn labels read slowly or not at all. Turn on Enhanced Recognition in Settings → Scanning to push tough codes through with the AI model. If a label is damaged past reading, look the product up by SKU and reprint a fresh location or product label from the app.",
          },
          {
            type: "p",
            text: "Still nothing? Confirm the symbology is one Nautilus supports and that the app has camera permission in your device settings. Force-quitting and reopening the app clears the occasional stuck camera session.",
          },
        ],
      },
      {
        slug: "integration-not-syncing",
        title: "An integration stopped syncing",
        content: [
          {
            type: "p",
            text: "When an integration stops moving data, start at Settings → Integrations and check its status. A connection showing 'Action needed' or 'Disconnected' usually means the other service expired or revoked its access token, which tends to happen after a password change or a permissions update on their side.",
          },
          { type: "h2", text: "Reconnecting" },
          {
            type: "p",
            text: "Open the integration and choose Reconnect, then sign in to the other service again. This refreshes the token without disturbing your field mappings or sync history. Shopify, QuickBooks, and ShipStation all reconnect the same way.",
          },
          {
            type: "p",
            text: "If the connection looks healthy but specific records aren't syncing, look for a mismatch. Products without a matching SKU on both sides won't link, and that's the most common reason a count reads right in one system and stale in the other. Fix the SKU and the next sync catches up.",
          },
        ],
      },
      {
        slug: "login-and-2fa-problems",
        title: "Login and two-factor problems",
        content: [
          {
            type: "p",
            text: "Can't get past the sign-in screen? First confirm you're using the email your account was invited under, since invitations are tied to a specific address. Use the 'Forgot password' link to reset if you need to. The email lands within a couple of minutes, so check spam before trying again.",
          },
          { type: "h2", text: "Locked out by two-factor" },
          {
            type: "p",
            text: "If you've lost the phone with your authenticator, sign in with one of the backup codes you saved when you turned on 2FA. Each code works once. If you're out of those too, any Admin on your account can reset 2FA for you from Settings → Team. On an account with no reachable admin, contact support to verify ownership and get back in.",
          },
        ],
      },
      {
        slug: "counts-and-quantities-look-wrong",
        title: "Counts and quantities look wrong",
        content: [
          {
            type: "p",
            text: "A number that doesn't match the shelf almost always traces back to a missed or doubled scan rather than a system error. Open the product's activity log and walk the recent entries. You'll usually spot the relocate that wasn't finished or the receive that got entered twice.",
          },
          { type: "h2", text: "Setting it right" },
          {
            type: "p",
            text: "Once you've found the cause, use the Adjust action with the matching reason code to bring the digital count back in line, or run a quick cycle count of just that location. The Reconciliation screen then confirms the fix. If discrepancies keep clustering in one area, AI-prioritized cycle counting will start surfacing those locations first.",
          },
        ],
      },
      {
        slug: "alerts-and-notifications-not-arriving",
        title: "Alerts and notifications aren't arriving",
        content: [
          {
            type: "p",
            text: "If alerts aren't reaching you, check three things in order: that the alert is actually set up under Settings → Alerts, that you're listed as a recipient, and that the threshold sits where you expect. An alert with no recipients fires silently.",
          },
          { type: "h2", text: "Push and email delivery" },
          {
            type: "p",
            text: "For missing push notifications, make sure notifications are enabled for Nautilus in your device settings, since a denied permission blocks them outright. Missing emails are usually filtered, so add no-reply@nautilusinventory.com to your contacts and check spam. Predictive Alerts stay quiet on brand-new SKUs until there's enough movement history to forecast against.",
          },
        ],
      },
      {
        slug: "app-running-slowly",
        title: "The app is running slowly",
        content: [
          {
            type: "p",
            text: "Sluggish performance on the floor is more often a network issue than the device. Nautilus runs over Wi-Fi and cellular, but a building with thick walls and dead zones can starve the connection. Watch the connection indicator: when it drops, scans queue locally and sync once you're back in range, so your data is safe even when the screen lags.",
          },
          { type: "h2", text: "Freeing things up" },
          {
            type: "p",
            text: "On older phones, close background apps and restart the device to reclaim memory before a long counting session. Keep the app updated, since each release ships performance fixes. If a single warehouse with a very large catalog feels heavy, reach out and we can look at the account and suggest device or layout changes that help.",
          },
        ],
      },
    ],
  },
];
