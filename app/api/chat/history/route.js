// ──────────────────────────────────────────────────────────────────────────
// app/api/chat/history/route.js
// ──────────────────────────────────────────────────────────────────────────
// GET /api/chat/history?conversation_id=X
//
// Returns the message transcript for a chat conversation, scoped to the
// caller's visitor cookie. Used by ChatProvider on mount to rehydrate the
// transcript after a tab reload — so users see their prior conversation
// when they come back, but only their own (visitor_id must match the row
// in chat_conversations).
//
// Returns { messages: [] } when:
//   - conversation_id is missing from query
//   - conversation_id doesn't belong to the calling visitor
//   - conversation has no messages yet
//
// Empty-array fallback (not 404) so the client doesn't need branching
// logic — it just hydrates with whatever it gets.
//
// ── Email-draft reconstruction ──
// In the live stream, an `email_draft` SSE event attaches a { subject, body }
// block to the current assistant bubble. On the server those live as a
// role='tool' row (the draft payload as JSON) produced by a draft_email
// tool_use on the preceding assistant row. The old version of this endpoint
// only returned user + text-bearing assistant rows, so a reloaded transcript
// silently dropped any email draft the user had generated. We now pull the
// tool rows too and re-attach the draft to the right assistant bubble, so a
// reload renders the draft exactly like the live stream did.
//
// ── CTA cards are intentionally NOT restored ──
// CTA cards are transient bottom-of-transcript prompts held in a separate
// `cta` state slot, not in the messages array, and the client doesn't persist
// dismissals. Re-showing a historical CTA on every reload would re-nag a card
// the user already dismissed, so we leave CTAs out of hydration — if the
// conversation still has sales intent, the next assistant turn re-proposes one.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getOrCreateVisitor } from "@/lib/chat/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversation_id");

  if (!conversationId) {
    return NextResponse.json({ messages: [] });
  }

  const visitorId = await getOrCreateVisitor();
  const supabase = getSupabaseAdmin();

  /* Ownership check. Without this, anyone with a conversation_id could
     read its full transcript. The visitor cookie is httpOnly + sameSite
     so it can't be set or read by JS — this gives us "users see only
     their own chats" without needing a full auth system. */
  const { data: conv } = await supabase
    .from("chat_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (!conv) {
    return NextResponse.json({ messages: [] });
  }

  /* Pull user + assistant + tool rows in chronological order. We need:
       - assistant.tool_calls — to learn which tool_use ids were draft_email
       - tool.tool_use_id + tool.content — the draft payload to re-render
     role='tool' rows are otherwise internal; we only surface draft results. */
  const { data: rows, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, tool_calls, tool_use_id, created_at")
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant", "tool"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[chat/history] Supabase query failed:", error);
    return NextResponse.json({ messages: [] });
  }

  /* Map of tool_use ids that were draft_email calls. The draft's subject/body
     lives in the matching role='tool' row's content (JSON), not on the
     assistant row, so we record "this id is a draft" here and parse the payload
     when we reach that tool row below. */
  const draftToolIds = new Set();
  for (const row of rows || []) {
    if (row.role === "assistant" && Array.isArray(row.tool_calls)) {
      for (const call of row.tool_calls) {
        if (call?.name === "draft_email" && call?.id) draftToolIds.add(call.id);
      }
    }
  }

  /* Client assistant-message shape, matching what the live stream produces
     (and what hydrate() in useChatStream expects). */
  function assistantShell(id, content, emailDraft = null) {
    return {
      id,
      role: "assistant",
      content: content || "",
      citations: [],
      emailDraft,
      toolInFlight: null,
      error: false,
      errorCode: null,
    };
  }

  const messages = [];

  /* A draft tool row arrives BEFORE the assistant's closing text turn ("Here's
     a draft you can edit"). Buffer it and attach it to that next assistant text
     bubble so the rebuilt order matches the live UI (text, then draft block).
     If a user turn or the end of the transcript comes first, flush it as its
     own bubble so a draft is never lost. */
  let pendingDraft = null;
  const flushPendingDraft = () => {
    if (pendingDraft) {
      messages.push(assistantShell(pendingDraft.id, "", pendingDraft.draft));
      pendingDraft = null;
    }
  };

  for (const row of rows || []) {
    if (row.role === "user") {
      flushPendingDraft();
      messages.push({ id: row.id, role: "user", content: row.content || "" });
      continue;
    }

    if (row.role === "assistant") {
      if (row.content) {
        const m = assistantShell(row.id, row.content);
        if (pendingDraft) {
          m.emailDraft = pendingDraft.draft;
          pendingDraft = null;
        }
        messages.push(m);
      }
      /* Assistant rows with no text (pure tool_use turns) produce no bubble on
         their own — the draft, if any, arrives via the tool row below. */
      continue;
    }

    if (row.role === "tool" && draftToolIds.has(row.tool_use_id)) {
      let draft = null;
      try {
        const parsed = JSON.parse(row.content);
        if (parsed && (parsed.subject || parsed.body)) {
          draft = {
            subject: String(parsed.subject || ""),
            body: String(parsed.body || ""),
          };
        }
      } catch {
        /* malformed tool payload — skip, nothing to render */
      }
      if (draft) {
        flushPendingDraft(); // don't drop a previous unattached draft
        pendingDraft = { id: row.id, draft };
      }
    }
  }

  flushPendingDraft();

  return NextResponse.json({ messages });
}
