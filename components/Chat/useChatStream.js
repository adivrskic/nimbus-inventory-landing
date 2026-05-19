// ──────────────────────────────────────────────────────────────────────────
// components/Chat/useChatStream.js
// ──────────────────────────────────────────────────────────────────────────
// Client-side streaming hook. Imports nothing from the server side — only
// React. If you ever see `next/headers` in this file, something is wrong.
//
// ─── Letter-by-letter typing effect ───
// Chunks from the SSE stream arrive in bursts — sometimes 10 chars,
// sometimes a whole paragraph at once. Painting them directly to
// `message.content` makes the chat feel like it's pasting blocks of
// text. Instead, we keep two parallel strings per assistant message:
//
//   _pending  — everything we've received from the server so far
//   content   — what's currently visible to the user
//
// A single interval-driven typing loop walks `_pending` into `content`
// one (or a few) characters per tick. The base rate is tuned for
// readable prose; we accelerate when far behind, and switch to a
// "finish fast" mode once the underlying stream is done so the user
// never waits noticeably long for the buffer to drain. Messages with
// no `_pending` (rate-limit cards, server errors) bypass the loop
// entirely — those land instantly.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const STORAGE_KEY = "Nautilus_chat_conv_id";

/* ── Typing effect config ──────────────────────────────────────────────
   TICK_MS                — how often the typing loop fires (40fps)
   CHARS_PER_TICK_BASE    — minimum chars added per tick (steady cadence)
   CATCHUP_THRESHOLD      — backlog at which we start accelerating
   CATCHUP_DIVISOR        — bigger backlog → faster accel (remaining/N)
   FINISH_FAST_DIVISOR    — once stream is done, drain at this rate so
                            the user sees the whole reply quickly

   Adjust feel from here — bumping CHARS_PER_TICK_BASE to 2 makes it
   noticeably brisker; bumping TICK_MS to 16 makes it smoother but more
   CPU. Defaults aim for ~40 chars/sec — readable but not slow. */
const TICK_MS = 25;
const CHARS_PER_TICK_BASE = 1;
const CATCHUP_THRESHOLD = 60;
const CATCHUP_DIVISOR = 40;
const FINISH_FAST_DIVISOR = 20;

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

  /* Typing state. typingIntervalRef holds the live interval handle (or
     null when idle); streamDoneRef tracks which message IDs have had
     their server stream finish, so the loop knows to switch into
     finish-fast mode for them. Both are refs (no re-render) because
     the typing loop manages them imperatively. */
  const typingIntervalRef = useRef(null);
  const streamDoneRef = useRef(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setConversationId(stored);
  }, []);

  /* ── Typing loop ──
     One interval drains every assistant message that has backlog. Each
     tick, for each message with _pending.length > content.length, we
     append a chunk of chars to content. The loop self-terminates when
     no message has backlog left, and ensureTypingLoop() restarts it
     on the next text event. Single shared loop is simpler than per-
     message timers and never leaks. */
  const ensureTypingLoop = useCallback(() => {
    if (typingIntervalRef.current) return;
    typingIntervalRef.current = setInterval(() => {
      let anyActive = false;
      setMessages((prev) => {
        let changed = false;
        const next = prev.map((m) => {
          if (m.role !== "assistant") return m;
          const pending = m._pending;
          if (!pending) return m;
          const displayed = m.content || "";
          const remaining = pending.length - displayed.length;
          if (remaining <= 0) return m;

          anyActive = true;

          const isFinal = streamDoneRef.current.has(m.id);
          let chunkSize;
          if (isFinal) {
            /* Stream is done — finish fast so the user can read the
               whole reply. Floors at 2 so even tiny tails don't drag. */
            chunkSize = Math.max(2, Math.ceil(remaining / FINISH_FAST_DIVISOR));
          } else if (remaining > CATCHUP_THRESHOLD) {
            /* Server is racing ahead — accelerate but stay smooth. */
            chunkSize = Math.max(2, Math.ceil(remaining / CATCHUP_DIVISOR));
          } else {
            chunkSize = CHARS_PER_TICK_BASE;
          }

          changed = true;
          return {
            ...m,
            content: pending.slice(0, displayed.length + chunkSize),
          };
        });
        return changed ? next : prev;
      });

      if (!anyActive) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    }, TICK_MS);
  }, []);

  /* Cleanup on unmount so the interval doesn't survive route changes. */
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
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
        /* _pending is the typing buffer — text events append to this,
           and the typing loop drains it into content. Starts empty;
           bypassed entirely for error/rate-limit messages by setting
           it to undefined on those paths. */
        _pending: "",
        citations: [],
        emailDraft: null,
        toolInFlight: null,
        error: false,
        errorCode: null,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);
      setCta(null);
      /* Fresh message — make sure it isn't in the "stream done" set
         from a previous turn if IDs ever recycle. */
      streamDoneRef.current.delete(assistantMsg.id);

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
                    /* No typing animation for rate-limit cards — set
                       _pending undefined so the loop ignores them. */
                    _pending: undefined,
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
                    /* Drop the typing buffer — show the fallback text
                       immediately rather than animating into an error. */
                    content: m.content || "Connection lost. Try again?",
                    _pending: undefined,
                    error: true,
                  }
                : m
            )
          );
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
        /* Mark stream finished so the typing loop drains any remaining
           backlog in finish-fast mode. */
        streamDoneRef.current.add(assistantMsg.id);
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
      /* Append to the typing buffer (NOT content). The typing loop
         will reveal these chars one at a time. */
      setMessages((prev) =>
        prev.map((m) =>
          m.id === currentAssistantId
            ? { ...m, _pending: (m._pending || "") + (payload.text || "") }
            : m
        )
      );
      ensureTypingLoop();
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
      /* Server-side error — show the canonical error message
         immediately, no typing animation. */
      setMessages((prev) =>
        prev.map((m) =>
          m.id === currentAssistantId
            ? {
                ...m,
                content: payload.message || "Error",
                _pending: undefined,
                error: true,
              }
            : m
        )
      );
    }
  }

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    /* Stop any in-flight typing before clearing the message list so we
       don't leave a zombie interval running. */
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    streamDoneRef.current.clear();
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
