// ──────────────────────────────────────────────────────────────────────────
// components/Chat/ChatLauncher.jsx
// ──────────────────────────────────────────────────────────────────────────
// Floating chat launcher that sits in the bottom-right corner of every
// marketing page. Renders a shared CornerButton labeled "Ask Nimbus" so it
// matches the rest of the site's CTA vocabulary.
//
// Mounted via ChatProvider in app/layout.js — do NOT import or render this
// directly; let ChatProvider own its lifecycle and the open/close state.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import CornerButton from "@/components/shared/CornerButton";
import styles from "./ChatLauncher.module.css";

export default function ChatLauncher({ onOpen, hidden }) {
  /* Drawer is open — ChatProvider passes hidden=true, we render nothing. */
  if (hidden) return null;

  return (
    <div className={styles.root}>
      <CornerButton
        variant="primary"
        onClick={onOpen}
        ariaLabel="Open chat with Nimbus"
        className={styles.launcher}
      >
        <ChatIcon />
      </CornerButton>
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
