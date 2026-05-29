// ──────────────────────────────────────────────────────────────────────────
// lib/chat/canned-answers.js
// ──────────────────────────────────────────────────────────────────────────
// Pre-baked answers for FAQ-style questions. The /api/chat route checks
// every incoming FIRST-TURN user message against matchCanned() before
// calling Anthropic. On a hit, the canned text is streamed back via the same
// SSE stream and persisted to chat_messages exactly like a real assistant
// turn — so the rest of the system (transcript hydration, analytics, rate
// limiting, conversation continuity) doesn't notice the difference.
//
// ── First-turn gating (route.js) ──
// The route only calls matchCanned when the conversation is brand new (no
// prior messages). Mid-conversation messages always go to the model, which
// has the full history. This is the guard the older comment here referenced
// but that didn't actually exist in the route yet — it does now. It means a
// canned answer can never hijack a follow-up that depends on earlier context
// ("what about for 3 of those?"), which is exactly the failure mode the
// narrow-coverage rule below was written to avoid. Because the gate lives in
// the route, the EXACT table can be broader without that risk.
//
// Coverage:
//   - Tier 1 (EXACT) handles the literal starter buttons, the few obvious
//     phrasings, and a set of stable, never-changing FAQ answers (free
//     trial, mobile apps, integrations, setup time, barcode scanning,
//     hosting, billing, API, security). Matched against a NORMALIZED form
//     of the input (see normalize()), so we no longer need to enumerate
//     every "?"/apostrophe/greeting variant by hand.
//   - Tier 2 (PATTERNS) handles tightly-anchored regexes for canonical
//     phrasings. Patterns run against the normalized string and must be
//     ^…$ anchored so they only match short standalone questions — never
//     substrings of longer queries.
//
// What does NOT get canned:
//   - Anything involving draft_email — that needs the actual tool call to
//     produce structured editable output.
//   - Anything involving propose_cta with topic-specific reasoning beyond
//     the talk_human card (which is simple enough to bake in).
//   - Anything mid-conversation — the route's first-turn gate handles this.
//   - Competitor comparisons we can't ground in a real /compare page. Only
//     Fishbowl is canned (it has /compare/fishbowl); everything else goes to
//     the model so it can pull from the knowledge base instead of us
//     hard-coding a claim about a page that may not exist.
//
// Answer shape:
//   { text: string, cta?: { type, topic?, reason } }
//
// To add a new canned answer:
//   1. Write the prose as a const at the top. Use only facts that appear in
//      the knowledge base (lib/chat/knowledge-base.js) and URLs for pages
//      that actually exist. Stable facts only — anything that changes often
//      (and isn't already mirrored in the KB) should go to the model.
//   2. Add to ANSWERS.
//   3. Add the normalized phrasing(s) to EXACT. Run them through normalize()
//      in your head: lowercase, no punctuation, no apostrophes, hyphens →
//      spaces, leading greeting/filler stripped.
//   4. (Optional) Add a tightly-anchored regex to PATTERNS for variants.
//      Test against expected non-matches before shipping.
// ──────────────────────────────────────────────────────────────────────────

/* ─────────────────────────────────────────────────────
   Answer prose
   ─────────────────────────────────────────────────────
   Tone, length, and link conventions match the Nautilus Helper system
   prompt: direct, concrete, real numbers, source URLs woven into prose,
   no "we'd love to chat" filler. These should be indistinguishable from a
   well-grounded AI response in style. Numbers here MUST match the KB /
   pricing page — see the sync note at the bottom of the file.
─────────────────────────────────────────────────────── */

const PRICING = `Nautilus has two plans.

**Pro** — $239/warehouse/month on annual billing, $299/month on monthly. Unlimited users, native iOS + Android apps, all included integrations, the full AI feature set (sub-200ms barcode scanning, cycle counting, anomaly detection, voice commands, route optimization), and priority support. Comes with a 14-day free trial, no credit card required.

**Enterprise** — custom pricing for 10+ warehouses. Adds SSO, custom roles, dedicated CSM, white-glove migration, and custom integrations.

/pricing has the full feature matrix. /calculator runs the ROI numbers for your specific warehouse size and headcount.`;

