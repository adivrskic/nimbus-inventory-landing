// ──────────────────────────────────────────────────────────────────────────
// lib/chat/claude-config.js  (no-embeddings version)
// ──────────────────────────────────────────────────────────────────────────
// System prompt is an array: a small instructions block plus the full
// knowledge base, with cache_control on the KB block. Everything before
// (and including) that breakpoint gets cached — tools, instructions, and
// the KB — for ~5 minutes per cache hit. Subsequent requests within that
// window pay 10% of normal input cost on the cached portion.
// ──────────────────────────────────────────────────────────────────────────

import { KNOWLEDGE_BASE } from "./knowledge-base";

export const CLAUDE_MODEL = "claude-sonnet-4-6";
// Drop to "claude-haiku-4-5-20251001" for lower latency at lower quality.
// Use "claude-opus-4-7" for the trickiest sales conversations.

/* MAX_TOKENS: the per-response output cap from Claude.
   Previously 1024 — too low for verbose answers (e.g. comparing all three
   pricing tiers with bullets, walking through a 4-week migration plan).
   Claude would hit the cap mid-sentence with stop_reason="max_tokens", the
   truncated text would be saved to history, and the next turn would get
   confused by the unfinished prior response (recency bias makes it
   continue the truncated topic instead of cleanly answering the new
   user message).

   4096 is ~3000 words — generous enough that nearly all responses complete
   naturally. Combined with the route.js max_tokens-handling that appends
   a "(response was cut off — ask me to continue)" marker on the rare
   times this still hits, the visible-truncation bug is fully resolved.

   Cost note: cap doesn't mean each request uses 4096. Claude uses what
   it needs. Median responses on this site are 200-400 tokens. */
export const MAX_TOKENS = 4096;

/* MAX_HISTORY_MESSAGES: how many of the most recent chat_messages rows
   to include when building the messages array for Claude. Prevents
   unbounded growth on long conversations — a 200-message back-and-forth
   would otherwise replay all 200 every turn, multiplying input cost.

   60 messages ≈ 30 user-assistant exchanges. Plenty of context for any
   real conversation. Combined with the system-prompt KB cache, even a
   capped 60-message tail-of-history pays a small fraction of full
   replay cost. */
export const MAX_HISTORY_MESSAGES = 60;

// ──────────────────────────────────────────────────────────────────────────
// INSTRUCTIONS — kept short and stable. Cached as part of the prefix.
// ──────────────────────────────────────────────────────────────────────────

const INSTRUCTIONS = `You are the Nautilus Helper — the in-product AI assistant for Nautilus WMS, a warehouse management system with native iOS + Android apps, AI-powered features (barcode scanning, voice commands, anomaly detection, cycle counting, route optimization), and 50+ integrations across e-commerce, accounting, and ERP platforms.

Your job is to help. People come with questions about how Nautilus works, what it costs, how it compares to other systems, whether it fits their industry, and how to do things in the app. Answer those questions well and the rest takes care of itself.

# How to answer

The full Nautilus knowledge base — pricing, features, blog posts, help articles, integrations, industries, competitor comparisons — is provided to you in this system prompt. Use it as your source of truth. When you reference something specific, weave the source URL into the prose naturally (e.g. "Nautilus integrates with Shopify in both directions — see /integration/shopify for the field-level mapping").

Never invent pricing, integrations, customer names, or features. If the knowledge base doesn't cover something the user asks, say so plainly: "I don't have that detail handy — want me to put you in touch with the team?"

Match the Nautilus voice: direct, concrete, light on marketing language. Real numbers and specifics over adjectives. Short paragraphs. Avoid bullets unless the question is genuinely list-shaped. Avoid section headers in your responses — this is a chat, not a doc. Sentences like "we'd love to chat" or "let me know how I can help further" are off-brand; leave them out.

Most answers should fit in 2–4 sentences. Long explanations are reserved for genuinely complex questions (migration planning, multi-warehouse rollouts, integration architecture).

# Handling continuations

If the user's previous turn from you ended with "(response was cut off — ask me to continue)" and the user's new message asks you to continue, pick up exactly where you left off without restating what you already covered. If the new message is unrelated, ignore the truncation entirely and answer the new question — don't dredge up the previous topic.

If the user asks you something completely off-topic (general math, weather, news, anything outside Nautilus's scope), answer briefly: "That's not something I can help with — I'm just here for Nautilus questions. Anything I can answer about [a relevant Nautilus angle, if any]?"

# When to offer a call

There are exactly two situations where you should call propose_cta:

1. Right after answering a high-intent question — pricing, ROI, multi-warehouse setup, "vs [competitor]", migration, custom integrations. Use the topic that matches the conversation.

2. Once the conversation has roughly 6 user messages, no CTA has been shown yet, AND there's any sales flavor at all. Use type=book_call with topic=demo or sales.

Never call propose_cta after a basic help question ("how do I print a label?"). Never include CTA language in your prose text — the rendered card handles it. If you call propose_cta, keep your text answer focused on the actual question.

# Email drafts

When the user asks you to write or compose an email, call draft_email. The result renders as an editable block with copy and mail buttons. Don't repeat the draft back in your text — say something brief like "Here's a draft you can edit" and let the rendered block speak.

If the user wants you to actually send the email (not just draft), ask for their email address so the follow-up is tied to a real lead. Then call capture_lead with intent="email_draft".

# Hard rules

- Never invent pricing, integrations, customer names, features, or stats.
- Never speak about competitors negatively beyond what's documented in the comparison pages of the knowledge base.
- Never ask for an email unless the user has indicated they want one (draft sent, booking confirmation, follow-up).
- Never claim to do something you can't (e.g. "I'll have a rep call you in 5 minutes").
- If the user is frustrated, confused, or has an issue you can't resolve from the knowledge base, call propose_cta with type=talk_human and answer briefly.`;

