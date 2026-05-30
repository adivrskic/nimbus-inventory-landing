"use client";

import styles from "./FeatureMatrix.module.css";

/* ═══════════════════════════════════════════════════════════════════════
   FeatureMatrix — the canonical spec-sheet comparison table.
   ───────────────────────────────────────────────────────────────────────
   Consolidates the compare detail-page matrix (its MatrixCell glyph logic
   folds in here) and is built to also take over the pricing matrix.

   API:
     columns      [{ label, tone }]  — the value columns (the leading
                                        "Feature" column is implicit). tone:
                                          "accent"  gold header + gold check
                                          "default" white header + gold check
                                          "muted"   dim header + green check
     rows         [{ feature, values: [...] }]  — one value per column, in
                  column order. A value may be:
                    true | "yes"   → ✓ supported (color per column tone)
                    "partial"      → ◐ partial (amber)
                    false | "no"   → — not supported (ghost)
                    any other      → rendered as a text label
     featureLabel string            — header for the leading column ("Feature")
     headerRule   "accent"|"neutral"— the header's bottom rule: a gold hairline
                                        (default, for emphasized matrices) or a
                                        neutral one
     initiallyHidden boolean        — start data rows at opacity:0 so a host
                                        page's scroll-reveal can fade them in;
                                        the host targets `[data-matrix-row]`.
     className    string

   Tuned for a leading column + 2 value columns (the site's pattern on both
   /compare and /pricing). The header row is never hidden; only data rows
   carry the reveal hook.
   ═══════════════════════════════════════════════════════════════════════ */

function Mark({ value, markClass }) {
  if (value === true || value === "yes") {
    return (
      <span className={`${styles.mark} ${markClass}`} aria-label="Supported">
        ✓
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span
        className={`${styles.mark} ${styles.markPartial}`}
        aria-label="Partial"
      >
        ◐
      </span>
    );
  }
  if (value === false || value === "no") {
    return (
      <span
        className={`${styles.mark} ${styles.markNo}`}
        aria-label="Not supported"
      >
        —
      </span>
    );
  }
  /* Fallthrough — a plain text label (e.g. "Read-only", "99.9%"). */
  return <span className={styles.markText}>{value}</span>;
}

const headClass = (tone) =>
  tone === "accent"
    ? styles.headAccent
    : tone === "muted"
    ? styles.headMuted
    : styles.headDefault;

/* Supported-mark color: gold for accent/default columns, green for muted. */
const markClass = (tone) =>
  tone === "muted" ? styles.markYes : styles.markAccent;

export default function FeatureMatrix({
  columns = [],
  rows = [],
  featureLabel = "Feature",
  headerRule = "accent",
  initiallyHidden = false,
  className = "",
}) {
  if (!columns.length || !rows.length) return null;

  const cols = columns.map((c) => (typeof c === "string" ? { label: c } : c));

  return (
    <div className={`${styles.matrix} ${className}`}>
      <div
        className={`${styles.head} ${
          headerRule === "neutral" ? styles.headRuleNeutral : ""
        }`}
      >
        <div className={styles.headFeature}>{featureLabel}</div>
        {cols.map((c, i) => (
          <div key={i} className={`${styles.headCol} ${headClass(c.tone)}`}>
            {c.label}
          </div>
        ))}
      </div>

      {rows.map((row, ri) => (
        <div
          key={ri}
          data-matrix-row
          className={`${styles.row} ${initiallyHidden ? styles.hidden : ""}`}
        >
          <div className={styles.feature}>{row.feature}</div>
          {cols.map((c, ci) => (
            <div key={ci} className={styles.col}>
              <Mark value={row.values[ci]} markClass={markClass(c.tone)} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
