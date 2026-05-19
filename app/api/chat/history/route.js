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

  /* Pull user + assistant messages in chronological order. We skip
     role='tool' rows (those are tool-result payloads, not user-facing)
     and assistant rows with no text content (those are pure tool_use
     turns — the visible result was rendered as an email_draft / cta
     card via SSE at the time and isn't easily reconstructible here). */
  const { data: rows, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[chat/history] Supabase query failed:", error);
    return NextResponse.json({ messages: [] });
  }

  const messages = [];
  for (const row of rows || []) {
    if (row.role === "user") {
      messages.push({
        id: row.id,
        role: "user",
        content: row.content || "",
      });
    } else if (row.role === "assistant" && row.content) {
      messages.push({
        id: row.id,
        role: "assistant",
        content: row.content,
        citations: [],
        emailDraft: null,
        toolInFlight: null,
        error: false,
        errorCode: null,
      });
    }
  }

  return NextResponse.json({ messages });
}
