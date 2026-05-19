// ──────────────────────────────────────────────────────────────────────────
// components/Chat/useChatStream.js
// ──────────────────────────────────────────────────────────────────────────
// Client-side streaming hook. Imports nothing from the server side — only
// React. If you ever see `next/headers` in this file, something is wrong.
//
// Analytics: fires the chat events that have natural hooks inside the
// stream lifecycle. The consumer-side events (open, close, starter
// clicks, CTA clicks, email-draft button clicks) fire from the
// components that own those UIs — see ChatProvider.jsx, ChatDrawer.jsx,
// AskClient.jsx.
//
// Events fired from this file:
//   - chat_message_sent      at the top of send()
//   - chat_cta_shown         in handleEvent when a `cta` event arrives
//   - chat_rate_limit_hit    on 429 response
//   - chat_reset             in reset()
//
// `surface` ('drawer'|'ask_page') is passed in via the optional `surface`
// option on send() / reset() so the hook itself stays surface-agnostic
// and the events carry the right attribution.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { track } from "@/lib/analytics";

const STORAGE_KEY = "Nautilus_chat_conv_id";

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function useChatStream({ userEmail, userName } = {}) {
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [cta, setCta] = useState(null);
  const abortRef = useRef(null);

  /* Tracks how many messages have been sent in the current session so
     chat_message_sent can carry an is_first flag. Reset by reset(). */
  const sendCountRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setConversationId(stored);
  }, []);

  const send = useCallback(
    async (text, { sourceUrl, sourceTopic, surface = "drawer" } = {}) => {
      if (streaming) return;
      const trimmed = text?.trim();
      if (!trimmed) return;

      /* Fire chat_message_sent before the network call so analytics
         captures intent even if the request fails. No message content
         — just length + surface + is_first signal. */
      sendCountRef.current += 1;
      track("chat_message_sent", {
        surface,
        is_first: sendCountRef.current === 1,
        message_length: trimmed.length,
      });

      const userMsg = { id: makeId(), role: "user", content: trimmed };
      const assistantMsg = {
        id: makeId(),
        role: "assistant",
        content: "",
        citations: [],
        emailDraft: null,
        toolInFlight: null,
        error: false,
        errorCode: null,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);
      setCta(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: conversationId,
            message: trimmed,
            source_url:
              sourceUrl ||
              (typeof window !== "undefined" ? window.location.pathname : null),
            source_topic: sourceTopic || null,
            user_email: userEmail || null,
            user_name: userName || null,
          }),
          signal: controller.signal,
        });

        // ── 429 rate limit (JSON, not SSE) ───────────────────────────
        if (res.status === 429) {
          const err = await res.json().catch(() => ({}));
          track("chat_rate_limit_hit", { surface });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? {
                    ...m,
                    content: err.error || "Rate limit reached.",
                    error: true,
                    errorCode: err.code || "rate_limit",
                  }
                : m
            )
          );
          return;
        }

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const raw of parts) {
            if (!raw.trim()) continue;
            let eventType = "message";
            let data = "";
            for (const line of raw.split("\n")) {
              if (line.startsWith("event:")) eventType = line.slice(6).trim();
              else if (line.startsWith("data:")) data += line.slice(5).trim();
            }
            if (!data) continue;

            let payload;
            try {
              payload = JSON.parse(data);
            } catch {
              continue;
            }
            handleEvent(eventType, payload, assistantMsg.id);
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("[chat] Stream error:", err);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? {
                    ...m,
                    content: m.content || "Connection lost. Try again?",
                    error: true,
                  }
                : m
            )
          );
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, toolInFlight: null } : m
          )
        );
      }
    },
    [streaming, conversationId, userEmail, userName]
  );

  function handleEvent(type, payload, currentAssistantId) {
    if (type === "ready") {
      if (payload.conversation_id) {
        setConversationId(payload.conversation_id);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, payload.conversation_id);
        }
      }
    } else if (type === "text") {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === currentAssistantId
            ? { ...m, content: m.content + (payload.text || "") }
            : m
        )
      );
    } else if (type === "tool_start") {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === currentAssistantId ? { ...m, toolInFlight: payload.name } : m
        )
      );
    } else if (type === "email_draft") {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === currentAssistantId ? { ...m, emailDraft: payload } : m
        )
      );
    } else if (type === "cta") {
      /* The bot proposed a CTA — fire chat_cta_shown so we can pair
         with chat_cta_click for funnel analysis. */
      track("chat_cta_shown", {
        cta_type: payload?.type || "unknown",
        topic: payload?.topic || "unknown",
      });
      setCta(payload);
    } else if (type === "calendly") {
      if (payload.url && typeof window !== "undefined") {
        window.open(payload.url, "_blank", "noopener");
      }
    } else if (type === "error") {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === currentAssistantId
            ? { ...m, content: payload.message || "Error", error: true }
            : m
        )
      );
    }
  }

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(
    (options = {}) => {
      const { surface = "drawer" } = options;
      track("chat_reset", {
        surface,
        messages_count: messages.length,
      });
      sendCountRef.current = 0;
      setMessages([]);
      setCta(null);
      setConversationId(null);
      if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    },
    [messages.length]
  );

  /* hydrate — replace the messages array wholesale. Used by ChatProvider
     on mount to restore a prior conversation from the server. Caller is
     responsible for passing shapes that match what the stream produces
     (id, role, content, plus the assistant-only fields).

     When we hydrate from server history, prime sendCountRef so the
     NEXT message isn't mislabeled as is_first. */
  const hydrate = useCallback((nextMessages) => {
    if (!Array.isArray(nextMessages)) return;
    setMessages(nextMessages);
    const userMsgCount = nextMessages.filter((m) => m.role === "user").length;
    sendCountRef.current = userMsgCount;
  }, []);

  return {
    messages,
    streaming,
    send,
    stop,
    reset,
    hydrate,
    cta,
    setCta,
    conversationId,
  };
}
