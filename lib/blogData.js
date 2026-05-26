// ────────────────────────────────────────────────────────────────────────
// blogData.js
//
// Editorial guidelines for this file (please keep to them):
//   • We're a young company. No customer names, no case studies, no
//     testimonials — we don't have a track record to cite yet.
//   • No invented statistics. No "99.7% accuracy", "240 warehouses",
//     "three days out", "10,000 hours of audio", dollar figures, or
//     percentages we can't stand behind. Describe capabilities
//     qualitatively instead.
//   • Two kinds of posts only: (1) honest, informational explainers about
//     what Nautilus does, and (2) genuinely useful industry education about
//     warehouses and inventory. Established domain facts (barcode quiet
//     zones, FEFO, ABC, ZONE-AISLE-BAY-LEVEL) are fine — they're real.
//   • Tags drive the filter chips automatically (BlogListClient derives the
//     tag set from this data), so add a tag and it just appears.
// ────────────────────────────────────────────────────────────────────────

export const BLOG_POSTS = [
  /* ──────────────────────────────────────────────────────────────────
     May 20, 2026 · Product · Overview
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "meet-nautilus",
    tag: "Product",
    date: "May 20, 2026",
    readTime: "4 min",
    title: "Meet Nautilus: inventory management built for the floor",
    desc: "A short introduction to what we're building and who it's for — a warehouse and inventory platform designed around the people actually doing the work.",
    content: [
      {
        type: "p",
        text: "Nautilus is an inventory and warehouse management platform. The short version: a fast mobile app your team uses on the floor, paired with a dashboard your managers use to plan, and a set of AI features that quietly do the bookkeeping and the math so your people can focus on the physical work.",
      },
      {
        type: "p",
        text: "We're an early company, and we'd rather be honest about that than pretend otherwise. What follows on this blog is two things: straightforward explanations of what the product does, and the warehouse and inventory knowledge we care about as we build it. No customer logos, no inflated numbers — just the work.",
      },
      { type: "h2", text: "The shape of the product" },
      {
        type: "p",
        text: "On the floor, operators work from their phone. They scan to receive, put away, pick, count, relocate, return, and ship. They can talk to the app instead of tapping when their hands are full. The app works whether or not the warehouse WiFi is cooperating, because warehouses are hostile to radio and an inventory app that freezes when the signal drops is worse than useless.",
      },
      {
        type: "p",
        text: "In the office, managers get a dashboard: live inventory, order and fulfillment status, a model of the physical floor, analytics that summarize what's happening in plain language, and alerts when something looks off. Purchase orders can be drafted automatically from demand signals. The system connects to the accounting, e-commerce, and shipping tools you already run, so the floor and the books stay in sync without manual re-entry.",
      },
      { type: "h2", text: "What we believe" },
      {
        type: "p",
        text: "A few opinions shape everything we build. Software should make the operator faster, not busier. The system should earn trust by being right and admitting when it isn't. And the hard, unglamorous parts — offline sync, label legibility, receiving accuracy — matter more than the flashy ones, because they're where warehouses actually lose time and money.",
      },
      {
        type: "p",
        text: "The rest of this blog goes deeper on each piece. If you run a warehouse and something here is wrong or missing, tell us. We're new enough that your feedback genuinely changes what we build next.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     May 14, 2026 · Product · Barcode scanning
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "barcode-scanning-real-world-labels",
    tag: "Product",
    date: "May 14, 2026",
    readTime: "4 min",
    title: "Barcode scanning built for real-world labels",
    desc: "Pristine barcodes are easy. Warehouses don't have pristine barcodes. Here's how Nautilus scanning is built for scuffed, partial, and double-labeled items.",
    content: [
      {
        type: "p",
        text: "Any scanner can read a crisp barcode under good light. The barcodes in a real warehouse are scuffed, peeling, frosted with freezer condensation, printed at an angle, or partially torn by a forklift fork. The job isn't reading a perfect label; it's reading the labels you actually have.",
      },
      { type: "h2", text: "Formats, without you choosing one" },
      {
        type: "p",
        text: "Nautilus reads the formats warehouses use — Code 128, Code 39, EAN-13, UPC-A, QR, and Data Matrix — in a single pass. The operator never has to tell the app which format they're scanning. It identifies and decodes whatever is in frame.",
      },
      {
        type: "p",
        text: "The scan also feels instant. We hold ourselves to a simple bar: the operator should never register a wait between pointing the camera and seeing the result. A scan that makes someone pause is a scan that breaks their rhythm, and rhythm is most of an operator's speed.",
      },
      { type: "h2", text: "When an item has two barcodes" },
      {
        type: "p",
        text: "A common mess: a bag arrives from a supplier with the supplier's barcode already on it, and your own internal label gets added alongside. Now the item has two barcodes encoding two different identities. A scanner that simply grabs whichever code its camera locks onto first will quietly log receipts against the wrong identity.",
      },
      {
        type: "p",
        text: "When Nautilus sees an item that resolves to more than one identity, it asks once which barcode to treat as canonical, then remembers. A wrong scan nobody notices is far more expensive than a one-time question, so we'd rather ask.",
      },
      { type: "h2", text: "Register, locate, and act in one motion" },
      {
        type: "p",
        text: "Scanning isn't just lookup. From the scan view an operator can register a brand-new item, find where an existing one lives, pick it, receive it, relocate it, count it, adjust it, or return it. The barcode is the entry point to every action, so the device stays in the operator's hand and the work keeps moving.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     May 08, 2026 · Product · Voice commands
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "voice-commands-hands-free",
    tag: "Product",
    date: "May 08, 2026",
    readTime: "4 min",
    title: "Voice commands, for when your hands are full",
    desc: "Warehouse workers rarely have a free hand. Voice lets operators scan, count, and look things up without putting down what they're carrying.",
    content: [
      {
        type: "p",
        text: "Watch anyone work a warehouse floor and you'll notice they almost never have a free hand. There's a box, a pallet jack, a ladder rung. Every time the system needs an input, the operator has to set something down, pull out a device, and tap. The friction is small per action and large per shift.",
      },
      {
        type: "p",
        text: "Voice commands remove that. An operator can speak the action instead of stopping to tap it.",
      },
      { type: "h2", text: "What you can say" },
      {
        type: "p",
        text: "The same actions available by tap are available by voice: pick, putaway, receive, relocate, count, adjust, ship, return. You can also ask where a product lives, check an order's status, or pull up item details without looking at the screen. The system keeps context — once you've scanned or named an item, a follow-up command knows what you're referring to.",
      },
      { type: "h2", text: "Built for a loud room" },
      {
        type: "p",
        text: "General-purpose voice assistants fall apart in a warehouse. Forklifts, conveyors, radio chatter, and a conversation carrying from the next aisle all confuse a model trained on quiet living rooms. We tuned voice recognition for the acoustic reality of a working floor so it holds up under that kind of background noise.",
      },
      {
        type: "p",
        text: "Just as important: when the system isn't sure what it heard, it asks instead of guessing. The cost of a confident wrong action that nobody catches is much higher than the cost of a quick confirmation, so we bias toward confirming.",
      },
      {
        type: "p",
        text: "Voice is optional and per-device. If a particular operator or station works better with scanning alone, that's fine — voice is there for the moments when a free hand is the thing you don't have.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     May 01, 2026 · Product · Spatial Intelligence
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "spatial-intelligence-living-map",
    tag: "Product",
    date: "May 01, 2026",
    readTime: "5 min",
    title: "Spatial Intelligence: your warehouse as a living map",
    desc: "Most inventory software treats a warehouse as a flat list of bin codes. Yours isn't flat. Spatial Intelligence learns the real shape of your floor.",
    content: [
      {
        type: "p",
        text: "Most inventory software models a warehouse as a flat list of location codes. But your warehouse isn't flat. It has wide aisles and narrow ones, dead ends, a forklift turnaround that snarls traffic at predictable times, and a cold room you have to walk around to reach the back of a section. A flat list knows none of that.",
      },
      {
        type: "p",
        text: "Spatial Intelligence is how we teach the software the real shape of your floor.",
      },
      { type: "h2", text: "It builds itself from normal work" },
      {
        type: "p",
        text: "There's no hardware to install and no manual mapping exercise. As your team scans through their normal day, the system learns the physical relationships between locations — which bins are actually near each other, how far apart sections really are, where movement clusters. Over the first couple of weeks of ordinary operations the model sharpens into a genuinely useful picture of the space.",
      },
      { type: "h2", text: "Why a spatial model is worth having" },
      {
        type: "p",
        text: "Once the software understands the floor as a place rather than a spreadsheet, a few things get better. Putaway suggestions can favor real physical proximity, so items that are frequently picked together end up stored near each other and future pick trips get shorter.",
      },
      {
        type: "p",
        text: "Routing can account for congestion. If a cluster of pickers is already working one aisle, the system can send the next person a slightly longer way around rather than into the jam — trading a few seconds of walking for avoiding a much longer wait. And travel-aware pick paths beat a printed list that has no idea two adjacent codes are nowhere near each other physically.",
      },
      {
        type: "p",
        text: "None of this requires you to draw a map. The point of Spatial Intelligence is that the map draws itself, and then quietly makes every downstream decision a little smarter.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Apr 24, 2026 · Product · Predictive depletion
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "predicting-stockouts-before-they-happen",
    tag: "Product",
    date: "Apr 24, 2026",
    readTime: "4 min",
    title: "Seeing stockouts before they happen",
    desc: "A stockout is expensive in ways that don't show up on one line. Nautilus forecasts depletion early enough that you can reorder calmly instead of in a panic.",
    content: [
      {
        type: "p",
        text: "A stockout rarely costs you just the missed sale. It triggers an emergency reorder, often at a worse price, sometimes with expedited shipping. The rushed replenishment then arrives all at once and leaves you overstocked, tying up cash and shelf space. The goal of forecasting isn't a perfect crystal ball — it's enough lead time to act calmly instead of reactively.",
      },
      { type: "h2", text: "What the forecast watches" },
      {
        type: "p",
        text: "Nautilus projects demand for each item from its own history: the underlying run rate, whether that rate is trending up or down, and any pattern that repeats by day of week or season. When projected demand is on track to outrun what's on hand (less the buffer you want to keep), it raises a flag while there's still room to respond.",
      },
      {
        type: "p",
        text: "A new warehouse starts with sensible defaults and gets more accurate as it accumulates its own data. The forecast is specific to your operation, because the way a building-materials yard sells is nothing like the way a coffee roaster sells.",
      },
      { type: "h2", text: "The hard part: telling a spike from a fluke" },
      {
        type: "p",
        text: "The tricky case is the item that sells steadily for months and then gets ordered in one enormous batch by a single customer. Is that a new normal or a one-off? Rather than silently bake the spike into the forecast, the system flags the unusual pattern and asks you to say which it is, then adjusts accordingly.",
      },
      {
        type: "p",
        text: "Forecasting won't fix a broken process, and we don't pretend it replaces a buyer's judgment. It's there to make sure the boring, predictable stockouts — the ones you'd kick yourself for — get caught early enough that handling them is routine.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Apr 17, 2026 · Product · Cycle counting
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "smarter-cycle-counting",
    tag: "Product",
    date: "Apr 17, 2026",
    readTime: "5 min",
    title: "Count what's likely wrong, not what's on the schedule",
    desc: "Most cycle-count programs are scheduled by item value. We think the better question isn't how often to count something — it's how likely it is to be wrong right now.",
    content: [
      {
        type: "p",
        text: "The classic approach to cycle counting is ABC: sort items by value, count the high-value ones often and the low-value ones rarely. It's a reasonable answer to an old question — how do you spend scarce counting time when every count is slow and manual?",
      },
      {
        type: "p",
        text: "But ABC never asks the question that actually matters: is this item likely to be wrong? It prioritizes by value, not by probability of error. So you spend labor recounting expensive items the system already has right, while a cheap, fast-moving, heavily-handled item drifts out of sync unnoticed.",
      },
      { type: "h2", text: "A count that finds nothing is a wasted count" },
      {
        type: "p",
        text: "The whole purpose of cycle counting is to catch discrepancies before they compound into stockouts and mispicks. A count that confirms what the system already knew cost you labor and produced no information. The counts worth doing are the ones likely to surface a real problem.",
      },
      { type: "h2", text: "How Nautilus prioritizes" },
      {
        type: "p",
        text: "Instead of a value-based schedule, Nautilus ranks locations by how likely they are to be wrong right now. It weighs things like how long it's been since a location was last counted, how much picking, receiving, and relocation activity it has seen since, whether it sits near a congested zone where items get bumped and restacked, and whether that particular bin has a history of being problematic.",
      },
      {
        type: "p",
        text: "The output is a ranked queue: start at the top, where a discrepancy is most likely, and work down. Operators can always override it, but the default sends them to the counts most likely to matter.",
      },
      {
        type: "p",
        text: 'One design note from experience: we present priority as plain levels — critical, high, medium, low — rather than a precise-looking probability. A number like "87%" gets misread as "you\'ll find a problem 87% of the time," which isn\'t what it means. Clear priority bands communicate the same ranking without the false precision.',
      },
      {
        type: "p",
        text: "Risk-based counting won't rescue a broken process. If labels are unreadable or one station is systematically miscounting, you'll just keep recounting bad data — fix the root cause first. But when the process is sound, pointing your counting labor at the likely errors makes every count pull more weight.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Apr 10, 2026 · Product · Lot & expiration
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "lot-and-expiration-tracking",
    tag: "Product",
    date: "Apr 10, 2026",
    readTime: "5 min",
    title: "Lot and expiration tracking, and the logic of FEFO",
    desc: "If your products expire or need to be traceable to a batch, the rules change at the receiving step. Here's what lot tracking does and who actually needs it.",
    content: [
      {
        type: "p",
        text: "For a lot of operations, an item is just an item: you have some quantity of SKU X and that's all you need to know. But for food, beverage, pharmaceuticals, cosmetics, agriculture, and chemicals, that's not enough. You need to know which batch a unit came from and when it expires. That changes how the warehouse works, starting at the dock.",
      },
      { type: "h2", text: "What lot tracking actually records" },
      {
        type: "p",
        text: 'With lot tracking on, receiving captures more than a quantity. Instead of "we received 200 units of SKU X," the operator records "200 units of SKU X, lot 24-A19, expiring November 4." That lot identity then travels with the product through every later step — putaway, count, pick, ship. If a lot is ever recalled, you can trace exactly which orders contained units from it instead of guessing or pulling everything.',
      },
      { type: "h2", text: "FEFO: the pick rule that pairs with it" },
      {
        type: "p",
        text: "FEFO stands for first-expired-first-out. When several lots of the same item are available, the pick recommender routes the operator to the one expiring soonest, so the oldest stock ships first and less product expires on the shelf. The operator doesn't have to track expiration dates in their head — the system sends them to the right bin.",
      },
      {
        type: "p",
        text: "Expiration alerts round it out, warning operations leads as dates approach. Sensible thresholds differ wildly by category — a two-week window means something very different for fresh produce than for a shelf-stable reagent — so they're configurable.",
      },
      { type: "h2", text: "It isn't free, and it isn't for everyone" },
      {
        type: "p",
        text: "Lot tracking adds a field at receiving, and someone has to enter the right lot every time. If your suppliers don't print lot numbers, you have to invent and apply your own conventions — workable, but a real change to the receiving workflow. If your inventory turns over in days, expiration is effectively implicit and the overhead may not be worth it.",
      },
      {
        type: "p",
        text: "Our stance is simple: the operations that need lot tracking really need it, so it's there and it's thorough. We're not going to push it on operations that don't.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Apr 03, 2026 · Product · Integrations
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "integrations-your-existing-stack",
    tag: "Product",
    date: "Apr 03, 2026",
    readTime: "3 min",
    title: "Nautilus plugs into the stack you already run",
    desc: "Your accounting, storefront, and shipping tools already work. Nautilus is built to sit next to them and keep the floor and the books in sync — not to replace them.",
    content: [
      {
        type: "p",
        text: "We don't think a warehouse system should demand that you rip out everything else. Your books live in your accounting tool, your storefront is wherever you sell, your shipping runs through a carrier platform. Nautilus is designed to connect to those, not push them out.",
      },
      { type: "h2", text: "Accounting and ERP" },
      {
        type: "p",
        text: "Connections to tools like QuickBooks, Xero, FreshBooks, Sage, NetSuite, and SAP Business One mean inventory movements on the floor flow into your books. Receipts, cost of goods, and inventory valuations stay current without anyone keying journal entries by hand.",
      },
      { type: "h2", text: "E-commerce and POS" },
      {
        type: "p",
        text: "With your sales channels connected — Shopify, WooCommerce, Amazon, Square, BigCommerce, Lightspeed — a sale decrements warehouse stock, so you're not overselling the same unit across two channels, and fulfillment can begin the moment an order lands.",
      },
      { type: "h2", text: "Shipping and logistics" },
      {
        type: "p",
        text: "Shipping connections — ShipStation, Shippo, EasyPost, and carriers like FedEx, UPS, and DHL — let a picked order move into your shipping platform, print a label, push tracking back to the sales channel, and notify the customer, off the back of the same workflow your team already runs.",
      },
      {
        type: "p",
        text: "We'd rather a smaller set of connections that go deep than a long list of shallow ones nobody uses twice. The Integrations page in the dashboard has the current list and what each one syncs.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Mar 27, 2026 · Engineering · Offline-first
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "offline-first-warehouses",
    tag: "Engineering",
    date: "Mar 27, 2026",
    readTime: "6 min",
    title: "Why we built Nautilus offline-first",
    desc: "Warehouses are hostile to radio. An inventory app that needs a network round-trip before it confirms an action is an app that will fail when it matters most.",
    content: [
      {
        type: "p",
        text: 'Warehouses are hard on wireless. Metal racking, concrete, cold rooms that behave like Faraday cages, forklifts throwing electrical noise. WiFi works most of the time — but "most of the time" is not a foundation for a system operators rely on every few seconds. So we made a decision early: every action in Nautilus has to work without a network.',
      },
      { type: "h2", text: "What offline-first means here" },
      {
        type: "p",
        text: "When an operator scans, counts, adjusts, or speaks a command, the app confirms it immediately on the device — it doesn't wait for a server to answer. The action is recorded locally and synced up when the network is available. To the operator it always feels instant, whether the signal is strong, weak, or gone.",
      },
      {
        type: "p",
        text: "The expensive, invisible engineering of an inventory app isn't the scanning or the AI. It's this sync layer underneath, and specifically what happens when several people change overlapping things while disconnected.",
      },
      { type: "h2", text: "The problem with naïve queueing" },
      {
        type: "p",
        text: "The obvious approach — queue each operator's actions on the device and replay them when the network returns — works fine for one person and breaks the moment two people touch the same stock. Picture two pickers, both offline, both pulling from the same bin. Each sees the same starting count and each picks one. If their queues simply replay later, the counts and what each device believes can disagree, and the next sync looks like a glitch.",
      },
      {
        type: "p",
        text: "It gets harder when the conflicting actions are different kinds: one person adjusts a count while another relocates the item and a third is mid-audit assuming a fixed quantity. Replaying a queue in arrival order produces inconsistent state and confused, annoyed operators.",
      },
      { type: "h2", text: "Resolving conflicts sensibly" },
      {
        type: "p",
        text: "So conflicts get resolved by rules that mirror what would have happened in the physical world. Two picks from the same bin don't really conflict — both are valid decrements, so they accumulate and the count lands correctly; we can optionally tell each operator a colleague also picked there. A relocation that conflicts with a pick yields to the pick, because in the real world the picker already grabbed the item. An adjustment beats almost anything, because it represents a human standing at the bin telling us what's actually there, and we trust that over the system's assumption.",
      },
      { type: "h2", text: "A couple of hard-won principles" },
      {
        type: "p",
        text: "Treat the device as untrusted and tough. Warehouse devices get dropped, knocked off shelves, and run out of battery in bad moments. Hard crashes are routine, not exceptional, so anything that can't survive a device misbehaving doesn't belong on the device.",
      },
      {
        type: "p",
        text: "And optimize for perceived speed, not just real speed. An operator who scans and sees a confirmation instantly will call the app fast, even if the server finishes its bookkeeping a moment later. The local, optimistic confirmation is the thing they feel. Offline-first work is unglamorous and mostly invisible when it's done right — which is exactly the point.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Mar 20, 2026 · Product · Anomaly detection
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "anomaly-detection-for-operators",
    tag: "Product",
    date: "Mar 20, 2026",
    readTime: "4 min",
    title: "Anomaly detection that helps operators, not watches them",
    desc: "A system that sees every event can surface the few that actually matter. We built that carefully, because the line between 'helpful' and 'surveillance' is real.",
    content: [
      {
        type: "p",
        text: "A warehouse produces a constant stream of events — scans, counts, adjustments, movements. A person can't watch all of it, and watching all of it wouldn't help anyway; almost everything is normal. The useful thing is to surface the handful of events that are genuinely unusual, so a manager can take a look.",
      },
      { type: "h2", text: "What it does" },
      {
        type: "p",
        text: "Anomaly detection watches the stream and flags patterns that fall outside what's normal for your operation: an adjustment far larger than usual, activity at an odd hour, a receipt that doesn't match its purchase order, a location behaving unlike itself. It doesn't decide what the pattern means — it raises it for a human to interpret. The judgment stays with your team.",
      },
      { type: "h2", text: "Tuned to be trusted, not ignored" },
      {
        type: "p",
        text: "An alert system is only useful if alerts are taken seriously, and they're only taken seriously if there aren't too many. We default to a conservative threshold that surfaces the genuinely notable and stays quiet otherwise. Every alert has a simple useful / not-useful control, and that feedback makes the system better at showing you the things your team actually acts on.",
      },
      { type: "h2", text: "A deliberate stance on surveillance" },
      {
        type: "p",
        text: "We're wary of the framing \"AI watches your warehouse.\" It isn't wrong, but it can curdle into something we don't want to build. So a few choices are deliberate: alerts go to operations leads, not to individual operators' records. The system never disciplines anyone — it surfaces a pattern, and a person decides what, if anything, to do. The defaults are conservative on purpose.",
      },
      {
        type: "p",
        text: "Used well, it catches the quiet problems — a mislabeled vendor shipment, a reporting bug inflating numbers, a process drifting out of spec — before they compound. That's the value: not catching people, but catching the unusual stuff before it costs you.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Mar 13, 2026 · Industry · Bin location naming
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "bin-location-naming-guide",
    tag: "Industry",
    date: "Mar 13, 2026",
    readTime: "7 min",
    title: "Bin location naming will outlast every system you buy",
    desc: "Whatever you print on the labels in year one is what you'll be reading in year fifteen. A practical guide to naming bin locations so they survive growth.",
    content: [
      {
        type: "p",
        text: "Over the years a company will change inventory systems, migrate data, retrain staff, and rewrite integrations. One thing tends not to change: the names of the bin locations. Whatever you put on the wall early is what you'll be reading a decade later. Get it wrong and you live with it for a long time, so it's worth getting right the first time.",
      },
      { type: "h2", text: "What good naming buys you" },
      {
        type: "p",
        text: "Bin names get used constantly — on labels, on pick lists, in scans, in voice commands, in reports, in conversations between operators. A good name tells someone everything they need about a location without looking anywhere else. A bad one forces them to memorize the layout, ask a coworker, or guess. The cost compounds: slower training, un-optimizable pick paths, and reports that can't group by zone or level because that information isn't in the name.",
      },
      { type: "h2", text: "Four principles" },
      {
        type: "p",
        text: "Encode the structural axis first. A location is a hierarchy — a zone, an aisle within it, a bay within that, a level within that. Walk it from most general to most specific, left to right. Something like P-A04-12-B reads as pick zone, aisle 04, bay 12, level B. Learn the format once and you can decode every bin in the building.",
      },
      {
        type: "p",
        text: "Let the zone encode purpose, not just geography. The first character can tell you what a location is for — for example P for pick, R for reserve, S for staging, D for damaged or quarantine, X for cross-dock, Y for yard. Now the name communicates role, not only place.",
      },
      {
        type: "p",
        text: "Zero-pad your numbers. This sounds petty; it isn't. A01, A02, A10 sort correctly as text. A1, A2, A10 do not — A10 sorts between A1 and A2, and every report you generate inherits that wrongness. Pick a consistent width (two digits is usually enough, three if you'll grow large) and never use one.",
      },
      {
        type: "p",
        text: 'Put the level last, as a letter. Level is the smallest unit; encoding it as a letter (A at floor, B at shoulder height, and up from there) distinguishes it from the numeric fields and lets the system treat "anywhere on bay 12" as a clean prefix match.',
      },
      {
        type: "p",
        text: "Together these give a canonical format — ZONE-AISLE-BAY-LEVEL — and the hyphens are not optional. The hyphen is a checksum for the eye; don't run the fields together.",
      },
      { type: "h2", text: "Common anti-patterns" },
      {
        type: "p",
        text: "The unspeakable ERP default. Out of the box some systems suggest names so long and punctuation-heavy that no one can say them aloud or fit them on a readable label. Whatever the default optimizes for, it isn't the human saying the name eighty times a day.",
      },
      {
        type: "p",
        text: "The alphabet-only scheme. Using AA, AB, AC for positions breaks the moment you pass twenty-six of something, and the letters don't decode to anything a person can reason about. When the thing being counted is numeric, use numbers.",
      },
      {
        type: "p",
        text: 'The charming-but-arbitrary scheme. Street-style names ("Fourth Avenue, bin 12") feel friendly on day one and become a memory test by day fifty, because nothing in the name tells you where Fourth Avenue actually is. And inherited legacy names that "everyone just knows" are a tax you charge every new hire.',
      },
      { type: "h2", text: "If you're already stuck" },
      {
        type: "p",
        text: 'You can migrate. Design the new scheme and run it past people who actually pick and put away, not just managers. Then run both names in parallel for a couple of months — labels show both, scans accept both — before retiring the old names from the interface while keeping them as aliases in the database for old documents and long-tenured staff. The one rule that makes or breaks it: never re-introduce the old scheme "just for this section." Half a migration is worse than none.',
      },
      {
        type: "p",
        text: "And if your warehouse is brand new and unnamed, you're in the best position you'll ever be in. Spend an afternoon. Use ZONE-AISLE-BAY-LEVEL, zero-pad the numbers, then leave it alone for fifteen years.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Mar 06, 2026 · Industry · Label printing
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "printing-barcode-labels-that-scan",
    tag: "Industry",
    date: "Mar 06, 2026",
    readTime: "6 min",
    title: "Printing barcode labels that actually scan",
    desc: "The bin name is half the job. The physical label is the other half, and it's where a lot of warehouses quietly lose accuracy. A practical guide.",
    content: [
      {
        type: "p",
        text: "A good naming scheme only helps if the label on the shelf scans reliably and reads from a distance. The physical print is where the name meets reality, and it's where many warehouses have at least one preventable problem. Here's what makes a warehouse label hold up.",
      },
      { type: "h2", text: "Leave a quiet zone" },
      {
        type: "p",
        text: "The quiet zone is the blank margin around the barcode. The scanner uses it to find where the code starts and ends, and most standards want it to be at least about ten times the width of the narrowest bar. A lot of real-world labels leave barely any. Widening that white space is the single highest-leverage change you can make — the label looks emptier and scans far more reliably, especially at a bad angle.",
      },
      { type: "h2", text: "Contrast beats resolution" },
      {
        type: "p",
        text: "A high-resolution inkjet barcode will scan worse than a lower-resolution thermal one, because scanners care about the sharpness of the black-to-white edge more than about dots per inch. Thermal printing lays down a dense, opaque black; inkjet's ink is slightly translucent and bleeds a touch into the paper, softening the edge. This is why thermal printers dominate warehouses despite being lower-resolution. Use one.",
      },
      { type: "h2", text: "Type for distance" },
      {
        type: "p",
        text: "Print the human-readable name large, above or below the barcode. Use a monospaced font — the fixed character width gives the eye a steady rhythm that's easier to parse across an aisle — and avoid serifs, which smear into illegibility at distance in warehouse lighting. The text should be readable from where a picker actually approaches it, not from a foot away at the designer's desk.",
      },
      {
        type: "p",
        text: "Size for the worst case, then check it physically: print one label, mount it where it will live, walk to where a picker would stand, and try to read it. If you can't, make it bigger. Designing labels at arm's length is how you end up with a barcode that's treated as decoration and printed too small to scan.",
      },
      { type: "h2", text: "Mounting, adhesive, and upkeep" },
      {
        type: "p",
        text: "The adhesive matters more than the material. A vinyl label with cheap glue peels in a freezer within weeks; a properly rated label survives years. Ask your supplier what their adhesive is rated for, and if they can't tell you, switch suppliers. In any aisle with forklift or pallet-jack traffic, mount labels behind a thin clear shield — it's cheap and it prevents the most common way labels die, which is a fork catching an edge and tearing it off.",
      },
      {
        type: "p",
        text: "Finally, inspect on a schedule. Walk the aisles periodically looking for damaged labels and replace them while you still know what they say — rather than discovering the bad ones through scan failures, which is the expensive way. None of this is a substitute for testing in your own building: print a batch, stick them up, run real scan workflows, and adjust for your lighting, dust, and temperature. An afternoon of testing prevents years of accumulated scan failures.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Feb 27, 2026 · Industry · Receiving
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "receiving-is-your-most-important-station",
    tag: "Industry",
    date: "Feb 27, 2026",
    readTime: "6 min",
    title: "Receiving is your most important station",
    desc: "It looks like the easy job, so it often goes to the newest people. The logic of how errors travel says it should be the opposite.",
    content: [
      {
        type: "p",
        text: "Of all the operations a warehouse runs, receiving is the one most worth getting right — not because it's the hardest to do, but because of how its errors travel. A mistake at the dock is the most expensive mistake you can make, and it usually goes to the least experienced person on the floor. That's worth rethinking.",
      },
      { type: "h2", text: "Why receiving errors compound" },
      {
        type: "p",
        text: "When an operator makes a mistake at receiving, the bad data gets stamped into the system and rides along with the product. A unit received against the wrong code will be counted wrong, picked wrong, and shipped wrong, until someone finally notices — by which point the error has rippled through many later operations.",
      },
      {
        type: "p",
        text: "Compare a picking error. The picker grabs the wrong item, the customer flags it, a return comes back, and the picker hears about it within days. The loop is short and the damage is contained to one shipment. A receiving error has no such loop. Receiving is invisible to customers, so the first symptom is usually a stockout weeks later (you thought you had plenty; you didn't) or a wrong shipment — long after the receiver has done a thousand more receipts and has no memory of the bad one.",
      },
      { type: "h2", text: "It's harder than it looks" },
      {
        type: "p",
        text: "Receiving looks simple — boxes show up, you scan them, you shelve them — so it gets handed to new hires, who are the most likely to make the exact errors the system won't catch. But receiving is genuinely hard: telling near-identical products from different suppliers apart, handling damaged or partial pallets, catching a mislabel, noticing when the manifest count doesn't match the box, and deciding what to do when something arrives that wasn't on the purchase order. None of that is fully automatable.",
      },
      { type: "h2", text: "What good receiving looks like" },
      {
        type: "p",
        text: "The operations that get this right share habits, and most of them are about people, not software. The lead receiver is experienced and treated like a senior operator, because they are one. Ambiguity gets escalated rather than guessed — stopping the line for a minute is far cheaper than a wrong answer that propagates for weeks. Anomalies get photographed at receipt, which feels excessive right up until you're trying to charge back a supplier for a shortage. And the first hour of a new receiver's shift gets watched, because that's where errors cluster.",
      },
      {
        type: "p",
        text: "Tools help — multi-barcode disambiguation that asks instead of guessing, a photo on every receipt, lot-level traceability so one bad receipt can be unwound — but they help the people who are there catch their own errors faster. They don't replace staffing the dock with expertise. If the newest, lowest-paid people in your operation are the ones receiving, that's a choice worth revisiting. The math says they should be among your most experienced.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Feb 20, 2026 · Industry · Inventory accuracy
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "inventory-accuracy-101",
    tag: "Industry",
    date: "Feb 20, 2026",
    readTime: "5 min",
    title: "Inventory accuracy: the number that quietly runs your warehouse",
    desc: "Almost every warehouse problem traces back to a gap between what the system says you have and what's actually on the shelf. A primer on closing that gap.",
    content: [
      {
        type: "p",
        text: "If you trace most warehouse problems back far enough, you arrive at the same place: a gap between what the system says is on the shelf and what's actually there. Stockouts, oversells, frantic reorders, mispicks, bad forecasts — they're usually downstream of inventory inaccuracy. It's the quiet number that everything else depends on.",
      },
      { type: "h2", text: "What accuracy actually measures" },
      {
        type: "p",
        text: "Inventory accuracy is the share of locations where the recorded quantity matches the physical count. The important word is locations. A warehouse can look accurate in total — the company-wide numbers tie out — while individual bins are wrong in ways that cancel out on paper and cause real pain on the floor. Measuring at the location level is what surfaces the problems you can act on.",
      },
      { type: "h2", text: "Where the gap comes from" },
      {
        type: "p",
        text: "Accuracy erodes wherever a human touches inventory: a miscount, a pick from the wrong bin, an unrecorded relocation, a receipt against the wrong code. It also erodes through small process leaks — items knocked into a neighboring bin near a busy aisle, a damaged unit set aside and never adjusted out. None of these are dramatic on their own; they accumulate.",
      },
      { type: "h2", text: "How to actually improve it" },
      {
        type: "p",
        text: "Make the right action the easy action. If scanning the correct bin is faster than guessing, people scan. If labels are legible and locations are sensibly named, fewer errors happen in the first place — accuracy is downstream of the boring fundamentals.",
      },
      {
        type: "p",
        text: "Count where errors are likely, not on a fixed calendar. Pointing your counting effort at the locations most likely to be wrong — heavily handled, recently relocated, near congestion — finds and fixes more discrepancies per hour than counting everything on a rigid schedule.",
      },
      {
        type: "p",
        text: "And treat a discrepancy as a question, not just a correction. When a count is off, the fix is to update the number; the improvement is to ask why it drifted. A bin that's chronically wrong is telling you something about a label, a layout, or a workflow. Accuracy isn't a one-time cleanup — it's the ongoing result of a floor where the easy path is also the correct one.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Feb 13, 2026 · Industry · Trends
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "warehouse-technology-shifts-2026",
    tag: "Industry",
    date: "Feb 13, 2026",
    readTime: "5 min",
    title: "Five shifts shaping warehouses in 2026",
    desc: "We don't write many trend posts — most age badly. But here are five changes we think are genuinely reshaping how warehouses run, and why.",
    content: [
      {
        type: "p",
        text: "Most trend posts age badly, so we'll keep this to shifts we actually believe in and have opinions about. Five things we think are reshaping warehouse work right now.",
      },
      { type: "h2", text: "1. Voice becomes a primary input, not a novelty" },
      {
        type: "p",
        text: "Voice has been promised in warehouses for years and rarely worked outside narrow, structured pick-by-voice setups. Speech models tuned for the noise of an actual floor have changed that, and operators are starting to use voice as casually as they use scanning — because the real constraint on the floor was never the screen, it was the free hand they didn't have.",
      },
      {
        type: "h2",
        text: "2. Counting moves from schedule-based to risk-based",
      },
      {
        type: "p",
        text: "Decades of value-based cycle counting are giving way to a better question: not how often to count an item, but how likely it is to be wrong right now. Pointing counting labor at probable errors gets you the same accuracy for a fraction of the effort, and once you've seen it work, fixed schedules look like a relic of when counting was expensive.",
      },
      { type: "h2", text: "3. The warehouse as a spatial object" },
      {
        type: "p",
        text: "Most software still treats a warehouse as a flat list of codes. The more useful model understands the floor as a physical space — with distances, congestion, and dead ends — and lets that awareness quietly improve putaway, picking, and routing. The shift won't arrive as one headline feature; it's the slow accumulation of layout-aware decisions everywhere.",
      },
      { type: "h2", text: "4. Fewer, deeper integrations" },
      {
        type: "p",
        text: 'The "we connect to everything" era is fading. Operators would rather have a handful of integrations that sync deeply and reliably — real two-way accounting sync, live e-commerce updates — than a hundred shallow connectors nobody uses twice. Depth is becoming the selling point, not breadth.',
      },
      { type: "h2", text: "5. Mobile-first, not mobile-as-companion" },
      {
        type: "p",
        text: "Purpose-built handheld scanners are giving way to ordinary phones and tablets running real apps. The hardware savings are nice; the bigger win is being able to push an improvement to every device on a Tuesday afternoon instead of scheduling a firmware rollout. If we're wrong about any of these, the people running floors will tell us — and we'll write the follow-up.",
      },
    ],
  },
];
