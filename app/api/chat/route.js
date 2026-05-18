// ──────────────────────────────────────────────────────────────────────────
// app/api/chat/route.js  (no-embeddings, rate-limited)
// ──────────────────────────────────────────────────────────────────────────
// Streaming chat endpoint with rate limiting.
//
// SSE event types sent to client:
//   ready       { conversation_id }
//   text        { text }
//   tool_start  { name }
//   email_draft { subject, body }
//   calendly    { url, topic }
//   cta         { type, topic, reason, calendly_url? }
//   done        { conversation_id }
//   error       { message }
//
// 429 responses are returned as regular JSON (not SSE) — the client checks
// res.status before opening the stream.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  SYSTEM_PROMPT,
  TOOLS,
  CLAUDE_MODEL,
  MAX_TOKENS,
  buildMessagesArray,
} from "@/lib/chat/claude-config";
import { handleTool } from "@/lib/chat/tool-handlers";
import { getOrCreateVisitor, getIp, hashIp } from "@/lib/chat/visitor";
import { checkRateLimit } from "@/lib/chat/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_LOOPS = 5;
const MESSAGE_MAX_LEN = 4000;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const message = String(body.message || "")
    .slice(0, MESSAGE_MAX_LEN)
    .trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Chat is not configured. Try sales@Nautiluswms.com." },
      { status: 500 }
    );
  }

  const visitorId = await getOrCreateVisitor();

  // ── Rate limit ─────────────────────────────────────────────────────────
  const rate = await checkRateLimit(visitorId);
  if (!rate.ok) {
    return NextResponse.json(
      {
        error: rate.message,
        code: rate.code,
        retryAfter: rate.retryAfter,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      }
    );
  }

  const supabase = getSupabaseAdmin();
  const sourceUrl = String(body.source_url || "").slice(0, 500) || null;
  const sourceTopic = String(body.source_topic || "").slice(0, 50) || null;
  const userEmail = String(body.user_email || "").slice(0, 320) || null;
  const userName = String(body.user_name || "").slice(0, 200) || null;

  // ── Resolve or create conversation ─────────────────────────────────────
  let conversationId = body.conversation_id || null;
  if (conversationId) {
    const { data: existing } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("visitor_id", visitorId)
      .maybeSingle();
    if (!existing) conversationId = null;
  }

  if (!conversationId) {
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        visitor_id: visitorId,
        email: userEmail,
        name: userName,
        source_url: sourceUrl,
        source_topic: sourceTopic,
        user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
        ip_hash: hashIp(getIp(request)),
        lead_captured: !!userEmail,
      })
      .select("id")
      .single();
    if (error) {
      console.error("[chat] Could not create conversation:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
    conversationId = data.id;
  }

  await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message,
  });

  await supabase
    .from("chat_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  const { data: history } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const workingHistory = [...(history || [])];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event, data) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          /* client disconnected */
        }
      };

      try {
        send("ready", { conversation_id: conversationId });

        for (let loop = 0; loop < MAX_LOOPS; loop++) {
          const messages = buildMessagesArray(workingHistory);

          const claudeStream = anthropic.messages.stream({
            model: CLAUDE_MODEL,
            max_tokens: MAX_TOKENS,
            system: SYSTEM_PROMPT,
            tools: TOOLS,
            messages,
          });

          let assistantText = "";
          const toolCalls = [];
          let currentToolCall = null;
          let inputTokens = 0;
          let outputTokens = 0;
          let cacheReadTokens = 0;
          let cacheCreationTokens = 0;
          let stopReason = null;

          for await (const event of claudeStream) {
            if (event.type === "message_start") {
              const usage = event.message?.usage || {};
              inputTokens = usage.input_tokens || 0;
              cacheReadTokens = usage.cache_read_input_tokens || 0;
              cacheCreationTokens = usage.cache_creation_input_tokens || 0;
            } else if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                currentToolCall = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  inputJson: "",
                };
                send("tool_start", { name: event.content_block.name });
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                assistantText += event.delta.text;
                send("text", { text: event.delta.text });
              } else if (
                event.delta.type === "input_json_delta" &&
                currentToolCall
              ) {
                currentToolCall.inputJson += event.delta.partial_json || "";
              }
            } else if (event.type === "content_block_stop") {
              if (currentToolCall) {
                let input = {};
                try {
                  input = currentToolCall.inputJson
                    ? JSON.parse(currentToolCall.inputJson)
                    : {};
                } catch {
                  console.error(
                    "[chat] Bad tool input JSON:",
                    currentToolCall.inputJson
                  );
                }
                toolCalls.push({
                  id: currentToolCall.id,
                  name: currentToolCall.name,
                  input,
                });
                currentToolCall = null;
              }
            } else if (event.type === "message_delta") {
              if (event.delta?.stop_reason)
                stopReason = event.delta.stop_reason;
              if (event.usage?.output_tokens)
                outputTokens = event.usage.output_tokens;
            }
          }

          const { data: savedAssistant } = await supabase
            .from("chat_messages")
            .insert({
              conversation_id: conversationId,
              role: "assistant",
              content: assistantText || null,
              tool_calls: toolCalls.length ? toolCalls : null,
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              cache_read_input_tokens: cacheReadTokens,
              cache_creation_input_tokens: cacheCreationTokens,
            })
            .select()
            .single();
          if (savedAssistant) workingHistory.push(savedAssistant);

          if (stopReason !== "tool_use" || toolCalls.length === 0) break;

          for (const call of toolCalls) {
            const result = await handleTool(call, { conversationId, supabase });

            if (call.name === "draft_email") {
              send("email_draft", {
                subject: result.subject,
                body: result.body,
              });
            } else if (call.name === "get_calendly_link") {
              send("calendly", { url: result.url, topic: result.topic });
            } else if (call.name === "propose_cta") {
              send("cta", result);
              await supabase.from("chat_events").insert({
                conversation_id: conversationId,
                type: "cta_shown",
                payload: result,
              });
              await supabase
                .rpc("increment_cta_count", { conv_id: conversationId })
                .catch((err) =>
                  console.error("[chat] increment_cta_count failed:", err)
                );
            }

            const { data: savedTool } = await supabase
              .from("chat_messages")
              .insert({
                conversation_id: conversationId,
                role: "tool",
                tool_use_id: call.id,
                content: JSON.stringify(result),
              })
              .select()
              .single();
            if (savedTool) workingHistory.push(savedTool);
          }
        }

        send("done", { conversation_id: conversationId });
      } catch (err) {
        console.error("[chat] Stream error:", err);
        send("error", { message: "Something went wrong. Please try again." });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
