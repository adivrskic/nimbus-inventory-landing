"use client";

import styles from "./NumberedList.module.css";

/* ═══════════════════════════════════════════════════════════════════════
   NumberedList — the editorial numbered list.
   ───────────────────────────────────────────────────────────────────────
   Consolidates the two near-identical numbered patterns: the /compare
   "why teams switch" reasons and the /integration features list. Both are
   a 80px + 1fr grid: a gold numeral + gold dash on the left, a title +
   description on the right.

   API:
     items           [{ title, desc }]
     startNum        number   — first index (default 1); rendered "01", "02"…
     divided         boolean  — hairline rule between items + under the last
                                one (the compare-reasons look). Omit for the
                                borderless integration-features look.
     initiallyHidden boolean  — start items at opacity:0 AND stamp
                                `data-list-item` for a host scroll-reveal
                                (host targets [data-list-item]); reduced-motion
                                is handled by the global backstop via the
                                inline opacity the host writes.
     className       string
   ═══════════════════════════════════════════════════════════════════════ */

export default function NumberedList({
  items = [],
  startNum = 1,
  divided = false,
  initiallyHidden = false,
  className = "",
}) {
  if (!items.length) return null;

  return (
    <div
      className={`${styles.list} ${divided ? styles.divided : ""} ${className}`}
    >
      {items.map((item, i) => (
        <div
          key={i}
          data-list-item={initiallyHidden ? "" : undefined}
          className={`${styles.item} ${initiallyHidden ? styles.hidden : ""}`}
        >
          <div className={styles.left}>
            <span className={styles.num}>
              {String(startNum + i).padStart(2, "0")}
            </span>
            <span className={styles.mark} />
          </div>
          <div className={styles.right}>
            <h3 className={styles.title}>{item.title}</h3>
            <p className={styles.desc}>{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
