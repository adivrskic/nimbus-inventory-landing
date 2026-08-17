// ──────────────────────────────────────────────────────────────────────────
// app/ask/AskClient.jsx
// ──────────────────────────────────────────────────────────────────────────
// Full-page version of the chat. Same useChatStream hook as the drawer.
// Includes the "New chat" button, inline linkification, and rate-limit
// error state.
//
// Layout (editorial redesign): the page is locked to one viewport. .column
// is position:relative and fills the height; inside it three layers stack:
//   1. .scrollRegion (flex:1) — the only scroller. Holds the intro overlay
//      and, in conversation, the transcript (normal flow, which gives the
//      region its scroll height). scrollRef is on this element.
//   2. .compactHeader — absolute, pinned TOP, conversation-only, rises in.
//   3. .composer — absolute, pinned BOTTOM, ALWAYS visible. A floating
//      translucent bracket bar that never moves between states.
//
// The intro → conversation change is a cross-fade, not a swap: the intro is
// ALWAYS mounted and gets the .introOut class when a message exists, which
// turns it into an absolute overlay that fades up and out while the
// transcript + header rise in. Because the composer is constant, there's no
// jarring jump — the old complaint.
//
// The gradient fade: .scrollConvo carries a mask-image (alpha linear-
// gradient) so transcript text dissolves to zero opacity before it slides
// under the composer (bottom band) or the header (top band). It's an alpha
// mask, not a colored overlay, so it works against the global ocean gradient.
// Because text self-erases under the header, the header needs no solid plate.
//
// Visual vocabulary: the intro's eyebrow + per-letter title + display-font
// subtitle match the Contact / Trust / Calculator heroes. The send button
// uses the shared CornerButton for the corner-bracket hover the rest of the
// site uses for primary actions.
//
// Intro animation: matches the Calculator / Pricing / IndustryPage makeover —
// a reduced-motion guard that jumps the intro to its final visible state,
// then a top-to-bottom cascade (kicker -> per-letter title -> lead ->
// starters) anchored to the END of each previous step (">" with a small
// negative overlap) rather than fixed start times. The letter tween is a
// fromTo so the cascade replays cleanly on reset (intro is no longer
// remounted, so it can't rely on CSS initial state for the replay).
//
// SearchAction support: the WebSite schema declares a SearchAction pointing
// at /ask?q={search_term_string}. When a user submits through Google's
// sitelinks search box they land here with ?q=... — the mount effect reads
// that param and fires the query immediately. Empty/whitespace q is ignored.
//
// Accessibility (Wave 2):
//   - Completed assistant responses are announced via an aria-live polite
//     region. Rate-limit errors use role="alert".
//   - CTA card titles use <h3>.
//   - The intro's h1 is owned by SplitText's legacy mode (sr-only flat text
//     + aria-hidden letters). The intro is aria-hidden once it's the fading
//     overlay so SR users don't hit stale content during a conversation.
//
// Scroll behavior (notes for future maintainers):
//   The page fits one viewport with no body scroll; .scrollRegion scrolls
//   internally. Two guards keep focus from yanking the page:
//     1) window.scrollTo(0, 0) on mount.
//     2) focus({ preventScroll: true }) on every focus() call.
//   The inner .scrollRegion auto-scrolls to bottom on new token / cta
//   updates. The hasScrolledOnceRef gate skips the first run after mount so
//   hydrated transcripts don't yank the user down.
//
// Analytics events fired here:
//   - chat_starter_click       { starter, surface: 'ask_page' }
//   - chat_cta_click           { cta_type, topic, surface: 'ask_page' }
//   - chat_email_draft_action  { action: 'copy' | 'open_mail', surface: 'ask_page' }
// Plus: send() and reset() both get { surface: 'ask_page' }.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/gsap";
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

