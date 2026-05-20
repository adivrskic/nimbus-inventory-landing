// ──────────────────────────────────────────────────────────────────────────
// lib/chat/canned-answers.js
// ──────────────────────────────────────────────────────────────────────────
// Pre-baked answers for FAQ-style questions. The /api/chat route checks
// every incoming user message against matchCanned() before calling
// Anthropic. On a hit, the canned text is streamed back via the same SSE
// stream and persisted to chat_messages exactly like a real assistant
// turn — so the rest of the system (transcript hydration, analytics,
// rate limiting, conversation continuity) doesn't notice the difference.
//
// Coverage is intentionally narrow:
//   - Tier 1 (EXACT) handles the literal starter buttons from the drawer
//     and the /ask page, plus the few obvious variants ("what does it
//     cost" vs "what does it cost?" vs "how much does nautilus cost").
//   - Tier 2 (PATTERNS) handles tightly-anchored regexes for a small
//     set of canonical phrasings ("pricing", "ai features", "vs
//     fishbowl"). Patterns must be anchored with ^…$ so they only match
//     short standalone questions — never substrings of longer queries.
//
// What does NOT get canned:
//   - Anything involving draft_email — that needs the actual tool call
//     to produce structured editable output.
//   - Anything involving propose_cta with topic-specific reasoning beyond
//     the talk_human card (which is simple enough to bake in).
//   - Anything where the user is mid-conversation and references prior
//     turns ("you said earlier…", "what about for that case…"). The
//     pattern table is for FRESH questions; the route still passes the
//     conversation history check first so this matters less than it
//     sounds.
//
// Answer shape:
//   { text: string, cta?: { type, topic?, reason } }
//   - `text` is the prose to stream
//   - `cta` (optional) mirrors what propose_cta would have returned —
//     the route fires the same "cta" SSE event + increments cta_count,
//     so the human-handoff card still appears when relevant.
//
// To add a new canned answer:
//   1. Write the prose as a const at the top.
//   2. Add to ANSWERS dict.
//   3. Add exact-match keys to EXACT for the literal phrasings.
//   4. (Optional) Add a tightly-anchored regex to PATTERNS for variants.
//      Test the regex against expected non-matches before shipping —
//      a too-loose regex intercepts real questions the AI should answer.
// ──────────────────────────────────────────────────────────────────────────

/* ─────────────────────────────────────────────────────
   Answer prose
   ─────────────────────────────────────────────────────
   Tone, length, and link conventions match the Nautilus Helper system
   prompt: direct, concrete, real numbers, source URLs woven into prose,
   no "we'd love to chat" filler. These should be indistinguishable
   from a well-grounded AI response in style.
─────────────────────────────────────────────────────── */

const PRICING = `Nautilus has two plans.

**Pro** — $239/warehouse/month on annual billing, $299/month on monthly. Unlimited users, native iOS + Android apps, all 50+ integrations, the full AI feature set (sub-200ms barcode scanning, cycle counting, anomaly detection, voice commands, route optimization), and priority support. Comes with a 7-day free trial.

**Enterprise** — custom pricing for 10+ warehouses. Adds SSO, custom roles, dedicated CSM, white-glove migration, and custom integrations.

/pricing has the full feature matrix. /calculator runs the ROI numbers for your specific warehouse size and headcount.`;

const PRICING_3 = `Three warehouses on the Pro plan:

- Annual billing: 3 × $239 = **$717/month** (billed yearly, $8,604/year)
- Monthly billing: 3 × $299 = **$897/month**

That covers unlimited users across all three sites, the full AI feature set, all 50+ integrations, native iOS + Android apps, and priority support. The 7-day free trial covers all three.

If you're rolling out to 10+ warehouses, Enterprise pricing kicks in — usually with a volume discount, a dedicated CSM, and white-glove migration. /pricing has the contact link for a custom quote.`;