// ──────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — array with cache_control on the KB block.
// ──────────────────────────────────────────────────────────────────────────
// The cache_control marker caches everything BEFORE and INCLUDING that block,
// in the request order: tools → system → messages. So this single marker
// caches tools + instructions + KB. Cache TTL is 5 min by default; bump to
// 1h with cache_control: { type: "ephemeral", ttl: "1h" } if you have steady
// traffic and want fewer cache writes (costs 2x to write but lasts longer).

export const SYSTEM_PROMPT = [
  { type: "text", text: INSTRUCTIONS },
  {
    type: "text",
    text: KNOWLEDGE_BASE,
    cache_control: { type: "ephemeral" },
  },
];

// ──────────────────────────────────────────────────────────────────────────
// TOOLS — search_knowledge_base is gone. KB is in the system prompt now.
// ──────────────────────────────────────────────────────────────────────────

export const TOOLS = [
  {
    name: "get_calendly_link",
    description:
      "Returns a Calendly booking URL tailored to the user's intent, with the right utm_content tag so the sales rep sees context on the booking before the call. Call this when the user explicitly wants to book a meeting or talk to someone. For showing a CTA card (not a direct link), use propose_cta instead.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: ["demo", "sales", "migration", "integration"],
          description:
            "demo: general product walkthrough. sales: Enterprise pricing / multi-warehouse. migration: moving from another WMS. integration: custom integration build.",
        },
      },
      required: ["topic"],
    },
  },

  {
    name: "draft_email",
    description:
      "Draft an email the user can edit, copy, or open in their mail client. Returns subject + body. Use when the user asks you to write, compose, or draft an email — typically to share Nautilus with their team, with a vendor, or with leadership. The frontend renders the result as an editable block; do not repeat the draft in your prose response.",
    input_schema: {
      type: "object",
      properties: {
        purpose: {
          type: "string",
          description: "What the email is for, in one sentence.",
        },
        recipient_role: {
          type: "string",
          description:
            "Who the recipient is (e.g. 'ops manager', 'CFO', 'IT lead'). Optional but improves the draft.",
        },
        tone: {
          type: "string",
          enum: ["casual", "formal", "direct"],
          description: "Default: direct.",
        },
        key_points: {
          type: "array",
          items: { type: "string" },
          description:
            "Specific facts or numbers to include (pricing, features, integrations). Pull these from the knowledge base — don't invent.",
        },
      },
      required: ["purpose"],
    },
  },

  {
    name: "capture_lead",
    description:
      "Save the user's contact info to the leads database and fire the same sales notification email the DemoModal uses. Only call AFTER the user has voluntarily shared their email for a specific reason (sending a draft, booking, follow-up). Never ask for an email purely to capture it.",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string", description: "User's email." },
        name: { type: "string", description: "User's name, if shared." },
        intent: {
          type: "string",
          enum: [
            "demo",
            "sales",
            "migration",
            "integration",
            "email_draft",
            "follow_up",
          ],
          description: "Why the user shared their email.",
        },
      },
      required: ["email", "intent"],
    },
  },

  {
    name: "propose_cta",
    description:
      "Signal the frontend to render a contextual call-to-action card after your text response. The card matches the DemoModal aesthetic (gold accent, topic chip) and links to Calendly with the right utm_content. Use sparingly — see system prompt for the two situations where this is appropriate. Do not include CTA language in your prose; the card handles it.",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["book_call", "compare", "talk_human"],
          description:
            "book_call: opens Calendly with the topic preselected. compare: links to the relevant /compare page. talk_human: shows a 'we'll get back within 24h' contact card.",
        },
        topic: {
          type: "string",
          enum: ["demo", "sales", "migration", "integration"],
          description:
            "Required if type is book_call. Drives the Calendly utm_content.",
        },
        reason: {
          type: "string",
          description:
            "One short sentence on why this CTA fits the conversation. Internal only — never shown to the user.",
        },
      },
      required: ["type", "reason"],
    },
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Conversation history → messages array shape
// ──────────────────────────────────────────────────────────────────────────

export function buildMessagesArray(rows) {
  const out = [];
  for (const row of rows) {
    if (row.role === "system") continue;

    if (row.role === "user") {
      out.push({ role: "user", content: row.content });
      continue;
    }

    if (row.role === "assistant") {
      const content = [];
      if (row.content) content.push({ type: "text", text: row.content });
      if (Array.isArray(row.tool_calls)) {
        for (const call of row.tool_calls) {
          content.push({
            type: "tool_use",
            id: call.id,
            name: call.name,
            input: call.input,
          });
        }
      }
      out.push({ role: "assistant", content });
      continue;
    }

    if (row.role === "tool") {
      out.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: row.tool_use_id,
            content: row.content,
          },
        ],
      });
    }
  }
  return out;
}

/* trimHistory — slice the working history to at most maxMessages while
   preserving the message-alternation invariant Anthropic requires (first
   message must be role=user). After slicing -maxMessages, we trim any
   leading non-user rows (orphaned tool results, dangling assistant turns)
   so the result always starts on a clean user message.

   Called from the route handler right before buildMessagesArray. */
export function trimHistory(rows, maxMessages = MAX_HISTORY_MESSAGES) {
  if (!Array.isArray(rows) || rows.length <= maxMessages) return rows;
  let cut = rows.slice(-maxMessages);
  while (cut.length > 0 && cut[0].role !== "user") {
    cut = cut.slice(1);
  }
  return cut;
}
