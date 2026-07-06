"use client";

import styles from "./StatGrid.module.css";

/* ═══════════════════════════════════════════════════════════════════════
   StatGrid — the "big number + small label" metrics row.
   ───────────────────────────────────────────────────────────────────────
   Consolidates the near-identical .stats/.stat/.statVal/.statLabel blocks
   on /integration and /industry: a single row of gold numerals separated by
   hairline rules, collapsing to a stacked list on mobile.

   API:
     items           [{ val, label }]
     initiallyHidden boolean  — start each stat at opacity:0 AND stamp
                                `data-stat` so a host scroll-reveal can fade
                                them in (host targets [data-stat]); the global
                                reduced-motion backstop handles the inline
                                opacity the host writes.
     className       string

   The column count is driven off the item count via a --stat-cols custom
   property (NOT an inline grid-template-columns) so the mobile media query
   can still override it to a single column — inline grid-template-columns
   would out-specify the breakpoint and never collapse.
   ═══════════════════════════════════════════════════════════════════════ */

export default function StatGrid({
  items = [],
  initiallyHidden = false,
  className = "",
}) {
  if (!items.length) return null;

  return (
    <div
      className={`${styles.stats} ${className}`}
      style={{ "--stat-cols": items.length }}
    >
      {items.map((s, i) => (
        <div
          key={i}
          data-stat={initiallyHidden ? "" : undefined}
          className={`${styles.stat} ${initiallyHidden ? styles.hidden : ""}`}
        >
          <div className={styles.val}>{s.val}</div>
          <div className={styles.label}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
