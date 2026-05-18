// ──────────────────────────────────────────────────────────────────────────
// components/Chat/ChatLauncher.jsx
// ──────────────────────────────────────────────────────────────────────────
// Floating chat launcher pill that sits in the bottom-right corner of every
// marketing page. Renders a small white "Ask Nimbus" pill button; optionally
// shows a teaser "peek" card above it on first visit (per session).
//
// Mounted via ChatProvider in app/layout.js — do NOT import or render this
// directly; let ChatProvider own its lifecycle and the open/close state.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";
import styles from "./ChatLauncher.module.css";

const PEEK_STORAGE_KEY = "nimbus_chat_peek_dismissed";

export default function ChatLauncher({ onOpen, pathname, hidden }) {
  const [showPeek, setShowPeek] = useState(false);

  /* Show the small teaser peek card once per session, after a short
     delay, unless the user has already dismissed or opened the chat. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hidden) return;

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(PEEK_STORAGE_KEY) === "1";
    } catch {
      /* sessionStorage may be unavailable in private mode — silently
         skip the peek rather than crashing the launcher. */
    }
    if (dismissed) return;

    const t = setTimeout(() => setShowPeek(true), 1800);
    return () => clearTimeout(t);
  }, [hidden, pathname]);

  const dismissPeek = (e) => {
    e?.stopPropagation();
    setShowPeek(false);
    try {
      sessionStorage.setItem(PEEK_STORAGE_KEY, "1");
    } catch {
      /* sessionStorage may be unavailable — non-fatal */
    }
  };

  const openAndDismiss = () => {
    dismissPeek();
    onOpen?.();
  };

  /* Drawer is open — ChatProvider passes hidden=true, we render nothing. */
  if (hidden) return null;

  return (
    <div className={styles.root}>
      {showPeek && (
        <div
          className={styles.peek}
          onClick={openAndDismiss}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openAndDismiss();
          }}
        >
          <div className={styles.peekTitle}>Got questions about Nimbus?</div>
          <div className={styles.peekSub}>
            Pricing, comparisons, demos — instant answers from our AI.
          </div>
          <button
            type="button"
            className={styles.peekClose}
            onClick={dismissPeek}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <button
        type="button"
        className={styles.bubble}
        onClick={openAndDismiss}
        aria-label="Open chat with Nimbus"
      >
        <ChatIcon />
        <span>Ask Nimbus</span>
      </button>
    </div>
  );
}

/* ── Icon (matches the ChatDrawer header icon style) ───────────────────── */
function ChatIcon() {
  return (
    <svg
      width="13"
      height="13"
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
