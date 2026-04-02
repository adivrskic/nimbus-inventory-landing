export const INDUSTRIES = [
  {
    slug: "flooring-building-materials",
    title: "Flooring & Building Materials",
    headline: ["Built for the", "building trade."],
    accentWord: "building",
    heroDesc:
      "Track hardwood, tile, carpet rolls, and adhesive across sprawling warehouses. Nimbus handles lot numbers, linear footage, and partial-pallet inventory.",
    challenges: [
      {
        title: "Varied unit types",
        desc: "Square footage, linear feet, rolls, pallets, cases — flooring inventory comes in every unit of measure imaginable.",
      },
      {
        title: "Damage tracking",
        desc: "Partial rolls, chipped tiles, and dented boxes need to be flagged and tracked separately from sellable stock.",
      },
      {
        title: "Job-site deliveries",
        desc: "Orders ship to dozens of job sites, not just one address. Tracking what went where is a full-time job.",
      },
    ],
    solutions: [
      {
        title: "Multi-unit inventory",
        desc: "Track the same product in square feet, cases, and pallets simultaneously. Nimbus converts between units automatically.",
        stat: "12+",
        statLabel: "Unit types",
      },
      {
        title: "Condition grading",
        desc: "Scan and tag items by condition — A-grade, B-grade, damaged. Separate stock levels keep your sales team honest.",
        stat: "100%",
        statLabel: "Graded stock",
      },
      {
        title: "Job-site tracking",
        desc: "Assign inventory to specific jobs and delivery addresses. Know exactly what was sent, received, and installed.",
        stat: "Real-time",
        statLabel: "Delivery tracking",
      },
    ],
    stats: [
      { val: "40%", label: "Less shrinkage" },
      { val: "3x", label: "Faster receiving" },
      { val: "99.5%", label: "Order accuracy" },
    ],
    cta: "See how Nimbus handles building materials",
  },
  {
    slug: "manufacturing-assembly",
    title: "Manufacturing & Assembly",
    headline: ["Precision parts,", "precision tracking."],
    accentWord: "precision",
    heroDesc:
      "Real-time parts tracking from raw material intake to finished goods. Manage BOM components across multiple staging areas and production lines.",
    challenges: [
      {
        title: "BOM complexity",
        desc: "A single finished product can have hundreds of components sourced from dozens of suppliers across multiple warehouses.",
      },
      {
        title: "WIP tracking",
        desc: "Work-in-progress inventory sits between raw materials and finished goods — most systems lose visibility here.",
      },
      {
        title: "Production scheduling",
        desc: "Stockouts on a single component can halt an entire production line. You need to know before it happens.",
      },
    ],
    solutions: [
      {
        title: "BOM management",
        desc: "Link raw materials to finished goods. Nimbus automatically decrements component stock when assemblies are completed.",
        stat: "Auto",
        statLabel: "BOM deductions",
      },
      {
        title: "WIP visibility",
        desc: "Track items through every production stage. Scan at each station to move inventory from raw to WIP to finished.",
        stat: "100%",
        statLabel: "Stage visibility",
      },
      {
        title: "Predictive reordering",
        desc: "AI analyzes production schedules and component burn rates to flag shortages days before they hit.",
        stat: "3 days",
        statLabel: "Early warning",
      },
    ],
    stats: [
      { val: "60%", label: "Less downtime" },
      { val: "2x", label: "Throughput" },
      { val: "98%", label: "On-time delivery" },
    ],
    cta: "See how Nimbus supports manufacturing",
  },
  {
    slug: "food-beverage",
    title: "Food & Beverage",
    headline: ["Freshness is", "non-negotiable."],
    accentWord: "non-negotiable.",
    heroDesc:
      "FIFO enforcement, expiration tracking, and temperature zone mapping. Nimbus ensures compliance while cutting spoilage and waste.",
    challenges: [
      {
        title: "Expiration management",
        desc: "Thousands of SKUs with different shelf lives. One missed date can mean a recall, a fine, or a customer complaint.",
      },
      {
        title: "FIFO compliance",
        desc: "First-in-first-out isn't optional — it's the law for many food categories. Manual tracking fails at scale.",
      },
      {
        title: "Temperature zones",
        desc: "Frozen, refrigerated, ambient, and dry storage all under one roof. Each zone has different rules.",
      },
    ],
    solutions: [
      {
        title: "Expiration alerts",
        desc: "Nimbus tracks best-by, sell-by, and use-by dates for every item. Alerts fire days before anything expires.",
        stat: "5 days",
        statLabel: "Advance notice",
      },
      {
        title: "Automated FIFO",
        desc: "Pick lists are automatically ordered by receipt date. The oldest stock always ships first — no exceptions.",
        stat: "100%",
        statLabel: "FIFO compliance",
      },
      {
        title: "Zone mapping",
        desc: "Assign temperature zones to warehouse sections. Nimbus prevents items from being stored in wrong conditions.",
        stat: "4",
        statLabel: "Zone types",
      },
    ],
    stats: [
      { val: "80%", label: "Less spoilage" },
      { val: "100%", label: "FIFO compliance" },
      { val: "0", label: "Recall incidents" },
    ],
    cta: "See how Nimbus handles food safety",
  },
  {
    slug: "automotive-parts",
    title: "Automotive & Parts",
    headline: ["Every part,", "every vehicle."],
    accentWord: "every",
    heroDesc:
      "Thousands of SKUs across makes, models, and years. AI-powered search finds the right part in seconds, not minutes.",
    challenges: [
      {
        title: "SKU explosion",
        desc: "The same brake pad comes in 40 variants across different makes, models, and years. Picking the wrong one is costly.",
      },
      {
        title: "Cross-referencing",
        desc: "OEM numbers, aftermarket numbers, and universal part numbers all refer to the same item. Or different items.",
      },
      {
        title: "Core returns",
        desc: "Remanufactured parts require core tracking — the old part comes back, gets credited, and re-enters inventory.",
      },
    ],
    solutions: [
      {
        title: "AI part matching",
        desc: "Describe what you need in plain language. Nimbus finds the right SKU across all numbering systems instantly.",
        stat: "<200ms",
        statLabel: "Search speed",
      },
      {
        title: "Cross-reference database",
        desc: "Link OEM, aftermarket, and universal numbers together. One scan shows every way to identify that part.",
        stat: "3+",
        statLabel: "Number systems",
      },
      {
        title: "Core management",
        desc: "Track cores in, cores out, and credit status. Automated reconciliation catches discrepancies before they compound.",
        stat: "Auto",
        statLabel: "Core tracking",
      },
    ],
    stats: [
      { val: "95%", label: "First-pick accuracy" },
      { val: "70%", label: "Faster lookups" },
      { val: "50%", label: "Less dead stock" },
    ],
    cta: "See how Nimbus handles auto parts",
  },
  {
    slug: "pharmaceuticals-medical",
    title: "Pharmaceuticals & Medical",
    headline: ["Compliance at", "every shelf."],
    accentWord: "every",
    heroDesc:
      "Serialized tracking, cold chain management, and regulatory audit trails. Every scan is logged, timestamped, and tamper-proof.",
    challenges: [
      {
        title: "Serialization mandates",
        desc: "DSCSA and EU FMD require unique serial numbers on every unit. Manual tracking is impossible at scale.",
      },
      {
        title: "Cold chain integrity",
        desc: "Temperature excursions can destroy millions in inventory. You need proof that storage conditions were maintained.",
      },
      {
        title: "Regulatory audits",
        desc: "FDA, DEA, and state boards can audit at any time. Your records need to be complete, accurate, and instant.",
      },
    ],
    solutions: [
      {
        title: "Serial number tracking",
        desc: "Scan and verify individual serial numbers. Nimbus maintains the complete chain of custody for every unit.",
        stat: "100%",
        statLabel: "Serialized",
      },
      {
        title: "Cold chain logging",
        desc: "Integrate with temperature monitors. Nimbus logs conditions and alerts immediately on excursions.",
        stat: "Continuous",
        statLabel: "Monitoring",
      },
      {
        title: "Audit-ready reports",
        desc: "Generate complete audit trails in seconds. Every scan, movement, and adjustment is timestamped and attributed.",
        stat: "<30s",
        statLabel: "Report generation",
      },
    ],
    stats: [
      { val: "100%", label: "Audit compliance" },
      { val: "0", label: "Excursion losses" },
      { val: "99.99%", label: "Tracking accuracy" },
    ],
    cta: "See how Nimbus handles pharma compliance",
  },
  {
    slug: "ecommerce-3pl",
    title: "E-commerce & 3PL",
    headline: ["Ship faster,", "ship smarter."],
    accentWord: "smarter.",
    heroDesc:
      "Multi-client inventory separation, wave picking optimization, and real-time stock sync across every sales channel.",
    challenges: [
      {
        title: "Multi-channel sync",
        desc: "Shopify, Amazon, eBay, and your own site all show different stock levels. One oversell and your ratings tank.",
      },
      {
        title: "Multi-client separation",
        desc: "3PL operators store inventory for dozens of clients. Co-mingling is a contract breach waiting to happen.",
      },
      {
        title: "Peak season scaling",
        desc: "Black Friday traffic can 10x your daily order volume. Your warehouse process needs to scale instantly.",
      },
    ],
    solutions: [
      {
        title: "Real-time channel sync",
        desc: "Every scan updates stock levels across all connected channels within seconds. Overselling becomes impossible.",
        stat: "<5s",
        statLabel: "Sync delay",
      },
      {
        title: "Client isolation",
        desc: "Separate inventory, locations, and reporting by client. Each client sees only their own data.",
        stat: "Unlimited",
        statLabel: "Client accounts",
      },
      {
        title: "Wave picking",
        desc: "AI groups orders into optimal pick waves. Multiple pickers work simultaneously without path conflicts.",
        stat: "3x",
        statLabel: "Pick throughput",
      },
    ],
    stats: [
      { val: "99.9%", label: "Order accuracy" },
      { val: "3x", label: "Peak capacity" },
      { val: "0", label: "Oversells" },
    ],
    cta: "See how Nimbus handles e-commerce fulfillment",
  },
  {
    slug: "electrical-plumbing",
    title: "Electrical & Plumbing Supply",
    headline: ["Small parts,", "big precision."],
    accentWord: "precision.",
    heroDesc:
      "Manage pipe lengths, wire spools, and small-parts bins with barcode precision. AI predicts reorder points by season and job type.",
    challenges: [
      {
        title: "Bulk + unit tracking",
        desc: "Wire sells by the foot but ships on 500ft spools. Pipe fittings come in bags of 50 but get picked individually.",
      },
      {
        title: "Bin management",
        desc: "Thousands of small parts in bins, drawers, and racks. Finding a specific fitting in a sea of brass is painful.",
      },
      {
        title: "Seasonal demand",
        desc: "HVAC parts spike in summer, plumbing in winter. Static reorder points don't account for seasonal patterns.",
      },
    ],
    solutions: [
      {
        title: "Dual-unit tracking",
        desc: "Track bulk and unit quantities simultaneously. Nimbus knows a spool has 347 feet remaining without manual counting.",
        stat: "Dual",
        statLabel: "Unit tracking",
      },
      {
        title: "Bin location mapping",
        desc: "Every bin, drawer, and shelf position is mapped. Scan a part number and Nimbus tells you exactly where to look.",
        stat: "<3s",
        statLabel: "Location time",
      },
      {
        title: "Seasonal forecasting",
        desc: "AI analyzes historical patterns and upcoming weather data to adjust reorder points automatically.",
        stat: "AI",
        statLabel: "Forecasting",
      },
    ],
    stats: [
      { val: "60%", label: "Less searching" },
      { val: "45%", label: "Less overstock" },
      { val: "99%", label: "Bin accuracy" },
    ],
    cta: "See how Nimbus handles supply distribution",
  },
  {
    slug: "agriculture-seed",
    title: "Agriculture & Seed",
    headline: ["From silo", "to shipment."],
    accentWord: "shipment.",
    heroDesc:
      "Bulk storage management, harvest lot tracking, and seed treatment records. GPS-tagged inventory from silo to shipment.",
    challenges: [
      {
        title: "Lot traceability",
        desc: "Regulators require full traceability from field to customer. One contaminated lot needs to be recalled in hours, not weeks.",
      },
      {
        title: "Bulk measurement",
        desc: "Grain inventory is measured in bushels, tons, and truckloads. Precision matters when margins are thin.",
      },
      {
        title: "Treatment tracking",
        desc: "Seed treatments, chemical applications, and certifications need to stay attached to inventory through every transfer.",
      },
    ],
    solutions: [
      {
        title: "Full lot traceability",
        desc: "Track every lot from harvest through processing, storage, treatment, and shipping. Instant recall capability.",
        stat: "<1hr",
        statLabel: "Recall time",
      },
      {
        title: "Bulk inventory",
        desc: "Integrate with scales and flow meters. Nimbus updates inventory as product moves in and out of storage.",
        stat: "Auto",
        statLabel: "Scale integration",
      },
      {
        title: "Treatment records",
        desc: "Attach treatment data, certificates, and test results to inventory lots. Everything travels with the product.",
        stat: "100%",
        statLabel: "Documentation",
      },
    ],
    stats: [
      { val: "100%", label: "Lot traceability" },
      { val: "50%", label: "Faster audits" },
      { val: "0", label: "Compliance gaps" },
    ],
    cta: "See how Nimbus handles agriculture",
  },
];
