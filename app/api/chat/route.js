// ──────────────────────────────────────────────────────────────────────────
// app/api/chat/route.js  (no-embeddings, rate-limited)
// ──────────────────────────────────────────────────────────────────────────
// Streaming chat endpoint with rate limiting + origin verification.
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
  trimHistory,
} from "@/lib/chat/claude-config";
import { handleTool } from "@/lib/chat/tool-handlers";
import { getOrCreateVisitor, getIp, hashIp } from "@/lib/chat/visitor";
import { checkRateLimit } from "@/lib/chat/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_LOOPS = 5;
const MESSAGE_MAX_LEN = 4000;

/* Origin allowlist for production. Requests from any other origin get a
   403 before we touch Claude. Dev (NODE_ENV !== "production") skips this
   check so localhost development just works.

   Add your real production domain(s) here. *.netlify.app is allowed
   unconditionally so Netlify preview deploys (deploy-preview-XX--…) work.
   Same-origin POSTs from a server (no Origin header) are also allowed —
   browsers always send Origin for cross-origin POSTs, so a missing
   header generally means same-origin or a non-browser caller. */
const ALLOWED_HOSTS = new Set([
  "nautilusinventory.com",
  "www.nautilusinventory.com",
  /* Add staging / preview custom domains here if you use any. */
]);

function isAllowedOrigin(origin) {
  if (!origin) return true; /* no header → same-origin or server caller */
  try {
    const host = new URL(origin).hostname;
    if (ALLOWED_HOSTS.has(host)) return true;
    if (host.endsWith(".netlify.app")) return true;
    if (host === "localhost" || host === "127.0.0.1") return true;
    return false;
  } catch {
    return false;
  }
}

export async function POST(request) {
  // ── Origin check (production only) ───────────────────────────────────
  if (process.env.NODE_ENV === "production") {
    const origin = request.headers.get("origin");
    if (!isAllowedOrigin(origin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

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
      { error: "Chat is not configured. Try sales@nautilusinventory.com." },
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
          /* Cap history to the last MAX_HISTORY_MESSAGES (default 60).
             trimHistory also enforces the user-message-first invariant
             so we never send Claude a messages array starting with an
             orphaned assistant or tool turn. */
          const trimmed = trimHistory(workingHistory);
          const messages = buildMessagesArray(trimmed);

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

          /* If Claude hit the per-response token cap, append a clear
             marker so:
               1. The user sees that the response was cut off (not a
                  silent mid-sentence drop like before)
               2. Claude on the NEXT user turn sees the marker in
                  history and knows to either continue or wrap up
                  instead of getting confused by an abrupt cutoff.

             Streamed via send("text", …) so the client renders it as
             part of the assistant message it's currently showing — no
             client code changes required. */
          if (stopReason === "max_tokens") {
            const marker =
              "\n\n*(response was cut off — ask me to continue if you want the rest)*";
            send("text", { text: marker });
            assistantText += marker;
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

          /* Loop continues only if Claude wants to use a tool. Anything
             else (end_turn, max_tokens, stop_sequence) ends this user
             turn — max_tokens is intentionally NOT auto-continued
             because the messages-array protocol requires user/assistant
             alternation; chaining two adjacent assistant turns on the
             server would produce an API validation error. The user can
             trigger a continuation by sending "continue" or similar,
             which Claude will pick up on (per the system prompt's
             "Handling continuations" section). */
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
              const { error: ctaCountErr } = await supabase.rpc(
                "increment_cta_count",
                { conv_id: conversationId }
              );
              if (ctaCountErr) {
                console.error(
                  "[chat] increment_cta_count failed:",
                  ctaCountErr
                );
              }
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
