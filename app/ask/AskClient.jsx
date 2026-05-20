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
//
// Visual vocabulary: the intro state's eyebrow + per-letter title +
// subtitle now match the Contact / Trust / Calculator heroes — same
// SplitText brand signature, same gold italic accent treatment, same
// display-font subtitle. The send button uses the shared CornerButton
// so it picks up the corner-bracket hover decoration the rest of the
// site uses for primary actions.
//
// SearchAction support: the WebSite schema declares a SearchAction
// pointing at /ask?q={search_term_string}. When a user submits a
// query through Google's sitelinks search box, they land here with
// ?q=... in the URL. The mount effect below reads that param and
// immediately fires the query through the chat stream — no extra
// click required. Empty/whitespace-only q values are ignored.
//
// Accessibility (Wave 2):
//   - Completed assistant responses are announced via an aria-live
//     polite region (see "Announcement region" comment below). Rate-
//     limit errors use role="alert" for immediate announcement.
//   - CTA card titles use <h3> so SR users can navigate by heading.
//   - The intro's h1 is owned by SplitText's legacy mode (sr-only flat
//     text + aria-hidden letters from the Wave 1 SplitText fix).
//
// Auto-scroll behavior:
//   The scroll-to-bottom effect skips its first run after mount, so
//   navigating into /ask with a hydrated transcript doesn't yank the
//   user to the bottom. After the first turn, subsequent token/cta
//   updates do auto-scroll — that's the right behavior for an
//   ongoing conversation.
//
// Analytics events fired here:
//   - chat_starter_click       { starter, surface: 'ask_page' }
//   - chat_cta_click           { cta_type, topic, surface: 'ask_page' }
//   - chat_email_draft_action  { action: 'copy' | 'open_mail', surface: 'ask_page' }
// Plus: send() and reset() both get { surface: 'ask_page' } so useChatStream
// fires chat_message_sent / chat_reset with the right attribution.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { useChatStream } from "@/components/Chat/useChatStream";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import SplitText from "@/components/shared/SplitText";
import { track } from "@/lib/analytics";
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

/* Visually-hidden style for the announcement region. */
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

