export const BLOG_POSTS = [
  /* ──────────────────────────────────────────────────────────────────
     May 21, 2026 · Product · Lot and expiration tracking
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "lot-and-expiration-tracking",
    tag: "Product",
    date: "May 21, 2026",
    readTime: "5 min",
    title: "Lot and expiration tracking, now in every plan",
    desc: "FEFO pick logic, lot-level traceability, and expiration alerts used to be Enterprise-only. As of this week they're standard on every plan.",
    content: [
      {
        type: "p",
        text: "For three years, lot tracking and expiration management have sat behind the Enterprise tier in Nautilus. As of this week they don't. Every Pro plan gets the same lot-level traceability, FEFO pick logic, and expiration alerts that our largest customers have been using.",
      },
      {
        type: "p",
        text: "We're announcing it here because the change is meaningful for a few industries (food and beverage, pharmaceuticals, cosmetics, agriculture) and because the reasoning matters.",
      },
      { type: "h2", text: "Why we moved it" },
      {
        type: "p",
        text: "We had a working theory when we built Nautilus that lot tracking was an Enterprise feature. It's bookkeeping-heavy and carries real regulatory exposure. It also changes how receiving works. Enterprise customers, we figured, would have the operations maturity to set it up. Pro customers would not, and exposing it to them would make the product feel heavier than it needed to.",
      },
      {
        type: "p",
        text: "That theory was wrong in one specific direction. The customers who needed lot tracking most urgently were not always the biggest. A six-person specialty food distributor handling 1,200 SKUs has the same FDA traceability requirements as a thousand-person operation. Putting their use case behind a sales call was bad for them and bad for us.",
      },
      {
        type: "p",
        text: "About half of our Pro customers in food and beverage had been asking us for this for two years. The other half had been quietly working around it (logging lots in spreadsheets, doing expiration checks by hand). Neither was a good outcome.",
      },
      { type: "h2", text: "What lot tracking actually does" },
      {
        type: "p",
        text: 'At the receiving step, instead of recording "we received 200 units of SKU X," operators record "we received 200 units of SKU X in lot 24-A19 with expiration date Nov 4, 2026." The lot identifier travels with every subsequent operation: putaway, count, pick, ship. If a lot is later recalled, the system can identify every customer order that contained units from that lot in about a second.',
      },
      {
        type: "p",
        text: "FEFO (first-expired-first-out) is the pick logic that pairs with it. When there are multiple lots of the same SKU available, the pick recommender chooses the one with the earliest expiration. The operator doesn't have to think about it. The system just routes them to the right bin.",
      },
      {
        type: "p",
        text: "Expiration alerts run on a schedule we picked based on customer use: 30 days out, 14 days out, 7 days out. Operations leads get a digest. The thresholds are configurable per category, because a 14-day window means something very different for fresh produce than it does for pharmaceutical reagents.",
      },
      { type: "h2", text: "What's new and what isn't" },
      {
        type: "p",
        text: "The underlying engine has been in production for three years. We're not turning on something new; we're turning down the access gate. The Enterprise tier still has features that build on lot tracking (custom regulatory reports, the audit trail export, lot-level shrink analysis), and those stay where they were.",
      },
      {
        type: "p",
        text: "What's free now: lots on receipt, FEFO picking, expiration alerts, lot-level traceability reports, recall lookup.",
      },
      { type: "h2", text: "Turning it on" },
      {
        type: "p",
        text: "For Pro customers in lot-relevant industries (food and beverage, pharma, cosmetics, agriculture, chemicals) lot tracking will be enabled by default starting May 28. For other Pro customers it's behind a setting in the warehouse configuration, off by default, since adding the lot field to the receiving workflow changes how operators interact with the app and we don't want to make that choice for you.",
      },
      {
        type: "p",
        text: "The help center has setup guides for each industry. The 30-minute migration call we used to offer Enterprise customers is now available on Pro as well.",
      },
      { type: "h2", text: "Not for everyone" },
      {
        type: "p",
        text: "This isn't free in the operational sense. Lot tracking adds a field at the receiving step, and operators have to actually enter the right lot. If your products don't have lot numbers printed by your suppliers, you have to invent your own conventions. There's a setup cost.",
      },
      {
        type: "p",
        text: "For some product types the setup cost is too high relative to the benefit. If your inventory turns weekly, expiration is implicit. If your suppliers don't print lot numbers, you're either taking on the burden of generating them at receipt (workable, but a real workflow change) or skipping the feature.",
      },
      {
        type: "p",
        text: "We're making it available because the people who need it really need it. We're not pushing it on customers who don't.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     May 16, 2026 · Engineering · Activity feed
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "killing-the-realtime-activity-feed",
    tag: "Engineering",
    date: "May 16, 2026",
    readTime: "7 min",
    title: "Why we killed our real-time activity feed",
    desc: "We shipped a live activity ticker. For eighteen months managers stared at it. Last week we removed it. Here's what the data said.",
    content: [
      {
        type: "p",
        text: "We shipped a real-time activity feed in our dashboard 18 months ago. It was a live scrolling ticker showing every scan, count, adjustment, voice command, and order event across all the warehouses a customer ran. We thought it was going to be a flagship feature for operations managers. Last week we removed it.",
      },
      {
        type: "p",
        text: "This is the story of why, because we think there's a pattern that applies more broadly than dashboards.",
      },
      { type: "h2", text: "What we were trying to do" },
      {
        type: "p",
        text: "The pitch was straightforward. A warehouse operations lead has a hard time knowing what's happening across the floor at any given moment. They can walk the floor, but only one floor at a time. They can call a supervisor, but only one supervisor at a time. A real-time view of what's actually happening, scrolling past in front of them, should help.",
      },
      {
        type: "p",
        text: "We built it in three weeks. The animations were polished, the typography was good, the batching was smart enough that the feed didn't feel like noise. We were proud of it. Customer demo feedback was positive. We shipped it as the default landing page for managers.",
      },
      { type: "h2", text: "What actually happened" },
      {
        type: "p",
        text: "For about six months we patted ourselves on the back. Customers told us they loved the feed. Sales used it heavily in demos. We saw screenshots of it in customer marketing materials, sometimes.",
      },
      {
        type: "p",
        text: "Then we started looking at the data.",
      },
      {
        type: "p",
        text: "Managers spent a median of 14 minutes per session on the dashboard with the feed open. That, by itself, is fine. What wasn't fine was that during those 14 minutes they took an action (clicked, drilled in, navigated to a related view) about 0.7 times. Median. Most sessions ended with the manager closing the tab.",
      },
      {
        type: "p",
        text: "For comparison, on a dashboard view we built around weekly summaries, managers averaged 4 minutes per session and 3.2 actions. The feed was three times stickier and four times less productive.",
      },
      {
        type: "p",
        text: "We thought maybe the feed was helping in ways the click data couldn't show. The manager watches the feed in the background, notices something off, then walks the floor. The action would have happened in the physical world, not in the app.",
      },
      {
        type: "p",
        text: "We interviewed thirty managers. Not one of them described that workflow. What they described was something else: the feed was a comfort object. It made them feel informed. It did not make them more informed in any way they could articulate. Several said they kept the tab open during meetings because the motion was calming.",
      },
      {
        type: "p",
        text: 'A few specifically said they got anxious when the feed scrolled fast and they could not keep up. One manager described it as "a stock ticker for problems I might already be missing." That was bad.',
      },
      { type: "h2", text: "What broke our resolve" },
      {
        type: "p",
        text: 'We sat on this data for about six months. We tried to redesign the feed (slower scroll, prioritized events, filters). It got marginally less anxiety-inducing and did not get more useful. We added a "summary mode" that compressed the feed into a once-an-hour digest. About 8% of managers turned it on.',
      },
      {
        type: "p",
        text: "What broke us was a separate signal. When we shipped the anomaly detection layer in April, the alerts it produced were better signals than anything in the feed had been. The feed had been showing every event with no judgment about what mattered. The anomaly layer was showing the few events that actually did.",
      },
      {
        type: "p",
        text: "With anomaly detection live, the real-time feed was redundant for the things that mattered and noisy for the things that didn't. So we removed it.",
      },
      { type: "h2", text: "What replaced it" },
      {
        type: "p",
        text: "The new manager landing page is a once-a-day digest of what happened in your warehouse yesterday: high-level totals, the anomaly alerts that fired, the cycle count recommendations the system produced overnight, and a short list of what needs attention today. The page does not auto-refresh. Looking at it more than once a day produces no new information.",
      },
      {
        type: "p",
        text: "For the rare cases where someone genuinely needs to see live activity (a supervisor watching a difficult shift, a manager investigating a specific incident) we kept the feed view, but it's no longer the default and you have to navigate to it explicitly. Usage is down 94% since we made the change. We expect it to settle around 5% of its old volume, which seems about right.",
      },
      { type: "h2", text: "What we kept from this" },
      {
        type: "p",
        text: "Real-time is a default that should be earned, not assumed. In our experience, the things that genuinely need real-time visibility (a tank approaching critical temperature, a fire alarm, an order pickup at the dock) are very few. The things people enjoy watching in real time (events scrolling past, dashboard numbers ticking up) are mostly entertainment.",
      },
      {
        type: "p",
        text: 'We think this is true for a lot more software than warehouse dashboards. We have gotten quietly skeptical of any feature that\'s primarily justified by "you can watch it happen live." Live is not the same as useful.',
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     May 13, 2026 · Industry · Receiving
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "receiving-is-the-most-expensive-operation",
    tag: "Industry",
    date: "May 13, 2026",
    readTime: "8 min",
    title: "Receiving is the most expensive thing your warehouse does",
    desc: "Most operators staff receiving with their newest people. The data says they should be doing the opposite.",
    content: [
      {
        type: "p",
        text: "We pulled the error rates of every operation across about 240 Nautilus customers and ranked them by downstream cost. The most expensive operation, by a substantial margin, was not picking or counting or shipping. It was receiving.",
      },
      {
        type: "p",
        text: "This is counterintuitive enough that we want to walk through it, because if you accept the argument, it changes how you should be staffing your dock.",
      },
      { type: "h2", text: "Why receiving errors compound" },
      {
        type: "p",
        text: "When an operator makes a mistake at receiving, the bad data is stamped into the system and travels with the product. A SKU received against the wrong product code will be counted as the wrong product, picked as the wrong product, and shipped as the wrong product, until someone notices. By the time someone does notice, the error has propagated through dozens or hundreds of subsequent operations.",
      },
      {
        type: "p",
        text: "Contrast this with a picking error. A picker grabs the wrong item, the customer flags it on receipt, a return comes back, the picker (or their manager) is told about the mistake. The feedback loop is hours to days. The downstream cost is contained to one shipment.",
      },
      {
        type: "p",
        text: "A receiving error has no immediate feedback loop. Receiving is invisible to customers. The first signal that something went wrong is usually a stockout (you thought you had 200 units, you really had 47) or a customer complaint (you shipped them a similar but wrong SKU). The signals arrive weeks later, and by then the receiving operator has done a thousand more receipts and has no memory of the bad one.",
      },
      { type: "h2", text: "The numbers, from our dataset" },
      {
        type: "p",
        text: "Across our 240-warehouse sample, here's what we found, sorted by what we'd call \"blast radius\" (the average number of downstream operations affected by a single error):",
      },
      {
        type: "p",
        text: "Receiving errors: average blast radius of 47 downstream operations. The misallocated receipt produces wrong-count balances at putaway, mispick risk at the bin level, wrong shipments to customers, and incorrect inventory valuations in the accounting integration. About 8.2% of our customers' stockouts trace back to a receiving error that happened weeks earlier.",
      },
      {
        type: "p",
        text: "Picking errors: average blast radius of 1.2 operations. The wrong item gets shipped. The customer returns it. The system records the return and re-shelves the original. Done.",
      },
      {
        type: "p",
        text: "Counting errors at cycle count: average blast radius of about 3 operations. The cycle count records a wrong quantity, which gets corrected at the next count or at the next physical action. Self-correcting on a short timescale.",
      },
      {
        type: "p",
        text: "Shipping errors: average blast radius of about 1.5 operations. Similar to picking. The error gets noticed when the customer opens the box.",
      },
      {
        type: "p",
        text: "The asymmetry is large. A receiving operation is roughly 30 to 40 times more expensive when it goes wrong than a picking operation is. And receiving operators are often paid less than pickers, get less training, and rotate faster.",
      },
      { type: "h2", text: "Why it's staffed wrong" },
      {
        type: "p",
        text: "We have spent enough time at warehouses to have a guess about how this happened. Receiving looks easy. The boxes show up, you scan them, you put them in their bins. The cognitive load looks low. So it gets handed to the newest people, who are by definition the most likely to make mistakes that the system will not catch.",
      },
      {
        type: "p",
        text: "Receiving is, in fact, harder than it looks. You have to disambiguate identical-looking products from different suppliers, deal with damaged or partial pallets, catch lot mislabels, notice when the count on the manifest doesn't match the count in the box, and decide what to do when something arrives that wasn't on the purchase order. None of this is automatable to the point where it doesn't need a thoughtful human.",
      },
      { type: "h2", text: "What good receiving looks like" },
      {
        type: "p",
        text: "A few observations from customers who get receiving right. None of these are technological. They are staffing and culture.",
      },
      {
        type: "p",
        text: "The lead receiver is not new. We notice the best operations have a lead receiver who has been at the company for years and who actively trains the day-to-day team. This person is paid like a senior operator, because they are one.",
      },
      {
        type: "p",
        text: "Ambiguity gets escalated, not guessed. Good receivers stop the line and ask when something doesn't match. They don't try to figure out which SKU is \"probably\" right. The wrong answer is much more expensive than a 90-second delay.",
      },
      {
        type: "p",
        text: "Anomalies get photographed. Damaged pallets, partial cases, wrong SKUs, mismatched manifests: all get a photo attached to the receipt record. This sounds excessive until you're trying to charge back a supplier six weeks later for a shortage.",
      },
      {
        type: "p",
        text: "The first hour of a new receiver's shift is observed. This is the hour where errors cluster. The operations lead at one of our customers walks the dock for the first hour of every new receiver's first three days, and intervenes when patterns emerge. Their misallocated-receipt rate is the lowest in our dataset.",
      },
      { type: "h2", text: "What we built for it" },
      {
        type: "p",
        text: "We have built a few things into Nautilus specifically to lower the cost of receiving errors. Multi-barcode disambiguation that asks instead of guesses (born out of the Mercantile Coffee incident we wrote about last month). A drift report that flags receiving events clustered in a new operator's first hour. Photo attachment on every receipt, one tap from the scan view. Lot-level traceability that lets a single bad receipt be unwound without rebuilding state from scratch.",
      },
      {
        type: "p",
        text: "None of these compensate for short-staffing the dock. The tools help the people who are there catch their own errors faster. They don't replace expertise.",
      },
      { type: "h2", text: "The closing argument" },
      {
        type: "p",
        text: "If you do nothing else after reading this: walk to your dock tomorrow morning and watch your receivers for an hour. If they're the youngest, newest, lowest-paid people in your operation, that's a choice you've made, possibly without realizing it. The math says they should be among your most experienced.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     May 09, 2026 · Case Study · Northwest Auto
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "northwest-auto-erp-migration",
    tag: "Case Study",
    date: "May 09, 2026",
    readTime: "9 min",
    title: "Northwest Auto's ERP migration, from the warehouse side",
    desc: "A four-warehouse parts distributor swapped QuickBooks for NetSuite in three months. Floor operations didn't notice. Here's how the integration cutover went.",
    content: [
      {
        type: "p",
        text: "Northwest Auto Distribution moves automotive parts out of four warehouses in Idaho, Washington, and Montana. About 38,000 SKUs, 90% of which are slow-moving and 10% of which turn weekly. They had been on QuickBooks Enterprise for seven years and Nautilus for two. In February, they made the decision to migrate from QuickBooks to NetSuite.",
      },
      {
        type: "p",
        text: "Doug Vargas, their VP of Operations, called us the week before they signed the NetSuite contract. He had one question: was there any reason this would break Nautilus?",
      },
      {
        type: "p",
        text: "The honest answer was that we had never done an ERP swap underneath a live customer before. We had migrated customers onto Nautilus from various ERPs, but we had never had a Nautilus customer change which ERP we connected to. So we said: probably not, but let's walk through it.",
      },
      { type: "h2", text: "What they were actually changing" },
      {
        type: "p",
        text: "The change at Northwest Auto was about accounting and finance, not warehouse operations. QuickBooks Enterprise was straining at their scale, especially around consolidated reporting across the four facilities. NetSuite gave them better reporting, better multi-entity handling, and a runway for their planned expansion to two more locations next year.",
      },
      {
        type: "p",
        text: "From the warehouse floor, the change should be invisible. Operators don't see the ERP. They see Nautilus on their phones. The ERP is the thing on the back end where receipts post against purchase orders and cycle count variances close out to journal entries.",
      },
      {
        type: "p",
        text: "But the integration is real. A receipt in Nautilus updates the QuickBooks inventory ledger in real time. A cycle count variance closes against a QuickBooks adjustment account. The connection runs both ways, and there was no version where we could just unplug QuickBooks one Friday and plug NetSuite in on Monday without something going wrong.",
      },
      { type: "h2", text: "The plan" },
      {
        type: "p",
        text: "We landed on a four-phase plan, which took about three months to execute.",
      },
      {
        type: "p",
        text: "Phase one (two weeks): mirror the chart of accounts. NetSuite's account structure was different from QuickBooks's. Their finance team built the mapping table. We pulled it into Nautilus's integration config in dry-run mode, where the system would compute what it would have posted to NetSuite for every actual operation without actually posting anything. We compared dry-run outputs to live QuickBooks postings for two weeks. About 4% of operations produced different journal entries, all of which traced to expected mapping decisions (asset category renames, location code differences).",
      },
      {
        type: "p",
        text: "Phase two (three weeks): dual-write. Nautilus posted to both QuickBooks and NetSuite simultaneously. NetSuite was the test target; QuickBooks remained the source of truth. The accounting team reconciled NetSuite's books against QuickBooks's books weekly. Any drift was investigated and resolved. By the end of phase two, NetSuite and QuickBooks were producing identical balances within a small rounding tolerance.",
      },
      {
        type: "p",
        text: "Phase three (one week): cutover. NetSuite became the source of truth. QuickBooks went into read-only mode. Nautilus posted only to NetSuite. The accounting team continued reconciliation against the QuickBooks shadow for the first week as a check.",
      },
      {
        type: "p",
        text: "Phase four (ongoing): retirement. QuickBooks data was archived, the QuickBooks integration was disabled, and Northwest Auto's finance team transitioned to NetSuite-only workflows.",
      },
      { type: "h2", text: "What broke" },
      {
        type: "p",
        text: "We hit three meaningful issues during the migration, all in phase two.",
      },
      {
        type: "p",
        text: "The first was negative-quantity handling. QuickBooks and NetSuite have different conventions for posting a negative inventory adjustment. We had to add a small abstraction layer in the integration that normalized the convention at our end, so the same logical operation produced sensible journal entries on either platform.",
      },
      {
        type: "p",
        text: "The second was multi-location consolidation. QuickBooks had treated Northwest Auto's four warehouses as four separate inventory locations with manual consolidation in reports. NetSuite has a more flexible multi-subsidiary model. We had to map each Nautilus warehouse to a NetSuite location and a NetSuite subsidiary, which required a Northwest Auto operational decision: do the warehouses count as separate subsidiaries for tax purposes, or one. They chose the latter, which simplified things.",
      },
      {
        type: "p",
        text: "The third was timing. NetSuite's API rate limits are tighter than QuickBooks's. During high-volume periods (Monday morning receiving, end-of-month cycle count) Nautilus had to back off and batch. We adjusted the integration's batching strategy and the issue went away.",
      },
      { type: "h2", text: "What didn't break" },
      {
        type: "p",
        text: "Receiving, picking, putaway, counting, shipping, and reporting on the warehouse floor were unaffected. The operators saw the same Nautilus app on Monday morning that they had seen on Friday. No retraining was needed.",
      },
      {
        type: "p",
        text: 'We asked Doug to ask his floor managers, two weeks after cutover, if they had noticed anything different. The first answer was "different about what?" The second was "you mean the new accounting system? When did that happen?"',
      },
      {
        type: "p",
        text: "That's the answer we wanted. The integration layer absorbed the migration so operations didn't have to.",
      },
      { type: "h2", text: "What we kept from this" },
      {
        type: "p",
        text: "Two things.",
      },
      {
        type: "p",
        text: "First, the dual-write pattern is now the default for any customer doing an ERP migration with us in the loop. We had considered it overkill before this; it isn't. The two-week reconciliation period catches mapping errors before they become real accounting errors, and it's much cheaper than retroactively unwinding three weeks of incorrect journal entries.",
      },
      {
        type: "p",
        text: "Second, we wrote a runbook for ERP migrations and have used it twice more since Northwest Auto. The runbook is internal but the headline is: plan for ten weeks, schedule the cutover for a Tuesday (not a weekend, because you want your engineers and theirs available), and rehearse the rollback.",
      },
      {
        type: "p",
        text: "Northwest Auto's NetSuite go-live was March 17. As of this writing they have been on NetSuite for two months. Inventory accuracy is unchanged. Operator satisfaction (we ask quarterly) is unchanged. Doug's last note to us said the finance team is happier than they have been in years. That was the goal.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     May 06, 2026 · Engineering · Label printing
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "notes-on-printing-barcode-labels",
    tag: "Engineering",
    date: "May 06, 2026",
    readTime: "6 min",
    title: "Notes on printing barcode labels",
    desc: "A companion to our bin-naming guide. The name is half the job. The print is the other half, and it's where most warehouses lose accuracy.",
    content: [
      {
        type: "p",
        text: "A few weeks ago we wrote about how to name your bin locations. It got more responses than anything else we have written, mostly along the lines of \"the name is fine; what about the actual physical label?\" That's fair. The label is where the naming hits reality, and it's where most warehouses we visit have at least one preventable problem.",
      },
      {
        type: "p",
        text: "This is a companion piece. It is about the physical print itself: how to make a barcode that scans reliably under warehouse conditions, what to put around it, and what to do when it stops working.",
      },
      { type: "h2", text: "Leave a quiet zone" },
      {
        type: "p",
        text: "A quiet zone is the blank margin around the barcode itself. The scanner uses it as a reference for where the barcode starts and ends. Most barcode standards require a quiet zone of at least 10 times the width of the narrowest bar. Most labels we see in actual warehouses have a quiet zone of one or two times that. Sometimes none.",
      },
      {
        type: "p",
        text: "A barcode with too little quiet zone scans about 80% of the time in good conditions and 30% of the time when the scan angle is bad. A barcode with proper quiet zone scans 99% of the time in both. This is the single highest-leverage change you can make to label design.",
      },
      {
        type: "p",
        text: "We have had customers fix scan-failure rates of 12% by widening the white space around the barcode. The label looks emptier. It works much better.",
      },
      { type: "h2", text: "Contrast matters more than resolution" },
      {
        type: "p",
        text: "A 600 DPI inkjet printer produces a sharper barcode than a 300 DPI thermal printer. The thermal printer's barcode will scan more reliably under warehouse conditions every time.",
      },
      {
        type: "p",
        text: "The reason is contrast. Thermal printing produces a dense, opaque black on white. Inkjet's black is slightly translucent and absorbs slightly into the paper, which lowers the contrast at the edges. Scanners care about the edge transition between black and white more than they care about resolution.",
      },
      {
        type: "p",
        text: "This is why thermal label printers dominate warehouse environments despite being lower-resolution and more limited in fonts. They produce labels that scan more reliably under poor lighting, scuffing, and partial occlusion. Use one.",
      },
      { type: "h2", text: "Font selection for the human-readable text" },
      {
        type: "p",
        text: "Above (or below) the barcode you'll want the bin name printed in text large enough to read from across an aisle. Two opinions.",
      },
      {
        type: "p",
        text: "Use a monospaced font. Variable-width fonts like Arial or Helvetica look better in a marketing brochure and worse on a warehouse label. The fixed character width of a monospace font gives the eye a regular rhythm that's easier to parse from a distance. We use Roboto Mono or IBM Plex Mono. Both are free.",
      },
      {
        type: "p",
        text: 'Don\'t use a serif font. Serifs disappear at distance. From three meters away in warehouse lighting, "B-A04-12" in Times New Roman is harder to read than the same text in a clean sans-serif or monospace. The serif is a typographic flourish that produces operational cost.',
      },
      { type: "h2", text: "Size for the worst case" },
      {
        type: "p",
        text: "We size labels for a 3-meter scan distance and a 6-meter visual read distance. Concretely this means the text is at least 36 points (about half an inch tall) and the barcode is at least 1.5 inches wide for the Code 128 format we recommend.",
      },
      {
        type: "p",
        text: "Labels we see in the field are routinely too small, because they were designed at a desk by someone looking at them from a foot away. The designer felt good about the proportions. The picker squinting at the label from across the aisle does not.",
      },
      {
        type: "p",
        text: "Print one label, mount it where it will actually live, and walk away from it. Try to read the text from the position a picker would actually approach it. If you can't, make it bigger.",
      },
      { type: "h2", text: "Mounting and adhesive" },
      {
        type: "p",
        text: "We mostly cover this in the bin-naming guide, but two refinements.",
      },
      {
        type: "p",
        text: "The adhesive matters more than the substrate. A vinyl label with cheap adhesive will peel off in a freezer within a month. A paper label with industrial adhesive can survive years if the paper is rated for the temperature. Ask your label supplier what their adhesive is rated for. If they don't know, switch suppliers.",
      },
      {
        type: "p",
        text: "Mount labels behind a clear acrylic shield in any environment with forklift traffic or pallet jack contact. The shield costs about $0.40 per location and prevents the most common cause of label loss (forklift forks catching the edge of a label and tearing it off). Pay the $0.40.",
      },
      { type: "h2", text: "Re-print policy" },
      {
        type: "p",
        text: "Labels need to be inspected on a schedule. We recommend a quarterly walk of every aisle by someone whose explicit job is to identify damaged labels. Most warehouses don't do this and discover bad labels through scan failures, which is much more expensive.",
      },
      {
        type: "p",
        text: "A damaged label that's still scanning is on borrowed time. Replace it now, while you know what it says, rather than later, when the scan failure forces you to look up the bin name in three other places.",
      },
      { type: "h2", text: "Test under your conditions" },
      {
        type: "p",
        text: "The most important thing in this post: nothing we wrote is a substitute for testing labels in your actual warehouse. Print a batch. Stick them up. Walk through scan workflows. Adjust. The right size, contrast, mounting, and font for your operation depend on factors we can't enumerate here (lighting, dust, freezer condensation, the eyesight of your specific team).",
      },
      {
        type: "p",
        text: "One afternoon of testing now saves a decade of accumulated scan failures. We watched a customer's accuracy rate jump three percentage points after they redesigned their labels following a half-day of in-warehouse testing. No software change. Just better labels.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     May 02, 2026 · Product · Anomaly detection
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "anomaly-detection-first-month",
    tag: "Product",
    date: "May 02, 2026",
    readTime: "9 min",
    title: "Anomaly detection: five things it caught in its first month",
    desc: "We turned on the anomaly detection layer for every Nautilus customer on April 1st. Here are five real incidents it surfaced, anonymized but otherwise unmodified.",
    content: [
      {
        type: "p",
        text: "We turned on the anomaly detection layer for all customers on April 1st. It does what it sounds like: a model that watches the stream of scans, counts, voice events, and movements in your warehouse and flags patterns that look unusual.",
      },
      {
        type: "p",
        text: "We were curious what it would actually catch. The team had spent months on the model and we had a long list of theoretical anomalies we'd designed for, but theory is theory. Here are five real things it surfaced in the first month, anonymized but otherwise unmodified. None of them were on our list of design cases.",
      },
      { type: "h2", text: "One. The unproductive scanning" },
      {
        type: "p",
        text: 'First customer, large auto parts distributor. Day three of the feature being live, we got a note from their warehouse manager: their early-morning shift had been scanning the same SKU 47 times in 8 minutes. The anomaly system flagged it as "repeat-scan well above normal distribution." On its own that\'s not necessarily a problem; sometimes operators scan things repeatedly during a difficult count.',
      },
      {
        type: "p",
        text: 'The manager investigated. The operator had been scanning the same item over and over to inflate a "scans per hour" metric that their previous manager had set as a productivity KPI. The current manager hadn\'t even known the metric existed. It came up in the conversation that followed.',
      },
      {
        type: "p",
        text: "We didn't design the system to detect gaming of productivity metrics, but in retrospect we should have expected it. Anywhere there's a number a person is measured by, there are operators figuring out how to make the number go up without doing more work. The model didn't flag \"this person is gaming a metric.\" It flagged \"this scan pattern is statistically improbable under normal operations.\" The interpretation was the manager's.",
      },
      { type: "h2", text: "Two. The late-night adjustment" },
      {
        type: "p",
        text: "Second customer, mid-sized 3PL. At 2:47 in the morning, an inventory adjustment of -120 units of a high-value SKU was entered by a user account with administrator permissions. The model flagged it on two dimensions: time of day was outside the user's typical activity window, and the magnitude was 4 standard deviations above their average adjustment size.",
      },
      {
        type: "p",
        text: "It turned out to be legitimate. The user was an operations manager who was in the building doing a late-night audit before a quarterly review. The adjustment reflected a known but unreported shrinkage that they were finally writing down in the books.",
      },
      {
        type: "p",
        text: "But it could have been theft. The fact that it took a model to surface this for review, rather than a human noticing it the next morning during a 30-second glance at the activity log, is the point. The 30-second glance doesn't happen reliably. The model flag does.",
      },
      {
        type: "p",
        text: "The customer has since used the same pattern to set up explicit review requirements for after-hours adjustments above a threshold. We didn't build that workflow; they built it themselves on top of our alert. Good outcome.",
      },
      { type: "h2", text: "Three. The vendor mislabel" },
      {
        type: "p",
        text: "Third customer, electronics distributor. They were receiving a shipment from a Chinese supplier whose labels had been mostly fine for two years. The anomaly system flagged that the SKUs being received didn't match the SKUs on the corresponding purchase order. Not by a wide margin: three SKUs out of 80 were off by one in their internal coding.",
      },
      {
        type: "p",
        text: "On investigation, the supplier had updated their internal SKU scheme three weeks earlier and shifted three digit codes. The labels were correctly printed against the new scheme, but the receiving operator was treating the codes as if they were the old scheme. About 12 units of a $200 line item had already been receipted to the wrong SKU.",
      },
      {
        type: "p",
        text: "The receiving operator wasn't doing anything wrong. They had been receiving from this vendor for years and the scheme had been stable. The anomaly detector noticed the mismatch in pattern and flagged it for review before more inventory got misallocated.",
      },
      {
        type: "p",
        text: "We talked to the supplier afterward, with the customer's permission. The supplier had emailed about the SKU scheme change but the email had gone to a procurement inbox that no one was actively monitoring. This is depressingly common. The model can't prevent a missed email, but it can catch the consequences before they spread.",
      },
      { type: "h2", text: "Four. The avoided coworker" },
      {
        type: "p",
        text: "Fourth customer, apparel. The model flagged that one specific operator had picked exclusively from aisles 1 through 8 over a six-week stretch, despite being trained on the entire warehouse and being included in pick assignments across the floor. Picker assignment is supposed to come from the optimizer, which spreads work across operators based on workload and skill, but this one operator's actual completed picks didn't match what the optimizer was assigning to them.",
      },
      {
        type: "p",
        text: "The customer investigated. The operator was avoiding aisles 9 through 16 because a coworker who worked in that section had been making sexual comments. The picker had been declining assignments in that area, swapping them for assignments in aisles 1-8 with other operators who didn't ask questions about why.",
      },
      {
        type: "p",
        text: 'This is not a use case we built for. The model flagged it as "pick distribution far from optimizer assignment for this operator," which is a statistical statement, not a social one. The HR conversation that followed was the customer\'s, and they handled it well, but we are uncomfortable that this is what our tool detected. We left the alert active and added a help center entry recommending that managers who see this pattern start a confidential conversation, not a disciplinary one.',
      },
      { type: "h2", text: "Five. The double-counting bug" },
      {
        type: "p",
        text: "Fifth customer, food and beverage distributor. The model flagged a single bin showing a 99% pick rate over a 3-day window. A 99% pick rate would mean nearly every item that entered the bin was immediately picked out and shipped, which is plausible only for high-velocity cross-dock items.",
      },
      {
        type: "p",
        text: "On investigation, the bin in question was a slow-moving SKU. The 99% rate was a bug, not a behavior. Their integration with their Shopify storefront was double-counting pick events under a specific condition (orders that involved a split shipment because some items were on backorder). The duplicate pick events were artificially inflating the velocity numbers.",
      },
      {
        type: "p",
        text: "We caught this on our end as a result, traced it through to the integration, and shipped a fix the following week. The customer's actual operations were fine; only the reporting was wrong. But that's the kind of bug that quietly distorts your understanding of the warehouse for months until someone happens to notice. The model noticed in three days. The interpretation is always the human's.",
      },
      { type: "h2", text: "Tuning" },
      {
        type: "p",
        text: 'By default, anomaly detection runs at a threshold that surfaces roughly 8 to 12 alerts per warehouse per week. We picked that based on beta feedback as "enough that the alerts are taken seriously, few enough that they don\'t get ignored as noise." You can tune the threshold in Settings if you want a different volume.',
      },
      {
        type: "p",
        text: 'The model also accepts feedback. Every alert has a "useful / not useful" thumbs button. Aggregate feedback feeds back into our training pipeline weekly, so the system gets better at surfacing alerts your team finds actionable and quieter on alerts you don\'t.',
      },
      { type: "h2", text: "Closing" },
      {
        type: "p",
        text: 'We are wary of the framing "AI watches your warehouse and catches problems." It isn\'t wrong but it can sound sinister, and we are determined not to ship a surveillance product. The alerts are aimed at operations leads, not at individual operators. The defaults are conservative. The system never disciplines anyone; it surfaces patterns, and the human decides what, if anything, to do.',
      },
      {
        type: "p",
        text: "The five stories above are unusual catches. Most weeks, most warehouses will get a handful of alerts about things that turn out to be benign. The point isn't that the model is always right. The point is that without it, the unusual stuff drifts past everyone's attention until it compounds.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Apr 25, 2026 · Engineering · Offline-first
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "offline-first-warehouses",
    tag: "Engineering",
    date: "Apr 25, 2026",
    readTime: "13 min",
    title: "What we learned building offline-first for warehouses",
    desc: "Three years of building inventory software that works without a network: what we learned, what we got wrong, and what we'd do differently if we started over.",
    content: [
      {
        type: "p",
        text: 'Warehouses are hostile to radio. Metal racking everywhere, concrete walls, the occasional Faraday-cage cold storage room, forklifts throwing off electrical noise. WiFi works most of the time, but "most of the time" is not a viable substrate for a production system that operators rely on every second.',
      },
      {
        type: "p",
        text: "Early on we made the call that every action a Nautilus operator takes (every scan, voice command, count entry, adjustment) has to work without a network. The device should never wait for a round trip before confirming an action. The expensive part of building inventory software that feels instant is not the AI or the integrations. It's the offline-first sync layer underneath.",
      },
      {
        type: "p",
        text: "We've now been operating this layer for about three years, including across a few customers in metal-clad facilities where the WiFi drops every couple of minutes. This is what we got wrong, what we got right, and what we'd do differently.",
      },
      { type: "h2", text: "Why naive queueing fails" },
      {
        type: "p",
        text: "The first thing you'd reach for is action queueing. Every user action gets serialized into a queue on the device; the queue flushes to the server whenever the network is up. This works for a single user. It falls apart the moment you have multiple operators making changes to overlapping state.",
      },
      {
        type: "p",
        text: 'Picture two pickers in the same aisle, both offline, both with a pick list that includes SKU X from bin 12. Both walk up at roughly the same time, both scan the bin, both see "9 units available." Both pick "1 unit." Both devices update their local count to 8. Both queue the action.',
      },
      {
        type: "p",
        text: 'When the network comes back, both queues flush. The server now receives two "pick 1 from bin 12" actions. If it processes them in order, the count goes 9 → 8 → 7. But the local devices both think the count is 8. The next time either device syncs down from the server, the count it shows will jump down by one in a way that looks like a glitch.',
      },
      {
        type: "p",
        text: "That's the simplest case. It gets much worse when the conflicting actions are different types: one device adjusts the count, another relocates the item, and a third is in the middle of a count audit that assumes a specific quantity. Naive queueing produces inconsistent state across devices and unhappy users.",
      },
      { type: "h2", text: "What we ended up with" },
      {
        type: "p",
        text: "Our sync layer treats every entity (SKU, bin, lot, count) as a state machine with a known set of transitions, and every operator action as an event with a few properties: a unique ID, a timestamp from the originating device, a vector clock of what the device knew at the time, and the actual operation.",
      },
      {
        type: "p",
        text: "When events arrive at the server they're applied in an order that respects causality (you can't pick from a bin you don't know exists yet) rather than wall-clock time. Conflicts that the order-of-arrival can't resolve get sent through a rules engine that knows, for each pair of conflicting operation types, what to do.",
      },
      {
        type: "p",
        text: 'For the "both pickers scan the same bin" case, the count operations don\'t actually conflict if both are decrements within available stock. We accumulate them, and the bin count ends up correct (9 → 7). What we surface to the user, optionally, is a notification: "your colleague also picked from bin 12 while you were offline." This isn\'t strictly necessary for correctness, but it\'s necessary for not freaking people out.',
      },
      {
        type: "p",
        text: 'For relocations that conflict with picks, pick wins. The relocation comes back to the operator as "this item is no longer at the location you intended to move it from." This matches what would happen in the physical world if both operators were online; the picker would have grabbed the item before the mover got there.',
      },
      {
        type: "p",
        text: "For adjustments that conflict with anything, adjustment wins, because adjustments represent the operator's belief about ground truth, and we trust the human in front of the bin over the system's belief about what should be there.",
      },
      {
        type: "p",
        text: "These rules took months to enumerate. We didn't get them right at first.",
      },
      { type: "h2", text: "The data layer" },
      {
        type: "p",
        text: "We use SQLite on every device, wrapped with WatermelonDB for the reactive query layer. Every entity the operator can interact with (products, locations, lots, open work) is replicated locally. On Android and iOS, the database runs around 12 to 40 MB for a typical warehouse, depending on SKU count and history depth.",
      },
      {
        type: "p",
        text: "We sync incrementally. The device pulls only events newer than its last successful sync, and pushes only events the server hasn't acknowledged. On a slow connection, the typical sync round trip is 200 to 400 KB. On a fresh device the initial bootstrap is bigger (a few MB), but it's a one-time cost.",
      },
      {
        type: "p",
        text: "One thing we got wrong early: we tried to sync everything on a fixed interval. Every 30 seconds, then every 10 seconds, then every 3 seconds. All of these felt slow when you wanted real-time, and wasteful when nothing had changed. We now use a hybrid. Events push immediately when the device is online (sub-second), and a polling sync runs every few minutes as a backstop in case something was missed. This was the obvious answer in hindsight.",
      },
      { type: "h2", text: "The receipts problem" },
      {
        type: "p",
        text: "One subtle failure mode: an operator performs an action while offline, the action successfully syncs to the server, but the device never receives the confirmation receipt before the device crashes or restarts. On reconnect, the device might re-send the same action, producing duplicate events.",
      },
      {
        type: "p",
        text: 'We solved this with idempotency keys on every event (a UUID generated at action time, stored locally until acknowledged) and server-side deduplication keyed on the UUID. The server is the source of truth for "has this event been processed"; the client treats the absence of a receipt as "I should try again, knowing the server will dedupe me."',
      },
      {
        type: "p",
        text: "This is standard distributed-systems stuff, but it bit us harder than expected because warehouse devices are tougher than warehouse software developers usually imagine. They drop from belts, get knocked off shelves by forklifts, run out of battery in inconvenient places. Hard crashes are routine. We treated transient device failure as the common case, not the exception.",
      },
      { type: "h2", text: "Voice commands and ordering" },
      {
        type: "p",
        text: "When we added voice commands, we hit a new sync problem we hadn't anticipated. Voice actions process locally and can complete much faster than scan actions. (\"Adjust count B3-441 to 47\" runs as soon as the speech model returns, around 200ms.) Scan actions involve more pipeline. So in a single operator's stream, you can have voice events that originated at time T+0 and scan events that originated at time T-0.5 but completed at T+0.3.",
      },
      {
        type: "p",
        text: "If the server orders these by completion time, the resulting state is wrong: the scan's earlier intent loses to the voice's later intent. We had to be explicit that the device's intent timestamp (when the user spoke or pressed the button) is what matters, not when the action's processing finished.",
      },
      {
        type: "p",
        text: "This sounds obvious in writing. It was not obvious in code. Three production incidents and a lot of customer support tickets before we figured out the right invariant.",
      },
      { type: "h2", text: "Battery and bandwidth" },
      {
        type: "p",
        text: "Sync chattiness costs battery. Every time the radio comes on it costs maybe 80 mAh of power. A device that's syncing constantly on a flaky connection burns its battery in half a shift.",
      },
      {
        type: "p",
        text: "We backed off our sync strategy over time. Initially we treated each event as worth pushing on its own. Now we batch: events sit in the local outbox for up to 800 ms before pushing, on the assumption that an operator will likely produce another event soon. This nearly halved our average radio-on time for picking workflows without measurably affecting perceived responsiveness.",
      },
      {
        type: "p",
        text: "On bandwidth: warehouses are sometimes on metered connections (cellular failover when WiFi is down), so we use protobuf-encoded events instead of JSON to roughly quarter our wire size. We considered going further with a custom binary format and decided against it. The engineering cost wasn't worth the additional savings, and protobuf has decent debugging tooling.",
      },
      { type: "h2", text: "What we'd do differently" },
      {
        type: "p",
        text: "Two things, if we were starting over.",
      },
      {
        type: "p",
        text: "We would not build our own reactive query layer on top of SQLite. WatermelonDB has been good to us, but maintaining the bridge between the database, the React Native UI, and the sync layer has been a constant tax. If we did it again we'd probably reach for SQLite plus Drizzle ORM plus a thinner observability layer, and accept some performance loss in exchange for less custom plumbing.",
      },
      {
        type: "p",
        text: "We would also start with a coarser conflict model and let it grow, rather than the reverse. Our initial rules engine had distinct cases for every pair of operation types. We later collapsed many of them into three patterns (last-writer-wins, accumulate, manual-resolution) and have not noticed the loss of expressiveness. Simpler conflict models are easier to reason about, easier to debug, and easier for our support team to explain to customers when something does go wrong.",
      },
      { type: "h2", text: "If you're building something similar" },
      {
        type: "p",
        text: "Treat the device as untrusted. Operators install random apps, drop the device, run it through hot wash cycles by accident. Anything that can't survive arbitrary client misbehavior shouldn't be on the client.",
      },
      {
        type: "p",
        text: "Make idempotency keys mandatory from day one. Retroactively adding them after you discover a duplicate-event bug is much more painful than starting with them.",
      },
      {
        type: "p",
        text: "Pay attention to perceived latency, not actual latency. A user who scans an item and waits 600ms for the green checkmark will rate the app as slow. A user who scans, sees a green checkmark in 30ms (rendered locally before any sync), and waits 600ms for the server to process the action will rate the app as fast. The local optimistic update is what they feel.",
      },
      {
        type: "p",
        text: "Don't trust device clocks. Use server-issued timestamps for ordering wherever possible, and treat device timestamps as ordering hints that can be corrected.",
      },
      {
        type: "p",
        text: "Plan for the case where two operators legitimately produced the same event ID by accident. It happens. Operators share devices, then the shared device gets cloned to a new model, the clone duplicates some local state, and now a UUID that was supposed to be unique is in fact present on two devices. Yes, really, more than once.",
      },
      {
        type: "p",
        text: 'Test in dead zones. We didn\'t, originally. We thought "100% packet loss for 5 minutes" was an unrealistic test case. Then a customer in northern Idaho had it happen every hour during shift change because of a misbehaving 5 GHz repeater. Test it.',
      },
      { type: "h2", text: "Closing" },
      {
        type: "p",
        text: "Offline-first is not glamorous work. It's slow, fiddly, and most of the wins are invisible. When it works, no one notices, because it just feels like a normal app. When it doesn't work, every operator on the floor notices immediately, and they're not shy about telling you. We've made our peace with that distribution. It's the price of building software that warehouses can actually depend on, on radios that drop more often than the vendors will admit.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Apr 18, 2026 · Industry · Bin location naming
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "bin-location-naming-guide",
    tag: "Industry",
    date: "Apr 18, 2026",
    readTime: "8 min",
    title: "Bin location naming will outlast every system you ever buy",
    desc: "Whatever you print on the labels in year one is what you'll be reading in year fifteen. A practical guide to getting bin location names right the first time.",
    content: [
      {
        type: "p",
        text: "In ten years your company will have changed inventory providers twice. You will have migrated data, retrained staff, re-printed labels, and rewritten integrations. One thing that will not have changed is the names of your bin locations. Whatever you put on the wall in year one is what you'll be looking at in year fifteen. If you got it wrong, you'll be living with that decision for a long time.",
      },
      {
        type: "p",
        text: "We talk to a lot of warehouses. Maybe a third have a naming convention that's actively hostile to the people who work there. Another third have a convention that works but won't scale. The remaining third did this part well, and almost none of them got there by accident. They had someone, usually one stubborn person, who fought for a good naming scheme during the original buildout.",
      },
      {
        type: "p",
        text: "This is a guide for the stubborn person.",
      },
      { type: "h2", text: "What good naming buys you" },
      {
        type: "p",
        text: "Bin names get used constantly: on labels, on pick lists, in scans, in voice commands, in reports, in conversations between operators. A good name communicates everything an operator needs to know about a location without them having to look anywhere else. A bad name forces them to memorize the layout, ask a coworker, or guess.",
      },
      {
        type: "p",
        text: "The cost of bad naming compounds over the years. Workers waste time looking up where things are. Trainees take longer to ramp. Pick paths can't be optimized because the system doesn't know that two adjacent codes are actually fifteen meters apart. Reports lie because the dimensional categories you'd want to filter on (zone, level, dock proximity) aren't in the names.",
      },
      {
        type: "p",
        text: "Good naming is boring, mechanical, and worth the fight.",
      },
      { type: "h2", text: "Four principles" },
      {
        type: "p",
        text: "We've collected four rules that get most operations 90% of the way to a good scheme. Apply them in order and you'll have a name that survives growth.",
      },
      {
        type: "p",
        text: "Encode the structural axis first. A bin's location is structured: a zone within the warehouse, an aisle within the zone, a bay within the aisle, a level within the bay. The name should walk this hierarchy from most general to most specific, left to right. P-A04-12-B is a pick-zone bin, aisle 04, bay 12, level B. Anyone who learns the format once can decode every bin in the warehouse.",
      },
      {
        type: "p",
        text: "Zones encode purpose, not just geography. A zone is not just a region of floor space. It tells the system (and a person) what kind of operation happens there. We use P for pick locations (forward-deployed inventory for fulfillment), R for reserve (overflow storage), S for staging, D for damaged or quarantine, X for cross-dock, and Y for yard or trailer holding. Some operations need more (separate zones for cold and frozen storage, for example), but the principle holds: the first character of every bin name tells you what role the location plays.",
      },
      {
        type: "p",
        text: "Numbers must be zero-padded. This sounds petty. It isn't. A01, A02, A03 sorts correctly as a string. A1, A2, A3, A10, A11 does not. A10 sorts between A1 and A2. Every report you ever generate will be wrong unless your numbers are zero-padded to a consistent width. We use two digits for aisles (00-99) and two for bays (00-99). If you think you'll need more, three. Never one.",
      },
      {
        type: "p",
        text: 'Levels go last, alphabetically. Level is the smallest unit, encoded as a letter to distinguish from the numeric position fields. A is floor level, B is shoulder level, C and up are reach-ladder territory. Putting level last means the system can group "pick from anywhere on bay 12" naturally as a prefix match.',
      },
      {
        type: "p",
        text: "These four together give you the canonical format: ZONE-AISLE-BAY-LEVEL. P-A04-12-B. The hyphens are non-negotiable. Don't run things together. The hyphen is a checksum for the eye.",
      },
      { type: "h2", text: "Anti-patterns" },
      {
        type: "p",
        text: 'The SAP default. Out of the box, several major ERP systems suggest names like "WHSE01-AISLE-G-005-LVL-2." This is a perfectly clear name that no one can speak aloud, can\'t fit on a label readable from ten feet away, and produces miserable receiving slips. Whatever your ERP suggests as a default, it\'s optimizing for something other than the human who will say "G dash 5, level 2" eighty times a day.',
      },
      {
        type: "p",
        text: 'The alphabet-only scheme. Some warehouses use AA, AB, AC, AD instead of A01, A02, A03. The intent is usually that AA = aisle 1 bay 1, AB = aisle 1 bay 2, and so on. This breaks the moment you grow past 26 bays per aisle, and the symbol "AB" doesn\'t actually tell anyone anything they could decode at a glance. Numbers are better than letters when the thing being counted is numeric.',
      },
      {
        type: "p",
        text: 'The geographic-but-arbitrary scheme. A warehouse we worked with had bin names that were literally street-style: 4th Avenue, Bin 12. The first time you visit, this is charming. The fiftieth time, you realize that 4th Avenue is sometimes north-south and sometimes east-west depending on which warehouse, and a pick list that says "go to 4th Avenue" requires a mental layout map nobody has on Tuesday mornings.',
      },
      {
        type: "p",
        text: 'The legacy-system inheritance. Many warehouses inherit names from a 1990s system, get used to them, and never update because everyone "knows where everything is." Then they hire a new operator who quits in week two because nobody could explain why bin 7-G3 was next to bin Q-22. Inheritance is not a strategy. It\'s an excuse.',
      },
      { type: "h2", text: "Migration: what to do if you're already stuck" },
      {
        type: "p",
        text: "If your bin names are bad and you've been running for ten years, you do not have to live with this. But you cannot rip and replace overnight. We've helped half a dozen warehouses migrate, and the playbook looks like this.",
      },
      {
        type: "p",
        text: "Design the new scheme. Run it past three people who actually pick or putaway, not just management. The people who use the names know what hurts; the people who chose the names typically don't.",
      },
      {
        type: "p",
        text: "Run both names in parallel. Print labels with the new name and the old name side by side. For 60 to 90 days, every report shows both, every scan accepts both, every conversation can use either.",
      },
      {
        type: "p",
        text: "After the parallel period, retire the old names from the UI but keep them in the database as aliases. Old documents and old people will continue to reference them. That's fine. The system just translates.",
      },
      {
        type: "p",
        text: "Never re-introduce the old scheme even partially. The hardest part of a migration is the warehouse manager who, three months in, says \"well in section C let's keep the old names because everyone's used to them.\" If you compromise, you've now made things worse than before, because new operators have to learn two systems and nobody can tell which one applies where.",
      },
      { type: "h2", text: "On the labels themselves" },
      {
        type: "p",
        text: "A few opinions on the physical side, since we've been collecting them.",
      },
      {
        type: "p",
        text: "Vinyl stickers beat printed paper labels in any environment with moisture, dust, forklift traffic, or temperature variance. The label needs to outlast the bin. A paper label that fades in two years is a label you have to re-print and re-stick four times in the life of the warehouse. Vinyl lasts.",
      },
      {
        type: "p",
        text: "The barcode should be sized for a scan at three meters, not for the label aesthetics. We see warehouses with beautifully designed labels in which the barcode itself is tiny because the designer treated it as visual decoration around the text. The barcode is the point.",
      },
      {
        type: "p",
        text: "Include the bin name as text, large, above the barcode. Not because the worker can't scan it, but because there will be a day when the scanner is dead or the network is down, and someone needs to read the name off a label and write it down. That happens every quarter, conservatively.",
      },
      { type: "h2", text: "One last thing" },
      {
        type: "p",
        text: "If your warehouse is brand new and you have not yet named your bins, congratulations. You are in the best position you will ever be in to do this right. Spend an afternoon on it. Use ZONE-AISLE-BAY-LEVEL. Zero-pad your numbers. Print vinyl labels. Make the barcode legible from three meters. Then never touch the scheme again.",
      },
      {
        type: "p",
        text: "You'll be glad in fifteen years.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Apr 12, 2026 · Engineering · Cycle counting
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "cycle-counting-is-broken",
    tag: "Engineering",
    date: "Apr 12, 2026",
    readTime: "11 min",
    title: "Cycle counting is broken. Here's our case for replacing it.",
    desc: "Random ABC cycle counting is the default in most inventory software. We don't ship it. Here's the math behind what we built instead.",
    content: [
      {
        type: "p",
        text: "If you run a warehouse, you've probably heard of ABC cycle counting. It's the convention. Count your A-class (high-value, high-velocity) items every month, your B-class every quarter, your C-class once or twice a year. It's been the default in inventory software for forty years.",
      },
      {
        type: "p",
        text: "We don't ship it.",
      },
      {
        type: "p",
        text: "We have an ABC report. You can run an ABC analysis if you want. But the default counting suggestion in Nautilus has never been ABC, and we'd like to make the case for why.",
      },
      { type: "h2", text: "What ABC is actually optimizing for" },
      {
        type: "p",
        text: "ABC was designed for an era when counting was expensive. Each count required a worker to walk to a location, manually inspect quantity, and write it down. Time was the constraint. So you allocated your scarce time to the SKUs that mattered most. High-value items get counted often. Low-value items get counted rarely.",
      },
      {
        type: "p",
        text: "But here's what ABC does not consider: whether the count is likely to find a discrepancy. It's a static priority based on inventory value, not a dynamic priority based on probability of error.",
      },
      {
        type: "p",
        text: "Picture two A-class SKUs. One was counted three days ago, has had no receiving or pick activity since, and sits in a quiet aisle far from the dock. The other was counted three months ago, has had ninety pick events, eight receipts, and three relocations in the meantime, and sits two bays from a forklift turnaround zone. ABC says count them both at the same frequency. Common sense says count the second one first and don't bother with the first one yet.",
      },
      {
        type: "p",
        text: "When you count something where the system is already right, you've spent labor and found nothing. That's a wasted count. The whole point of cycle counting is to find errors before they compound into stockouts and mispicks. A count that doesn't find an error is not a successful count. It's a failed test that produced no information.",
      },
      { type: "h2", text: "The shift" },
      {
        type: "p",
        text: "What you actually want is not a value-weighted priority but a probability-weighted priority. Of all the SKUs and locations in your warehouse, which is most likely to be wrong right now? Count those. Don't count the ones the system is probably right about.",
      },
      {
        type: "p",
        text: "This is the same shift that happened in software testing in the 2000s. You used to write test cases by feature. Now you mostly write them by risk: untested code, code that just changed, code with a history of bugs. The labor went to where the labor was likely to matter.",
      },
      { type: "h2", text: "What goes into our model" },
      {
        type: "p",
        text: "Our counting recommender is a gradient-boosted classifier trained to predict the probability that a given SKU-at-a-location will have an inventory discrepancy if counted right now. The features:",
      },
      {
        type: "p",
        text: "Time since last successful count. Linear effect mostly. We found a small nonlinearity at the 90-day mark which we attribute to people simply forgetting that locations exist if they haven't been touched in three months.",
      },
      {
        type: "p",
        text: "Number of pick events since last count. Strong positive effect. More handling means more chances for an error.",
      },
      {
        type: "p",
        text: "Number of receiving events since last count. Weaker than picks but still significant, especially when the receipt was a split-quantity entry.",
      },
      {
        type: "p",
        text: "Number of relocations since last count. Strong positive effect. Moving an item is where you lose count.",
      },
      {
        type: "p",
        text: "Variance of pick-event spacing. Bursty picks correlate with higher error rates.",
      },
      {
        type: "p",
        text: "Operator tenure for the most recent operations at this location. Newer operators have higher discrepancy rates for about the first 60 days, after which the effect mostly disappears.",
      },
      {
        type: "p",
        text: "Proximity to congestion zones. Bays near forklift turnarounds, near the dock, or near common cross-traffic paths have higher discrepancy rates, presumably because items get knocked, bumped, or restacked more often.",
      },
      {
        type: "p",
        text: "Historical accuracy of this specific location. Some bins are chronically problematic. The model picks this up and weights them higher.",
      },
      {
        type: "p",
        text: "Last is the SKU's physical characteristics. Small loose items (washers, gaskets, screws) have systematically higher count errors than bulky discrete items. Items that come in mixed-quantity cases have higher errors than items in fixed-pack cases.",
      },
      { type: "h2", text: "What it produces" },
      {
        type: "p",
        text: "Output is a ranked list. The top of the list is the SKU-location pair most likely to be wrong right now. The bottom is the pair least likely. We surface the top of the list as the operator's recommended count queue. They can override it, but the default is to start from the highest-probability discrepancy.",
      },
      {
        type: "p",
        text: "In production, our top-decile recommendations turn into actual discrepancies about 6.4x more often than a random count of the same warehouse. That's the headline number we care about. It means each count an operator does is, on average, about six times more useful than ABC would predict.",
      },
      { type: "h2", text: "What we got wrong the first time" },
      {
        type: "p",
        text: "We initially used a logistic regression. It worked, but not as well as we needed. The interactions between features (high pick velocity AND new operator AND near-dock) carried a lot of signal that linear models couldn't capture. Switching to gradient boosting roughly doubled our discrepancy-finding rate.",
      },
      {
        type: "p",
        text: "We also originally surfaced the model's confidence as a percentage next to each recommendation. \"87% probability of discrepancy if counted now.\" This was a mistake. Operators interpreted the number as a forecast. They expected to find a discrepancy on 87% of those counts. The actual hit rate was closer to 31%. The number 87% was the model's calibrated probability rank; people heard it as a frequency. We now surface a five-step priority (Critical / High / Medium / Low / Skip) instead and have not had this confusion since.",
      },
      { type: "h2", text: "What it doesn't do" },
      {
        type: "p",
        text: "Probability-weighted counting doesn't help if you have a fundamental process problem. If your operators are routinely scanning the wrong bin label because the labels are unreadable, no model will save you. You'll just be counting and recounting the same bad data. Fix the labels first.",
      },
      {
        type: "p",
        text: "It also doesn't help if your error distribution is dominated by a single root cause, like one operator who's consistently miscounting. The model will correctly identify their territory as high-risk, but the right intervention is conversation, not more counting.",
      },
      { type: "h2", text: "The bigger point" },
      {
        type: "p",
        text: 'Most warehouse "best practices" predate cheap compute. ABC cycle counting was a good answer to "how do I allocate scarce inspector time," back when the model in your head was the best information available. With cheap compute and an event stream, the model in software can do better. Not because it\'s smarter, but because it has access to data the model in your head doesn\'t: every relocation timestamp, the variance of every pick interval, the operator tenure for every scan.',
      },
      {
        type: "p",
        text: "We think this same logic will eventually retire a half-dozen warehouse conventions. ABC, blanket safety stock multipliers, fixed-interval recounts, location-based shrink reporting. The convention exists because the computation was expensive. The computation is no longer expensive.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Apr 04, 2026 · Case Study · Mercantile Coffee
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "mercantile-coffee-near-miss",
    tag: "Case Study",
    date: "Apr 04, 2026",
    readTime: "9 min",
    title: "How we almost lost Mercantile Coffee in week six",
    desc: "An honest look at a multi-warehouse rollout that nearly ended early. What broke, why it broke, and what we changed afterward.",
    content: [
      {
        type: "p",
        text: 'Six weeks into the rollout, Reese Albano sent us a calendar invite titled "Wind down conversation."',
      },
      {
        type: "p",
        text: "Reese is the COO of Mercantile Coffee, a specialty roaster and distributor we'd been onboarding across four warehouses in Oregon and Washington. They roast about 380 tons of coffee a year. They were one of our first multi-site customers. And by their sixth week with Nautilus, they were ready to send us packing.",
      },
      {
        type: "p",
        text: "This is a case study, but not the kind that ends with a 70% improvement and a photogenic quote. It ends fine. We're still working together. But the path from week six to \"still working together\" wasn't pretty, and we think it's more useful to walk through what went wrong than to pretend the rollout was clean.",
      },
      { type: "h2", text: "What Mercantile is" },
      {
        type: "p",
        text: "Specialty coffee distribution looks deceptively simple. The product is a bag of beans. You receive bags from origin, you roast them (in Mercantile's case, in-house at two of their four facilities), and you ship them out. About 1,900 active SKUs. Maybe 80% of inventory turns inside 14 days. Most of their orders are wholesale to cafés and grocery, with a smaller direct-to-consumer line on Shopify.",
      },
      {
        type: "p",
        text: "What complicates this is that coffee changes state. Green beans come in. They're stored. They get roasted, which produces a new SKU. They're packaged, which produces another SKU. The packaged product goes out within a few weeks because beyond that it's stale and unsellable. Some lots get blended. Lot tracking is non-negotiable for traceability and recall.",
      },
      {
        type: "p",
        text: "Their stack before us: a custom-built inventory tool one of their developers wrote in 2019 that read and wrote to a shared Access database, with a brittle bridge to QuickBooks. They'd been trying to replace it for two years.",
      },
      { type: "h2", text: "Week one through three: cautiously fine" },
      {
        type: "p",
        text: "We did a phased rollout, starting at their smallest warehouse. (This is what we recommend; the alternative is a big-bang cutover and we've never seen one go well.) The first warehouse, in Eugene, handles their direct-to-consumer side and is the simplest of the four. Fewer SKUs, no roasting, no blends.",
      },
      {
        type: "p",
        text: "Eugene came up clean. Three days of double-entry parallel operation, then live. Their team adjusted quickly. Their warehouse manager, who'd been pushing for a system upgrade for years, was happy.",
      },
      {
        type: "p",
        text: "Then we moved to Portland.",
      },
      { type: "h2", text: "Week four: the first cracks" },
      {
        type: "p",
        text: "Portland is one of the roasting facilities. It has about 700 SKUs across green beans, roasted, packaged, and blends. Three things broke in week four.",
      },
      {
        type: "p",
        text: "The first was the barcode situation. Mercantile had been printing their own labels on a Brother thermal printer using a layout that hadn't been updated in years. The labels included an internal Mercantile SKU as a Code 39 barcode. When they brought in coffee from origin, the origin supplier's labels were already present on the bags, in Code 128, encoding their own SKU. Both barcodes coexisted on the same physical bag. Our scanner was reading whichever one its camera locked onto first, which meant some receipts were getting logged against the wrong SKU.",
      },
      {
        type: "p",
        text: "The second was the humidity. Portland's green coffee storage is climate-controlled in a way that produces persistent condensation on phone and scanner lenses. After about ten minutes on the floor, the scanners couldn't focus. Their team had a workaround for this (they kept a microfiber cloth in every pocket), but our app didn't know about the workaround, so when scans failed it would queue an \"unscannable item\" alert that piled up faster than anyone could clear it.",
      },
      {
        type: "p",
        text: "The third was that their procurement team was on a week-long offsite. Procurement runs the receiving process at Portland. The two people who came up cold to receiving during that week had not been part of the training sessions. They learned by doing, and the doing produced about 140 misallocated receipts that someone, eventually us, would have to unwind.",
      },
      { type: "h2", text: "Week six: the conversation" },
      {
        type: "p",
        text: "Reese is direct. The Wind Down call was 22 minutes long. She had a list. The list was specific. Several of the points were fair.",
      },
      {
        type: "p",
        text: 'What landed hardest was a phrase she used early: "Your software does not understand coffee." She was right. We had spent enormous effort building a flexible system that could handle anything from auto parts to electronics to apparel. We had not spent any effort thinking about what it means when a SKU literally cannot exist for more than three weeks before its value drops by half. We had no good answer for state changes (green → roast → packaged) other than treating each as a separate SKU with a separate receipt event, which is how you get 140 misallocated entries.',
      },
      {
        type: "p",
        text: "We did the only thing we could think to do: we asked for another week before they made a decision, and we put two engineers on-site at Portland the next morning.",
      },
      { type: "h2", text: "What we changed" },
      {
        type: "p",
        text: "In the week that followed, we shipped four things, most of which came out of conversations on Mercantile's floor.",
      },
      {
        type: "p",
        text: "We added multi-barcode disambiguation. If a single physical item is observed to have two barcodes (we detect this when a scan resolves to two different SKUs in our database, both matching their origin context), we now ask the user once which to treat as canonical. This was a half-day fix. It should have been the default behavior from launch. We'd just never encountered a customer with the layered-barcode pattern before.",
      },
      {
        type: "p",
        text: "We added state transitions for stateful SKUs. Instead of treating roast and package as separate inventory events with no link, we introduced a transformation action: scan input SKU, scan output SKU, record a lot. This is much closer to how real food and beverage operations think about their inventory, and we ought to have built it sooner.",
      },
      {
        type: "p",
        text: "We added a weekly drift report that flags receiving events with timestamps clustered within their first hour of access. If a new operator is being trained on receiving, almost every one of their first hour's scans will need review. Flagging the cluster makes that obvious to a supervisor.",
      },
      {
        type: "p",
        text: "And we wrote training material specific to coffee operations, including a checklist of equipment quirks (lens condensation, ladder-pick patterns at high-volume green storage, the way light spills change inside the bays at sunset) for their team to extend.",
      },
      {
        type: "p",
        text: "None of these were heroic engineering. The four together took eight working days. The reason they hadn't existed was that we'd never confronted the workflows that required them. It is, in retrospect, embarrassing that the multi-barcode case wasn't part of our v1.",
      },
      { type: "h2", text: "Six months later" },
      {
        type: "p",
        text: "Mercantile is now using Nautilus across all four facilities, with the Tacoma site coming up two months ago. Inventory accuracy is at 99.4% as of their last quarterly count, up from a self-reported 94-ish before we arrived. Roast batch traceability went from spreadsheet-by-hand to a query that takes 90 milliseconds.",
      },
      {
        type: "p",
        text: 'More important than any number: they trust the software now. Reese still sends pointed emails when something is wrong. She also sent us a five-pound bag of their Ethiopia Yirgacheffe at Christmas, with a note that read, "Don\'t get cocky."',
      },
      { type: "h2", text: "What we kept from this" },
      {
        type: "p",
        text: "Three things, mostly procedural.",
      },
      {
        type: "p",
        text: "We now scope rollouts by product type, not by warehouse count. A food and beverage customer with two warehouses is harder than an auto-parts customer with five. Our onboarding now begins with a product-type interview that includes seventeen specific questions about state changes, lot tracking, expiration, and label layout.",
      },
      {
        type: "p",
        text: "We bring an engineer on-site to the second warehouse of any multi-site rollout, not the first. The first warehouse is always the simplest and always goes well; the second is where the customer's actual operational complexity shows up.",
      },
      {
        type: "p",
        text: "And we hold a Wind Down rehearsal with every multi-site customer at the four-week mark. It is exactly what it sounds like. We explicitly ask them what would have to be true for them to fire us, and we work backwards from there. This is uncomfortable to do. We have learned more in those conversations than in any QBR.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Mar 28, 2026 · Product · AI Voice Commands
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "ai-voice-commands",
    tag: "Product",
    date: "Mar 28, 2026",
    readTime: "4 min",
    title: "Voice commands are now in every Nautilus plan",
    desc: "Hands-free scan, count, and lookup workflows. How we trained the speech model on 10,000 hours of warehouse audio, and what it gets right and wrong.",
    content: [
      {
        type: "p",
        text: "Warehouse workers don't have a free hand. Every time they need to put something into the system, they have to put down what they were holding, pull out a device, and tap through screens. The friction is small per scan and large per shift.",
      },
      {
        type: "p",
        text: "Voice Commands shipped this week. It runs on any device with a microphone, processes locally for sub-200ms response, and falls back to the cloud only when the local model isn't confident.",
      },
      { type: "h2", text: "How it works" },
      {
        type: "p",
        text: 'Say "scan this" and hold up a barcode. Say "where is SKU 4821" and get turn-by-turn directions. Say "count section B3" and start a hands-free cycle count. The system understands context: if you just scanned a product, "move to B7" knows what you\'re relocating.',
      },
      {
        type: "p",
        text: "Every scan action available in the app is available by voice. Pick, putaway, receive, relocate, count, adjust, ship, return. You can also query inventory levels, check order status, and pull up product details without touching the screen.",
      },
      { type: "h2", text: "Accuracy and noise handling" },
      {
        type: "p",
        text: "Warehouses are loud. We trained the speech model on roughly 10,000 hours of actual warehouse audio (forklifts, conveyors, radio chatter, two-way conversations carrying from the next aisle) so it handles background noise that confuses general-purpose voice assistants. Across 14 facilities in beta, command recognition accuracy averaged 97.3%.",
      },
      {
        type: "p",
        text: "When the model isn't confident, it asks rather than guesses. We tuned the threshold to err on the side of confirmation, because a wrong scan you didn't notice is much worse than a slow scan you did.",
      },
      { type: "h2", text: "Getting started" },
      {
        type: "p",
        text: "Voice Commands is on every plan. Enable it in Settings → AI Features → Voice Commands. The first time you use it the app will calibrate to your voice and your warehouse's background. Calibration takes about 90 seconds and is a one-time step per device.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Mar 15, 2026 · Engineering · Barcode recognition
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "sub-200ms-barcode-recognition",
    tag: "Engineering",
    date: "Mar 15, 2026",
    readTime: "8 min",
    title: "How we got barcode recognition under 200ms",
    desc: "A walk through the four-stage scan pipeline — frame selection, neural localization, decode, lookup — and where the time actually goes.",
    content: [
      {
        type: "p",
        text: 'Our target for barcode scanning was 200 milliseconds from camera frame to decoded SKU on screen. Not "fast for a web app." Fast enough that the operator never registers a wait.',
      },
      {
        type: "p",
        text: "We're under it now, by a comfortable margin. Here's where the time goes.",
      },
      { type: "h2", text: "The pipeline" },
      {
        type: "p",
        text: "The scanning pipeline has four stages: frame capture, barcode localization, decode, and database lookup. Each had to be optimized independently, then the whole pipeline had to work together without blocking the main thread.",
      },
      {
        type: "p",
        text: "Frame capture uses the device camera at 30fps. We don't process every frame. An adaptive algorithm selects the sharpest frame from each 3-frame window based on edge contrast scoring. This alone eliminated 40% of decode failures from motion blur.",
      },
      { type: "h2", text: "Neural barcode localization" },
      {
        type: "p",
        text: "Traditional barcode scanners look for specific patterns across the entire image. We trained a lightweight CNN (1.2M parameters) to predict bounding boxes around barcode regions in under 15ms. Cropping the image before decode is dramatically faster than scanning at full resolution.",
      },
      {
        type: "p",
        text: "The model handles partial barcodes, damaged labels, and unusual angles that would fail with traditional pattern matching. It was trained on 2.3 million real-world barcode images captured in warehouse conditions: peeled labels, freezer condensation, scuffs from years of handling.",
      },
      { type: "h2", text: "Decode and lookup" },
      {
        type: "p",
        text: "Once localized, the barcode region is processed by our decode engine, which supports Code 128, Code 39, EAN-13, UPC-A, QR, and Data Matrix formats simultaneously. No need to specify which format. The engine identifies and decodes in a single pass.",
      },
      {
        type: "p",
        text: "Database lookup happens against a local cache of the warehouse's product catalog, synced in the background. Cache hits (98.7% of lookups) complete in under 2ms. Cache misses fall back to the API with typical response times of 40 to 80ms.",
      },
      {
        type: "p",
        text: "End to end: frame selection 10ms, localization 15ms, decode 8ms, lookup 2ms, rendering 12ms. 47ms typical. Our 200ms target gives us 153ms of headroom for difficult conditions.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Mar 02, 2026 · Industry · $300K problem
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "300k-problem-manual-operations",
    tag: "Industry",
    date: "Mar 02, 2026",
    readTime: "6 min",
    title: "The $300K problem: where manual warehouse ops actually leak money",
    desc: "We pulled operational data from 200+ warehouses. The average facility loses about $300,000 a year to manual processes. Here's where the bleeding happens.",
    content: [
      {
        type: "p",
        text: "We pulled operational data from 200+ warehouses across industries. The average facility loses about $300,000 a year to inefficiencies that software could eliminate. Most operators know manual work is expensive. Fewer have added up the number.",
      },
      { type: "h2", text: "Where the money goes" },
      {
        type: "p",
        text: "The biggest cost is not dramatic failure. It's the daily accumulation of small inefficiencies. Mispicks that require reshipping (about $42 per incident, on average). Cycle counts that take three times longer than they need to. Workers walking suboptimal routes because they're picking from a printed list instead of an optimized sequence.",
      },
      {
        type: "p",
        text: "Labor accounts for 65% of the total. The remaining 35% splits between excess inventory carrying costs from inaccurate counts, expedited shipping to cover stockouts, and returns processing from wrong-item-shipped errors.",
      },
      { type: "h2", text: "The compounding effect" },
      {
        type: "p",
        text: "Manual errors don't just cost money directly. They compound. A miscounted shelf leads to a stockout. The stockout triggers an emergency reorder at premium pricing. The premium order arrives and now you're overstocked. The overstock sits on a shelf for months, tying up capital and taking up space that could hold faster-moving product.",
      },
      { type: "h2", text: "What automation changes" },
      {
        type: "p",
        text: "Warehouses that implement scanning-based inventory management see an average 73% reduction in mispicks within the first 90 days. Cycle count time drops by 60 to 70%. Pick route optimization alone saves 15 to 20 minutes per picker per shift.",
      },
      {
        type: "p",
        text: "At a 50-person warehouse running two shifts, those saved minutes add up to roughly 400 labor hours per month. That's the equivalent of 2.5 full-time employees.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Feb 18, 2026 · Product · Spatial Intelligence
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "spatial-intelligence-warehouse-map",
    tag: "Product",
    date: "Feb 18, 2026",
    readTime: "5 min",
    title: "Spatial Intelligence: your warehouse as a living map",
    desc: "Most inventory software treats a warehouse as a flat list of bin codes. Yours isn't flat. Spatial Intelligence builds a real-time model from your scan activity.",
    content: [
      {
        type: "p",
        text: "Most inventory software treats a warehouse as a flat list of bin codes. Yours isn't flat. It has wide aisles, narrow aisles, dead ends, a forklift turnaround near the dock that backs up traffic at 10am, and a cold storage room you have to go around to reach the back of section C.",
      },
      {
        type: "p",
        text: "Spatial Intelligence is what we built so the software knows about all of that too.",
      },
      { type: "h2", text: "Building the map" },
      {
        type: "p",
        text: "Nautilus Spatial Intelligence builds a real-time model of your warehouse from scan data. Every time a worker scans at a location, the system refines its understanding of the physical layout: aisle widths, shelf heights, walking distances between sections. After about two weeks of normal operations the model is accurate to within 0.5 meters.",
      },
      { type: "h2", text: "Smarter putaway" },
      {
        type: "p",
        text: "With spatial awareness, putaway suggestions factor in physical proximity, not just logical location codes. If a product is frequently picked alongside another product, the system suggests placing them in adjacent locations to minimize future pick travel time.",
      },
      { type: "h2", text: "Congestion avoidance" },
      {
        type: "p",
        text: "The spatial model tracks real-time activity density. If three pickers are already working in aisle C4, the system will route the fourth picker through C5 even when C4 has the next item on their list. The extra 10-second detour avoids a 2-minute traffic jam.",
      },
      {
        type: "p",
        text: "Spatial Intelligence is available on Enterprise plans. The model builds itself from your team's normal scan activity, with no extra hardware to install and no manual mapping to do.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Feb 05, 2026 · Case Study · BuildRight Supply
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "buildright-supply-case-study",
    tag: "Case Study",
    date: "Feb 05, 2026",
    readTime: "7 min",
    title: "How BuildRight Supply cut counting time by 70%",
    desc: "BuildRight Supply rolled Nautilus out across three warehouses. Ninety days later: 70% faster cycle counts, 99.7% accuracy, and no spreadsheets.",
    content: [
      {
        type: "p",
        text: "BuildRight Supply distributes building materials (lumber, drywall, fasteners, tools) across three warehouses in the Pacific Northwest. Before Nautilus, their inventory management ran on a combination of spreadsheets, a legacy ERP system, and a lot of manual counting.",
      },
      { type: "h2", text: "The challenge" },
      {
        type: "p",
        text: "BuildRight's product catalog spans 14,000 SKUs with high visual similarity. A single shelf might hold 15 different types of screws that look nearly identical. Their manual counting process required experienced staff who could visually identify products. New hires took months to become reliable counters.",
      },
      {
        type: "p",
        text: "Cycle counts consumed 120 staff-hours per month across all three locations. Despite the effort, inventory accuracy hovered around 94%, well below the 99%+ target they needed for reliable order fulfillment.",
      },
      { type: "h2", text: "Implementation" },
      {
        type: "p",
        text: "BuildRight rolled out Nautilus in phases, one warehouse at a time over six weeks. The team configured sections, bays, and levels to match their physical layout, then barcoded every location. Staff training took one afternoon per warehouse.",
      },
      { type: "h2", text: "Results after 90 days" },
      {
        type: "p",
        text: "Cycle count time dropped from 120 hours to 36 hours per month. A 70% reduction. Inventory accuracy rose to 99.7%. Mispick rate fell from 2.1% to 0.3%. The time savings alone freed up the equivalent of two full-time warehouse associates, who were reassigned to fulfillment.",
      },
      {
        type: "p",
        text: "The team has since expanded to use voice commands and AI-prioritized counting, which they expect will cut the remaining 36 hours further.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Jan 22, 2026 · Engineering · Predictive stock depletion
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "predictive-stock-depletion-math",
    tag: "Engineering",
    date: "Jan 22, 2026",
    readTime: "10 min",
    title: "Predictive stock depletion: the math behind the forecast",
    desc: "Our model predicts stockouts about three days out. Here's the time-series setup, how we handle outlier demand, and the parts that broke first.",
    content: [
      {
        type: "p",
        text: "Stockouts are expensive. They trigger emergency reorders, expedited shipping, backorder processing, and lost customers. Nautilus predicts stockouts about three days before they happen, which is usually enough lead time for a team to act without paying expedite fees.",
      },
      { type: "h2", text: "The forecasting model" },
      {
        type: "p",
        text: "At its core the engine uses a modified exponential smoothing model that tracks three components for every SKU: baseline demand, trend (is demand increasing or decreasing?), and seasonality (does demand vary by day of week, month, or season?).",
      },
      {
        type: "p",
        text: "These three components combine into a forecast of daily demand for the next 14 days. When projected demand exceeds current inventory minus safety stock, the system generates an alert.",
      },
      { type: "h2", text: "Learning from your data" },
      {
        type: "p",
        text: "The model trains on each warehouse's historical scan data. A new warehouse gets generic priors that work reasonably well. After 30 days the model has enough facility-specific data to start making accurate predictions. After 90 days, prediction accuracy typically exceeds 91%.",
      },
      { type: "h2", text: "Handling unusual patterns" },
      {
        type: "p",
        text: "The hard part is the edge cases. A product that sells 10 units per day for months, then suddenly gets ordered in a batch of 500 by a single customer. The model needs to distinguish a genuine demand spike from an outlier.",
      },
      {
        type: "p",
        text: "We use a separate anomaly detection layer that flags unusual consumption patterns. When one fires, the system asks the user to confirm whether the pattern represents new demand or a one-time event, and adjusts the model accordingly.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Jan 10, 2026 · Product · Integrations
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "18-integrations-one-warehouse",
    tag: "Product",
    date: "Jan 10, 2026",
    readTime: "3 min",
    title: "Nautilus connects to 18 of the tools you already use",
    desc: "QuickBooks, Shopify, FedEx, and 15 others. Nautilus plugs into the stack you already have rather than asking you to replace it.",
    content: [
      {
        type: "p",
        text: "We don't want Nautilus to replace your stack. Your accounting is in QuickBooks, your storefront is on Shopify, your shipping goes through ShipStation. Nautilus should plug in next to those, not push them out.",
      },
      {
        type: "p",
        text: "Today we're announcing 18 integrations across three categories: accounting and ERP, e-commerce and POS, and shipping and logistics.",
      },
      { type: "h2", text: "Accounting & ERP" },
      {
        type: "p",
        text: "QuickBooks, Xero, FreshBooks, SAP Business One, NetSuite, and Sage. Inventory movements on the floor automatically update your books. Purchase orders, cost of goods sold, and inventory valuations stay in sync without manual journal entries.",
      },
      { type: "h2", text: "E-commerce & POS" },
      {
        type: "p",
        text: "Shopify, WooCommerce, Amazon, Square, BigCommerce, and Lightspeed. Every sale decrements warehouse stock in real time. No overselling across channels. Fulfillment workflows start automatically when orders arrive.",
      },
      { type: "h2", text: "Shipping & Logistics" },
      {
        type: "p",
        text: "ShipStation, Shippo, EasyPost, FedEx, UPS, and DHL. Picked orders flow into your shipping platform. Labels print, tracking numbers push back to sales channels, and customers get notified, all from one scan.",
      },
      {
        type: "p",
        text: "Every integration is available on every plan. Setup takes under 10 minutes per connection. The Integrations page in your Nautilus dashboard has the full list.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     Dec 28, 2025 · Industry · 2026 trends
     ────────────────────────────────────────────────────────────────── */
  {
    slug: "2026-warehouse-technology-trends",
    tag: "Industry",
    date: "Dec 28, 2025",
    readTime: "6 min",
    title: "Five things we think 2026 changes for warehouses",
    desc: "We don't write a lot of trend posts. Customers ask, so here are five shifts we think are going to keep mattering through the year.",
    content: [
      {
        type: "p",
        text: "We don't write a lot of trend posts. Most of them age badly. Customers ask anyway, so here are five shifts we think are going to keep mattering through 2026. We have skin in the game on all of them.",
      },
      { type: "h2", text: "1. Voice as a primary input, not a novelty" },
      {
        type: "p",
        text: "Voice has been on warehouse roadmaps for a decade and has rarely worked well outside of structured pick-by-voice deployments. Local speech models trained on actual warehouse audio are finally good enough that operators use voice in the same casual way they use scanning. We expect voice to handle 30%+ of operator interactions by the end of the year in facilities that have it turned on.",
      },
      {
        type: "h2",
        text: "2. Counting moves from schedule-based to risk-based",
      },
      {
        type: "p",
        text: "Forty years of ABC-style cycle counting are going to look quaint by the end of the decade. The interesting question is no longer how often to count a SKU but how likely that SKU is to be wrong right now. Probability-weighted counting gets you the same accuracy with a fraction of the labor. We wrote about our own version of this earlier in the spring.",
      },
      { type: "h2", text: "3. The warehouse as a spatial object" },
      {
        type: "p",
        text: "Most inventory software still treats a warehouse as a flat database of locations. The next generation of products understands the floor as a physical space with congestion patterns, walking distances, and ergonomic constraints. The shift won't come from a new feature; it'll come from the slow accumulation of layout-aware tools across putaway, picking, and route planning.",
      },
      { type: "h2", text: "4. Smaller, more opinionated integration sets" },
      {
        type: "p",
        text: 'The era of "we connect to everything" is fading. Operators prefer a smaller set of integrations that go deep over a larger set that go shallow. Two-way sync with QuickBooks, real-time webhooks with Shopify, and bin-level transfer order support with NetSuite are worth more than a hundred CSV-based connectors that nobody uses twice.',
      },
      { type: "h2", text: "5. Mobile-first, not mobile-companion" },
      {
        type: "p",
        text: "The remaining holdouts running purpose-built handheld scanners are being replaced by smartphones and tablets running native apps. The cost savings are real; the bigger advantage is the ability to push updates to every device on Tuesday afternoon instead of scheduling a quarterly firmware push.",
      },
      {
        type: "p",
        text: "If we're wrong about any of these, the customers will tell us in the usual way. We'll write the follow-up.",
      },
    ],
  },
];
