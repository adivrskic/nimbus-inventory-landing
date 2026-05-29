// System prompt is an array: a small instructions block plus the full
// knowledge base, with cache_control on the KB block. Everything before
// (and including) that breakpoint gets cached — tools, instructions, and
// the KB — for ~5 minutes per cache hit. Subsequent requests within that
// window pay 10% of normal input cost on the cached portion.
// ──────────────────────────────────────────────────────────────────────────

import { KNOWLEDGE_BASE } from "./knowledge-base";

export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const CLAUDE_MODEL_SMART = CLAUDE_MODEL; // strong default (Sonnet)
export const CLAUDE_MODEL_FAST = "claude-haiku-4-5-20251001"; // cheaper/faster

const ESCALATE_RE = new RegExp(
  [
    "\\b(?:pric|quot|roi|budget|discount|compar|migrat|integrat|complian|onboard|implement|schedul|invoic|enterprise|secur)\\w*",
    "\\b(?:vs|versus|api|webhook|sdk|sso|saml|hipaa|gdpr|contract|demo|book|email|draft|compose|sales|human|rep|call|fishbowl|netsuite|sortly|shipstation|sap|sage|switch)\\b",
    "soc\\s?2",
  ].join("|"),
  "i"
);

const SIMPLE_LEAD_RE =
  /^(?:how\b|where\b|which\b|can i\b|is there\b|are there\b|do you (?:support|have)\b|does (?:it|nautilus|the app)\b|what(?:'s| is| are| does)?\b)/i;

const SIMPLE_MAX_LEN = 160;

export function pickModel(message) {
  const text = String(message || "").trim();
  if (!text) return CLAUDE_MODEL_SMART;
  if (ESCALATE_RE.test(text)) return CLAUDE_MODEL_SMART;
  if (text.length <= SIMPLE_MAX_LEN && SIMPLE_LEAD_RE.test(text))
    return CLAUDE_MODEL_FAST;
  return CLAUDE_MODEL_SMART;
}

export const MAX_TOKENS = 4096;

export const MAX_HISTORY_MESSAGES = 60;

const INSTRUCTIONS = `You are the Nautilus Helper — the in-product AI assistant for Nautilus WMS, a warehouse management system with native iOS + Android apps, AI-powered features (barcode scanning, voice commands, anomaly detection, cycle counting, route optimization), and 10+ integrations (and counting) across e-commerce, accounting, and ERP platforms.

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

export const SYSTEM_PROMPT = [
  { type: "text", text: INSTRUCTIONS },
  {
    type: "text",
    text: KNOWLEDGE_BASE,
    cache_control: { type: "ephemeral" },
  },
];

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

export function buildMessagesArray(rows) {
  const built = [];
  for (const row of rows) {
    if (row.role === "system") continue;

    if (row.role === "user") {
      built.push({ role: "user", content: row.content });
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
      built.push({ role: "assistant", content });
      continue;
    }

    if (row.role === "tool") {
      const block = {
        type: "tool_result",
        tool_use_id: row.tool_use_id,
        content: row.content,
      };

      const last = built[built.length - 1];
      const isAggregatable =
        last &&
        last.role === "user" &&
        Array.isArray(last.content) &&
        last.content.length > 0 &&
        last.content[0]?.type === "tool_result";

      if (isAggregatable) {
        last.content.push(block);
      } else {
        built.push({ role: "user", content: [block] });
      }
    }
  }

  const validated = [];
  for (const msg of built) {
    const isToolResultMsg =
      msg.role === "user" &&
      Array.isArray(msg.content) &&
      msg.content.length > 0 &&
      msg.content[0]?.type === "tool_result";

    if (!isToolResultMsg) {
      validated.push(msg);
      continue;
    }

    const prev = validated[validated.length - 1];
    const validIds = new Set();
    if (prev && prev.role === "assistant" && Array.isArray(prev.content)) {
      for (const block of prev.content) {
        if (block?.type === "tool_use" && block.id) {
          validIds.add(block.id);
        }
      }
    }

    const filtered = msg.content.filter(
      (block) =>
        block?.type !== "tool_result" || validIds.has(block.tool_use_id)
    );

    if (filtered.length > 0) {
      validated.push({ role: "user", content: filtered });
    }
  }

  return validated;
}

export function trimHistory(rows, maxMessages = MAX_HISTORY_MESSAGES) {
  if (!Array.isArray(rows) || rows.length <= maxMessages) return rows;
  let cut = rows.slice(-maxMessages);
  while (cut.length > 0 && cut[0].role !== "user") {
    cut = cut.slice(1);
  }
  return cut;
}