const FISHBOWL = `Fishbowl is desktop-first software that's been around since 2001 — QuickBooks-adjacent inventory with a small e-commerce module bolted on. Nautilus is the opposite shape: native iOS + Android apps that work offline, AI features built into the core product, and 50+ pre-built integrations.

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

const ANSWERS = {
  PRICING,
  PRICING_3,
  FISHBOWL,
  AI_FEATURES,
  HUMAN,
  COLD_STORAGE,
  MIGRATION,
};

/* ─────────────────────────────────────────────────────
   TIER 1 — exact match (case-insensitive, trimmed)
   ─────────────────────────────────────────────────────
   Keys are normalized: lowercased and trimmed. matchCanned() does the
   same normalization on the input before looking up. Trailing question
   marks are included as separate keys rather than stripped, since the
   pattern table below handles regex variants and the exact map should
   stay literal.

   Each value is the full response shape: { text, cta? }
─────────────────────────────────────────────────────── */

const EXACT = {
  // Pricing — drawer starter and natural variants
  "what does nautilus cost?": { text: ANSWERS.PRICING },
  "what does nautilus cost": { text: ANSWERS.PRICING },
  "how much does nautilus cost?": { text: ANSWERS.PRICING },
  "how much does nautilus cost": { text: ANSWERS.PRICING },
  "how much is nautilus?": { text: ANSWERS.PRICING },
  "how much is nautilus": { text: ANSWERS.PRICING },

  // Pricing — /ask starter
  "pricing for 3 warehouses": { text: ANSWERS.PRICING_3 },
  "pricing for three warehouses": { text: ANSWERS.PRICING_3 },

  // Fishbowl — both starter wordings
  "how does it compare to fishbowl?": { text: ANSWERS.FISHBOWL },
  "how does it compare to fishbowl": { text: ANSWERS.FISHBOWL },
  "how does nautilus compare to fishbowl?": { text: ANSWERS.FISHBOWL },
  "how does nautilus compare to fishbowl": { text: ANSWERS.FISHBOWL },

  // AI features — drawer + /ask starter
  "show me the ai features": { text: ANSWERS.AI_FEATURES },
  "what are the ai features?": { text: ANSWERS.AI_FEATURES },
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
  "will it work for cold storage?": { text: ANSWERS.COLD_STORAGE },
  "will it work for cold storage": { text: ANSWERS.COLD_STORAGE },
  "does it work for cold storage?": { text: ANSWERS.COLD_STORAGE },
  "does it work for cold storage": { text: ANSWERS.COLD_STORAGE },

  // Migration — /ask starter (with and without apostrophe quirks)
  "what's the migration look like?": { text: ANSWERS.MIGRATION },
  "what's the migration look like": { text: ANSWERS.MIGRATION },
  "whats the migration look like?": { text: ANSWERS.MIGRATION },
  "whats the migration look like": { text: ANSWERS.MIGRATION },
  "what does the migration look like?": { text: ANSWERS.MIGRATION },
  "what does the migration look like": { text: ANSWERS.MIGRATION },
};

/* ─────────────────────────────────────────────────────
   TIER 2 — pattern matches
   ─────────────────────────────────────────────────────
   Each regex must be ^…$ anchored against the trimmed (NOT lowercased)
   input. The `i` flag handles case-insensitive matching. Anchoring
   means a pattern only fires on standalone short questions — substrings
   inside longer queries fall through to the AI.

   Resist the urge to add loose patterns. Each entry here is a coverage
   gain but also a risk vector: if "pricing" matches everything that
   contains the word "pricing", a question like "I have a pricing
   problem" would get the canned generic pricing card. Keep anchors
   tight.
─────────────────────────────────────────────────────── */

const PATTERNS = [
  // Pricing — single-word or extremely short asks
  { re: /^pricing\??$/i, response: { text: ANSWERS.PRICING } },
  { re: /^cost\??$/i, response: { text: ANSWERS.PRICING } },
  { re: /^pricing info\??$/i, response: { text: ANSWERS.PRICING } },
  {
    re: /^how much (does|is) (it|this|nautilus)( cost)?\??$/i,
    response: { text: ANSWERS.PRICING },
  },
  {
    re: /^what(?:'s| is) (?:the |your )?pric(?:e|ing)( like)?\??$/i,
    response: { text: ANSWERS.PRICING },
  },
  {
    re: /^what does (?:it|this) cost\??$/i,
    response: { text: ANSWERS.PRICING },
  },

  // AI features
  {
    re: /^(?:show me )?(?:your |the )?ai (?:features|capabilities)\??$/i,
    response: { text: ANSWERS.AI_FEATURES },
  },
  {
    re: /^what ai (?:features )?(?:do )?(?:you |it )?(?:have|offer)\??$/i,
    response: { text: ANSWERS.AI_FEATURES },
  },

  // Fishbowl comparison
  {
    re: /^(?:how does )?(?:it|nautilus) compare (?:to|against|vs|versus) fishbowl\??$/i,
    response: { text: ANSWERS.FISHBOWL },
  },
  {
    re: /^(?:nautilus )?(?:vs|versus) fishbowl\??$/i,
    response: { text: ANSWERS.FISHBOWL },
  },

  // Migration — short variants
  {
    re: /^(?:what'?s )?(?:the )?migration (?:process|plan|like|look like)\??$/i,
    response: { text: ANSWERS.MIGRATION },
  },
  {
    re: /^how does (?:the )?migration work\??$/i,
    response: { text: ANSWERS.MIGRATION },
  },

  // Talk-to-human variants (with CTA)
  {
    re: /^(?:can i )?talk to (?:a |the )?(human|person|rep|sales rep|salesperson|someone)\??$/i,
    response: {
      text: ANSWERS.HUMAN,
      cta: {
        type: "talk_human",
        reason: "User asked to talk to a human (Tier 2 pattern match).",
      },
    },
  },
  {
    re: /^(?:i )?(?:want to|need to|would like to) (?:speak|talk) (?:to|with) (?:a |the )?(human|person|rep|sales rep|salesperson|someone)\??$/i,
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
   Returns the canned response if the input matches any Tier 1 exact
   key or Tier 2 regex pattern. Returns null if nothing matches, in
   which case the caller (route.js) falls through to the normal
   Anthropic loop.

   Normalization rules:
     - Trim leading/trailing whitespace.
     - For exact-match lookup: also lowercase. EXACT keys are stored
       in lowercase.
     - For pattern lookup: don't lowercase — the regexes use the `i`
       flag where needed. Leaving the original case lets future
       patterns optionally be case-sensitive without rewriting this.
─────────────────────────────────────────────────────── */

export function matchCanned(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (EXACT[lower]) return EXACT[lower];

  for (const { re, response } of PATTERNS) {
    if (re.test(trimmed)) return response;
  }

  return null;
}