const PRICING_3 = `Three warehouses on the Pro plan:

- Annual billing: 3 × $239 = **$717/month** (billed yearly, $8,604/year)
- Monthly billing: 3 × $299 = **$897/month**

That covers unlimited users across all three sites, the full AI feature set, the included integrations, native iOS + Android apps, and priority support. The 14-day free trial covers all three.

If you're rolling out to 10+ warehouses, Enterprise pricing kicks in — usually with a volume discount, a dedicated CSM, and white-glove migration. /pricing has the contact link for a custom quote.`;

const FISHBOWL = `Fishbowl is desktop-first software that's been around since 2001 — QuickBooks-adjacent inventory with a small e-commerce module bolted on. Nautilus is the opposite shape: native iOS + Android apps that work offline, AI features built into the core product, and a full set of pre-built integrations.

The practical differences:

- **Setup**: Nautilus is cloud, runs in a day. Fishbowl is on-prem or hosted, typically a multi-week implementation.
- **Pricing model**: Nautilus is per-warehouse ($239/mo annual). Fishbowl is per-user plus per-add-on.
- **AI**: Fishbowl has none. Nautilus ships with sub-200ms scanning, cycle counting, anomaly detection, voice commands, and route optimization.
- **Mobile**: Fishbowl's mobile is a thin client over the desktop app. Nautilus is native iOS + Android with offline mode.

/compare/fishbowl has the field-by-field breakdown.`;

const AI_FEATURES = `Five AI capabilities built into the core product:

- **Sub-200ms barcode scanning** — works in poor lighting, on scuffed or damaged labels, and offline.
- **AI cycle counting** — picks which SKUs to count based on movement velocity, shrinkage risk, and last-count age, instead of fixed schedules.
- **Anomaly detection** — flags location, count, and movement patterns that diverge from your warehouse's historical baseline.
- **Voice commands** — hands-free pick and receive workflows. Works through earpieces or scanner audio, no screen taps required.
- **Route optimization** — pickers get an ordered path through the warehouse based on bay layout, item dimensions, and current cart load.

All five are included in the Pro plan, not gated to Enterprise. /#ai-engine on the home page has the technical writeup.`;

const HUMAN = `Two ways:

- Send a note at /contact — the team replies within 4 business hours, usually faster. No bots, no qualification calls, just an engineer or operator.
- Book 30 minutes directly — the "Request demo" button on any page opens our calendar, or head to /pricing.

Email also works: sales@nautilusinventory.com.`;

const COLD_STORAGE = `Yes — cold storage is one of the verticals Nautilus is built around. The operational quirks that come with it (gloved-hand scanning, scuffed frozen barcodes, FEFO rotation, temperature-zone-aware putaway) are all handled natively.

The iOS + Android apps work on rugged scanners rated for freezer temperatures. Voice commands work through earpieces under PPE — no gloved fumbling with screens. AI cycle counting respects zone constraints; it won't ask a picker to count something in -20°F if there's a target in the +35°F section.

/industry/food-beverage covers the cold-chain specifics, including a couple of customer examples.`;

const MIGRATION = `Four phases, typically 2-4 weeks depending on size:

1. **Audit** (week 1) — we map your current WMS data: items, locations, customers, vendors, open orders. Concept-by-concept doc lands in your inbox.
2. **Mapping & pilot** (week 2) — we run a single warehouse in parallel with your existing system. Same scans hit both. Reconciliation reports daily.
3. **Cutover** (week 3) — the pilot warehouse goes Nautilus-only. We monitor for 5 business days.
4. **Rollout** (week 4+) — remaining warehouses migrate one at a time. No big-bang weekend.

You get a dedicated migration engineer on Enterprise, or our migration ops queue on Pro. Most teams keep floor productivity steady through the whole transition — no shutdown required.

If you want to plan yours, the demo button on /pricing books a 30-minute migration call.`;

