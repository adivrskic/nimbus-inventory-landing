// ──────────────────────────────────────────────────────────────────────────
// components/Chat/ChatDrawer.jsx
// ──────────────────────────────────────────────────────────────────────────
// Slide-in chat panel, styled to match the Nautilus visual vocabulary:
// sharp corners, mono font for everything except headlines, hairline rules.
//
// State ownership: this component does NOT call useChatStream anymore.
// Chat state is owned by ChatProvider (always-mounted) and passed in as
// the `chat` prop. That way, closing the drawer (which unmounts it) does
// not wipe the transcript. See ChatProvider.jsx for the rationale.
//
// Features:
//   - "New chat" button in the header (only renders when there are messages)
//   - Inline URL linkification in assistant text (assistant prose can
//     reference /pricing or https://... and those become clickable)
//   - Rate-limit error state with a clean limit-reached card
//
// Accessibility:
//   - role="dialog" + aria-modal="true" — the drawer is a modal dialog.
//   - Focus trap on Tab — focus wraps within the drawer so keyboard
//     users can't accidentally Tab back into the page behind. WCAG
//     2.4.3 (Focus Order).
//   - Focus is moved to the input on mount; focus restore to the
//     launcher button on close is handled by ChatProvider.
//   - Escape closes (existing behavior).
//   - Completed assistant responses are announced via an aria-live
//     polite region (see "Announcement region" comment below). Rate-
//     limit errors use role="alert" for immediate announcement.
//   - Headings: Welcome title is h2, CTA card titles are h3 — so
//     keyboard users on screen readers can navigate by heading.
//
// Analytics events fired here:
//   - chat_starter_click       { starter, surface: 'drawer' }
//   - chat_cta_click           { cta_type, topic, surface: 'drawer' }
//   - chat_email_draft_action  { action: 'copy' | 'open_mail', surface: 'drawer' }
// Plus: send() and reset() both get { surface: 'drawer' } so useChatStream
// fires chat_message_sent / chat_reset with the right attribution.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useRef } from "react";
import { track } from "@/lib/analytics";
import styles from "./ChatDrawer.module.css";

const STARTERS = [
  "What does Nautilus cost?",
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

/* Focusable-element selector used by the Tab trap. Excludes disabled
   inputs, hidden inputs, and tabindex="-1" elements. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* Visually-hidden style for the aria-live announcement region. Inline
   so this file doesn't depend on an .sr-only utility class. */
const SR_ONLY_STYLE = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function ChatDrawer({ onClose, pathname, chat }) {
  const [input, setInput] = useState("");

  /* Chat state lives in ChatProvider now and is passed in via `chat`.
     Pulling the same fields off the prop keeps the rest of this file
     identical to the pre-hoist version. */
  const { messages, streaming, send, cta, setCta, reset } = chat;

  const drawerRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  /* ── Announcement region ──
     Aria-live on every assistant message div would re-fire on every
     token during streaming — noisy and unreliable across screen
     readers. Instead, we maintain ONE polite live region that updates
     with the full text of the latest assistant response when streaming
     completes. SR users hear the response read once, fully formed.

     Rate-limit errors are NOT announced through this region — they
     use role="alert" on the RateLimitCard for immediate, assertive
     announcement. lastAnnouncedRef ensures each message is announced
     exactly once even if the messages array re-renders for other
     reasons. */
  const [announceText, setAnnounceText] = useState("");
  const lastAnnouncedRef = useRef(null);

  useEffect(() => {
    if (streaming) return;
    const latest = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.content && !m.error);
    if (latest && latest.id !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = latest.id;
      setAnnounceText(latest.content);
    }
  }, [streaming, messages]);

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

  /* Focus trap — wrap Tab/Shift+Tab navigation within the drawer.
     Without this, keyboard users tabbing past the last focusable
     element in the drawer land on whatever is behind it (page
     content, Nav, etc.). WCAG 2.4.3 (Focus Order). */
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;

    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      const focusables = drawer.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    drawer.addEventListener("keydown", handleTab);
    return () => drawer.removeEventListener("keydown", handleTab);
  }, []);

  const submit = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    send(text, { sourceUrl: pathname, surface: "drawer" });
  };

  const sendStarter = (t) => {
    if (streaming) return;
    track("chat_starter_click", { starter: t, surface: "drawer" });
    send(t, { sourceUrl: pathname, surface: "drawer" });
  };

  const handleReset = () => {
    if (streaming) return;
    reset({ surface: "drawer" });
    inputRef.current?.focus();
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <aside
        ref={drawerRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Chat with Nautilus"
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
            <ArrowIcon />
          </button>
        </form>
        <div className={styles.disclaimer}>
          AI-generated — verify pricing details with your rep
        </div>

        {/* Polite live region — see "Announcement region" comment above
            useEffect. Visually hidden; fires when streaming completes
            for a new assistant message. */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={SR_ONLY_STYLE}
        >
          {announceText}
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
        <div className={styles.headerTitle}>Ask Nautilus</div>
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
  /* Welcome title is rendered as a real h2 so screen-reader users can
     navigate to it with H/2 keys. Visual styling unchanged — the
     existing `.welcomeTitle` class already targets generic typography. */
  return (
    <div className={styles.welcome}>
      <div className={styles.welcomeKicker}>ASK Nautilus</div>
      <h2 className={styles.welcomeTitle}>What can I help with?</h2>
      <p className={styles.welcomeDesc}>
        I know everything about Nautilus — features, pricing, integrations,
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

/* RateLimitCard uses role="alert" so screen readers announce the error
   immediately (assertive politeness). This is the WCAG 4.1.3 (Status
   Messages) treatment for blocking errors that need user attention. */
function RateLimitCard({ message }) {
  return (
    <div className={styles.limitCard} role="alert">
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
      track("chat_email_draft_action", { action: "copy", surface: "drawer" });
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
        <a
          href={mailto}
          onClick={() =>
            track("chat_email_draft_action", {
              action: "open_mail",
              surface: "drawer",
            })
          }
          className={styles.actionBtn}
        >
          Open in mail
        </a>
      </div>
    </div>
  );
}

// ── CTA card ──────────────────────────────────────────────────────────────

const CTA_COPY = {
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
    sub: "Talk to an engineer about what you need to connect.",
  },
};

function CTACard({ cta, onDismiss }) {
  /* CTA card titles are h3 — semantic level under the Welcome h2, and
     give SR users a heading-navigable landmark for the call to action. */
  if (cta.type === "talk_human") {
    return (
      <div className={styles.ctaCard}>
        <div className={styles.ctaKicker}>TALK TO US</div>
        <h3 className={styles.ctaTitle}>Want to talk to a human?</h3>
        <div className={styles.ctaSub}>Our team gets back within 24 hours.</div>
        <div className={styles.ctaButtons}>
          <a
            href="/contact"
            onClick={() =>
              track("chat_cta_click", {
                cta_type: "talk_human",
                topic: cta.topic || "unknown",
                surface: "drawer",
              })
            }
            className={styles.ctaPrimary}
          >
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
    const open = () => {
      track("chat_cta_click", {
        cta_type: "book_call",
        topic: cta.topic || "unknown",
        surface: "drawer",
      });
      if (cta.calendly_url) {
        window.open(cta.calendly_url, "_blank", "noopener");
      }
    };
    return (
      <div className={styles.ctaCard}>
        <div className={styles.ctaKicker}>BOOK A CALL</div>
        <h3 className={styles.ctaTitle}>{copy.title}</h3>
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
