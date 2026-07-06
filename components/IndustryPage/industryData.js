/* ═══════════════════════════════════════════════════════════════════════
   INDUSTRY DATA
   ───────────────────────────────────────────────────────────────────────
   Per-industry content for the 8 industry contexts we ship pages for.
   Each entry feeds the IndustryPage component (/industry/[slug]) and
   the FAQ JSON-LD schema in app/industry/[slug]/page.js.

   Schema per industry:
     slug:        string         — URL slug
     title:       string         — display name
     headline:    string[]       — multi-line hero headline (one string per line)
     accentWord:  string         — which word in the headline gets the accent color
     heroDesc:    string         — hero paragraph below the headline
     challenges:  [{ title, desc }] × 3
     solutions:   [{ title, desc, stat, statLabel }] × 3
                                  (paired with challenges in section 01 of the page)
     stats:       [{ val, label }] × 3
     cta:         string         — copy for the cross-link card on adjacent pages

     workflow:    [{ label, desc }] × 4
                                  — replaces the page's generic WORKFLOW
                                    fallback (Receive/Putaway/Pick/Pack) with
                                    industry-specific verbs and details.
                                    Renders in section 02 of the page.
     faqs:        [{ q, a }] × 4
                                  — industry-specific Q&As. Renders in
                                    section 04 of the page AND drives the
                                    FAQ JSON-LD schema in page.js (so each
                                    industry page emits a unique FAQPage
                                    payload eligible for Google's FAQ
                                    rich result, rather than the duplicate
                                    content a shared block would produce).

   If an industry omits `workflow` or `faqs`, the renderer falls back to
   the WORKFLOW const in IndustryPage.jsx and DEFAULT_INDUSTRY_FAQS
   exported below.

   KEEP IN SYNC: components/Industries/industriesIndex.js is a small
   standalone copy of each industry's title / heroDesc / slug used by the
   home-page <Industries /> client section (it must NOT import this module,
   or the whole ~44 KB file ships in the home-page JS chunk). When adding,
   removing, reordering industries here — or editing title/heroDesc/slug —
   update industriesIndex.js to match.
   ═══════════════════════════════════════════════════════════════════════ */