/* ── Stable-fact FAQ answers (new) ──
   Each of these is grounded in PRICING_TEXT / FEATURES_TEXT in the KB and
   only references pages that exist. Safe to add as EXACT keys because the
   route gates canned answers to the first turn. */

const TRIAL = `Yes — Pro comes with a 14-day free trial, no credit card required. You get the full feature set during the trial: native iOS + Android scanning, the AI features, and all the included integrations. /pricing has the details, and /calculator will size the ROI for your warehouse.`;

const MOBILE = `Nautilus has native iOS and Android apps, and both work offline — scans queue locally and sync when the connection comes back. There's also a web dashboard for any modern browser. Scanning is sub-200ms even on damaged or partial barcodes. /#features has the walkthrough.`;

const INTEGRATIONS_ANS = `Nautilus integrates with 10+ platforms and counting — accounting/ERP (QuickBooks, Xero, NetSuite, SAP Business One, Sage), e-commerce (Shopify, WooCommerce, Amazon, BigCommerce), POS (Square, Lightspeed), and shipping (ShipStation, FedEx, UPS, DHL, and more). On top of that there's Zapier for 5,000+ no-code workflows and a REST API with webhooks. /integration has the full list with field-level mapping for each.`;

const SETUP = `Nautilus is cloud-based, so a single warehouse can be up and running in about a day — no on-prem install. If you're moving off another WMS, migrations typically run 2-4 weeks with a parallel-run pilot so the floor never stops. /pricing books a setup call if you want to walk through your specifics.`;

const BARCODE = `Scanning runs natively on iOS and Android with sub-200ms recognition at 99.7% accuracy, and it handles damaged or partial barcodes. It works offline too — scans queue and sync later. There are 8 scan actions (pick, receive, putaway, transfer, count, adjust, register, lookup), each with a full audit trail. /#features has the detail.`;

const HOSTING = `Nautilus is cloud-hosted SaaS — there's no on-prem or self-hosted option. Infrastructure is multi-region (US-East primary, US-West failover, EU/Frankfurt for enterprise), with TLS 1.3 in transit and AES-256 at rest. /pricing and /legal/security have the specifics.`;

const BILLING = `Pro is billed per warehouse — $239/mo on annual billing or $299/mo monthly, and annual saves 20%. Annual Pro and all Enterprise contracts can be invoiced with net-30 terms; monthly Pro is credit card only. Registered non-profits and accredited schools get 30% off. /pricing has the full breakdown.`;

const API_ANS = `Nautilus has a REST API with webhooks, plus official Node and Python SDKs. Pro includes read-only API access; full read/write is on Enterprise. The v1 API is in preview now, with general availability targeted for Q3 2026. /integration covers what's available today.`;

const SECURITY = `Nautilus is SOC 2 Type II certified (audited annually), GDPR compliant with a DPA available, HIPAA compliant with a BAA for healthcare and pharma, and CCPA/CPRA compliant. Data is encrypted with TLS 1.3 in transit and AES-256 at rest, keys rotated every 90 days, with annual third-party penetration testing. /legal/security has the full writeup.`;

const ANSWERS = {
  PRICING,
  PRICING_3,
  FISHBOWL,
  AI_FEATURES,
  HUMAN,
  COLD_STORAGE,
  MIGRATION,
  TRIAL,
  MOBILE,
  INTEGRATIONS_ANS,
  SETUP,
  BARCODE,
  HOSTING,
  BILLING,
  API_ANS,
  SECURITY,
};

