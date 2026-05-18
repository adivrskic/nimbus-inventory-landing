// ──────────────────────────────────────────────────────────────────────────
// app/ask/AskClient.jsx
// ──────────────────────────────────────────────────────────────────────────
// Full-page version of the chat. Same useChatStream hook as the drawer.
// Includes the "New chat" button, inline linkification, and rate-limit
// error state.
//
// Layout: locked to 100vh, no body scroll. The intro (when empty) or
// transcript (when there are messages) lives inside a single flex-1
// .scrollRegion that scrolls internally; the input bar and disclaimer
// sit naturally at the bottom of the flex column. scrollRef is on the
// outer .scrollRegion now — that's the element with overflow-y: auto,
// so the auto-scroll-to-bottom effect needs to target it (not the
// .transcript div, which no longer scrolls).
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useRef, useEffect } from "react";
import { useChatStream } from "@/components/Chat/useChatStream";
import Footer from "@/components/Footer/Footer";
import styles from "./ask-client.module.css";

const STARTERS = [
  "Pricing for 3 warehouses",
  "How does Nautilus compare to Fishbowl?",
  "Will it work for cold storage?",
  "Show me the AI features",
  "What's the migration look like?",
  "Draft an email to my ops team",
];

const LINK_RE =
  /(https?:\/\/[^\s<>"']+|(?<![a-z0-9])\/(?:blog|help|compare|integration|industry|ask|contact|pricing|features|api-docs|status|legal|signup|login)(?:\/[a-z0-9\-]+)*\/?)/gi;

function linkify(text) {
  if (!text) return [];
  const out = [];
  let last = 0;
  for (const match of text.matchAll(LINK_RE)) {
    if (match.index > last)
      out.push({ type: "t", v: text.slice(last, match.index) });
    out.push({ type: "l", v: match[0] });
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push({ type: "t", v: text.slice(last) });
  return out;
}

export default function AskClient({ userEmail, userName } = {}) {
  const [input, setInput] = useState("");
  const { messages, streaming, send, cta, setCta, reset } = useChatStream({
    userEmail,
    userName,
  });
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* Auto-scroll-to-bottom when new content arrives. scrollRef is on
     the outer .scrollRegion wrapper — that's where overflow-y: auto
     lives now that the page itself doesn't scroll. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, cta]);

  const submit = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    send(text, { sourceUrl: "/ask" });
  };

  const handleReset = () => {
    if (streaming) return;
    reset();
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      <main className={styles.main}>
        <div className={styles.column}>
          {/* Single scrollable region. Contains EITHER the intro state
            OR the transcript header + transcript — whichever is active.
            The form + disclaimer below sit outside it, pinned to the
            bottom of the flex column. */}
          <div ref={scrollRef} className={styles.scrollRegion}>
            {isEmpty ? (
              <header className={styles.intro}>
                <div className={styles.kicker}>ASK Nautilus</div>
                <h1 className={styles.h1}>
                  Instant answers about Nautilus.
                  <span className={styles.h1Dim}> Sources cited.</span>
                </h1>
                <p className={styles.lead}>
                  Pricing, features, integrations, comparisons, migration
                  planning — anything our docs cover, plus help drafting emails
                  and booking time with our team.
                </p>
                <div className={styles.starters}>
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={styles.starter}
                      onClick={() => send(s, { sourceUrl: "/ask" })}
                    >
                      <span className={styles.starterArrow}>→</span>
                      {s}
                    </button>
                  ))}
                </div>
              </header>
            ) : (
              <>
                <div className={styles.transcriptHeader}>
                  <div className={styles.kicker}>CONVERSATION</div>
                  <button
                    type="button"
                    className={styles.resetBtn}
                    onClick={handleReset}
                    disabled={streaming}
                  >
                    New chat
                  </button>
                </div>
                <div className={styles.transcript}>
                  {messages.map((m) => (
                    <AskMessage key={m.id} message={m} streaming={streaming} />
                  ))}
                  {cta && <AskCTA cta={cta} onDismiss={() => setCta(null)} />}
                </div>
              </>
            )}
          </div>

          <form className={styles.inputBar} onSubmit={submit}>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder={
                streaming ? "Waiting…" : "Ask anything about Nautilus…"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={streaming}
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={streaming || !input.trim()}
              aria-label="Send"
            >
              <svg
                width="12"
                height="10"
                viewBox="0 0 12 10"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 5H11M8 1L11 5L8 9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
          <div className={styles.disclaimer}>
            AI-generated — verify pricing details with your rep
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ── Message ───────────────────────────────────────────────────────────────

function AskMessage({ message, streaming }) {
  if (message.role === "user") {
    return <div className={styles.userMsg}>{message.content}</div>;
  }

  if (message.error && message.errorCode) {
    return (
      <div className={styles.limitCard}>
        <div className={styles.limitKicker}>LIMIT REACHED</div>
        <div className={styles.limitText}>{message.content}</div>
      </div>
    );
  }

  const showCursor =
    streaming && message.content && !message.emailDraft && !message.error;

  return (
    <div className={styles.assistantMsg}>
      {message.toolInFlight && !message.content && (
        <div className={styles.toolStatus}>
          <span className={styles.dot} aria-hidden="true" />
          {message.toolInFlight === "draft_email"
            ? "DRAFTING"
            : message.toolInFlight === "get_calendly_link"
            ? "PULLING CALENDLY"
            : "WORKING"}
        </div>
      )}
      {message.content && (
        <div className={styles.assistantText}>
          {linkify(message.content).map((seg, i) =>
            seg.type === "l" ? (
              <a
                key={i}
                href={seg.v}
                target={seg.v.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className={styles.inlineLink}
              >
                {seg.v}
              </a>
            ) : (
              <span key={i}>{seg.v}</span>
            )
          )}
          {showCursor && <span className={styles.cursor} />}
        </div>
      )}
      {message.emailDraft && <AskEmail draft={message.emailDraft} />}
    </div>
  );
}

// ── Email draft ───────────────────────────────────────────────────────────

function AskEmail({ draft }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `Subject: ${draft.subject}\n\n${draft.body}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };
  const mailto = `mailto:?subject=${encodeURIComponent(
    draft.subject || ""
  )}&body=${encodeURIComponent(draft.body || "")}`;
  return (
    <div className={styles.emailDraft}>
      <div className={styles.emailDraftSubject}>SUBJECT — {draft.subject}</div>
      <div className={styles.emailDraftBody}>{draft.body}</div>
      <div className={styles.emailDraftActions}>
        <button type="button" onClick={copy} className={styles.actionBtn}>
          {copied ? "Copied" : "Copy"}
        </button>
        <a href={mailto} className={styles.actionBtn}>
          Open in mail
        </a>
      </div>
    </div>
  );
}

// ── CTA card ──────────────────────────────────────────────────────────────

function AskCTA({ cta, onDismiss }) {
  const COPY = {
    demo: {
      title: "Want to see Nautilus in action?",
      sub: "30-minute walkthrough on your calendar.",
    },
    sales: {
      title: "Want a tailored quote?",
      sub: "Multi-warehouse rollouts often come with custom terms.",
    },
    migration: {
      title: "Want to plan the migration?",
      sub: "We'll map your current setup to Nautilus.",
    },
    integration: {
      title: "Want to scope the integration?",
      sub: "Talk to an engineer about what you need.",
    },
  };

  if (cta.type === "talk_human") {
    return (
      <div className={styles.ctaCard}>
        <div className={styles.ctaKicker}>TALK TO US</div>
        <div className={styles.ctaTitle}>Want to talk to a human?</div>
        <div className={styles.ctaSub}>Our team gets back within 24 hours.</div>
        <div className={styles.ctaButtons}>
          <a href="/contact" className={styles.ctaPrimary}>
            Contact us →
          </a>
          <button
            type="button"
            onClick={onDismiss}
            className={styles.ctaDismiss}
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  if (cta.type === "book_call") {
    const c = COPY[cta.topic] || COPY.demo;
    return (
      <div className={styles.ctaCard}>
        <div className={styles.ctaKicker}>BOOK A CALL</div>
        <div className={styles.ctaTitle}>{c.title}</div>
        <div className={styles.ctaSub}>{c.sub}</div>
        <div className={styles.ctaButtons}>
          <button
            type="button"
            onClick={() =>
              cta.calendly_url &&
              window.open(cta.calendly_url, "_blank", "noopener")
            }
            className={styles.ctaPrimary}
          >
            Book a call →
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className={styles.ctaDismiss}
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  return null;
}