export default function AskClient({ userEmail, userName } = {}) {
  const [input, setInput] = useState("");
  const { messages, streaming, send, cta, setCta, reset } = useChatStream({
    userEmail,
    userName,
  });
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const introRef = useRef(null);

  /* ── Announcement region ──
     Same pattern as ChatDrawer: a single polite live region that fires
     when streaming completes for a new assistant message. SR users
     hear each response read once, fully formed, instead of token-by-
     token chaos. Rate-limit errors are routed through role="alert"
     on the limit card (skipped here). */
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

  /* On mount: check for ?q= in the URL. If present, submit it as the
     first chat message — this is how Google's sitelinks SearchAction
     hands users off to /ask. If no q, focus the input as before.
     Skipped when there are already messages (e.g. a returning visitor
     whose transcript was hydrated from /api/chat/history) so we never
     re-fire the same query on a refresh.

     Reading window.location.search directly (not useSearchParams) keeps
     this effect server-render-safe and avoids opting the whole page
     into client-side rendering. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (messages.length > 0) {
      inputRef.current?.focus();
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim();
    if (q) {
      send(q, { sourceUrl: "/ask", surface: "ask_page" });
      return;
    }
    inputRef.current?.focus();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  /* Auto-scroll-to-bottom when new content arrives.

     The hasScrolledOnceRef gate skips the first run after mount so
     navigating into /ask with a hydrated transcript (returning visitor
     whose conversation was restored from /api/chat/history) doesn't
     yank the user to the bottom of the message list before they've
     even read the page. After the first turn in this tab session,
     subsequent token streams and CTA updates do auto-scroll — which
     is the right behavior for an active conversation where the user
     is watching the assistant type.

     scrollRef is on the outer .scrollRegion wrapper — that's where
     overflow-y: auto lives now that the page itself doesn't scroll. */
  const hasScrolledOnceRef = useRef(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (!hasScrolledOnceRef.current) {
      hasScrolledOnceRef.current = true;
      return;
    }

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, cta]);

  /* Intro mount animation — eyebrow fades up, then per-letter title
     rotates in, then subtitle + starters fade up. Same cadence as the
     Contact / Trust hero so /ask reads as part of the same family.
     Only fires while the empty intro is mounted; when the user sends
     their first message the conditional unmounts the header. On reset
     (transcript → intro) the header re-mounts and the timeline fires
     again because messages.length flips back to 0. */
  useEffect(() => {
    if (messages.length > 0 || !introRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(
      `.${styles.kicker}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45 },
      0.1
    );

    const letters = introRef.current.querySelectorAll(`.${styles.heroLetter}`);
    tl.to(
      letters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.75, stagger: 0.025 },
      0.2
    );

    tl.fromTo(
      `.${styles.lead}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55 },
      0.6
    );

    tl.fromTo(
      `.${styles.starters}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5 },
      0.75
    );

    return () => tl.kill();
  }, [messages.length]);

  const submit = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    send(text, { sourceUrl: "/ask", surface: "ask_page" });
  };

  const handleStarter = (s) => {
    if (streaming) return;
    track("chat_starter_click", { starter: s, surface: "ask_page" });
    send(s, { sourceUrl: "/ask", surface: "ask_page" });
  };

  const handleReset = () => {
    if (streaming) return;
    reset({ surface: "ask_page" });
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
              <header ref={introRef} className={styles.intro}>
                <div className={styles.kicker}>ASK Nautilus</div>
                <h1 className={styles.h1}>
                  <SplitText
                    lines={[
                      "Instant answers about Nautilus.",
                      "Sources cited.",
                    ]}
                    accentLines={[1]}
                    classNames={{
                      line: styles.heroLine,
                      letter: styles.heroLetter,
                      accent: styles.heroLetterAccent,
                      space: styles.heroSpace,
                    }}
                  />
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
                      onClick={() => handleStarter(s)}
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
                  {/* className is .resetBtn — the CSS module defines this
                      class with the mono-uppercase + bracket-hover look
                      that matches the rest of the site's secondary CTAs.
                      An earlier version used styles.newChatBtn which
                      didn't exist in the stylesheet, leaving the button
                      visually unstyled. */}
                  <button
                    type="button"
                    onClick={handleReset}
                    className={styles.resetBtn}
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
            <CornerButton
              type="submit"
              disabled={streaming || !input.trim()}
              ariaLabel="Send"
            >
              Send
            </CornerButton>
          </form>
          <div className={styles.disclaimer}>
            AI-generated — verify pricing details with your rep
          </div>

          {/* Polite live region for streaming-complete announcements.
              See "Announcement region" comment above. */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={SR_ONLY_STYLE}
          >
            {announceText}
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
    /* role="alert" announces the rate-limit error immediately rather
       than queuing through the polite announcement region above. */
    return (
      <div className={styles.limitCard} role="alert">
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
      track("chat_email_draft_action", { action: "copy", surface: "ask_page" });
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
        <a
          href={mailto}
          onClick={() =>
            track("chat_email_draft_action", {
              action: "open_mail",
              surface: "ask_page",
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

  /* CTA card titles are h3 — semantic level under the page's h1,
     and give SR users a heading-navigable landmark for the call to
     action. */
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
                surface: "ask_page",
              })
            }
            className={styles.ctaPrimary}
          >
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
        <h3 className={styles.ctaTitle}>{c.title}</h3>
        <div className={styles.ctaSub}>{c.sub}</div>
        <div className={styles.ctaButtons}>
          <button
            type="button"
            onClick={() => {
              track("chat_cta_click", {
                cta_type: "book_call",
                topic: cta.topic || "unknown",
                surface: "ask_page",
              });
              if (cta.calendly_url) {
                window.open(cta.calendly_url, "_blank", "noopener");
              }
            }}
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