/* Small helper so we don't repeat the option object at every call site. */
function focusNoScroll(el) {
  el?.focus({ preventScroll: true });
}

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
     A single polite live region that fires when streaming completes for a
     new assistant message. SR users hear each response read once, fully
     formed. Rate-limit errors route through role="alert" on the limit
     card instead. */
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

  /* On mount:
       1. Reset page scroll to 0.
       2. Check for ?q= and, if present, submit it as the first chat message
          (Google sitelinks SearchAction handoff). If no q, focus the input.
       3. Skipped when there are already messages (hydrated transcript) so we
          never re-fire the same query on a refresh.
     focus() uses preventScroll: true so moving focus to the input doesn't
     yank the page. Reading window.location.search directly (not
     useSearchParams) keeps this effect server-render-safe. */
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.scrollTo(0, 0);

    if (messages.length > 0) {
      focusNoScroll(inputRef.current);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim();
    if (q) {
      send(q, { sourceUrl: "/ask", surface: "ask_page" });
      return;
    }

    focusNoScroll(inputRef.current);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  /* Auto-scroll-to-bottom when new content arrives. The hasScrolledOnceRef
     gate skips the first run after mount so a hydrated transcript doesn't
     yank the user down before they've read the page. scrollRef is on the
     outer .scrollRegion — the element with overflow-y: auto. */
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

  /* Intro mount animation — uniform with Calculator / IndustryPage.
     Cadence: kicker -> per-letter title -> lead -> starters, each anchored
     to the END of the previous step. The intro is always mounted now, so
     the letter tween is a fromTo (not .to) to guarantee a clean replay when
     the user resets back to the empty state. */
  useEffect(() => {
    if (messages.length > 0 || !introRef.current) return;

    /* Reduced motion: jump straight to the visible state, skip choreography.
       SplitText keeps the sr-only flat headline either way. */
    if (prefersReducedMotion()) {
      gsap.set(introRef.current.querySelectorAll(`.${styles.heroLetter}`), {
        opacity: 1,
        y: "0%",
        rotateX: 0,
      });
      gsap.set(
        introRef.current.querySelectorAll(
          `.${styles.kicker}, .${styles.lead}, .${styles.starters}`
        ),
        { opacity: 1, y: 0 }
      );
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    /* Kicker */
    tl.fromTo(
      `.${styles.kicker}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45 },
      0
    );

    /* Per-letter title — starts just as the kicker lands. fromTo so a reset
       re-hides the letters before replaying the cascade. */
    const letters = introRef.current.querySelectorAll(`.${styles.heroLetter}`);
    tl.fromTo(
      letters,
      { opacity: 0, y: "100%", rotateX: 35 },
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.75, stagger: 0.025 },
      ">-0.05"
    );

    /* Subtitle — anchored to the END of the title stagger. */
    tl.fromTo(
      `.${styles.lead}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55 },
      ">-0.2"
    );

    /* Starters — follow the subtitle. */
    tl.fromTo(
      `.${styles.starters}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5 },
      ">-0.15"
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
    focusNoScroll(inputRef.current);
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* div, not <main> — layout.js already provides the page's
          single <main id="main-content">. */}
      <div className={styles.main}>
        <div className={styles.column}>
          {/* Compact floating header — conversation only. Rises in over the
              top fade band; no solid plate because the scroll mask erases
              text beneath it. "New chat" lives here now (was an in-scroll
              transcript header before). */}
          {!isEmpty && (
            <div className={styles.compactHeader}>
              <span className={styles.headLabel}>Ask Nautilus</span>
              <span className={styles.headSep}>· conversation</span>
              <button
                type="button"
                onClick={handleReset}
                className={styles.resetBtn}
                disabled={streaming}
              >
                New chat
              </button>
            </div>
          )}

          {/* The only scroller. Intro overlay (always mounted) + transcript
              (conversation only). The mask gradient lives on .scrollConvo. */}
          <div
            ref={scrollRef}
            className={`${styles.scrollRegion} ${
              isEmpty ? styles.scrollIntro : styles.scrollConvo
            }`}
          >
            <header
              ref={introRef}
              className={`${styles.intro} ${isEmpty ? "" : styles.introOut}`}
              aria-hidden={!isEmpty}
            >
              <div className={styles.kicker}>ASK Nautilus</div>
              <h1 className={styles.h1}>
                <SplitText
                  lines={["Instant answers about Nautilus.", "Sources cited."]}
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
                Pricing, features, integrations, comparisons, migration planning
                — anything our docs cover, plus help drafting emails and booking
                time with our team.
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

            {!isEmpty && (
              <div className={styles.transcript}>
                {messages.map((m) => (
                  <AskMessage key={m.id} message={m} streaming={streaming} />
                ))}
                {cta && <AskCTA cta={cta} onDismiss={() => setCta(null)} />}
              </div>
            )}
          </div>

          {/* Floating composer — always visible, never moves. */}
          <div className={styles.composer}>
            <form className={styles.cbar} onSubmit={submit}>
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
          </div>

          {/* Polite live region for streaming-complete announcements. */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={SR_ONLY_STYLE}
          >
            {announceText}
          </div>
        </div>
      </div>
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
    /* role="alert" announces the rate-limit error immediately rather than
       queuing through the polite announcement region above. */
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

  /* CTA card titles are h3 — semantic level under the page's h1, and give SR
     users a heading-navigable landmark for the call to action. */
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
