// ──────────────────────────────────────────────────────────────────────────
// lib/chat/tool-handlers.js  (no-embeddings version)
// ──────────────────────────────────────────────────────────────────────────
// Implementations of the 4 tools defined in claude-config.js:
//   get_calendly_link  — Calendly URL with topic-tagged utm_content
//   draft_email        — quick Haiku call to write a subject + body
//   capture_lead       — saves to chat_leads + fires Resend notification
//   propose_cta        — passthrough; client renders the card
//
// search_knowledge_base is gone — the KB is in the system prompt now and
// Claude references it directly.
// ──────────────────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendDemoRequestEmail } from "@/lib/email";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL || "";

const TOPIC_LABELS = {
  demo: "Live demo",
  sales: "Enterprise pricing",
  migration: "Migration",
  integration: "Custom integration",
  email_draft: "Email draft via chat",
  follow_up: "Follow-up from chat",
};

// ── get_calendly_link ─────────────────────────────────────────────────────

export function getCalendlyLink({ topic }) {
  if (!CALENDLY_URL) {
    return { url: null, topic, error: "Calendly not configured" };
  }
  try {
    const url = new URL(CALENDLY_URL);
    url.searchParams.set("utm_source", "nimbus_chat");
    url.searchParams.set("utm_content", topic || "demo");
    return { url: url.toString(), topic };
  } catch {
    return { url: CALENDLY_URL, topic };
  }
}

// ── draft_email ───────────────────────────────────────────────────────────

export async function draftEmail({
  purpose,
  recipient_role,
  tone = "direct",
  key_points,
}) {
  const points =
    Array.isArray(key_points) && key_points.length
      ? `\nKey points to include:\n${key_points
          .map((p) => `- ${p}`)
          .join("\n")}`
      : "";

  const prompt = `Write a short email.

Purpose: ${purpose}
${recipient_role ? `Recipient role: ${recipient_role}` : ""}
Tone: ${tone}${points}

Return JSON only — no markdown fences, no commentary. Shape:
{ "subject": "...", "body": "..." }

Rules:
- Subject under 60 characters.
- Body 3-6 short sentences. No "Dear ___" greeting — start with "Hi team" or the team name.
- No sign-off block ("Best, ___") — leave that for the sender.
- Direct, concrete, no marketing fluff.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content?.[0]?.text || "";
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      subject: String(parsed.subject || "Quick note").slice(0, 200),
      body: String(parsed.body || "").slice(0, 5000),
    };
  } catch {
    return { subject: "Quick note", body: cleaned.slice(0, 5000) };
  }
}

// ── capture_lead ──────────────────────────────────────────────────────────

export async function captureLead({ email, name, intent }, ctx) {
  const supabase = getSupabaseAdmin();

  const { data: conv } = await supabase
    .from("chat_conversations")
    .select("source_topic, source_url, name")
    .eq("id", ctx.conversationId)
    .single();

  const { data: lead, error } = await supabase
    .from("chat_leads")
    .insert({
      conversation_id: ctx.conversationId,
      email,
      name: name || conv?.name || null,
      intent,
      source_topic: conv?.source_topic || null,
      source_url: conv?.source_url || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[capture_lead] Insert error:", error);
    return { ok: false, error: "Could not save lead" };
  }

  await supabase
    .from("chat_conversations")
    .update({
      email,
      name: name || conv?.name || null,
      lead_captured: true,
    })
    .eq("id", ctx.conversationId);

  const SALES_INTENTS = ["demo", "sales", "migration", "integration"];
  if (SALES_INTENTS.includes(intent)) {
    try {
      await sendDemoRequestEmail({
        name: name || "(via chat)",
        email,
        company: "(via chat)",
        warehouseSize: "(not specified)",
        comments: `Lead captured from chat bot.\nConversation: ${
          ctx.conversationId
        }\nSource: ${conv?.source_url || "unknown"}`,
        topic: intent,
        topicLabel: TOPIC_LABELS[intent] || intent,
      });
      await supabase
        .from("chat_leads")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", lead.id);
    } catch (err) {
      console.error("[capture_lead] Notification email failed:", err);
    }
  }

  return { ok: true, lead_id: lead.id };
}

// ── propose_cta ───────────────────────────────────────────────────────────

export function proposeCta({ type, topic, reason }) {
  const result = { type, topic: topic || null, reason };
  if (type === "book_call" && topic) {
    const { url } = getCalendlyLink({ topic });
    result.calendly_url = url;
  }
  return result;
}

// ── dispatch ──────────────────────────────────────────────────────────────

const HANDLERS = {
  get_calendly_link: getCalendlyLink,
  draft_email: draftEmail,
  capture_lead: captureLead,
  propose_cta: proposeCta,
};

export async function handleTool(toolCall, ctx) {
  const handler = HANDLERS[toolCall.name];
  if (!handler) return { error: `Unknown tool: ${toolCall.name}` };
  try {
    return await handler(toolCall.input || {}, ctx);
  } catch (err) {
    console.error(`[handleTool] ${toolCall.name} failed:`, err);
    return { error: err.message || "Tool failed" };
  }
}