/* ─────────────────────────────────────────────────────
   normalize(input) — canonical form for matching
   ─────────────────────────────────────────────────────
   Collapses the trivial variants we used to enumerate by hand so both the
   EXACT table and the PATTERNS run against one clean string:
     - lowercase
     - drop apostrophes      what's → whats,  i'd → id
     - hyphens/slashes → space   on-prem → on prem,  cloud-based → cloud based
     - punctuation → space   "pricing?" → "pricing"
     - strip a leading greeting   "hey pricing" → "pricing"
     - strip a leading polite frame   "can you tell me pricing" → "pricing"
     - collapse whitespace, trim

   Kept deliberately conservative: only clearly-meaningless leading words are
   stripped, and word boundaries (\b) prevent clipping real words ("sortly"
   is not "so" + "rtly", "software" is not "so" + "ftware").

   EXACT keys must already BE in normalized form — i.e. normalize(key) === key.
─────────────────────────────────────────────────────── */
export function normalize(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[''`]/g, "") // apostrophes
    .replace(/[-_\/]+/g, " ") // hyphens / slashes → space
    .replace(/[?!.,;:]+/g, " ") // punctuation → space
    .replace(
      /^\s*(?:hey|hi|hello|yo|ok|okay|um+|uh+|well|please|pls|so)\b[\s,]*/,
      ""
    )
    .replace(
      /^\s*(?:can you|could you|can i|tell me|do you know|i want to know|i would like to know|id like to know|just curious|quick question)\b[\s,]*/,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

/* ─────────────────────────────────────────────────────
   TIER 1 — exact match against the normalized input
   ─────────────────────────────────────────────────────
   Keys are stored in normalized form (no "?", no apostrophes, hyphens as
   spaces, lowercased). Because the route only consults this table on the
   FIRST turn of a conversation, broad coverage here is safe — there's no
   prior context for a canned answer to clobber.
─────────────────────────────────────────────────────── */

const EXACT = {
  // Pricing — drawer starter and natural variants
  "what does nautilus cost": { text: ANSWERS.PRICING },
  "how much does nautilus cost": { text: ANSWERS.PRICING },
  "how much is nautilus": { text: ANSWERS.PRICING },
  "what does it cost": { text: ANSWERS.PRICING },

  // Pricing — /ask starter (multi-warehouse)
  "pricing for 3 warehouses": { text: ANSWERS.PRICING_3 },
  "pricing for three warehouses": { text: ANSWERS.PRICING_3 },

  // Fishbowl — starter wordings
  "how does it compare to fishbowl": { text: ANSWERS.FISHBOWL },
  "how does nautilus compare to fishbowl": { text: ANSWERS.FISHBOWL },
  "nautilus vs fishbowl": { text: ANSWERS.FISHBOWL },

  // AI features — drawer + /ask starter
  "show me the ai features": { text: ANSWERS.AI_FEATURES },
  "what are the ai features": { text: ANSWERS.AI_FEATURES },

  // Talk to human — drawer starter. Includes cta so the human-handoff
  // card renders alongside the prose, matching the AI path's behavior.
  "talk to a human": {
    text: ANSWERS.HUMAN,
    cta: {
      type: "talk_human",
      reason: "User directly asked to talk to a human.",
    },
  },
  "talk to a person": {
    text: ANSWERS.HUMAN,
    cta: {
      type: "talk_human",
      reason: "User directly asked to talk to a person.",
    },
  },
  "talk to someone": {
    text: ANSWERS.HUMAN,
    cta: {
      type: "talk_human",
      reason: "User directly asked to talk to someone.",
    },
  },

  // Cold storage — /ask starter
  "will it work for cold storage": { text: ANSWERS.COLD_STORAGE },
  "does it work for cold storage": { text: ANSWERS.COLD_STORAGE },

  // Migration — /ask starter
  "whats the migration look like": { text: ANSWERS.MIGRATION },
  "what does the migration look like": { text: ANSWERS.MIGRATION },

  // ── Stable-fact FAQs (new) ──

  // Free trial
  "free trial": { text: ANSWERS.TRIAL },
  "is there a free trial": { text: ANSWERS.TRIAL },
  "do you have a free trial": { text: ANSWERS.TRIAL },
  "do you offer a free trial": { text: ANSWERS.TRIAL },

  // Mobile apps
  "do you have a mobile app": { text: ANSWERS.MOBILE },
  "is there a mobile app": { text: ANSWERS.MOBILE },
  "do you have an app": { text: ANSWERS.MOBILE },
  "is there an ios app": { text: ANSWERS.MOBILE },
  "is there an android app": { text: ANSWERS.MOBILE },

  // Integrations
  "what integrations do you have": { text: ANSWERS.INTEGRATIONS_ANS },
  "what integrations do you support": { text: ANSWERS.INTEGRATIONS_ANS },
  "what do you integrate with": { text: ANSWERS.INTEGRATIONS_ANS },
  "do you integrate with quickbooks": { text: ANSWERS.INTEGRATIONS_ANS },
  "do you integrate with shopify": { text: ANSWERS.INTEGRATIONS_ANS },
  "do you integrate with netsuite": { text: ANSWERS.INTEGRATIONS_ANS },

  // Setup / onboarding
  "how long does setup take": { text: ANSWERS.SETUP },
  "how long does it take to set up": { text: ANSWERS.SETUP },
  "how long does onboarding take": { text: ANSWERS.SETUP },
  "how do i get started": { text: ANSWERS.SETUP },

  // Barcode scanning
  "how does barcode scanning work": { text: ANSWERS.BARCODE },
  "do you do barcode scanning": { text: ANSWERS.BARCODE },

  // Hosting model
  "is it cloud based": { text: ANSWERS.HOSTING },
  "is it cloud or on prem": { text: ANSWERS.HOSTING },
  "do you have an on prem version": { text: ANSWERS.HOSTING },
  "is it self hosted": { text: ANSWERS.HOSTING },
  "can i self host": { text: ANSWERS.HOSTING },

  // Billing / contract
  "how does billing work": { text: ANSWERS.BILLING },
  "is there a contract": { text: ANSWERS.BILLING },
  "do you require a contract": { text: ANSWERS.BILLING },
  "can i pay monthly": { text: ANSWERS.BILLING },
  "can i cancel anytime": { text: ANSWERS.BILLING },

  // API
  "do you have an api": { text: ANSWERS.API_ANS },
  "is there an api": { text: ANSWERS.API_ANS },
  "do you have a rest api": { text: ANSWERS.API_ANS },

  // Security
  "is it secure": { text: ANSWERS.SECURITY },
  "is my data secure": { text: ANSWERS.SECURITY },
  "are you soc 2 compliant": { text: ANSWERS.SECURITY },
  "are you hipaa compliant": { text: ANSWERS.SECURITY },
  "are you gdpr compliant": { text: ANSWERS.SECURITY },
};

/* ─────────────────────────────────────────────────────
   TIER 2 — pattern matches (run against the normalized input)
   ─────────────────────────────────────────────────────
   Each regex is ^…$ anchored against the normalized string, so a pattern
   only fires on a short standalone question — substrings inside longer
   queries fall through to the model. Because the input is already
   lowercased + de-punctuated by normalize(), patterns don't need the `i`
   flag or trailing-"?" handling, but keeping them is harmless.

   Resist loose patterns. The EXACT table (matched on normalized input) is
   the safe place to add coverage; each regex here is a coverage gain but
   also a hijack risk.
─────────────────────────────────────────────────────── */

const PATTERNS = [
  // Pricing — single-word or extremely short asks
  { re: /^pricing$/, response: { text: ANSWERS.PRICING } },
  { re: /^cost$/, response: { text: ANSWERS.PRICING } },
  { re: /^pricing info$/, response: { text: ANSWERS.PRICING } },
  { re: /^(?:the |your )?price$/, response: { text: ANSWERS.PRICING } },
  {
    re: /^how much (does|is) (it|this|nautilus)( cost)?$/,
    response: { text: ANSWERS.PRICING },
  },
  {
    re: /^what(?:s| is) (?:the |your )?pric(?:e|ing)( like)?$/,
    response: { text: ANSWERS.PRICING },
  },

  // AI features
  {
    re: /^(?:show me )?(?:your |the )?ai (?:features|capabilities)$/,
    response: { text: ANSWERS.AI_FEATURES },
  },
  {
    re: /^what ai (?:features )?(?:do )?(?:you |it )?(?:have|offer)$/,
    response: { text: ANSWERS.AI_FEATURES },
  },

  // Fishbowl comparison
  {
    re: /^(?:how does )?(?:it|nautilus) compare (?:to|against|vs|versus) fishbowl$/,
    response: { text: ANSWERS.FISHBOWL },
  },
  {
    re: /^(?:nautilus )?(?:vs|versus) fishbowl$/,
    response: { text: ANSWERS.FISHBOWL },
  },

  // Migration — short variants
  {
    re: /^(?:whats )?(?:the )?migration (?:process|plan|like|look like)$/,
    response: { text: ANSWERS.MIGRATION },
  },
  {
    re: /^how does (?:the )?migration work$/,
    response: { text: ANSWERS.MIGRATION },
  },

  // Integrations — short
  { re: /^integrations$/, response: { text: ANSWERS.INTEGRATIONS_ANS } },

  // Free trial — short
  { re: /^trial$/, response: { text: ANSWERS.TRIAL } },

  // API — short
  { re: /^api(?: access)?$/, response: { text: ANSWERS.API_ANS } },

  // Talk-to-human variants (with CTA). Leading "can i"/"i want to" frames
  // are stripped by normalize(), so these stay tight.
  {
    re: /^talk to (?:a |the )?(human|person|rep|sales rep|salesperson|someone)$/,
    response: {
      text: ANSWERS.HUMAN,
      cta: {
        type: "talk_human",
        reason: "User asked to talk to a human (Tier 2 pattern match).",
      },
    },
  },
  {
    re: /^(?:want to|need to|would like to) (?:speak|talk) (?:to|with) (?:a |the )?(human|person|rep|sales rep|salesperson|someone)$/,
    response: {
      text: ANSWERS.HUMAN,
      cta: {
        type: "talk_human",
        reason: "User asked to talk to a human (Tier 2 pattern match).",
      },
    },
  },
];

/* ─────────────────────────────────────────────────────
   matchCanned(input) → { text, cta? } | null
   ─────────────────────────────────────────────────────
   Returns the canned response if the NORMALIZED input matches a Tier 1
   exact key or a Tier 2 pattern. Returns null otherwise, in which case the
   caller (route.js) falls through to the Anthropic loop. The route only
   calls this on the first turn of a conversation.
─────────────────────────────────────────────────────── */

export function matchCanned(input) {
  const norm = normalize(input);
  if (!norm) return null;

  if (EXACT[norm]) return EXACT[norm];

  for (const { re, response } of PATTERNS) {
    if (re.test(norm)) return response;
  }

  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// SYNC NOTE
// ──────────────────────────────────────────────────────────────────────────
// The numbers in the prose above must match lib/chat/knowledge-base.js
// (PRICING_TEXT / FEATURES_TEXT) and the pricing page. Specifically:
//   - Free trial is 14 days (PRICING_TEXT says "14-day free trial"). An
//     earlier version of PRICING / PRICING_3 here said "7-day" — corrected.
//   - Integration count: the official line is "10+ and counting", so the
//     answers here avoid a hard number. Keep this aligned with the KB
//     (knowledge-base.js PRICING_TEXT / FEATURES_TEXT) and the system prompt
//     (claude-config.js INSTRUCTIONS) — all three were moved to "10+ and
//     counting" together, replacing the older "18" (KB) / "50+" (prompt).
// ──────────────────────────────────────────────────────────────────────────
