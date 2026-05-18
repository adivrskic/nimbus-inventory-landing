// ──────────────────────────────────────────────────────────────────────────
// components/Chat/useChatStream.js
// ──────────────────────────────────────────────────────────────────────────
// Client-side streaming hook. Imports nothing from the server side — only
// React. If you ever see `next/headers` in this file, something is wrong.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useCallback, useRef, useEffect } from "react";

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setConversationId(stored);
  }, []);

  const send = useCallback(
    async (text, { sourceUrl, sourceTopic } = {}) => {
      if (streaming) return;
      const trimmed = text?.trim();
      if (!trimmed) return;

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

  const reset = useCallback(() => {
    setMessages([]);
    setCta(null);
    setConversationId(null);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    messages,
    streaming,
    send,
    stop,
    reset,
    cta,
    setCta,
    conversationId,
  };
}
