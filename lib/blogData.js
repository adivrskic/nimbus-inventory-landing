export const BLOG_POSTS = [
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
        text: "We turned on the anomaly detection layer for all customers on April 1st. The feature is what it sounds like: a model that watches the stream of scans, counts, voice events, and movements in your warehouse, and flags patterns that look unusual.",
      },
      {
        type: "p",
        text: "We were curious what it would actually catch. The team had spent months on the model and we had a long list of theoretical anomalies we'd designed for, but theory is theory. Here are five real things it surfaced in the first month, anonymized but otherwise unmodified. None of these were in our list of design cases.",
      },
      { type: "h2", text: "One. The unproductive scanning" },
      {
        type: "p",
        text: 'First customer, large auto parts distributor. Day three of the feature being live, we get a note from their warehouse manager: their early-morning shift had been scanning the same SKU 47 times in 8 minutes. The anomaly system flagged it as "repeat-scan well above normal distribution." On its own, that\'s not necessarily a problem; sometimes operators scan things repeatedly during a difficult count.',
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
        text: "But: it could have been theft. And the fact that it took a model to surface this for review, rather than a human noticing it the next morning during a 30-second glance at the activity log, is the point. The 30-second glance doesn't happen reliably. The model flag does.",
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
        text: "The customer investigated. The operator was avoiding aisles 9-16 because a coworker who worked in that section had been making sexual comments. The picker had been declining assignments in that area, swapping them for assignments in aisles 1-8 with other operators who didn't ask questions about why.",
      },
      {
        type: "p",
        text: 'This is not a use case we built for. The model flagged it as "pick distribution far from optimizer assignment for this operator," which is a statistical statement, not a social one. The HR conversation that followed was the customer\'s, and they handled it well, but we are uncomfortable that this is what our tool detected. We have left the alert active and added a help center entry recommending that managers who see this pattern start a confidential conversation, not a disciplinary one.',
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
        text: 'We had not built the anomaly detector to catch our own integration bugs. It caught it anyway, because "this looks weird" is a generic enough framing that anything weird gets surfaced, including things that are weird because of how we wrote our software. The fix took two hours. The duplicate events had been in the data for about a week, affecting maybe four customers. We rolled the fix out across all customers, sent the affected ones a note, and audited their historical reporting to back out the inflated numbers.',
      },
      {
        type: "p",
        text: "This was, in some ways, the most useful catch of the five. The other four were customer-side issues. This one was ours. The anomaly detector pointed it out before our QA process did.",
      },
      { type: "h2", text: "What it doesn't catch" },
      {
        type: "p",
        text: "In the spirit of being honest:",
      },
      {
        type: "p",
        text: "It doesn't catch slow drift. If your inventory accuracy is degrading by 0.3% per week, the model sees normal-looking individual transactions and won't flag any of them. The cycle-counting recommender will eventually correct the drift, but it can take longer than you'd like.",
      },
      {
        type: "p",
        text: "It doesn't catch policy violations that are statistically common. If half your operators are routinely skipping a step in the receiving process, the model considers that the norm and won't surface it. You need process audits for that, not pattern detection.",
      },
      {
        type: "p",
        text: "It doesn't reason about intent. It can flag that an adjustment happened at an unusual time, but it can't tell whether the adjustment was someone working late or someone covering up shrinkage. The interpretation is always the human's.",
      },
      { type: "h2", text: "Tuning" },
      {
        type: "p",
        text: 'By default, anomaly detection runs at a threshold that surfaces roughly 8 to 12 alerts per warehouse per week. This is what we picked based on beta feedback as "enough that the alerts are taken seriously, few enough that they don\'t get ignored as noise." You can tune this in Settings if you want a different volume.',
      },
      {
        type: "p",
        text: 'The model also accepts feedback. Every alert has a "useful / not useful" thumbs button. Aggregate feedback is fed back into our training pipeline weekly, so the system gets better at surfacing alerts your team finds actionable and quieter on alerts you don\'t.',
      },
      { type: "h2", text: "Closing" },
      {
        type: "p",
        text: 'We are wary of the framing "AI watches your warehouse and catches problems." It\'s not wrong but it can sound sinister, and we are determined not to ship a surveillance product. The alerts are aimed at operations leads, not at individual operators. The defaults are conservative. The system never disciplines anyone; it surfaces patterns, and the human decides what, if anything, to do.',
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
    desc: "Three years of building a WMS that works without a network: what we learned, what we got wrong, and what we'd do differently if we started over.",
    content: [
      {
        type: "p",
        text: 'Warehouses are radio-frequency hostile environments. Metal racking everywhere, concrete walls, the occasional Faraday-cage cold storage room, forklifts emitting electrical noise. WiFi works most of the time, but "most of the time" is not a viable substrate for a production system that operators rely on every second.',
      },
      {
        type: "p",
        text: "Early on, we made the call that every action a Nautilus operator takes (every scan, voice command, count entry, adjustment) has to work without a network. The device should never wait for a round trip before confirming an action. The expensive part of building a WMS that feels instant is not the AI or the integrations. It's the offline-first sync layer underneath.",
      },
      {
        type: "p",
        text: "We've now been operating this layer for about three years, including across a few customers in metal-clad facilities where the WiFi drops every couple of minutes. This is what we got wrong, what we got right, and what we'd do differently.",
      },
      { type: "h2", text: "Why naive queueing fails" },
      {
        type: "p",
        text: "The first thing you'd reach for is action queueing: every user action gets serialized into a queue on the device, the queue flushes to the server whenever the network is up. This works for a single user. It falls apart the moment you have multiple operators making changes to overlapping state.",
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
        text: "That's the simplest case. It gets much worse when the conflicting actions are different types: one device adjusts the count, another relocates the item, the third is in the middle of a count audit that assumes a specific quantity. Naive queueing produces inconsistent state across devices and unhappy users.",
      },
      { type: "h2", text: "What we ended up with" },
      {
        type: "p",
        text: "Our sync layer treats every entity (SKU, bin, lot, count) as a state machine with a known set of transitions, and every operator action as an event with a few properties: a unique ID, a timestamp from the originating device, a vector clock of what the device knew at the time, and the actual operation.",
      },
      {
        type: "p",
        text: "When events arrive at the server, they're applied in an order that respects causality (you can't pick from a bin you don't know exists yet) rather than wall-clock time. Conflicts that the order-of-arrival can't resolve are sent through a rules engine that knows, for each pair of conflicting operation types, what to do.",
      },
      {
        type: "p",
        text: 'For the "both pickers scan the same bin" case: the count operations don\'t actually conflict if both are decrements within available stock. We accumulate them, and the bin count ends up correct (9 → 7). What we surface to the user, optionally, is a notification: "your colleague also picked from bin 12 while you were offline." This isn\'t strictly necessary for correctness, but it\'s necessary for not freaking people out.',
      },
      {
        type: "p",
        text: 'For relocations that conflict with picks: pick wins. Relocation gets returned to the operator as "this item is no longer at the location you intended to move it from." This matches what would happen in the physical world if both operators were online; the picker would have grabbed the item before the mover got there.',
      },
      {
        type: "p",
        text: "For adjustments that conflict with anything: adjustment wins, because adjustments represent the operator's belief about ground truth, and we trust the human in front of the bin over the system's belief about what should be there.",
      },
      {
        type: "p",
        text: "These rules took months to enumerate. We didn't get them right at first.",
      },
      { type: "h2", text: "The data layer" },
      {
        type: "p",
        text: "We use SQLite on every device, wrapped with WatermelonDB for the reactive query layer. Every entity the operator can interact with (products, locations, lots, open work) is replicated locally. On Android and iOS, the database is around 12 to 40 MB for a typical warehouse, depending on SKU count and history depth.",
      },
      {
        type: "p",
        text: "We sync incrementally: the device pulls only events newer than its last successful sync, and pushes only events the server hasn't acknowledged. On a slow connection, the typical sync round trip is 200 to 400 KB. On a fresh device, the initial bootstrap is bigger (a few MB), but it's a one-time cost.",
      },
      {
        type: "p",
        text: "One thing we got wrong early: we tried to sync everything on a fixed interval (every 30 seconds, then every 10 seconds, then every 3 seconds). All of these felt slow when you wanted real-time, and wasteful when nothing had changed. We now use a hybrid. Events push immediately when the device is online (sub-second), and a polling sync runs every few minutes as a backstop in case something was missed. This was the obvious answer in hindsight.",
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
        text: "Sync chattiness costs battery. Every time the radio comes on, it costs maybe 80 mAh of power. A device that's syncing constantly on a flaky connection burns its battery in half a shift.",
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
        text: "We would not build our own reactive query layer on top of SQLite. WatermelonDB has been good to us, but maintaining the bridge between the database, the React Native UI, and the sync layer has been a constant tax. If we did it again, we'd probably reach for SQLite + Drizzle ORM + a thinner observability layer, and accept some performance loss in exchange for less custom plumbing.",
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
    title: "Bin location naming will outlast every WMS you ever buy",
    desc: "Whatever you print on the labels in year one is what you'll be reading in year fifteen. A practical guide to getting bin location names right the first time.",
    content: [
      {
        type: "p",
        text: "In ten years, your company will have changed WMS providers twice. You will have migrated data, retrained staff, re-printed labels, and rewritten integrations. One thing that will not have changed is the names of your bin locations. Whatever you put on the wall in year one is what you'll be looking at in year fifteen. If you got it wrong, you'll be living with that decision for a long time.",
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
        text: 'The legacy-system inheritance. Many warehouses inherit names from a 1990s WMS, get used to them, and never update because everyone "knows where everything is." Then they hire a new operator who quits in week two because nobody could explain why bin 7-G3 was next to bin Q-22. Inheritance is not a strategy. It\'s an excuse.',
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
    desc: "Random ABC cycle counting is the default in most WMS software. We don't ship it. Here's the math behind what we built instead.",
    content: [
      {
        type: "p",
        text: "If you run a warehouse, you've probably heard of ABC cycle counting. It's the convention. Count your A-class (high-value, high-velocity) items every month, your B-class every quarter, your C-class once or twice a year. It's been the default in WMS software for forty years.",
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
        text: "Variance of pick-event spacing. Bursty picks correlate with higher error rates. If you pick a SKU thirty times in two hours, the chance that one of those picks was logged against the wrong location is higher than if you picked it once a day for thirty days.",
      },
      {
        type: "p",
        text: "Operator turnover at the location. Locations primarily handled by operators with under six months of tenure show 1.8x the discrepancy rate of those handled by veterans. We don't surface this in the UI, but the model uses it.",
      },
      {
        type: "p",
        text: "Time-of-day distribution. Items mostly picked during shift handoff hours have higher error rates. The model can't fix shift handoff problems but it can prioritize counts that catch them.",
      },
      {
        type: "p",
        text: "Last discrepancy magnitude. If a SKU was wrong by 12 units last time, the next count of it is much more likely to find another discrepancy than a SKU that has never had one. We initially thought this was noise. It isn't.",
      },
      {
        type: "p",
        text: "Adjacent-location density. SKUs in dense storage where adjacent bins hold similar-looking items have higher error rates.",
      },
      {
        type: "p",
        text: "Light-level estimation, which we get from the front camera during scans. Dark corners produce more errors. We were surprised by this one and almost dismissed it before the effect held up over more data.",
      },
      { type: "h2", text: "Training data" },
      {
        type: "p",
        text: "The model was trained on roughly 200,000 labeled count events from beta customers across 14 warehouses, with labels being the absolute discrepancy at the time of count. We held out four warehouses entirely for evaluation. We trained per-customer fine-tunes for the largest five customers and a global model that we use for everyone else; the fine-tunes outperform the global by about 7% AUC on average.",
      },
      {
        type: "p",
        text: 'We tuned for AUC rather than top-k accuracy because we don\'t actually rank-and-pick. We let the user choose how many counts they want to do today and surface the highest-probability candidates. The economic question is "how much of our daily counting labor budget should we spend on the next location?" and AUC matches that decision better than top-k.',
      },
      { type: "h2", text: "Results from the field" },
      {
        type: "p",
        text: "Across our beta cohort, switching from ABC to probability-weighted counting cut the average daily count workload by 38% while increasing discrepancies found per count by 2.7x. In absolute terms: customers were doing roughly half the counting work and finding roughly three times more errors.",
      },
      {
        type: "p",
        text: "The customers who saw the biggest gains were not the largest. They were the messiest. Warehouses with high SKU diversity, frequent relocations, and operators newer than six months. Those are exactly the conditions where uniform ABC underspends on the risky locations.",
      },
      {
        type: "p",
        text: "Two customers saw smaller gains, both in the 10-15% range. We dug in. One had a very well-run operation already with very low discrepancy rates across the board, which limited how much we could help. The other was using us in a way we hadn't expected. They were counting only one section of their warehouse with Nautilus while doing the rest manually, which broke our model's ability to learn the customer-specific patterns.",
      },
      { type: "h2", text: "What we got wrong in v1" },
      {
        type: "p",
        text: "The first version of the recommender didn't account for time-of-day of the last count. We discovered (about four months in) that counts performed at 4 PM had a 12% higher rediscovery rate than counts performed at 9 AM, controlling for everything else. End-of-shift counters are tired and less rigorous. Our model now down-weights counts performed in the last hour of a shift, treating them as partial information.",
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
        text: 'Most warehouse "best practices" predate cheap compute. ABC cycle counting was a good answer to "how do I allocate scarce inspector time," when the model in your head was the best information available. With cheap compute and an event stream, the model in software can do better. Not because it\'s smarter, but because it has access to data the model in your head doesn\'t: every relocation timestamp, the variance of every pick interval, the operator tenure for every scan.',
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
        text: 'What landed hardest was a phrase she used early: "Your software does not understand coffee." She was right. We had spent enormous effort building a flexible WMS that could handle anything from auto parts to electronics to apparel. We had not spent any effort thinking about what it means when a SKU literally cannot exist for more than three weeks before its value drops by half. We had no good answer for state changes (green → roast → packaged) other than treating each as a separate SKU with a separate receipt event, which is how you get 140 misallocated entries.',
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
        text: "We added state transitions for stateful SKUs. Instead of treating roast and package as separate inventory events with no link, we introduced a transformation action: scan input SKU, scan output SKU, record a lot. This is much closer to how real food and beverage operations think about their inventory and we ought to have built it sooner.",
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
     EXISTING POSTS — unchanged below this line
     ────────────────────────────────────────────────────────────────── */

  {
    slug: "ai-voice-commands",
    tag: "Product",
    date: "Mar 28, 2026",
    readTime: "4 min",
    title: "Introducing Nautilus AI Voice Commands",
    desc: "Hands-free warehouse operations are here. Learn how voice commands let your team scan, relocate, and count inventory without touching a screen.",
    content: [
      {
        type: "p",
        text: "Warehouse workers have their hands full — literally. Carrying boxes, operating scanners, climbing ladders. Every time they need to interact with software, they have to stop what they're doing, pull out a device, and tap through screens. That friction adds up to hours of lost productivity every week.",
      },
      {
        type: "p",
        text: "Today we're launching Nautilus AI Voice Commands, a hands-free interface that lets your team perform any scan action, look up inventory, and navigate the warehouse using natural speech.",
      },
      { type: "h2", text: "How it works" },
      {
        type: "p",
        text: "Voice Commands runs on any device with a microphone — phones, tablets, headsets, even smart glasses. The AI processes speech locally on-device for sub-200ms response times, with cloud fallback for complex queries.",
      },
      {
        type: "p",
        text: 'Say "scan this" and hold up a barcode. Say "where is SKU 4821" and get turn-by-turn directions. Say "count section B3" and start a hands-free cycle count. The system understands context — if you just scanned a product, saying "move to B7" knows what you\'re relocating.',
      },
      { type: "h2", text: "Supported actions" },
      {
        type: "p",
        text: "Every scan action available in the app is accessible by voice: pick, putaway, receive, relocate, count, adjust, ship, and return. You can also query inventory levels, check order status, and pull up product details — all without touching the screen.",
      },
      { type: "h2", text: "Accuracy and noise handling" },
      {
        type: "p",
        text: "Warehouses are loud. Forklifts, conveyor belts, radio chatter. Our speech model was trained on 10,000+ hours of actual warehouse audio, so it handles background noise that would confuse general-purpose voice assistants. In testing across 14 facilities, command recognition accuracy averaged 97.3%.",
      },
      {
        type: "p",
        text: "Voice Commands is available today on all Nautilus plans. Enable it in Settings → AI Features → Voice Commands.",
      },
    ],
  },
  {
    slug: "sub-200ms-barcode-recognition",
    tag: "Engineering",
    date: "Mar 15, 2026",
    readTime: "8 min",
    title: "How We Built Sub-200ms Barcode Recognition",
    desc: "A deep dive into the AI pipeline that powers Nautilus scanning — from camera frame to decoded SKU in under 200 milliseconds.",
    content: [
      {
        type: "p",
        text: 'When we set out to build Nautilus, we knew scanning had to be fast. Not "fast for a web app" — fast enough that it feels instant. Our target was 200 milliseconds from camera frame capture to decoded SKU displayed on screen.',
      },
      { type: "h2", text: "The pipeline" },
      {
        type: "p",
        text: "The scanning pipeline has four stages: frame capture, barcode localization, decode, and database lookup. Each stage had to be optimized independently, then the whole pipeline had to work together without blocking the main thread.",
      },
      {
        type: "p",
        text: "Frame capture uses the device camera at 30fps. We don't process every frame — an adaptive algorithm selects the sharpest frame from each 3-frame window based on edge contrast scoring. This alone eliminated 40% of decode failures from motion blur.",
      },
      { type: "h2", text: "Neural barcode localization" },
      {
        type: "p",
        text: "Traditional barcode scanners look for specific patterns across the entire image. We trained a lightweight CNN (1.2M parameters) to predict bounding boxes around barcode regions in under 15ms. This lets us crop the image before decode, which is dramatically faster than scanning the full resolution frame.",
      },
      {
        type: "p",
        text: "The model handles partial barcodes, damaged labels, and unusual angles that would fail with traditional pattern matching. It was trained on 2.3 million real-world barcode images captured in warehouse conditions.",
      },
      { type: "h2", text: "Decode and lookup" },
      {
        type: "p",
        text: "Once localized, the barcode region is processed by our decode engine which supports Code 128, Code 39, EAN-13, UPC-A, QR, and Data Matrix formats simultaneously. No need to specify which format — the engine identifies and decodes in a single pass.",
      },
      {
        type: "p",
        text: "Database lookup happens against a local cache of the warehouse's product catalog, synced in the background. Cache hits (98.7% of lookups) complete in under 2ms. Cache misses fall back to the API with typical response times of 40-80ms.",
      },
      {
        type: "p",
        text: "End to end: frame selection (10ms) + localization (15ms) + decode (8ms) + lookup (2ms) + rendering (12ms) = 47ms typical. Our 200ms target gives us 153ms of headroom for difficult conditions.",
      },
    ],
  },
  {
    slug: "300k-problem-manual-operations",
    tag: "Industry",
    date: "Mar 02, 2026",
    readTime: "6 min",
    title: "The $300K Problem: Manual Warehouse Operations",
    desc: "The average warehouse loses $300,000 annually to manual processes. Here's where the money goes and how to stop the bleeding.",
    content: [
      {
        type: "p",
        text: "Most warehouse operators know manual processes are expensive. Few realize exactly how expensive. We analyzed operational data from 200+ warehouses across industries and found the average facility loses $300,000 per year to inefficiencies that software could eliminate.",
      },
      { type: "h2", text: "Where the money goes" },
      {
        type: "p",
        text: "The biggest cost isn't dramatic failures — it's the daily accumulation of small inefficiencies. Mispicks that require reshipping ($42 average cost per incident). Cycle counts that take 3x longer than necessary. Workers walking suboptimal routes because they're picking from a printed list instead of an optimized sequence.",
      },
      {
        type: "p",
        text: "Labor accounts for 65% of the total. The remaining 35% splits between excess inventory carrying costs from inaccurate counts, expedited shipping to cover stockouts, and returns processing from wrong-item-shipped errors.",
      },
      { type: "h2", text: "The compounding effect" },
      {
        type: "p",
        text: "Manual errors don't just cost money directly — they compound. A miscounted shelf leads to a stockout. A stockout triggers an emergency reorder at premium pricing. The premium order arrives and now you're overstocked. The overstock sits on a shelf for months, tying up capital and taking up space that could hold faster-moving product.",
      },
      { type: "h2", text: "What automation changes" },
      {
        type: "p",
        text: "Warehouses that implement scanning-based inventory management see an average 73% reduction in mispicks within the first 90 days. Cycle count time drops by 60-70%. Pick route optimization alone typically saves 15-20 minutes per picker per shift.",
      },
      {
        type: "p",
        text: "At a 50-person warehouse running two shifts, those saved minutes add up to roughly 400 labor hours per month — the equivalent of 2.5 full-time employees.",
      },
    ],
  },
  {
    slug: "spatial-intelligence-warehouse-map",
    tag: "Product",
    date: "Feb 18, 2026",
    readTime: "5 min",
    title: "Spatial Intelligence: Your Warehouse as a Living Map",
    desc: "Nautilus now builds a real-time 3D model of your warehouse. See how spatial mapping transforms putaway, picking, and congestion management.",
    content: [
      {
        type: "p",
        text: "Your warehouse is a physical space with unique geometry — wide aisles, narrow aisles, dead ends, high-traffic intersections, loading dock bottlenecks. Until now, most WMS software treated it as a flat database of locations. Today that changes.",
      },
      { type: "h2", text: "Building the map" },
      {
        type: "p",
        text: "Nautilus Spatial Intelligence builds a real-time model of your warehouse from scan data. Every time a worker scans at a location, the system refines its understanding of the physical layout — aisle widths, shelf heights, walking distances between sections. After about two weeks of normal operations, the model is accurate to within 0.5 meters.",
      },
      { type: "h2", text: "Smarter putaway" },
      {
        type: "p",
        text: "With spatial awareness, putaway suggestions factor in physical proximity, not just logical location codes. If a product is frequently picked alongside another product, the system suggests placing them in adjacent locations to minimize future pick travel time.",
      },
      { type: "h2", text: "Congestion avoidance" },
      {
        type: "p",
        text: "The spatial model tracks real-time activity density. If three pickers are already working in aisle C4, the system will route the fourth picker through C5 even if C4 has the next item on their list. The extra 10-second detour avoids a 2-minute traffic jam.",
      },
      {
        type: "p",
        text: "Spatial Intelligence is available on Pro and Enterprise plans. The model builds automatically from your team's normal scan activity — no additional hardware or manual mapping required.",
      },
    ],
  },
  {
    slug: "buildright-supply-case-study",
    tag: "Case Study",
    date: "Feb 05, 2026",
    readTime: "7 min",
    title: "How BuildRight Supply Cut Counting Time by 70%",
    desc: "BuildRight Supply deployed Nautilus across three warehouses. The results: 70% faster cycle counts, 99.7% accuracy, and zero spreadsheets.",
    content: [
      {
        type: "p",
        text: "BuildRight Supply distributes building materials — lumber, drywall, fasteners, tools — across three warehouses in the Pacific Northwest. Before Nautilus, their inventory management ran on a combination of spreadsheets, a legacy ERP system, and a lot of manual counting.",
      },
      { type: "h2", text: "The challenge" },
      {
        type: "p",
        text: "BuildRight's product catalog spans 14,000 SKUs with high variability. A single shelf might hold 15 different types of screws that look nearly identical. Their manual counting process required experienced staff who could visually identify products — new hires took months to become reliable counters.",
      },
      {
        type: "p",
        text: "Cycle counts consumed 120 staff-hours per month across all three locations. Despite the effort, inventory accuracy hovered around 94% — well below the 99%+ target needed for reliable order fulfillment.",
      },
      { type: "h2", text: "Implementation" },
      {
        type: "p",
        text: "BuildRight rolled out Nautilus in phases — one warehouse at a time over six weeks. The team configured sections, bays, and levels to match their physical layout, then barcoded every location. Staff training took one afternoon per warehouse.",
      },
      { type: "h2", text: "Results after 90 days" },
      {
        type: "p",
        text: "Cycle count time dropped from 120 hours to 36 hours per month — a 70% reduction. Inventory accuracy rose to 99.7%. Mispick rate fell from 2.1% to 0.3%. The time savings alone freed up the equivalent of two full-time warehouse associates, who were reassigned to fulfillment.",
      },
      {
        type: "p",
        text: "The team has since expanded to use voice commands and AI-prioritized counting, which they expect will cut the remaining 36 hours further.",
      },
    ],
  },
  {
    slug: "predictive-stock-depletion-math",
    tag: "Engineering",
    date: "Jan 22, 2026",
    readTime: "10 min",
    title: "Predictive Stock Depletion: The Math Behind the Magic",
    desc: "Our forecasting engine predicts stockouts 3 days in advance. Here's the time-series analysis and machine learning that makes it work.",
    content: [
      {
        type: "p",
        text: "Running out of stock is one of the most expensive problems in warehouse management. It triggers emergency reorders, expedited shipping, backorder processing, and — worst of all — lost customers who go elsewhere. Nautilus predicts stockouts 3 days before they happen, giving teams time to act.",
      },
      { type: "h2", text: "The forecasting model" },
      {
        type: "p",
        text: "At its core, the engine uses a modified exponential smoothing model that tracks three components for every SKU: baseline demand, trend (is demand increasing or decreasing?), and seasonality (does demand vary by day of week, month, or season?).",
      },
      {
        type: "p",
        text: "These three components combine into a forecast of daily demand for the next 14 days. When projected demand exceeds current inventory minus safety stock, the system generates an alert.",
      },
      { type: "h2", text: "Learning from your data" },
      {
        type: "p",
        text: "The model trains on each warehouse's historical scan data. A new warehouse gets generic priors that work reasonably well. After 30 days, the model has enough facility-specific data to start making accurate predictions. After 90 days, prediction accuracy typically exceeds 91%.",
      },
      { type: "h2", text: "Handling unusual patterns" },
      {
        type: "p",
        text: "The hardest part isn't the math — it's the edge cases. A product that sells 10 units per day for months, then suddenly gets ordered in a batch of 500 by a single customer. The model needs to distinguish between a genuine demand spike and an outlier.",
      },
      {
        type: "p",
        text: "We use a separate anomaly detection layer that flags unusual consumption patterns. When detected, the system asks the user to confirm whether this represents a new demand pattern or a one-time event, and adjusts the model accordingly.",
      },
    ],
  },
  {
    slug: "18-integrations-one-warehouse",
    tag: "Product",
    date: "Jan 10, 2026",
    readTime: "3 min",
    title: "18 Integrations, One Warehouse",
    desc: "From QuickBooks to Shopify to FedEx — Nautilus now connects to every tool in your stack. No rip-and-replace, just plug in.",
    content: [
      {
        type: "p",
        text: "Warehouse software shouldn't force you to change how you run your business. Your accounting lives in QuickBooks. Your storefront is on Shopify. Your shipping goes through ShipStation. Nautilus should fit into that stack, not replace it.",
      },
      {
        type: "p",
        text: "Today we're announcing 18 integrations across three categories: accounting and ERP, e-commerce and POS, and shipping and logistics.",
      },
      { type: "h2", text: "Accounting & ERP" },
      {
        type: "p",
        text: "QuickBooks, Xero, FreshBooks, SAP Business One, NetSuite, and Sage. Inventory movements in your warehouse automatically update your books. Purchase orders, cost of goods sold, and inventory valuations stay in sync without manual journal entries.",
      },
      { type: "h2", text: "E-commerce & POS" },
      {
        type: "p",
        text: "Shopify, WooCommerce, Amazon, Square, BigCommerce, and Lightspeed. Every sale decrements warehouse stock in real time. No overselling across channels. Fulfillment workflows start automatically when orders arrive.",
      },
      { type: "h2", text: "Shipping & Logistics" },
      {
        type: "p",
        text: "ShipStation, Shippo, EasyPost, FedEx, UPS, and DHL. Picked orders flow directly into your shipping platform. Labels print, tracking numbers push back to sales channels, and customers get notified — all from one scan.",
      },
      {
        type: "p",
        text: "All integrations are available on every plan. Setup takes under 10 minutes per connection. Visit the Integrations page in your Nautilus dashboard to get started.",
      },
    ],
  },
  {
    slug: "2026-warehouse-technology-trends",
    tag: "Industry",
    date: "Dec 28, 2025",
    readTime: "6 min",
    title: "2026 Warehouse Technology Trends",
    desc: "AI, spatial computing, and voice interfaces are reshaping warehouse operations. Our predictions for the year ahead.",
    content: [
      {
        type: "p",
        text: "2025 was the year AI moved from pilot programs to production in warehouse operations. 2026 will be the year it becomes table stakes. Here are five trends we're watching.",
      },
      { type: "h2", text: "1. Voice-first interfaces" },
      {
        type: "p",
        text: "Touchscreen-based workflows are being replaced by voice commands optimized for noisy environments. Workers keep their hands on product and their eyes on shelves while the system handles data entry. Expect voice to become the primary interface for 30%+ of warehouse interactions by year-end.",
      },
      { type: "h2", text: "2. Predictive inventory management" },
      {
        type: "p",
        text: "Reactive counting is giving way to AI-driven predictive models that tell you what to count, when to reorder, and where to put incoming stock — before problems surface. The shift from reactive to proactive will define the next generation of WMS.",
      },
      { type: "h2", text: "3. Spatial computing" },
      {
        type: "p",
        text: "Warehouse management systems are becoming spatially aware. Instead of treating locations as abstract codes, modern systems understand physical layout, walking distances, congestion patterns, and optimal routes through the facility.",
      },
      { type: "h2", text: "4. Integration-first architecture" },
      {
        type: "p",
        text: "The era of monolithic WMS platforms that try to do everything is ending. The winning approach is a focused warehouse execution layer that connects deeply with existing accounting, e-commerce, and shipping tools. Interoperability beats feature count.",
      },
      { type: "h2", text: "5. Mobile-native operations" },
      {
        type: "p",
        text: "Purpose-built warehouse hardware is being replaced by smartphones and tablets running specialized software. The cost savings are significant, but the real advantage is the ability to push software updates instantly across every device in the facility.",
      },
    ],
  },
];