export const INDUSTRIES = [
  {
    slug: "flooring-building-materials",
    title: "Flooring & Building Materials",
    headline: ["Built for the", "building trade."],
    accentWord: "building",
    heroDesc:
      "Hardwood, tile, carpet rolls, and adhesive across warehouses that span an acre or more. Lot numbers, linear footage, partial pallets, and condition grading all tracked from receipt to job-site delivery.",
    challenges: [
      {
        title: "Varied unit types",
        desc: "Square footage, linear feet, rolls, pallets, cases. Flooring inventory arrives in every unit of measure imaginable, and customers buy in mixed units.",
      },
      {
        title: "Damage tracking",
        desc: "Partial rolls, chipped tiles, and dented boxes need to be flagged and tracked separately from sellable stock. Selling damaged as A-grade is a credit waiting to happen.",
      },
      {
        title: "Job-site deliveries",
        desc: "Orders ship to dozens of job sites, not just one address. Knowing what went where, and when, becomes a full-time job without the right tooling.",
      },
    ],
    solutions: [
      {
        title: "Multi-unit inventory",
        desc: "Track the same product in square feet, cases, and pallets simultaneously. Nautilus converts between units automatically based on each SKU's setup.",
        stat: "12+",
        statLabel: "Unit types",
      },
      {
        title: "Condition grading",
        desc: "Scan and tag items by condition (A-grade, B-grade, damaged). Separate stock levels let the sales team quote honestly and document credits cleanly.",
        stat: "100%",
        statLabel: "Graded stock",
      },
      {
        title: "Job-site tracking",
        desc: "Assign inventory to specific jobs and delivery addresses. Reports show exactly what was sent, received, and installed at every site.",
        stat: "Real-time",
        statLabel: "Delivery tracking",
      },
    ],
    stats: [
      { val: "40%", label: "Less shrinkage" },
      { val: "3x", label: "Faster receiving" },
      { val: "99.5%", label: "Order accuracy" },
    ],
    cta: "See how Nautilus handles building materials",
    workflow: [
      {
        label: "Receive & inspect",
        desc: "Scan bills of lading. Confirm pallet counts; flag damaged units to a separate inventory state at the point of receipt.",
      },
      {
        label: "Velocity putaway",
        desc: "Drop pallets by SKU velocity. Partial rolls and broken cases route to the cut zone for re-quantification.",
      },
      {
        label: "Job-site pick",
        desc: "Picks consolidate by job site and delivery date. Long-length items pull to the dock first to anchor truck packing.",
      },
      {
        label: "Stage & dispatch",
        desc: "Stage by truck route. Drivers scan to load; Nautilus generates a job-site manifest at dispatch.",
      },
    ],
    faqs: [
      {
        q: "Can Nautilus convert between linear feet, square feet, and pallets automatically?",
        a: "Yes. Each product carries unit-of-measure conversions during setup: a hardwood SKU might be defined as 24 sq ft per case and 36 cases per pallet. When you sell in any unit (sq ft to a contractor, cases to a distributor, pallets to a job site), Nautilus decrements stock in all three views simultaneously and reports inventory in whichever unit you ask for.",
      },
      {
        q: "How do you handle partial pallets and roll remnants?",
        a: "Receiving a 40-roll pallet of carpet, you scan the pallet as a unit. When 3 rolls leave for a job, Nautilus splits the pallet into 37 rolls remaining and tracks the new quantity automatically. Roll remnants (a 24 sq ft remainder from a 100 sq ft roll) re-scan into inventory with their actual dimensions, so the next quote sees real available stock rather than a phantom full roll.",
      },
      {
        q: "Will Nautilus integrate with our delivery routing software?",
        a: "If your routing software has an API or accepts CSV imports, yes. We have direct integrations to Onfleet, Routific, and OptimoRoute, and a generic webhook bridge for everything else. Pick lists export with job-site addresses and delivery windows attached so the routing software has what it needs.",
      },
      {
        q: "Can we attach photos to damaged receiving items?",
        a: "Yes. The scanner app lets the receiver photograph damage at the moment of receipt. Photos attach to that specific lot and travel with it through quarantine, supplier-credit, or sell-as-B-grade workflows. Useful for documenting credits with suppliers and for showing customers what 'B-grade' actually means before they buy.",
      },
    ],
  },

  {
    slug: "manufacturing-assembly",
    title: "Manufacturing & Assembly",
    headline: ["Precision parts,", "precision tracking."],
    accentWord: "precision",
    heroDesc:
      "Parts tracking from raw-material intake through WIP to finished goods. Bills of materials decrement as assemblies complete, and component shortages surface days before they stop a line.",
    challenges: [
      {
        title: "BOM complexity",
        desc: "A single finished product can have hundreds of components sourced from dozens of suppliers across multiple warehouses. Keeping the BOM accurate is harder than building the product.",
      },
      {
        title: "WIP tracking",
        desc: "Work-in-progress inventory sits between raw materials and finished goods. Most systems lose visibility here, which is exactly where bottlenecks form.",
      },
      {
        title: "Production scheduling",
        desc: "A stockout on a single component can halt a production line. You need to know about it days before it happens, not when the line stops.",
      },
    ],
    solutions: [
      {
        title: "BOM management",
        desc: "Link raw materials to finished goods. Nautilus decrements component stock automatically as assemblies are completed against the BOM.",
        stat: "Auto",
        statLabel: "BOM deductions",
      },
      {
        title: "WIP visibility",
        desc: "Track items through every production stage. Scan at each station to move inventory from raw to WIP to finished, with dwell time recorded.",
        stat: "100%",
        statLabel: "Stage visibility",
      },
      {
        title: "Predictive reordering",
        desc: "AI analyzes production schedules and component burn rates to flag shortages days before they hit. Reorder draft POs are ready for buyer review.",
        stat: "3 days",
        statLabel: "Early warning",
      },
    ],
    stats: [
      { val: "60%", label: "Less downtime" },
      { val: "2x", label: "Throughput" },
      { val: "98%", label: "On-time delivery" },
    ],
    cta: "See how Nautilus supports manufacturing",
    workflow: [
      {
        label: "Inbound receipt",
        desc: "Parts scan against PO. Lot numbers and supplier certificates attach to each receipt for downstream traceability.",
      },
      {
        label: "Line-side putaway",
        desc: "Components stage near the production lines that consume them. Cross-line moves record so finance sees the labor cost of repositioning.",
      },
      {
        label: "BOM-driven issue",
        desc: "Production picks decrement components against the BOM. Variance against expected consumption flags before assembly continues.",
      },
      {
        label: "Finished goods",
        desc: "Assembly confirmations close the production order. Finished units carry traceability back to their component lots.",
      },
    ],
    faqs: [
      {
        q: "Does Nautilus integrate with our MRP?",
        a: "Direct integrations to SAP Business One and NetSuite are first-party. For other MRPs (Microsoft Dynamics, Epicor Kinetic, Infor, custom-built), we use a webhook-and-API bridge that takes 1-2 weeks of mapping work during initial setup. Component issues, finished-goods receipts, and inventory adjustments sync both directions; production orders and BOMs originate in the MRP and read into Nautilus.",
      },
      {
        q: "Can it track work-in-progress between stations?",
        a: "Yes. Each station scan moves the unit between named WIP states (cut → finished, raw → assembled, and so on). The WIP report shows live inventory at each station, average dwell time, and where bottlenecks are forming. WIP value rolls into financial reporting against the configured cost basis.",
      },
      {
        q: "How are component substitutions handled when a BOM allows them?",
        a: "Substitution rules live on the BOM. When a primary component is out of stock and a substitute is approved, Nautilus offers the substitution at pick time and records which substitute was used on that finished-goods unit's traceability record. If substitutes aren't approved on the BOM, the pick blocks and surfaces an exception for engineering review.",
      },
      {
        q: "Will it support lot-genealogy compliance (ITAR, FAA Part 145, ISO 9001)?",
        a: "Yes. Every finished-goods unit carries a complete genealogy back to component lots, supplier certificates, treatment records, and operator IDs. The audit report exports in a format compatible with the major frameworks, with timestamps that match the certification retention requirements (ITAR retention is 5 years; Part 145 is 2 years; ISO 9001 is whatever your QMS specifies).",
      },
    ],
  },

  {
    slug: "food-beverage",
    title: "Food & Beverage",
    headline: ["Freshness is", "non-negotiable."],
    accentWord: "non-negotiable.",
    heroDesc:
      "Expiration tracking, FEFO-aware picking, temperature-zone discipline, and lot-level recall. Built for operations where one bad date or a wrong-zone putaway becomes an FDA conversation.",
    challenges: [
      {
        title: "Expiration management",
        desc: "Thousands of SKUs with different shelf lives. One missed date can mean a recall, a fine, or a customer complaint that takes years to recover from.",
      },
      {
        title: "FIFO compliance",
        desc: "First-in-first-out isn't optional for many food categories. It's the law, and manual tracking fails at scale.",
      },
      {
        title: "Temperature zones",
        desc: "Frozen, refrigerated, ambient, and dry storage all under one roof. Each zone has different rules, and the wrong putaway destroys product.",
      },
    ],
    solutions: [
      {
        title: "Expiration alerts",
        desc: "Nautilus tracks best-by, sell-by, and use-by dates for every item. Alerts fire days before anything expires, with quantities flagged for promotion or write-off.",
        stat: "5 days",
        statLabel: "Advance notice",
      },
      {
        title: "Automated FIFO",
        desc: "Pick lists are automatically ordered by receipt date. The oldest stock always ships first, with supervisor override logged for any exception.",
        stat: "100%",
        statLabel: "FIFO compliance",
      },
      {
        title: "Zone mapping",
        desc: "Assign temperature zones to warehouse sections. Nautilus prevents items from being stored in wrong conditions, blocking the scan if a putaway would violate the zone.",
        stat: "4",
        statLabel: "Zone types",
      },
    ],
    stats: [
      { val: "80%", label: "Less spoilage" },
      { val: "100%", label: "FIFO compliance" },
      { val: "0", label: "Recall incidents" },
    ],
    cta: "See how Nautilus handles food safety",
    workflow: [
      {
        label: "Receive with dates",
        desc: "Inbound scan captures lot code and best-by date. Cold goods route direct to the refrigerated dock without an intermediate ambient holding step.",
      },
      {
        label: "Zone putaway",
        desc: "Items go to the correct temperature zone: frozen, refrigerated, ambient, or dry. Wrong-zone scans block before the putaway is recorded.",
      },
      {
        label: "FEFO pick",
        desc: "Pick lists order by expiration, not receipt date. Oldest stock always ships first; supervisor override leaves an audit trail with a documented reason.",
      },
      {
        label: "Pack & manifest",
        desc: "Pack with the required liners. Lot manifest prints with the BOL; recall queries trace any lot in seconds.",
      },
    ],
    faqs: [
      {
        q: "Does Nautilus enforce FIFO or FEFO?",
        a: "Both, configurable per product. FIFO (first-in-first-out) drives pick order by receipt date; FEFO (first-expired-first-out) drives by expiration date. Most food customers run FEFO for date-sensitive products and FIFO for shelf-stable. The pick app sorts the list automatically; a supervisor override leaves an audit trail with the reason for the override.",
      },
      {
        q: "How are temperature excursions logged and reported?",
        a: "Nautilus integrates with continuous temperature monitors (DeltaTrak, MadgeTech, Sensitech, or our own paired sensor). Excursions outside the configured range alert immediately to a configured pager list. The excursion report exports with timestamps, duration, and which lots were in the affected zone, ready to attach to a credit request or an FDA submission.",
      },
      {
        q: "Can we recall an entire lot in under an hour?",
        a: "Yes. The recall query takes a lot number and returns every receipt, transfer, pick, ship, and current location for any unit from that lot. On the customer side, it returns every order that includes a unit from that lot, including customer contact information. Most recalls execute in under 5 minutes; the bottleneck becomes reaching out to affected customers, not finding them.",
      },
      {
        q: "How does it handle co-products and weighted-average costing?",
        a: "Co-products (the same SKU produced from different inputs at different costs) post at weighted-average cost across all active lots. The cost basis recalculates on each receipt; reporting can view either current weighted average or per-lot actual cost. For yield-variance accounting, transformations record both input quantities and output yields so variance reports surface meaningful production efficiency data.",
      },
    ],
  },

  {
    slug: "automotive-parts",
    title: "Automotive & Parts",
    headline: ["Every part,", "every vehicle."],
    accentWord: "every",
    heroDesc:
      "Thousands of SKUs across makes, models, model years, and supersession chains. AI part matching resolves OEM, aftermarket, and universal numbers from a plain-English description.",
    challenges: [
      {
        title: "SKU explosion",
        desc: "The same brake pad comes in 40 variants across different makes, models, and years. Picking the wrong one is costly and embarrassing.",
      },
      {
        title: "Cross-referencing",
        desc: "OEM numbers, aftermarket numbers, and universal part numbers all refer to the same item. Or different items. Either way, your staff has to know which is which.",
      },
      {
        title: "Core returns",
        desc: "Remanufactured parts require core tracking. The old part comes back, gets credited, and re-enters inventory. Mistakes here compound.",
      },
    ],
    solutions: [
      {
        title: "AI part matching",
        desc: "Describe what you need in plain language. Nautilus finds the right SKU across all numbering systems instantly, with vehicle-fit filtering applied where available.",
        stat: "<200ms",
        statLabel: "Search speed",
      },
      {
        title: "Cross-reference database",
        desc: "Link OEM, aftermarket, and universal numbers together. One scan shows every way to identify that part, and history preserves the original number used at sale.",
        stat: "3+",
        statLabel: "Number systems",
      },
      {
        title: "Core management",
        desc: "Track cores in, cores out, and credit status. Automated reconciliation catches discrepancies before they compound into a quarterly write-off.",
        stat: "Auto",
        statLabel: "Core tracking",
      },
    ],
    stats: [
      { val: "95%", label: "First-pick accuracy" },
      { val: "70%", label: "Faster lookups" },
      { val: "50%", label: "Less dead stock" },
    ],
    cta: "See how Nautilus handles auto parts",
    workflow: [
      {
        label: "Inbound receipt",
        desc: "Scan against PO with cross-reference matching across OEM, aftermarket, and universal part numbers.",
      },
      {
        label: "Velocity putaway",
        desc: "Fast-movers go to forward pick; slow-movers to deep storage. Cores route to the dedicated core area for credit verification.",
      },
      {
        label: "Catalog-driven pick",
        desc: "Counter calls or web orders resolve through AI part matching. Picker confirms the right SKU and the right variant for the vehicle.",
      },
      {
        label: "Counter or ship",
        desc: "Hand to counter customer with sale logged, or pack for delivery to dealer or installer with tracking pushed back to the originating channel.",
      },
    ],
    faqs: [
      {
        q: "How does AI part matching resolve OEM vs. aftermarket numbers?",
        a: "Each SKU in Nautilus can carry multiple part-number aliases: the OEM number, the aftermarket equivalent, the universal cross-reference, and your own internal SKU. The catalog search resolves any of them to the canonical record. When a counter person describes 'brake pads for a 2018 Ford F-150,' the search returns the catalog matches with vehicle-fit filtering applied, OEM and aftermarket options side by side.",
      },
      {
        q: "Can core returns be tracked back to original purchase orders?",
        a: "Yes. Cores return scans against the original sale or a generic return queue. The credit posts to the customer's account, the core re-enters inventory tagged with its source (which sale, which date), and remanufacturing routes to the appropriate vendor. Discrepancies (cores returned without a matching sale) flag for counter-staff review rather than auto-processing.",
      },
      {
        q: "What about supersession chains — when a part number is replaced by a newer one?",
        a: "Supersession data lives on the SKU record. When a customer asks for the old part number, the catalog returns the current supersession with the substitution noted, and inventory pulls from the current part. Historical sales reports preserve the original part number for warranty and service history; current inventory reports show the superseded SKU consolidated into the active one.",
      },
      {
        q: "Will it integrate with our parts catalog software?",
        a: "Yes. Direct integrations to PartsTech, WHI Solutions, and PartsAuthority are first-party. The catalog provides the make/model/year fitment data; Nautilus provides the inventory and pricing layer. For other catalog software, we have a webhook-and-API bridge with about a week of mapping work during setup.",
      },
    ],
  },

  {
    slug: "pharmaceuticals-medical",
    title: "Pharmaceuticals & Medical",
    headline: ["Compliance at", "every shelf."],
    accentWord: "every",
    heroDesc:
      "Serialized DSCSA tracking, cold-chain logging with excursion alerts, and audit trails ready for FDA, DEA, or state-board review. Every scan timestamps and attributes to a named operator.",
    challenges: [
      {
        title: "Serialization mandates",
        desc: "DSCSA and EU FMD require unique serial numbers on every unit. Manual tracking is impossible at scale, and the penalty for failure is exclusion from the supply chain.",
      },
      {
        title: "Cold chain integrity",
        desc: "Temperature excursions can destroy millions in inventory. You need proof that storage conditions were maintained, not just a claim.",
      },
      {
        title: "Regulatory audits",
        desc: "FDA, DEA, and state boards can audit at any time. Your records need to be complete, accurate, and producible on demand.",
      },
    ],
    solutions: [
      {
        title: "Serial number tracking",
        desc: "Scan and verify individual serial numbers. Nautilus maintains the complete chain of custody for every unit, with EPCIS file generation for outbound shipments.",
        stat: "100%",
        statLabel: "Serialized",
      },
      {
        title: "Cold chain logging",
        desc: "Integrate with temperature monitors. Nautilus logs conditions continuously and alerts immediately on excursions, with reports ready for credit conversations.",
        stat: "Continuous",
        statLabel: "Monitoring",
      },
      {
        title: "Audit-ready reports",
        desc: "Generate complete audit trails in seconds. Every scan, movement, and adjustment is timestamped and attributed to a named operator, with the retention period the regulator requires.",
        stat: "<30s",
        statLabel: "Report generation",
      },
    ],
    stats: [
      { val: "100%", label: "Audit compliance" },
      { val: "0", label: "Excursion losses" },
      { val: "99.99%", label: "Tracking accuracy" },
    ],
    cta: "See how Nautilus handles pharma compliance",
    workflow: [
      {
        label: "Serial receipt",
        desc: "Each unit's serial number scans and reconciles against the supplier's EPCIS file. DSCSA chain of custody begins at the receiving dock.",
      },
      {
        label: "Cold-zone putaway",
        desc: "Temperature-monitored zones with continuous logging. Excursions alert before product damage occurs, not after.",
      },
      {
        label: "Chain-of-custody pick",
        desc: "Pick lists honor lot, expiration, and custody requirements. Substitutions block unless explicitly authorized by a named approver.",
      },
      {
        label: "Verified pack & manifest",
        desc: "Second scanner verifies the pack. EPCIS outbound file generates; tamper-evident seals apply with audit log entry.",
      },
    ],
    faqs: [
      {
        q: "Is Nautilus DSCSA compliant?",
        a: "Yes. Nautilus handles DSCSA serialized product tracking, lot/batch verification, EPCIS file generation for outbound shipments, and the 6-year transaction history retention requirement. We also handle the November 2023 DSCSA enhanced drug distribution security (Phase II) requirements including verification-on-receipt for suspect product. Customers can self-attest using our DSCSA report; for FDA inspections, we generate the trace audit on demand.",
      },
      {
        q: "How is HIPAA handled for medical-device customers?",
        a: "Nautilus is HIPAA compliant and signs a BAA. Inventory data for medical devices doesn't typically contain PHI directly, but customer order data sometimes does (patient name, procedure, facility). We treat order data as PHI by default for medical-device customers: encrypted at rest, role-based access, and audit log of every read.",
      },
      {
        q: "Can we generate EPCIS files for outbound shipments?",
        a: "Yes. EPCIS 1.2 and 2.0 file generation is built in. Outbound shipments to wholesalers and dispensers include the full ASN/EPCIS payload with serial numbers, lot information, and chain of custody. We've tested compatibility with the major DSCSA-compliant trading partners (McKesson, Cardinal, AmerisourceBergen) and the smaller regional wholesalers.",
      },
      {
        q: "What about temperature-excursion proof for high-value cold-chain shipments?",
        a: "Each cold-chain shipment carries continuous temperature data from the in-package data logger, stored against the shipment record. Excursion alerts fire to a configured pager list at the moment they happen. If a wholesaler or hospital pharmacy claims an excursion on receipt, Nautilus can produce the in-transit temperature history within seconds, usually settling the credit conversation before it becomes a dispute.",
      },
    ],
  },

  {
    slug: "ecommerce-3pl",
    title: "E-commerce & 3PL",
    headline: ["Ship faster,", "ship smarter."],
    accentWord: "smarter.",
    heroDesc:
      "Multi-tenant inventory isolation, wave picking for high-volume order batches, and stock sync across every sales channel a client uses. Black Friday capacity that doesn't need pre-coordination.",
    challenges: [
      {
        title: "Multi-channel sync",
        desc: "Shopify, Amazon, eBay, and your own site all show different stock levels. One oversell and your seller ratings take months to recover.",
      },
      {
        title: "Multi-client separation",
        desc: "3PL operators store inventory for dozens of clients. Co-mingling is a contract breach waiting to happen, and clients audit on it regularly.",
      },
      {
        title: "Peak season scaling",
        desc: "Black Friday traffic can 10x your daily order volume. Your warehouse process needs to scale instantly, not after a one-week procurement cycle.",
      },
    ],
    solutions: [
      {
        title: "Real-time channel sync",
        desc: "Every scan updates stock levels across all connected channels within seconds. Overselling becomes impossible once allocation rules are in place.",
        stat: "<5s",
        statLabel: "Sync delay",
      },
      {
        title: "Client isolation",
        desc: "Separate inventory, locations, and reporting by client. Each client sees only their own data through white-labeled dashboards on your subdomain.",
        stat: "Unlimited",
        statLabel: "Client accounts",
      },
      {
        title: "Wave picking",
        desc: "AI groups orders into optimal pick waves. Multiple pickers work simultaneously without path conflicts, doubling throughput per picker.",
        stat: "3x",
        statLabel: "Pick throughput",
      },
    ],
    stats: [
      { val: "99.9%", label: "Order accuracy" },
      { val: "3x", label: "Peak capacity" },
      { val: "0", label: "Oversells" },
    ],
    cta: "See how Nautilus handles e-commerce fulfillment",
    workflow: [
      {
        label: "Multi-tenant receipt",
        desc: "Inbound scan against ASN. Receipts separate inventory by tenant at scan time; tenant ID attaches to every unit and travels with it.",
      },
      {
        label: "Smart putaway",
        desc: "AI routes to bin locations by velocity and tenant rules. Cross-dock flags surface where appropriate, skipping the storage step entirely.",
      },
      {
        label: "Wave pick",
        desc: "Orders group into pick waves by zone and pack-station capacity. Pickers work in parallel without path conflicts; the system rebalances waves live as conditions change.",
      },
      {
        label: "Rate-shop & ship",
        desc: "Pack stations rate-shop carriers. Labels, customs forms, and channel notifications fire on pick completion, not on shipment confirmation.",
      },
    ],
    faqs: [
      {
        q: "How does multi-tenant isolation work for 3PL?",
        a: "Each client tenant has its own inventory namespace within Nautilus. Stock counts, locations, orders, and reporting are tenant-scoped by default; operators only see their assigned tenant unless they have multi-tenant permissions. Cross-tenant transfers (a client moving inventory between facilities you operate) require explicit approval and leave a full audit trail. Co-mingling never happens at the data layer.",
      },
      {
        q: "Can we white-label dashboards for our clients?",
        a: "Yes. Pro and Enterprise plans include white-label dashboards that show your branding to your clients instead of Nautilus's. Clients log in via your subdomain (warehouse.yourcompany.com), see your colors and logo, and the URL never leaves your domain. The white-label runs the same Nautilus UI under the hood — you don't maintain a fork.",
      },
      {
        q: "How is billing handled for 3PL clients with different services?",
        a: "Nautilus exports the data your billing system needs (receipts, storage days by SKU, pick activity, kit assemblies, returns processed). The export feeds into your billing engine; most 3PLs run NetSuite, ShipHero, or a custom billing app. We don't try to be your billing system; we provide the metered events your billing system needs to invoice clients accurately.",
      },
      {
        q: "What about peak-season scaling for Black Friday-style spikes?",
        a: "Nautilus is designed for variable scale. The API handles peaks of 10,000+ orders per minute; the picking floor's bottleneck is staffing, not software. For very large peaks (200,000+ orders in a 24-hour window), we recommend a 72-hour pre-coordination conversation so we can monitor your tenant closely and pre-position any infrastructure adjustments. We have not had a customer's Black Friday fail because of Nautilus.",
      },
    ],
  },

  {
    slug: "electrical-plumbing",
    title: "Electrical & Plumbing Supply",
    headline: ["Small parts,", "big precision."],
    accentWord: "precision.",
    heroDesc:
      "Pipe lengths, wire spools, and small-parts bins, all on one bin-mapped warehouse. Reorder points adjust for seasonal demand patterns instead of relying on static minimums.",
    challenges: [
      {
        title: "Bulk + unit tracking",
        desc: "Wire sells by the foot but ships on 500ft spools. Pipe fittings come in bags of 50 but get picked individually. Inventory systems usually pick one or the other.",
      },
      {
        title: "Bin management",
        desc: "Thousands of small parts in bins, drawers, and racks. Finding a specific fitting in a sea of brass is painful and slow without bin-level mapping.",
      },
      {
        title: "Seasonal demand",
        desc: "HVAC parts spike in summer, heating components in winter. Static reorder points either run dry in peak or sit overstocked in shoulder seasons.",
      },
    ],
    solutions: [
      {
        title: "Dual-unit tracking",
        desc: "Track bulk and unit quantities simultaneously. Nautilus knows a spool has 347 feet remaining without manual counting, and decrements the foot count on each cut.",
        stat: "Dual",
        statLabel: "Unit tracking",
      },
      {
        title: "Bin location mapping",
        desc: "Every bin, drawer, and shelf position is mapped. Scan a part number and Nautilus tells you exactly where to look, with photo confirmation where useful.",
        stat: "<3s",
        statLabel: "Location time",
      },
      {
        title: "Seasonal forecasting",
        desc: "AI analyzes historical patterns and upcoming weather data to adjust reorder points automatically. The model recalibrates monthly as new data arrives.",
        stat: "AI",
        statLabel: "Forecasting",
      },
    ],
    stats: [
      { val: "60%", label: "Less searching" },
      { val: "45%", label: "Less overstock" },
      { val: "99%", label: "Bin accuracy" },
    ],
    cta: "See how Nautilus handles supply distribution",
    workflow: [
      {
        label: "Receive bulk & units",
        desc: "Scan against PO. Bulk items (spools, pipe lengths) record full and partial quantities; small parts record by bag count.",
      },
      {
        label: "Bin map putaway",
        desc: "Small parts route to bin locations on the mapped grid; bulk to floor pallets. The bin map updates live as putaway completes.",
      },
      {
        label: "Counter or pick",
        desc: "Counter customer requests resolve through bin location lookup. The pick path crosses the warehouse once, not three times.",
      },
      {
        label: "Cut & dispatch",
        desc: "Wire or pipe cut to length. Remnants re-scan back into inventory with new length recorded; finished cuts dispatch with the order.",
      },
    ],
    faqs: [
      {
        q: "How does dual-unit tracking handle wire spools and pipe lengths?",
        a: "Each SKU defines its tracked units: a 500-foot wire spool might track in 'feet' for sales but 'spools' for inventory. When 35 feet sells off the spool, Nautilus decrements the spool's remaining footage to 465 feet without affecting the spool count. When the spool empties, it auto-removes from inventory. Counter pricing shows feet-of-wire pricing while warehouse staff scan whole spools — no math required.",
      },
      {
        q: "Can counter staff use Nautilus directly during transactions?",
        a: "Yes. The web dashboard and tablet app are designed for counter use: bin location lookup, stock check, price quote, and sale processing in a single workflow. If counter staff use a separate POS, Nautilus integrates with Lightspeed Retail, Square, and the major distribution-specific POS systems. Sales decrement inventory in real time.",
      },
      {
        q: "How are seasonal reorder points handled?",
        a: "Nautilus's reorder logic uses seasonal pattern analysis from your historical data. A water-heater SKU with strong winter demand and weak summer demand will get different reorder points by month, automatically. The seasonal model needs about 18 months of historical data to calibrate; before that, it falls back to a 30-day rolling average.",
      },
      {
        q: "Will it integrate with our distributor management system?",
        a: "Most distributor management systems (Eclipse, Epicor Eagle, P21, Trade Service) have either direct integrations or webhook bridges. The integration depth varies: P21 and Eclipse get bidirectional inventory sync; Epicor Eagle and Trade Service currently run as inventory exports plus order imports. We're adding richer integrations on customer request.",
      },
    ],
  },

  {
    slug: "agriculture-seed",
    title: "Agriculture & Seed",
    headline: ["From silo", "to shipment."],
    accentWord: "shipment.",
    heroDesc:
      "Bulk storage with scale-integrated receipts and lot-level traceability from field to customer. Treatment records and certificates travel with each lot through storage, processing, and shipment.",
    challenges: [
      {
        title: "Lot traceability",
        desc: "Regulators require full traceability from field to customer. One contaminated lot needs to be recalled in hours, not weeks, and the records have to be complete.",
      },
      {
        title: "Bulk measurement",
        desc: "Grain inventory is measured in bushels, tons, and truckloads. Precision matters when margins are thin and the difference between two scales is a real dollar amount.",
      },
      {
        title: "Treatment tracking",
        desc: "Seed treatments, chemical applications, and certifications need to stay attached to inventory through every transfer. Losing the certificate is losing the sale.",
      },
    ],
    solutions: [
      {
        title: "Full lot traceability",
        desc: "Track every lot from harvest through processing, storage, treatment, and shipping. Instant recall capability with regulator-ready exports.",
        stat: "<1hr",
        statLabel: "Recall time",
      },
      {
        title: "Bulk inventory",
        desc: "Integrate with scales and flow meters. Nautilus updates inventory as product moves in and out of storage, with tare and gross weights both recorded.",
        stat: "Auto",
        statLabel: "Scale integration",
      },
      {
        title: "Treatment records",
        desc: "Attach treatment data, certificates, and test results to inventory lots. Everything travels with the product through transfers, sales, and shipments.",
        stat: "100%",
        statLabel: "Documentation",
      },
    ],
    stats: [
      { val: "100%", label: "Lot traceability" },
      { val: "50%", label: "Faster audits" },
      { val: "0", label: "Compliance gaps" },
    ],
    cta: "See how Nautilus handles agriculture",
    workflow: [
      {
        label: "Scaled receipt",
        desc: "Scale-integrated inbound weights record automatically. Treatment records and supplier certificates attach to each lot at receipt.",
      },
      {
        label: "Silo or bin storage",
        desc: "Lot-segregated storage in silos or bins. GPS tags apply for outdoor pallets and field-side inventory where positioning matters.",
      },
      {
        label: "Treatment & process",
        desc: "Apply treatments with operator scan. Treatment data, certificates, and test results join the lot record without re-entry.",
      },
      {
        label: "Scaled load & trace",
        desc: "Customer load weighs out. The BOL stamps with lot number; recall query returns the chain from field to customer in under an hour.",
      },
    ],
    faqs: [
      {
        q: "Can Nautilus integrate with our scale systems?",
        a: "Yes. Direct integrations to Avery Weigh-Tronix, Cardinal, Rice Lake, and Mettler Toledo industrial scales. The scale push-button records the weight against the active lot at the time of weighing. For truck scales, the inbound and outbound weights both record automatically, with the tare and gross weights stored on the load record.",
      },
      {
        q: "How are treatment records and certificates tracked?",
        a: "Each lot carries an attached document set: treatment dates, products used (with EPA registration numbers for chemicals), certificates from third-party labs (germination tests, contamination screens, organic certifications), and operator IDs for who applied each treatment. The document set travels with the lot through every transfer; when a customer asks for the certificate, it generates from the lot record.",
      },
      {
        q: "What about lot recall — how fast and how complete?",
        a: "Recall queries return the full lot history (inputs, treatments, storage locations, transfers, and outbound customers) in under a minute for any lot in the system. The recall report exports to the format the FDA, USDA, or state department of agriculture requires. We've had customers run recalls in production for actual incidents (one was an organic-certification verification, not a contamination) and the recall data was in the regulator's hands within 90 minutes of the query starting.",
      },
      {
        q: "Does it handle the seasonality of harvest vs. distribution?",
        a: "Yes. Inventory peaks at harvest and depletes through the distribution season; Nautilus's reorder logic accounts for the cyclical pattern. Storage costs (silo dwell time, treatment costs by month) post to the lot record so you see the true cost basis on each lot as it moves to customers. The agriculture and seed customers we work with use the model heavily for pricing decisions in the off-season.",
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════
     DEFAULT_INDUSTRY_FAQS
     ───────────────────────────────────────────────────────────────────────
     Fallback FAQ block, rendered when an industry above doesn't specify
     its own `faqs` array. Also used as the FAQ JSON-LD schema fallback in
     app/industry/[slug]/page.js.
  
     In practice all 8 industries ship with their own per-industry `faqs`,
     so this fallback exists for new industries added in the future before
     someone has written industry-specific Q&As.
     ═══════════════════════════════════════════════════════════════════════ */
export const DEFAULT_INDUSTRY_FAQS = [
  {
    q: "What kind of warehouse size is Nautilus designed for?",
    a: "Operations from 2,000 sq ft up to 500,000+ sq ft are running on Nautilus today. Pricing is per warehouse, not per square foot or per user, so small operations pay the same as large ones. The platform scales horizontally; we have customers running 12 warehouses on one Nautilus tenant.",
  },
  {
    q: "How long does implementation take?",
    a: "Most operations are live within 2-4 weeks. The bulk of that time is data import (product catalog, locations, opening stock counts) and team training. The software itself takes about a day to configure. Enterprise environments with heavy customization run 6-8 weeks.",
  },
  {
    q: "What hardware do I need?",
    a: "iOS or Android phones or tablets with cameras work out of the box. For higher-throughput operations, we recommend dedicated barcode scanners from Zebra, Honeywell, or Socket Mobile — supported natively. Printers (Zebra, Brother, Dymo) work for label printing through standard drivers.",
  },
  {
    q: "Can we try Nautilus before committing to a contract?",
    a: "Yes. We offer a 30-day pilot at no charge for operations that book a discovery call first. Pilots run on your actual inventory data so you can evaluate against your real workflow. If you decide to move forward, the pilot data carries over into your production tenant; if you don't, we delete it.",
  },
];
