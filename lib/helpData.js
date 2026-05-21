/* ═══════════════════════════════════════════════════════════════════════
   HELP DATA
   ───────────────────────────────────────────────────────────────────────
   The complete help-center content tree. Each category groups several
   articles; each article is rendered at /help/[slug] by the
   HelpArticleClient component using the ResourceShell.

   Schema per category:
     title:    string         — displayed in the help index and breadcrumbs
     slug:     string         — kept for URL consistency (the help index
                                doesn't currently route to category pages,
                                but the slug is reserved for that)
     articles: Article[]

   Schema per article:
     slug:    string           — URL slug, also used as the article ID in
                                 feedback / analytics
     title:   string           — page title and breadcrumb label
     content: ContentBlock[]   — render order, top to bottom
                                 each block is { type: "p" | "h2" | "h3",
                                 text: string }

   The TOC on the article page is built automatically from h2 blocks
   (HelpArticleClient slugifies each h2 as the section anchor). The meta
   description used in <head> falls back to the first paragraph in the
   article — so the first `p` block of every article should be a clean,
   self-contained summary of what the article covers.
   ═══════════════════════════════════════════════════════════════════════ */

export const HELP_CATEGORIES = [
  /* ─────────────────────────────────────────────────────────────────
       GETTING STARTED
       ───────────────────────────────────────────────────────────────── */
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
            text: "When you sign up for Nautilus, the first thing you'll do is create a warehouse. A warehouse is a physical facility with its own inventory, location codes, and team. Tap 'Create Warehouse' on the welcome screen, enter a name (typically something like 'Main Distribution Center' or '500 Industrial Blvd'), and confirm. The warehouse is live in seconds; what you do next determines how usable it becomes.",
          },
          { type: "h2", text: "Setting up the layout" },
          {
            type: "p",
            text: "Warehouse layout in Nautilus uses three tiers: Sections at the top (large physical areas like 'Receiving', 'Bulk Storage', 'Shipping'), Bays nested inside sections (individual shelving units, racks, or zones), and Levels nested inside bays (specific shelves or pick-faces).",
          },
          {
            type: "p",
            text: "You can add locations manually through the Locations page, or import them in bulk using the CSV template under Settings → Import/Export. For most warehouses, start by mapping the sections that match your physical zones — typically 5 to 10 — and add bays as you actually barcode each location. Trying to model the entire warehouse perfectly up front is a common mistake; the model works better when it grows alongside your barcoding effort.",
          },
          { type: "h2", text: "Naming conventions" },
          {
            type: "p",
            text: "A consistent naming format makes locations easier to scan, easier to print on labels, and easier for staff to find physically. We recommend a hyphenated three-part code: A-01-3 for Section A, Bay 01, Level 3. Keep section names short (one to three characters) and use leading zeros on bay numbers so they sort correctly in lists.",
          },
          { type: "h2", text: "What to do next" },
          {
            type: "p",
            text: "Once your warehouse exists, the next steps in order are: print location barcodes (you can do this from the Locations page once you have at least one section set up), add a few products to test scanning, and invite your team. Each of those has its own help article — see 'Configuring sections, bays, and levels' for the detail on locations and 'Inviting team members' for team setup.",
          },
        ],
      },
      {
        slug: "adding-products-and-skus",
        title: "Adding products and SKUs",
        content: [
          {
            type: "p",
            text: "Products in Nautilus are records that connect SKUs to barcodes, names, and any custom fields you track (lot numbers, supplier codes, expiration dates). There are three ways to add products, each suited to a different stage of your operation: scanning to add, manual entry, and CSV import.",
          },
          { type: "h2", text: "Scanning to add" },
          {
            type: "p",
            text: "The fastest way to populate your product catalog is to scan it. When you scan a barcode that doesn't match an existing product in your warehouse, Nautilus prompts you to create one. Enter the product name, SKU, and any custom fields, and the barcode permanently links to that product. Subsequent scans of the same barcode immediately pull up the record.",
          },
          {
            type: "p",
            text: "You can link multiple barcodes to a single product, which is useful when a manufacturer changes their barcode format mid-run, or when you receive the same product from two suppliers with different barcodes. Link additional barcodes from the product detail page under 'Barcodes'.",
          },
          { type: "h2", text: "Manual entry" },
          {
            type: "p",
            text: "For products you don't have on hand yet, or for SKUs you assign internally, use Products → Add Product → Manual Entry. Enter the SKU, name, and any custom fields. You can attach a barcode later by scanning while on the product detail page.",
          },
          { type: "h2", text: "CSV import" },
          {
            type: "p",
            text: "For bulk catalog setup or quarterly catalog refreshes, use Settings → Import/Export → Import Products. Download the CSV template, fill in your product data (SKU and Name are the minimum required columns; everything else is optional), and upload. Nautilus validates every row before importing, with a preview screen that shows exactly what will be created or updated and highlights any errors in red.",
          },
          { type: "h2", text: "Choosing between methods" },
          {
            type: "p",
            text: "Scan-to-add works best for the first few weeks while you're walking the floor and discovering what's actually in stock. CSV import works best for setup of large existing catalogs or for periodic bulk updates from your buying team. Manual entry fills the gap when you need to create a record for a product you haven't received yet.",
          },
        ],
      },
      {
        slug: "setting-up-barcode-scanning",
        title: "Setting up barcode scanning",
        content: [
          {
            type: "p",
            text: "Nautilus scanning works with your device's built-in camera on iOS and Android — no special hardware required for most operations. For high-volume warehouses, dedicated Bluetooth scanners from Zebra, Honeywell, and Socket Mobile are supported and pair as standard keyboard wedge devices.",
          },
          { type: "h2", text: "Camera setup" },
          {
            type: "p",
            text: "Two things make scanning work well: a clean camera lens and enough light. Clean the lens with a microfiber cloth at the start of each shift — dust and fingerprints are the most common cause of slow recognition. Most warehouse lighting is adequate; you'll know it isn't when scans take more than a second consistently in a specific zone.",
          },
          {
            type: "p",
            text: "On the first scan attempt of a new session, Nautilus may take a moment to initialize the camera. Subsequent scans are near-instant. If scans feel slow throughout an entire session, close and reopen the app to reset the camera pipeline.",
          },
          { type: "h2", text: "Supported formats" },
          {
            type: "p",
            text: "Nautilus recognizes all major 1D and 2D barcode formats automatically: Code 128, Code 39, EAN-13, EAN-8, UPC-A, UPC-E, QR codes, Data Matrix, ITF-14, and Codabar. The scanner detects which format is in the frame and decodes it. You never need to configure which format you're scanning.",
          },
          { type: "h2", text: "Enhanced Recognition for damaged barcodes" },
          {
            type: "p",
            text: "For damaged, partial, or low-contrast barcodes, enable Enhanced Recognition under Settings → Scanning. This routes the image through the AI vision model, which reads barcodes that have been scuffed, partially covered, faded by sun exposure, or printed on textured surfaces. The tradeoff is slightly higher battery usage and roughly 50ms more latency per scan; most operations keep it on by default.",
          },
          { type: "h2", text: "Bluetooth and ring scanners" },
          {
            type: "p",
            text: "Bluetooth scanners pair through the device's standard Bluetooth settings. Once paired, they work as keyboard input — Nautilus accepts the scanned barcode anywhere a barcode is expected without per-app configuration. Ring scanners (worn on the finger) work the same way; they're useful for warehouses where staff need both hands free for picking.",
          },
        ],
      },
      {
        slug: "inviting-team-members",
        title: "Inviting team members",
        content: [
          {
            type: "p",
            text: "Adding team members in Nautilus is a self-serve process. You don't need to provision accounts in advance — invites generate a sign-up link, and the team member creates their own account when they accept.",
          },
          { type: "h2", text: "Sending an invite" },
          {
            type: "p",
            text: "Go to Settings → Team → Invite Member. Enter the team member's email address and select a role: Admin, Manager, or Staff. You can invite multiple team members at once by entering several email addresses separated by commas. The invitation email arrives within a minute or two.",
          },
          {
            type: "p",
            text: "Invited members who already have a Nautilus account (from a different warehouse you don't manage) are added to your warehouse automatically when they accept; they don't need to create a new account.",
          },
          { type: "h2", text: "Role permissions" },
          {
            type: "p",
            text: "Admin has full access to everything: warehouse settings, billing, team management, integrations, and all scan actions. Keep at least two admins on every account so access doesn't depend on one person.",
          },
          {
            type: "p",
            text: "Manager can configure warehouse settings, view all reports, manage products and locations, and perform every scan action. Managers cannot change billing or invite other admins. This is the right role for shift leads and floor supervisors.",
          },
          {
            type: "p",
            text: "Staff can perform every scan action (pick, receive, putaway, count, adjust, etc.) and view inventory. Staff cannot change settings, view billing, or invite team members. This is the default role for warehouse operators.",
          },
          { type: "h2", text: "Removing or deactivating members" },
          {
            type: "p",
            text: "When someone leaves the team, you have two options. Deactivating preserves their activity history but blocks future access — useful for audit trails on past scans. Removing strips the account entirely, with their past activity attributed to 'Removed user'. For most cases (employee turnover, role changes), deactivate rather than remove.",
          },
          { type: "h2", text: "Bulk invites and SSO" },
          {
            type: "p",
            text: "For larger teams, CSV bulk invites are available under Settings → Team → Bulk Invite. Enterprise plans with SSO/SAML configured invite team members directly through your identity provider — when a new employee is added to your SSO group, they appear in Nautilus automatically on their first login.",
          },
        ],
      },
      {
        slug: "configuring-sections-bays-levels",
        title: "Configuring sections, bays, and levels",
        content: [
          {
            type: "p",
            text: "Your warehouse structure has three tiers: Sections are the top level (e.g., 'A', 'B', 'Receiving'), Bays are shelving units within a section, and Levels are individual shelves within a bay. Each tier nests inside the one above, and every scan action targets a specific level so movements track at the most granular position.",
          },
          { type: "h2", text: "Adding locations" },
          {
            type: "p",
            text: "Open Locations from the main nav. To add a section, tap 'Add Section' and enter a name. Once you have a section, tap into it to add bays; tap into a bay to add levels. Each level is the leaf node — the actual physical position where inventory lives.",
          },
          {
            type: "p",
            text: "For larger warehouses, building this tree by hand is slow. Use the CSV template under Settings → Import/Export → Import Locations to define the full structure in a spreadsheet and upload at once.",
          },
          { type: "h2", text: "Naming conventions" },
          {
            type: "p",
            text: "We recommend a consistent format like A-01-3 (Section A, Bay 01, Level 3). This maps cleanly to barcode labels and is easy for staff to locate physically. Some teams prefer a more descriptive format like 'Bulk-N-A1' (Bulk Storage North, Aisle A, Bay 1) — either works, but pick one and stick with it.",
          },
          {
            type: "p",
            text: "Keep section names short (one to three characters) and use leading zeros on bay numbers so they sort correctly. A-01 sorts before A-10; A-1 sorts after A-10 in many list views, which causes confusion when picking sequentially.",
          },
          { type: "h2", text: "Printing location labels" },
          {
            type: "p",
            text: "Once locations exist, print barcode labels directly from the Locations page. Select the locations you need and tap 'Print Labels'. Labels print to any connected Zebra, Brother, or Dymo printer through standard drivers. The label encodes the full location path (section-bay-level) so a single scan resolves the exact physical position.",
          },
          { type: "h2", text: "Restructuring later" },
          {
            type: "p",
            text: "You can rename sections, bays, and levels at any time without losing inventory data; the rename updates references throughout. Moving inventory between locations always uses the Relocate scan action — never rename a location to 'move' inventory in the model, since that decouples the digital record from the physical reality.",
          },
        ],
      },
      {
        slug: "your-first-cycle-count",
        title: "Your first cycle count",
        content: [
          {
            type: "p",
            text: "A cycle count verifies that your digital inventory matches what's physically on the shelves. Unlike an annual full count, a cycle count works through one section at a time without halting operations. Go to Cycle Counts → New Count and select which sections to include.",
          },
          { type: "h2", text: "Before you start" },
          {
            type: "p",
            text: "Pause any active picks in the sections you're about to count. The cycle count freezes those locations in the system while staff walk and scan; picks running concurrently in the same section will conflict with the freeze and surface as discrepancies that aren't actually discrepancies.",
          },
          {
            type: "p",
            text: "If your warehouse runs 24/7 and you can't pause operations, schedule cycle counts during the lowest-volume window or count only a single bay at a time.",
          },
          { type: "h2", text: "Counting process" },
          {
            type: "p",
            text: "Walk to each location in the count and scan the location barcode. Nautilus shows the expected quantity — enter the actual count from the shelf. If they match, the location confirms green. If they differ, the location flags amber for review.",
          },
          {
            type: "p",
            text: "Staff can count in any order, and multiple staff can work different sections of the same count simultaneously. The count completes when every selected location has been confirmed or flagged.",
          },
          { type: "h2", text: "Reconciliation" },
          {
            type: "p",
            text: "After counting, review discrepancies on the Reconciliation screen. For each flagged location, you can accept the physical count (which adjusts the digital record to match what was found) or flag it for further investigation. Common reasons for genuine discrepancies: damaged product written off without a corresponding adjustment, mispicks that returned to the wrong location, or shrinkage.",
          },
          {
            type: "p",
            text: "Every reconciliation logs the operator, the timestamp, the original system count, the physical count, and any note attached. The activity log carries this forward as part of the audit trail.",
          },
          { type: "h2", text: "What comes next" },
          {
            type: "p",
            text: "Most warehouses run cycle counts on a rolling basis rather than as one-off events. Once you're comfortable with the basic flow, see 'AI-prioritized cycle counting' for the smart-priority view that picks which locations to count next based on discrepancy risk rather than calendar schedule.",
          },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────
       SCANNING & INVENTORY
       ───────────────────────────────────────────────────────────────── */
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
            text: "Nautilus recognizes all major barcode formats automatically. The scanner detects the format in the image and decodes it — you never need to specify which type you're scanning, and you don't need to configure which formats are enabled per warehouse.",
          },
          { type: "h2", text: "1D (linear) formats" },
          {
            type: "p",
            text: "Code 128 is the most common general-purpose linear barcode and works for any alphanumeric data. Code 39 is older but still widespread in automotive and defense. EAN-13 and EAN-8 are the international retail standards (the 13-digit code on most consumer products). UPC-A and UPC-E are the North American retail standards. ITF-14 is used for shipping cartons and pallet labels. Codabar is used in libraries and blood banks.",
          },
          { type: "h2", text: "2D (matrix) formats" },
          {
            type: "p",
            text: "QR Code is the most common 2D format and can hold longer strings than 1D barcodes (URLs, structured data, serialized identifiers). Data Matrix is more space-efficient than QR for short identifiers and is heavily used in pharmaceuticals (DSCSA serialization), aerospace parts, and electronics. Both work the same way from the scanner's perspective.",
          },
          { type: "h2", text: "Multi-barcode scans" },
          {
            type: "p",
            text: "If multiple barcodes are in a single frame (for example, a product label with both a UPC and a Data Matrix), Nautilus reads them sequentially and presents the matches. You can choose which one to act on, or configure your warehouse to always prefer one format over another under Settings → Scanning → Format Priority.",
          },
          { type: "h2", text: "What's not supported" },
          {
            type: "p",
            text: "OCR (reading printed text that isn't a barcode) is not supported. PDF417 (used on driver's licenses and some shipping labels) is not supported in standard scanning but can be enabled through a custom-scan setting on Enterprise plans. Aztec and Maxicode (UPS proprietary) read but don't decode to a standardized inventory identifier.",
          },
        ],
      },
      {
        slug: "scan-actions-explained",
        title: "Scan actions explained",
        content: [
          {
            type: "p",
            text: "Every scan in Nautilus performs a specific action on inventory. The action determines what happens when the barcode is read: whether stock moves in, moves out, adjusts, or just gets looked up. There are eight scan actions, and selecting the right one matters because each one writes a different kind of record to the audit log.",
          },
          { type: "h2", text: "The eight actions" },
          {
            type: "p",
            text: "Pick removes inventory from a location for an order. Putaway places inbound inventory into a specific location. Receive registers new stock arriving from a supplier (typically followed by Putaway). Relocate moves inventory between two locations within the warehouse. Count verifies physical quantity during a cycle count. Adjust manually changes a quantity without a corresponding movement (used for damage write-offs and corrections). Ship marks inventory as having left the warehouse. Return processes incoming returns from customers.",
          },
          { type: "h2", text: "Selecting an action" },
          {
            type: "p",
            text: "Select the action before scanning by tapping the action chip at the top of the scanner screen. Once selected, the action sticks for the entire scanning session until you change it. This prevents the common error of accidentally picking when you meant to receive.",
          },
          {
            type: "p",
            text: "If you're in a cycle-count session, scans automatically register as Count actions and the chip is locked. If you're picking against an open pick task, the action defaults to Pick. Outside these contexts, the action defaults to the last one you used.",
          },
          { type: "h2", text: "Audit trail by action" },
          {
            type: "p",
            text: "Every action writes a record with the operator, timestamp, product, location, quantity, and any context (order ID for picks, PO number for receives, reason code for adjusts). The activity log and reports can filter by action type, so 'show me every adjustment in the last 7 days' or 'show me every pick by operator X this week' resolves immediately.",
          },
          { type: "h2", text: "When to use Adjust vs. Relocate" },
          {
            type: "p",
            text: "Adjust changes the quantity at a location without moving stock anywhere. Relocate moves stock between locations without changing the total quantity. If product is damaged and discarded, that's an Adjust (with reason 'Damaged'). If product is moved from receiving to bulk storage, that's a Relocate. Don't use Adjust to model a move; the audit trail loses the source-and-destination information that Relocate captures.",
          },
        ],
      },
      {
        slug: "registering-new-products-via-scan",
        title: "Registering new products via scan",
        content: [
          {
            type: "p",
            text: "Scanning is the fastest way to add products to your catalog. When you scan a barcode that doesn't match any existing product in your warehouse, Nautilus prompts you to create one. This is the recommended path for the first few weeks of any new warehouse: walk the floor, scan everything, and build the catalog as you discover what's actually in stock.",
          },
          { type: "h2", text: "The creation prompt" },
          {
            type: "p",
            text: "When an unknown barcode is scanned, the prompt asks for the product name and SKU at minimum. Custom fields you've configured (lot number, expiration date, supplier code, etc.) appear below as optional inputs. Hit Create and the product is live; the barcode is permanently linked.",
          },
          {
            type: "p",
            text: "If you're not sure of the product details on the spot, tap 'Save & Edit Later'. This creates the record with the barcode linked and a placeholder name, queued in the 'Unfinished Products' list for a manager to fill in later.",
          },
          { type: "h2", text: "Linking multiple barcodes" },
          {
            type: "p",
            text: "A single product can have multiple barcodes linked to it. This handles two common situations: a manufacturer changes their barcode format mid-run (so old and new stock both exist in your warehouse), or you receive the same product from two suppliers with different barcodes.",
          },
          {
            type: "p",
            text: "Link additional barcodes from the product detail page under 'Barcodes' → 'Add Barcode'. You can also link by scanning: open the product, tap 'Scan to Link', and scan the additional barcode. Future scans of either barcode resolve to the same product record.",
          },
          { type: "h2", text: "Preventing accidental duplicates" },
          {
            type: "p",
            text: "If two operators scan the same unknown barcode within a short window, Nautilus deduplicates the creation prompt — only one new product record is created, and the second operator sees the freshly created record instead of being prompted to create a new one. This prevents the 'two operators receive the same shipment and both create the same product twice' problem.",
          },
          { type: "h2", text: "When to NOT use scan-to-create" },
          {
            type: "p",
            text: "For large catalog imports (more than a few hundred products), CSV import is faster and lets you set every field cleanly. For products that have multiple variants (sizes, colors), set up the parent product manually first, then scan to link each variant's barcode to the appropriate variant.",
          },
        ],
      },
      {
        slug: "relocating-inventory",
        title: "Relocating inventory",
        content: [
          {
            type: "p",
            text: "Relocate moves inventory between two locations inside the warehouse. The total quantity in the system doesn't change — only its location. Use Relocate any time stock physically moves: receiving to bulk storage, bulk to pick face, pick face to shipping staging, or back-of-truck to receiving dock.",
          },
          { type: "h2", text: "Standard relocate flow" },
          {
            type: "p",
            text: "Select Relocate as your scan action. Scan the product barcode. Scan the source location (where the product is now). Enter the quantity to move — or type 'all' to move the entire quantity at that location. Scan the destination location. Nautilus updates both locations instantly and writes a record to the activity log with operator, timestamp, source, destination, and quantity.",
          },
          { type: "h2", text: "Multi-item relocations" },
          {
            type: "p",
            text: "If you're moving several different products from the same source to the same destination (typical for a putaway run from a receiving cart), tap 'Multi-item Relocate' from the action menu. Scan the source location once, then scan each product in the cart with its quantity. Scan the destination location once at the end. The whole batch records as a single relocate transaction in the activity log.",
          },
          { type: "h2", text: "Cross-warehouse moves" },
          {
            type: "p",
            text: "Relocate is for moves within a single warehouse. For moves between warehouses (or between Nautilus and an external location like FBA or a 3PL), use Transfer instead — Transfer creates an in-transit record so inventory shows correctly during the time it's traveling. See the Transfers article in this section for the detail.",
          },
          { type: "h2", text: "When something goes wrong mid-move" },
          {
            type: "p",
            text: "If you start a relocate and realize the source has less product than expected (or none at all), tap 'Cancel Relocate' rather than entering 0 — entering 0 generates an adjustment record. Cancel cleanly aborts the action without writing anything. Then use Count or Adjust on the source location to fix the underlying discrepancy.",
          },
        ],
      },
      {
        slug: "adjusting-quantities",
        title: "Adjusting quantities",
        content: [
          {
            type: "p",
            text: "Use the Adjust action when you need to change a quantity at a location without a corresponding movement — for example, writing off damaged goods, correcting a data-entry error, or reflecting shrinkage discovered during a cycle count. Adjust is the only scan action that changes total system inventory without a paired source-and-destination.",
          },
          { type: "h2", text: "When to use Adjust" },
          {
            type: "p",
            text: "Adjust is for inventory truth-up, not for inventory movement. Some legitimate uses: damaged goods discarded after a forklift accident, expired items written off after a date check, found inventory that wasn't in the system, theft or shrinkage discovered during a count.",
          },
          {
            type: "p",
            text: "Some illegitimate uses (use a different action instead): moving stock from one location to another (use Relocate), receiving a new shipment (use Receive), picking for an order (use Pick), correcting a wrong-product mispick (use Relocate to put it back where it belongs, then Pick the correct item).",
          },
          { type: "h2", text: "Required fields" },
          {
            type: "p",
            text: "Every adjustment requires a reason code. The standard codes are Damaged, Expired, Found, Lost, Theft, and Correction. You can add custom codes under Settings → Adjustments. An optional note field lets the operator add context — recommended for any non-trivial write-off.",
          },
          {
            type: "p",
            text: "Adjustments above a configured dollar value (typically $500 or higher) require manager approval before they post. The threshold is set per warehouse under Settings → Adjustments → Approval Threshold. The pending adjustment queues for review and the operator is notified when it's approved or declined.",
          },
          { type: "h2", text: "Audit trail" },
          {
            type: "p",
            text: "All adjustments log the operator, timestamp, location, product, quantity change, reason code, note, and (if applicable) the approving manager. Adjustments are visible in the activity feed, the per-product history, and the dedicated Adjustments report. For accounting integrations (QuickBooks, Xero, NetSuite), adjustments post as the corresponding journal entries automatically.",
          },
        ],
      },
      {
        slug: "bulk-import-via-csv",
        title: "Bulk import via CSV",
        content: [
          {
            type: "p",
            text: "CSV import is the fastest way to load an existing catalog, a list of locations, or a full opening inventory count. Navigate to Settings → Import/Export and pick the import type: Products, Inventory, or Locations. Download the appropriate template, fill it in, and upload.",
          },
          { type: "h2", text: "Templates" },
          {
            type: "p",
            text: "Each import type has its own template with required and optional columns clearly marked. The Products template requires SKU and Name; Inventory requires SKU, Location, and Quantity; Locations requires Section, Bay, and Level. Optional columns include barcode, custom fields, supplier, cost, and any per-row metadata your operation tracks.",
          },
          {
            type: "p",
            text: "Templates are stable across versions. If you have an export from a previous Nautilus snapshot or another system, the column headers tell you exactly what mapping is expected.",
          },
          { type: "h2", text: "Validation" },
          {
            type: "p",
            text: "Nautilus validates every row before importing. The preview screen shows exactly what will be created versus updated, with errors highlighted in red. Common issues: duplicate SKUs in the same file, missing required fields, invalid location codes that don't match your warehouse structure, and number formats that don't parse (commas in numeric quantity fields are a classic).",
          },
          {
            type: "p",
            text: "You can choose to import valid rows and skip errors, or cancel and fix the file. For first imports, fixing the file is usually the better choice — a clean import is easier to audit later than a partial import with error logs.",
          },
          { type: "h2", text: "Update vs. create" },
          {
            type: "p",
            text: "Products import by SKU as the unique key. If the SKU exists, the row updates the existing record (overwriting whatever fields the row specifies). If the SKU doesn't exist, the row creates a new record. To bulk-edit existing products, export the current catalog, edit in your spreadsheet, and re-import.",
          },
          { type: "h2", text: "Large imports" },
          {
            type: "p",
            text: "Files up to 50,000 rows process in a single upload. For larger catalogs, split into multiple files and import sequentially. Pro plans process at roughly 1,000 rows per second; Enterprise has higher throughput for very large catalog migrations.",
          },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────
       AI FEATURES
       ───────────────────────────────────────────────────────────────── */
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
            text: "Voice commands let you operate Nautilus hands-free using natural speech. They're especially useful during picking, where holding a phone or tablet competes with carrying product. Enable voice commands in Settings → AI Features → Voice Commands and grant microphone access.",
          },
          { type: "h2", text: "Common commands" },
          {
            type: "p",
            text: "'Scan this' takes a snapshot from the camera and decodes any barcode in frame. 'Where is [SKU]' returns the location of any product. 'Count section [name]' starts a cycle count of the named section. 'Move to [location]' executes a relocate action. 'How many [product]' reads aloud the current quantity. 'Pick order [number]' opens an order and walks through it pick by pick.",
          },
          {
            type: "p",
            text: "The full command list is available under Settings → AI Features → Voice Commands → Reference. Commands accept natural variations — 'where is SKU 4521' and 'find SKU 4521' both work — so operators don't need to memorize exact phrasing.",
          },
          { type: "h2", text: "Hardware recommendations" },
          {
            type: "p",
            text: "Voice commands work best with a Bluetooth headset microphone, particularly in noisy environments. Built-in phone microphones work but suffer accuracy loss when ambient noise exceeds about 70 dB (typical for a forklift-active warehouse).",
          },
          {
            type: "p",
            text: "Recommended headsets: Plantronics Voyager 5200, Jabra Talk 45, or any over-ear protection headset with an integrated boom mic. We've tested all three at multiple customer warehouses with consistent recognition above 95%.",
          },
          { type: "h2", text: "Personalization" },
          {
            type: "p",
            text: "The voice model adapts to each operator's voice over time. After about 100 successful commands, recognition accuracy meaningfully improves for that specific speaker. The adaptation is per-user, stored against the operator's account, and follows them across devices.",
          },
          { type: "h2", text: "Privacy" },
          {
            type: "p",
            text: "Voice processing happens on-device when possible (recent iOS and Android), and falls back to encrypted cloud processing for older devices or complex commands. Audio is never stored — only the recognized text. Operators can disable voice commands at any time without affecting other AI features.",
          },
        ],
      },
      {
        slug: "setting-up-spatial-mapping",
        title: "Setting up spatial mapping",
        content: [
          {
            type: "p",
            text: "Spatial mapping is the real-time 3D model of your warehouse that drives putaway suggestions, congestion alerts, and walking-distance estimates. It's an Enterprise feature, and the best part is that it requires almost no setup — the map builds itself from your team's normal scan activity over the first few weeks of operation.",
          },
          { type: "h2", text: "How it builds" },
          {
            type: "p",
            text: "Each scan in Nautilus carries metadata that the spatial model uses: the operator's device GPS or BLE position, the time of the scan, the location barcode, and the operator's ID. The model uses this to infer the physical relationship between locations — which bays are adjacent, which sections are far apart, which paths staff actually walk.",
          },
          {
            type: "p",
            text: "After about two weeks of normal operations, the model is accurate to within roughly half a meter on most location pairs. Continued use refines accuracy further; the model never stops learning.",
          },
          { type: "h2", text: "Viewing the map" },
          {
            type: "p",
            text: "Open Analytics → Warehouse Map to view the 3D model. The view rotates, zooms, and pans. Color-coding shows activity heatmaps (how often each location is scanned), congestion zones (where pick paths overlap), and walking distance estimates between any two locations you select.",
          },
          {
            type: "p",
            text: "The map is read-only — you can't drag locations to new positions in the view, since the model learns position from scan data rather than from manual editing. If the model has a location placed incorrectly, scanning at the actual physical location a few more times corrects it.",
          },
          { type: "h2", text: "What it drives" },
          {
            type: "p",
            text: "Putaway suggestions use the map to recommend bin locations close to either the receiving dock (for fast-moving items) or the picker's current position (for top-up replenishment). Congestion avoidance reroutes simultaneous pickers around each other rather than into the same aisle. Walking-distance estimates appear on pick lists, giving floor leads a realistic time estimate for any batch.",
          },
          { type: "h2", text: "Privacy and team coverage" },
          {
            type: "p",
            text: "The position data the model uses is from device GPS/BLE while operators are actively scanning. Nautilus doesn't track location continuously and doesn't track operators when they're not on shift. Operators can see the map but can't see other individual operators' paths — the heatmap aggregates across all activity.",
          },
        ],
      },
      {
        slug: "using-intelligent-search",
        title: "Using intelligent search",
        content: [
          {
            type: "p",
            text: "The search bar at the top of every Nautilus screen accepts natural-language queries instead of just keyword matching. Type a question or a phrase and the search returns the answer rather than just a list of matching records.",
          },
          { type: "h2", text: "Query patterns that work" },
          {
            type: "p",
            text: "Phrases like 'low stock in section A', 'products received this week', 'items not counted in 30 days', 'top 10 picked SKUs last month', or 'orders shipped to California yesterday' all return structured answers. The query parser understands time ranges (last week, this month, since Tuesday), quantity comparisons (over 100, under 5, around 50), and warehouse hierarchy (in section A, on level 3 of bay 12).",
          },
          {
            type: "p",
            text: "You can also search by partial SKU, by product name, by lot number, or by any custom field. Searches across multiple fields combine cleanly — 'leather wallet under 50 units in receiving' parses correctly.",
          },
          { type: "h2", text: "Result types" },
          {
            type: "p",
            text: "Search returns four kinds of results, ranked by relevance and recency: products (with current stock and last-movement timestamp), locations (with current occupancy), orders (with status and pick progress), and team activity (with operator and timestamp). The top result for any query is shown inline; the rest are listed below.",
          },
          { type: "h2", text: "Saving and sharing queries" },
          {
            type: "p",
            text: "Frequently used queries can be saved as bookmarks. Open the search results and tap 'Save Query' to add it to your sidebar. Saved queries refresh each time you open them, so 'low stock' or 'items expiring this week' always shows the current state.",
          },
          {
            type: "p",
            text: "You can share a saved query with your team — they get a link that opens the same query in their account, running against your shared warehouse data.",
          },
          { type: "h2", text: "When search doesn't find what you want" },
          {
            type: "p",
            text: "If a query doesn't return what you expected, try rephrasing with more specific terms. The parser handles ambiguity by returning the most likely match, which sometimes isn't yours. Specific phrasing ('SKU starting with 4521' rather than '4521') resolves most cases.",
          },
        ],
      },
      {
        slug: "predictive-analytics-dashboard",
        title: "Predictive analytics dashboard",
        content: [
          {
            type: "p",
            text: "The Predictions tab in Analytics surfaces AI-generated forecasts: stock depletion timelines, reorder recommendations, demand pattern shifts, and anomaly alerts. Predictions update continuously as new scan data arrives, so the dashboard reflects current conditions rather than yesterday's snapshot.",
          },
          { type: "h2", text: "Stock depletion forecasts" },
          {
            type: "p",
            text: "For each SKU, the forecast shows the projected date of stockout based on recent consumption velocity. Forecasts use a 60-day rolling history, weighted toward recent data, and adjust for known seasonal patterns where there's enough history (typically 18+ months).",
          },
          {
            type: "p",
            text: "Each forecast includes a confidence score (high, medium, low) and the historical data points it's based on. A low-confidence forecast on a SKU with sparse history is normal — the model surfaces this honestly rather than guessing.",
          },
          { type: "h2", text: "Reorder suggestions" },
          {
            type: "p",
            text: "When a stock depletion forecast hits the lead-time window for that supplier, a reorder suggestion appears. The suggestion includes recommended quantity (based on velocity and any seasonal adjustment), preferred supplier (based on history), and an estimated delivery date.",
          },
          {
            type: "p",
            text: "You can accept the suggestion (which drafts a PO in your accounting system if connected), modify the quantity or supplier first, or dismiss it. Dismissed suggestions inform future forecasts — the model learns from your overrides.",
          },
          { type: "h2", text: "Anomaly alerts" },
          {
            type: "p",
            text: "The anomaly detector flags unusual patterns that don't fit the normal velocity model: sudden spikes in consumption (potential demand shift or potential bulk customer), sudden drops (potential supply issue or product change), unusual pick paths (potential operator training need), and double-counting bugs (typically integration issues).",
          },
          {
            type: "p",
            text: "Each alert is annotated with the reasoning — the specific deviation that triggered it — so you can decide whether it's a genuine pattern shift or a one-time outlier.",
          },
          { type: "h2", text: "Improving forecast accuracy" },
          {
            type: "p",
            text: "Forecasts improve as historical data grows. Two practices materially help: accepting or dismissing suggestions (rather than ignoring them) so the model learns your actual decisions, and recording the reason on dismissals so the model understands what triggered the override.",
          },
        ],
      },
      {
        slug: "low-stock-alert-configuration",
        title: "Low stock alert configuration",
        content: [
          {
            type: "p",
            text: "Low stock alerts notify your team before you run out of an item. Configure thresholds and notification channels under Settings → Alerts → Low Stock. Alerts can fire at fixed quantity thresholds, percentage thresholds, or AI-predicted depletion dates — most operations use a combination.",
          },
          { type: "h2", text: "Threshold types" },
          {
            type: "p",
            text: "Fixed-quantity thresholds fire when stock drops below a specific count (alert when below 10 units). They're simple and easy to reason about but don't account for consumption velocity. Percentage thresholds fire below a percentage of average stock — alert at 20% of average reads more sensibly across SKUs with different normal levels.",
          },
          {
            type: "p",
            text: "AI predictive alerts fire when the depletion forecast shows you'll run out within a configured number of days — typically 5-7 days, enough lead time to reorder. This is the recommended threshold for most SKUs because it accounts for velocity changes that fixed thresholds miss.",
          },
          { type: "h2", text: "Per-product overrides" },
          {
            type: "p",
            text: "Set a global default for the warehouse, then override per-product where needed. High-velocity SKUs benefit from longer lead-time alerts; slow-movers can use lower thresholds without generating noise. Edit per-product thresholds on the product detail page under 'Stock Settings'.",
          },
          { type: "h2", text: "Notification channels" },
          {
            type: "p",
            text: "Alerts can deliver to push notifications on the mobile app, email to a configured distribution list, Slack channels (if the Slack integration is connected), or webhook endpoints for custom routing. Most operations route critical alerts to push + Slack and less-urgent ones to a daily email digest.",
          },
          { type: "h2", text: "Suppressing noisy alerts" },
          {
            type: "p",
            text: "If you have SKUs that legitimately run low and refill regularly (consignment items, just-in-time stock), suppress alerts on those specific products rather than dialing back the global threshold. The Suppress Alert toggle on the product detail page silences notifications without disabling threshold tracking. You'll still see the low-stock state in reports; you just won't get pinged about it.",
          },
        ],
      },
      {
        slug: "ai-prioritized-cycle-counting",
        title: "AI-prioritized cycle counting",
        content: [
          {
            type: "p",
            text: "Most warehouses count on a fixed schedule: every section every quarter, or every aisle once a month. AI-prioritized counting replaces the schedule with a risk-based ranking — the locations most likely to have discrepancies are counted first, and the rest are counted in priority order rather than calendar order.",
          },
          { type: "h2", text: "How priority is calculated" },
          {
            type: "p",
            text: "The priority model scores each location on four factors: time since last count (older counts get higher priority), transaction volume (high-activity locations are more likely to drift), value of items (high-value SKUs are more important to verify), and historical accuracy (locations that have drifted before drift again).",
          },
          {
            type: "p",
            text: "The four factors weight differently per warehouse — a low-value high-volume operation weights transaction volume heavily; a high-value low-volume operation weights value heavily. The weighting tunes itself over the first few months based on which counts actually surfaced discrepancies.",
          },
          { type: "h2", text: "Enabling AI priority" },
          {
            type: "p",
            text: "Go to Settings → Cycle Counts → AI Priority and toggle it on. The Cycle Counts dashboard then shows a ranked list of locations to count next, updated daily. The list refreshes overnight, so the morning's queue reflects yesterday's activity.",
          },
          { type: "h2", text: "Running counts from the priority list" },
          {
            type: "p",
            text: "Open the priority list and start a count on the top N locations (typically 5-20 per day per counter). Counts work the same as standard cycle counts — walk to each location, scan, enter the physical count, reconcile any discrepancies. The priority model learns from each count: locations that came back accurate get deprioritized; locations that had discrepancies move up.",
          },
          { type: "h2", text: "Coverage over time" },
          {
            type: "p",
            text: "Even on AI priority, every location eventually gets counted. The 'days since last count' factor ensures that no location stays uncounted indefinitely. After about 6 months of AI priority on a typical warehouse, you'll have caught roughly 70% more discrepancies for the same total count effort compared to a fixed schedule.",
          },
          { type: "h2", text: "Switching back" },
          {
            type: "p",
            text: "You can switch back to fixed-schedule counting at any time without losing history. The AI model keeps learning from any counts you run; if you turn priority back on later, the model resumes from where it was.",
          },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────
       INTEGRATIONS
       ───────────────────────────────────────────────────────────────── */
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
            text: "Connecting QuickBooks lets Nautilus sync inventory valuations, cost of goods sold, and purchase orders both directions in real time. Go to Settings → Integrations → QuickBooks and click 'Connect' to start.",
          },
          { type: "h2", text: "Authentication" },
          {
            type: "p",
            text: "QuickBooks Online uses OAuth — you'll sign in to your QuickBooks account and grant Nautilus permission to read and write inventory data. The OAuth tokens are stored encrypted at rest and refresh automatically. QuickBooks Desktop connects through the QuickBooks Web Connector instead; see the Desktop-specific notes below.",
          },
          {
            type: "p",
            text: "If you have multiple QuickBooks companies, the OAuth flow asks which company to connect. You can connect different Nautilus warehouses to different QuickBooks companies independently.",
          },
          { type: "h2", text: "Mapping products to QuickBooks items" },
          {
            type: "p",
            text: "After authentication, map your Nautilus products to QuickBooks inventory items. Nautilus auto-matches by SKU where the two systems share identical SKUs — typically 70-95% of products match on first pass. Unmatched products surface in a review list for manual mapping or skipping.",
          },
          {
            type: "p",
            text: "Products with no QuickBooks counterpart can be created in QuickBooks from Nautilus during the mapping step. Conversely, QuickBooks items that don't exist in Nautilus can be imported automatically.",
          },
          { type: "h2", text: "What syncs after setup" },
          {
            type: "p",
            text: "Inventory movements in Nautilus create the corresponding journal entries in QuickBooks: receives post as inventory increases against the appropriate accounts, picks post as inventory decreases plus COGS, adjustments post per the configured adjustment account, transfers post as inter-account moves.",
          },
          {
            type: "p",
            text: "Purchase orders flow both directions. POs created in QuickBooks appear in Nautilus's expected-receipts list, ready to scan against at the receiving dock. POs drafted by Nautilus's reorder suggestions create draft POs in QuickBooks for your buyer to approve.",
          },
          { type: "h2", text: "QuickBooks Desktop notes" },
          {
            type: "p",
            text: "Desktop sync polls every 5 minutes through the Web Connector — slower than Online's real-time sync. Keep the Web Connector running on a workstation that stays online during business hours. For full detail on Desktop quirks, see the QuickBooks integration page at /integration/quickbooks.",
          },
        ],
      },
      {
        slug: "shopify-inventory-sync",
        title: "Shopify inventory sync",
        content: [
          {
            type: "p",
            text: "Shopify integration syncs inventory levels bidirectionally so every sale on your Shopify store decrements warehouse stock instantly, and every warehouse receipt updates Shopify product availability without manual entry. Connect under Settings → Integrations → Shopify.",
          },
          { type: "h2", text: "Connecting the store" },
          {
            type: "p",
            text: "Enter your Shopify store URL (yourstore.myshopify.com or your custom domain) and click 'Connect'. You'll be redirected to Shopify to authorize Nautilus — review the requested permissions (read/write inventory, read orders, read products) and approve. The connection takes about 30 seconds to finalize.",
          },
          {
            type: "p",
            text: "If your store uses Shopify Plus, the same OAuth flow applies and there's no additional configuration. Plus benefits (higher rate limits, more flexible webhooks) are detected automatically and used where they help.",
          },
          { type: "h2", text: "Sync timing" },
          {
            type: "p",
            text: "Nautilus uses Shopify webhooks for inbound events (orders, refunds, product updates) so they're received within seconds of the Shopify event. Outbound updates from Nautilus to Shopify (inventory changes from warehouse scans) push immediately and complete in under 5 seconds end-to-end at typical loads.",
          },
          {
            type: "p",
            text: "During peak traffic (flash sales, Black Friday), Shopify's eventual-consistency model can delay sync by up to 60 seconds. Nautilus's oversell-prevention rule blocks any sale that would oversell the last unit, even if the Shopify view hasn't caught up.",
          },
          { type: "h2", text: "Multi-location" },
          {
            type: "p",
            text: "Each Nautilus warehouse maps to a Shopify location. Multi-location Shopify stores are fully supported — the Shopify checkout assigns each order to the right location based on customer address and stock availability, and Nautilus picks from the warehouse mapped to that location.",
          },
          { type: "h2", text: "Fulfillment automation" },
          {
            type: "p",
            text: "Picked orders create fulfillments in Shopify automatically. The tracking number from your shipping integration (ShipStation, Shippo, etc.) posts back to the Shopify order, the customer receives Shopify's standard shipping notification email, and the order status closes. The whole flow runs without human input once pick is confirmed.",
          },
        ],
      },
      {
        slug: "shipstation-setup-guide",
        title: "ShipStation setup guide",
        content: [
          {
            type: "p",
            text: "ShipStation integration feeds picked orders straight into ShipStation for label generation, and tracking numbers from ShipStation push back to Nautilus and to the sales channel that originated the order. Connect under Settings → Integrations → ShipStation.",
          },
          { type: "h2", text: "Getting your API credentials" },
          {
            type: "p",
            text: "Log in to ShipStation and go to Account → API Settings → API Keys. Generate a new key pair (API Key and API Secret) if you don't already have one. Copy both values; you'll paste them into the Nautilus connection screen.",
          },
          {
            type: "p",
            text: "We recommend creating a dedicated API key for Nautilus rather than reusing one from another integration. If you ever need to revoke access, you can revoke just the Nautilus key without affecting other integrations.",
          },
          { type: "h2", text: "Connecting" },
          {
            type: "p",
            text: "In Nautilus, paste the API Key and Secret into the ShipStation connection screen. Click 'Connect'. Nautilus tests the connection and pulls in your ShipStation stores, carriers, and shipping rules.",
          },
          { type: "h2", text: "How orders flow" },
          {
            type: "p",
            text: "When a pick is marked complete in Nautilus, the order auto-creates in ShipStation with package dimensions, weight, ship-to address, and your ShipStation rate-shopping rules apply automatically. Labels print to your designated ShipStation printer. The tracking number from ShipStation pushes back to Nautilus within a few seconds, and onward to the sales channel that originated the order.",
          },
          { type: "h2", text: "Rate shopping" },
          {
            type: "p",
            text: "Rate shopping happens in ShipStation, not in Nautilus. Configure your rate-shopping rules in ShipStation (use FedEx Ground for orders under 10 lbs, USPS Priority for over, etc.), and Nautilus passes the order details for ShipStation to apply them. We don't override your rate-shopping logic.",
          },
          { type: "h2", text: "Pre-pick vs. post-pick label creation" },
          {
            type: "p",
            text: "By default, Nautilus waits for pick completion before pushing the order to ShipStation. For warehouses that pre-print labels at the start of the day (common in high-volume B2C operations), switch to 'create on order arrival' mode under Settings → Integrations → ShipStation → Label Timing. The tradeoff: you'll generate labels you don't end up shipping if a pick fails.",
          },
        ],
      },
      {
        slug: "api-authentication",
        title: "API authentication",
        content: [
          {
            type: "p",
            text: "The Nautilus API uses Bearer token authentication. Every API request includes an Authorization header with your API key. Keys are generated in the Nautilus dashboard under Settings → API → Generate Key, and they grant access scoped to a specific warehouse.",
          },
          { type: "h2", text: "Generating a key" },
          {
            type: "p",
            text: "Go to Settings → API → Generate Key. Give the key a descriptive name (typically the system or person using it: 'Inventory dashboard', 'Buyer's reorder script', etc.) and choose a permission scope: read-only, write, or admin. Read-only is sufficient for most reporting integrations; write is needed for systems that create or modify inventory; admin is rarely needed for integrations.",
          },
          {
            type: "p",
            text: "When you click Create, the key is shown once. Copy it immediately and store it in your secrets manager. Nautilus doesn't store the full key after creation — only a hash for verification — so if you lose the key you need to generate a new one.",
          },
          { type: "h2", text: "Using the key" },
          {
            type: "p",
            text: "Include the key in every request as a Bearer token: Authorization: Bearer YOUR_API_KEY. The key works on any API endpoint within its scope. Requests without a key, with an invalid key, or with a key outside the endpoint's required scope return 401 Unauthorized.",
          },
          { type: "h2", text: "Rate limits" },
          {
            type: "p",
            text: "Standard plans are limited to 100 requests per minute per API key. Enterprise plans have higher limits. The current limit appears in the X-RateLimit-Limit response header on every API call, with X-RateLimit-Remaining showing requests left in the current window. Rate-limited requests return 429 Too Many Requests with a Retry-After header.",
          },
          { type: "h2", text: "Revoking keys" },
          {
            type: "p",
            text: "Revoke a key immediately by clicking 'Revoke' next to the key in Settings → API. Revoked keys stop working instantly; any in-flight requests using a revoked key complete normally, but new requests fail with 401.",
          },
          {
            type: "p",
            text: "If you suspect a key has been compromised, revoke it immediately and audit the activity log for any unfamiliar requests. The activity log shows every API request with timestamp, endpoint, response status, and source IP.",
          },
        ],
      },
      {
        slug: "webhook-configuration",
        title: "Webhook configuration",
        content: [
          {
            type: "p",
            text: "Webhooks let external systems react to events in Nautilus without polling. When an event you've subscribed to occurs (inventory updates, orders, scans, etc.), Nautilus sends an HTTP POST to your endpoint with a JSON payload describing the event.",
          },
          { type: "h2", text: "Registering an endpoint" },
          {
            type: "p",
            text: "Go to Settings → API → Webhooks → Add Endpoint. Enter the URL where Nautilus should POST events (HTTPS required), select which event types to subscribe to, and save. You can test the endpoint immediately from the same screen — Nautilus sends a sample payload for each subscribed event type so you can verify your handler.",
          },
          { type: "h2", text: "Available events" },
          {
            type: "p",
            text: "inventory.updated fires when any product's stock changes. order.created fires when a new order is created (from any source — sales channel, manual, API). scan.completed fires on every scan action. count.finished fires when a cycle count is reconciled. alert.triggered fires when a low-stock or anomaly alert is raised.",
          },
          {
            type: "p",
            text: "Subscribe only to the events your handler actually needs. Subscribing to scan.completed is sometimes useful for real-time dashboards but generates high volume — a busy warehouse can fire 10,000+ scan events per day per warehouse.",
          },
          { type: "h2", text: "Payload signing" },
          {
            type: "p",
            text: "Every webhook request includes an X-Nautilus-Signature header. The signature is an HMAC-SHA256 of the request body computed with your endpoint's secret (generated when you created the endpoint). Verify the signature before processing the payload — this prevents anyone from forging webhook requests to your endpoint.",
          },
          { type: "h2", text: "Retries and failures" },
          {
            type: "p",
            text: "If your endpoint returns a non-2xx response (or doesn't respond within 10 seconds), Nautilus retries with exponential backoff: 1 minute, 5 minutes, 30 minutes. After 3 failed retries, the event is moved to the Failed Deliveries queue under Settings → API → Webhooks → Failures, where you can manually retry once you've fixed the endpoint.",
          },
          { type: "h2", text: "Order matters" },
          {
            type: "p",
            text: "Webhooks deliver in roughly chronological order but aren't strictly guaranteed. For event types where order matters (sequential inventory updates on the same SKU), use the event_id and timestamp in the payload to detect out-of-order arrivals on the receiving side rather than relying on delivery order.",
          },
        ],
      },
      {
        slug: "zapier-integration",
        title: "Zapier integration",
        content: [
          {
            type: "p",
            text: "Zapier connects Nautilus to 5,000+ no-code apps without you writing any code. Use it to route Nautilus events into Slack, Google Sheets, Airtable, supplier portals, accounting platforms outside our first-party list, or anywhere else your team works.",
          },
          { type: "h2", text: "Finding Nautilus in Zapier" },
          {
            type: "p",
            text: "Search for 'Nautilus' in the Zapier app directory. Click 'Connect' and authorize using your API key (generate one under Settings → API → Generate Key in Nautilus). Zapier stores the key encrypted; you don't need to handle it again after the initial connection.",
          },
          { type: "h2", text: "Available triggers" },
          {
            type: "p",
            text: "Triggers fire on Nautilus events and start a Zap. The available triggers are: New Scan (any scan action), Low Stock Alert, Order Complete, Count Finished, Adjustment Posted, New Product Created, and Custom Webhook (for events not in the standard list — uses the webhook system).",
          },
          { type: "h2", text: "Available actions" },
          {
            type: "p",
            text: "Actions let Zaps modify Nautilus from external triggers. Available actions: Adjust Inventory, Create Product, Update Product, Receive Stock, Create Order, and Send Custom API Request (for endpoints not exposed as standard actions). Most automation needs are covered by the first five.",
          },
          { type: "h2", text: "Popular Zaps" },
          {
            type: "p",
            text: "Common Zaps include: send a Slack message when stock drops low (Trigger: Low Stock Alert → Action: Slack Send Message), create a Google Sheet row for every scan (Trigger: New Scan → Action: Google Sheets Add Row), draft a PO in your supplier portal when inventory hits minimum (Trigger: Low Stock Alert → Action: HTTP request to supplier API), and notify customer service in Salesforce when a high-value order is picked (Trigger: Order Complete → Filter by value → Action: Salesforce Create Case).",
          },
          { type: "h2", text: "When Zapier is the wrong choice" },
          {
            type: "p",
            text: "Zapier adds a small latency (typically 1-2 minutes between trigger and action) and has its own pricing tied to task volume. For high-volume integrations or anything requiring real-time response (under a few seconds), use direct API/webhook integration instead. Zapier shines for low-volume, ad-hoc connections to apps that don't justify a first-party integration.",
          },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────
       ACCOUNT & BILLING
       ───────────────────────────────────────────────────────────────── */
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
            text: "Nautilus has two plans. Pro is $239 per warehouse per month on annual billing ($299 on monthly), and it covers a single warehouse with unlimited scanner users and up to 50,000 SKUs. Enterprise is custom-priced and built for multi-site operations: unlimited warehouses, unlimited SKUs, plus the higher-tier features described below.",
          },
          { type: "h2", text: "What's in Pro" },
          {
            type: "p",
            text: "Pro includes AI scanning and voice commands, all 18 first-party integrations (QuickBooks, Xero, FreshBooks, SAP Business One, NetSuite, Sage, Shopify, WooCommerce, Amazon, Square, BigCommerce, Lightspeed, ShipStation, Shippo, EasyPost, FedEx, UPS, DHL), standard analytics and alerts, read-only API access, email support with 24-hour response, and a 99.9% uptime SLA.",
          },
          {
            type: "p",
            text: "A 14-day free trial is available without a credit card. The trial runs on the Pro feature set so you can evaluate against your real workflow.",
          },
          { type: "h2", text: "What's in Enterprise" },
          {
            type: "p",
            text: "Enterprise includes everything in Pro plus Spatial Intelligence (real-time 3D warehouse mapping), multi-warehouse orchestration, full read/write API access, SSO/SAML, a dedicated success manager, 24/7 priority support with 1-hour response, a 99.99% uptime SLA, and SOC 2 + HIPAA reports.",
          },
          {
            type: "p",
            text: "Enterprise also includes a typical 30-day tailored proof-of-concept with hands-on team support, so you can validate the multi-warehouse and compliance features against your actual environment before signing.",
          },
          { type: "h2", text: "Which plan is right" },
          {
            type: "p",
            text: "Single warehouse operations almost always start on Pro. Multi-site operations, regulated industries (pharma, food), and companies that need SSO or HIPAA reports go straight to Enterprise. The pricing difference reflects the operational complexity those features handle, not gating-for-gating's-sake.",
          },
          {
            type: "p",
            text: "You can upgrade from Pro to Enterprise at any time — upgrades take effect immediately, prorated for the remainder of the current billing cycle. See 'Upgrading your plan' for the detail.",
          },
        ],
      },
      {
        slug: "upgrading-your-plan",
        title: "Upgrading your plan",
        content: [
          {
            type: "p",
            text: "Upgrade your subscription under Settings → Billing → Change Plan. Select your new plan and confirm. Upgrades from Pro to Enterprise take effect immediately, with billing prorated for the remainder of the current cycle. Downgrades take effect at the start of the next billing period so you don't lose mid-cycle access to features you're using.",
          },
          { type: "h2", text: "What happens during an upgrade" },
          {
            type: "p",
            text: "Your existing data, warehouse configurations, integrations, and team members carry over unchanged. Enterprise-only features (Spatial Intelligence, multi-warehouse orchestration, full API access, SSO/SAML) become available immediately. Your dedicated success manager reaches out to schedule a kickoff call within one business day.",
          },
          {
            type: "p",
            text: "For Pro-to-Enterprise upgrades that involve adding additional warehouses, the second and subsequent warehouses can be created right away. Each new warehouse is a fresh setup — there's no requirement that they look like your first one.",
          },
          { type: "h2", text: "Annual vs monthly billing" },
          {
            type: "p",
            text: "Annual billing saves 20% over monthly. If you're upgrading mid-cycle from monthly to annual, the new annual term starts immediately and replaces the remaining monthly period. The proration credit from the unused monthly portion applies to the first annual invoice.",
          },
          { type: "h2", text: "Payment methods" },
          {
            type: "p",
            text: "Monthly Pro is credit card only. Annual Pro and all Enterprise contracts can be paid by invoice with net-30 terms — switch the payment method under Settings → Billing → Payment Method. For invoice payments, the first invoice generates at upgrade time and subsequent invoices generate 14 days before the renewal date.",
          },
          { type: "h2", text: "Downgrade considerations" },
          {
            type: "p",
            text: "Downgrades from Enterprise to Pro take effect at the next renewal. Before the downgrade, if you have more than one warehouse, you'll be prompted to choose which warehouse stays active on Pro. Inactive warehouses retain data for 90 days so you can reactivate if needed.",
          },
        ],
      },
      {
        slug: "managing-team-roles",
        title: "Managing team roles",
        content: [
          {
            type: "p",
            text: "Manage team roles under Settings → Team. Click any team member to change their role between Admin, Manager, and Staff. Roles can be changed at any time and take effect on the team member's next API call or page load.",
          },
          { type: "h2", text: "Role summary" },
          {
            type: "p",
            text: "Admin has full access including billing and team management. Keep at least two admins on the account so access doesn't depend on one person.",
          },
          {
            type: "p",
            text: "Manager can configure warehouse settings, view reports, and perform every scan action, but cannot change billing or invite admins.",
          },
          {
            type: "p",
            text: "Staff can perform every scan action and view inventory but cannot change settings. This is the default role for warehouse operators.",
          },
          { type: "h2", text: "Custom roles (Enterprise)" },
          {
            type: "p",
            text: "Enterprise plans support custom roles with granular permissions. Create custom roles under Settings → Team → Roles. Each permission can be toggled independently — for example, a 'Receiving Lead' role that can perform receive actions and view receiving reports but not adjust inventory or change settings.",
          },
          {
            type: "p",
            text: "Custom roles work alongside the standard roles, so a team member can hold both a custom role and a standard role; the union of permissions applies.",
          },
          { type: "h2", text: "Deactivating accounts" },
          {
            type: "p",
            text: "When someone leaves the team, you have two options. Deactivating preserves their activity history but blocks future access — useful for audit trails on past scans. Removing strips the account entirely, with their past activity attributed to 'Removed user'.",
          },
          {
            type: "p",
            text: "At least one Admin must remain on every account at all times. If you try to remove or downgrade the last admin, you'll be prompted to promote someone else first.",
          },
          { type: "h2", text: "Role audit" },
          {
            type: "p",
            text: "Every role change writes to the audit log with who made the change, when, and what the role was before and after. Useful for compliance reviews and for understanding access history during security incidents.",
          },
        ],
      },
      {
        slug: "two-factor-authentication",
        title: "Two-factor authentication",
        content: [
          {
            type: "p",
            text: "Two-factor authentication (2FA) adds a second verification step beyond your password. Enable 2FA under Settings → Security → Two-Factor Authentication. Nautilus supports authenticator apps (Google Authenticator, Authy, 1Password) and SMS codes; authenticator apps are stronger and recommended.",
          },
          { type: "h2", text: "Setting up authenticator apps" },
          {
            type: "p",
            text: "Open your authenticator app and scan the QR code shown in the Nautilus 2FA setup screen. The app generates a 6-digit code that rotates every 30 seconds. Enter the current code in Nautilus to confirm setup, and save the backup codes shown on the same screen.",
          },
          {
            type: "p",
            text: "Backup codes (a set of 8 one-time-use codes) let you sign in if you lose access to your authenticator. Store them somewhere safe — a password manager is ideal. Each backup code works exactly once; when you use one, it's invalidated.",
          },
          { type: "h2", text: "SMS as fallback" },
          {
            type: "p",
            text: "SMS 2FA is supported but less secure than authenticator apps. If you use SMS, keep an authenticator app as the primary and SMS as backup. SMS is vulnerable to SIM-swap attacks; authenticator apps are not.",
          },
          { type: "h2", text: "Requiring 2FA for the whole team" },
          {
            type: "p",
            text: "On Enterprise plans, admins can require 2FA for all team members. Enable under Settings → Security → Require 2FA. Team members without 2FA configured are prompted to set it up on their next sign-in; they can't continue using Nautilus until they complete setup.",
          },
          { type: "h2", text: "Recovering access" },
          {
            type: "p",
            text: "If you lose access to your authenticator and your backup codes, contact support. We require identity verification before resetting 2FA — typically a video call with a current admin on the account. The process takes about 30 minutes during business hours.",
          },
          {
            type: "p",
            text: "For accounts protected by SSO/SAML, recovery goes through your identity provider's recovery flow rather than Nautilus's.",
          },
        ],
      },
      {
        slug: "data-export-and-portability",
        title: "Data export and portability",
        content: [
          {
            type: "p",
            text: "You own your data. Export all of it at any time from Settings → Import/Export → Export All. The export generates CSV files for products, inventory snapshots, locations, activity logs, team members, and custom field definitions, packaged as a single ZIP for download.",
          },
          { type: "h2", text: "What's in the export" },
          {
            type: "p",
            text: "Products CSV: SKU, name, barcode(s), custom fields, supplier, cost, current stock. Inventory CSV: SKU, location, quantity, last-updated timestamp. Locations CSV: section, bay, level, label, capacity. Activity CSV: every scan and adjustment with operator, timestamp, action type, product, location, and quantity. Team CSV: name, email, role, last active.",
          },
          {
            type: "p",
            text: "The activity log export includes the entire history of the warehouse from creation to the present. For warehouses with multi-year histories, the activity CSV can be large (several gigabytes uncompressed). The ZIP compresses to roughly 10% of the uncompressed size.",
          },
          { type: "h2", text: "Format options" },
          {
            type: "p",
            text: "CSV is the default and works for spreadsheet import and most analytical workflows. JSON exports are available for systems that prefer structured data. Enterprise plans also support direct database exports (PostgreSQL dump) and API-based bulk data access for systems that need real-time export rather than scheduled snapshots.",
          },
          { type: "h2", text: "Scheduled exports" },
          {
            type: "p",
            text: "On Enterprise plans, schedule recurring exports to land in S3, Google Cloud Storage, or Azure Blob Storage on a daily or weekly cadence. Useful for compliance retention requirements (most regulators want their own copy of the data rather than relying on the vendor's retention).",
          },
          { type: "h2", text: "Format compatibility" },
          {
            type: "p",
            text: "The CSV schemas are stable across versions — exports from today and exports from a year from now are interchangeable. If you ever leave Nautilus, the export is sufficient to recreate your data in another system; no proprietary format lock-in.",
          },
        ],
      },
      {
        slug: "cancellation-and-refunds",
        title: "Cancellation and refunds",
        content: [
          {
            type: "p",
            text: "Cancel your subscription under Settings → Billing → Cancel Plan. Your account remains active until the end of the current billing cycle. After that, access ends and the account closes. We don't charge cancellation fees and we don't require a phone call to cancel — the self-serve flow handles it.",
          },
          { type: "h2", text: "What happens at cancellation" },
          {
            type: "p",
            text: "On the cancellation date, the account transitions to read-only — you can still sign in to view data and export, but new scan actions and integrations are disabled. Read-only access continues for 90 days, then the account closes fully and data is deleted from production systems.",
          },
          {
            type: "p",
            text: "We strongly recommend exporting your data before the 90-day window closes (see 'Data export and portability'). Once the data is deleted, we can't recover it.",
          },
          { type: "h2", text: "Reactivation" },
          {
            type: "p",
            text: "During the 90-day window, you can reactivate at any time without losing any data. Reactivation re-enables billing on the day you reactivate and resumes scan operations immediately. Past activity, products, locations, and team members are all preserved.",
          },
          {
            type: "p",
            text: "After 90 days, data is deleted and reactivation creates a fresh account. You can use the same email and warehouse name, but historical data is gone.",
          },
          { type: "h2", text: "Refunds" },
          {
            type: "p",
            text: "Annual plans are refundable within the first 30 days of the term. Contact billing@nautilusinventory.com with your account email and we'll process the refund within 5 business days. Refunds after 30 days are not available, but the account remains active for the remainder of the paid period.",
          },
          {
            type: "p",
            text: "Monthly plans don't carry refunds — cancellation simply stops the next billing cycle. The current month's payment remains, and access continues to the end of that month.",
          },
          { type: "h2", text: "If you have multiple warehouses" },
          {
            type: "p",
            text: "On Enterprise plans, you can cancel individual warehouses without canceling the whole account. The warehouse goes read-only on the cancellation date and is deleted after 90 days, but the rest of the account continues normally. Billing adjusts at the next renewal to reflect the lower warehouse count.",
          },
        ],
      },
    ],
  },
];
