"use client";

import styles from "./CheckList.module.css";

/* ═══════════════════════════════════════════════════════════════════════
   CheckList — the canonical marker list.
   ───────────────────────────────────────────────────────────────────────
   Consolidates the gold-check / dash / square bullet lists that were
   re-implemented per page (compare quick-compare columns, the honest-take
   strengths, the index card key-points, etc.). The supported marker is the
   crisp SVG check — the same tick we're standardizing on site-wide.

   API:
     items           string[]            — one line of text per item
     marker          "check"|"dash"|"square"
                       check  → gold SVG tick (default)
                       dash   → muted "—" (a negative / competitor column)
                       square → small neutral square (e.g. honest-take)
     tone            "strong"|"default"|"muted"  — text color
     size            "sm"|"md"|"lg"      — type scale + row gap. "sm" is the
                       dense mono list (pricing tier features); md/lg are the
                       display-font lists.
     initiallyHidden boolean             — start items at opacity:0 AND stamp
                       `data-list-item` so a host page's scroll-reveal can
                       fade them in (the host targets [data-list-item]); under
                       reduced-motion the host writes an inline opacity that
                       the global backstop forces back to 1. Omit it when a
                       parent element owns the reveal (then items aren't
                       individually hooked).
     className       string

   Display-font list (the common case). The dense mono tier-feature list on
   /pricing is intentionally NOT this component yet — see notes.
   ═══════════════════════════════════════════════════════════════════════ */

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3.5 8.5L6.5 11.5L12.5 5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function Marker({ marker }) {
  if (marker === "dash") {
    return (
      <span className={`${styles.marker} ${styles.dash}`} aria-hidden="true">
        —
      </span>
    );
  }
  if (marker === "square") {
    return (
      <span
        className={`${styles.marker} ${styles.square}`}
        aria-hidden="true"
      />
    );
  }
  return (
    <span className={`${styles.marker} ${styles.check}`} aria-hidden="true">
      <CheckIcon />
    </span>
  );
}

const toneClass = (tone) =>
  tone === "muted"
    ? styles.toneMuted
    : tone === "default"
    ? styles.toneDefault
    : styles.toneStrong;

export default function CheckList({
  items = [],
  marker = "check",
  tone = "strong",
  size = "md",
  initiallyHidden = false,
  className = "",
}) {
  if (!items.length) return null;

  const sizeClass =
    size === "sm" ? styles.sm : size === "lg" ? styles.lg : styles.md;

  return (
    <ul className={`${styles.list} ${sizeClass} ${className}`}>
      {items.map((item, i) => {
        const text = typeof item === "string" ? item : item.text;
        return (
          <li
            key={i}
            data-list-item={initiallyHidden ? "" : undefined}
            className={`${styles.item} ${toneClass(tone)} ${
              initiallyHidden ? styles.hidden : ""
            }`}
          >
            <Marker marker={marker} />
            <span className={styles.text}>{text}</span>
          </li>
        );
      })}
    </ul>
  );
}
