// ──────────────────────────────────────────────────────────────────────────
// components/Chat/ChatDrawer.jsx
// ──────────────────────────────────────────────────────────────────────────
// Slide-in chat panel, styled to match the Nimbus visual vocabulary:
// sharp corners, mono font for everything except headlines, hairline rules.
//
// New in this version:
//   - "New chat" button in the header (only renders when there are messages)
//   - Inline URL linkification in assistant text (assistant prose can reference
//     /pricing or https://... and those become clickable without markdown)
//   - Rate-limit error state with a clean limit-reached card
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useRef } from "react";
import { useChatStream } from "./useChatStream";
import styles from "./ChatDrawer.module.css";

const STARTERS = [
  "What does Nimbus cost?",
  "How does it compare to Fishbowl?",
  "Show me the AI features",
  "Talk to a human",
];

// Match http(s) URLs and absolute site paths starting with a known top-level
// section. The negative lookbehind keeps "$1,497/mo" or similar from
// matching as a path.
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

export default function ChatDrawer({ onClose, pathname, userEmail, userName }) {
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

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, cta]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const submit = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    send(text, { sourceUrl: pathname });
  };

  const sendStarter = (t) => {
    if (streaming) return;
    send(t, { sourceUrl: pathname });
  };

  const handleReset = () => {
    if (streaming) return;
    reset();
    inputRef.current?.focus();
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <aside
        className={styles.drawer}
        role="dialog"
        aria-label="Chat with Nimbus"
      >
        <Header
          streaming={streaming}
          onClose={onClose}
          onReset={handleReset}
          showReset={messages.length > 0}
        />

        <div ref={scrollRef} className={styles.scroll}>
          {messages.length === 0 ? (
            <Welcome onPick={sendStarter} />
          ) : (
            messages.map((m) => (
              <Message key={m.id} message={m} streaming={streaming} />
            ))
          )}
          {cta && <CTACard cta={cta} onDismiss={() => setCta(null)} />}
        </div>

        <form className={styles.inputBar} onSubmit={submit}>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder={streaming ? "Waiting…" : "Ask anything about Nimbus…"}
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
            <ArrowIcon />
          </button>
        </form>
        <div className={styles.disclaimer}>
          AI-generated — verify pricing details with your rep
        </div>
      </aside>
    </>
  );
}

// ── Header ────────────────────────────────────────────────────────────────

function Header({ streaming, onClose, onReset, showReset }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerIcon}>
        <MsgIcon />
      </div>
      <div className={styles.headerText}>
        <div className={styles.headerTitle}>Ask Nimbus</div>
        <div className={styles.headerSub}>
          {streaming ? (
            <>
              <span className={styles.statusDot} aria-hidden="true" />
              Thinking
            </>
          ) : (
            <>Help, pricing, demos — instant answers</>
          )}
        </div>
      </div>
      {showReset && (
        <button
          type="button"
          className={styles.resetBtn}
          onClick={onReset}
          disabled={streaming}
        >
          New chat
        </button>
      )}
      <button
        type="button"
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Close chat"
      >
        <CloseIcon />
      </button>
    </header>
  );
}

// ── Welcome ───────────────────────────────────────────────────────────────

function Welcome({ onPick }) {
  return (
    <div className={styles.welcome}>
      <div className={styles.welcomeKicker}>ASK NIMBUS</div>
      <div className={styles.welcomeTitle}>What can I help with?</div>
      <p className={styles.welcomeDesc}>
        I know everything about Nimbus — features, pricing, integrations,
        comparisons, and how things work in the app.
      </p>
      <div className={styles.suggestions}>
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            className={styles.suggestion}
            onClick={() => onPick(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Message ───────────────────────────────────────────────────────────────

function Message({ message, streaming }) {
  if (message.role === "user") {
    return <div className={styles.userMsg}>{message.content}</div>;
  }

  // Rate-limit state — render a dedicated card instead of the normal message
  if (message.error && message.errorCode) {
    return <RateLimitCard message={message} />;
  }

  const showCursor =
    streaming && message.content && !message.emailDraft && !message.error;

  return (
    <div className={styles.assistantMsg}>
      {message.toolInFlight && !message.content && (
        <ToolStatus name={message.toolInFlight} />
      )}

      {message.content && (
        <div
          className={
            message.error ? styles.assistantTextError : styles.assistantText
          }
        >
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

      {message.emailDraft && <EmailDraftBlock draft={message.emailDraft} />}
    </div>
  );
}

function ToolStatus({ name }) {
  const label =
    name === "draft_email"
      ? "DRAFTING"
      : name === "get_calendly_link"
      ? "PULLING CALENDLY"
      : "WORKING";
  return (
    <div className={styles.toolStatus}>
      <span className={styles.statusDot} aria-hidden="true" />
      {label}
    </div>
  );
}

function RateLimitCard({ message }) {
  return (
    <div className={styles.limitCard}>
      <div className={styles.limitKicker}>LIMIT REACHED</div>
      <div className={styles.limitText}>{message.content}</div>
    </div>
  );
}

// ── Email draft block ─────────────────────────────────────────────────────

function EmailDraftBlock({ draft }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
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
        <button type="button" onClick={handleCopy} className={styles.actionBtn}>
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

const CTA_COPY = {
  demo: {
    title: "Want to see Nimbus in action?",
    sub: "30-minute walkthrough on your calendar.",
  },
  sales: {
    title: "Want a tailored quote?",
    sub: "Multi-warehouse rollouts often come with custom terms.",
  },
  migration: {
    title: "Want to plan the migration?",
    sub: "We'll map your current setup to Nimbus.",
  },
  integration: {
    title: "Want to scope the integration?",
    sub: "Talk to an engineer about what you need to connect.",
  },
};

function CTACard({ cta, onDismiss }) {
  if (cta.type === "talk_human") {
    return (
      <div className={styles.ctaCard}>
        <div className={styles.ctaKicker}>TALK TO US</div>
        <div className={styles.ctaTitle}>Want to talk to a human?</div>
        <div className={styles.ctaSub}>Our team gets back within 24 hours.</div>
        <div className={styles.ctaButtons}>
          <a href="/contact" className={styles.ctaPrimary}>
            Contact us
            <ArrowIcon size={10} />
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
    const copy = CTA_COPY[cta.topic] || CTA_COPY.demo;
    const open = () =>
      cta.calendly_url && window.open(cta.calendly_url, "_blank", "noopener");
    return (
      <div className={styles.ctaCard}>
        <div className={styles.ctaKicker}>BOOK A CALL</div>
        <div className={styles.ctaTitle}>{copy.title}</div>
        <div className={styles.ctaSub}>{copy.sub}</div>
        <div className={styles.ctaButtons}>
          <button type="button" onClick={open} className={styles.ctaPrimary}>
            Book a call
            <ArrowIcon size={10} />
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

// ── Icons (matching DemoModal style) ──────────────────────────────────────

function MsgIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 4C2 2.89543 2.89543 2 4 2H12C13.1046 2 14 2.89543 14 4V10C14 11.1046 13.1046 12 12 12H6L3 14.5V12H4C2.89543 12 2 11.1046 2 10V4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3L13 13M3 13L13 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon({ size = 12 }) {
  return (
    <svg
      width={size}
      height={size * (10 / 12)}
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
  );
}
