// ──────────────────────────────────────────────────────────────────────────
// lib/roi.js
// ──────────────────────────────────────────────────────────────────────────
// The ROI model behind /calculator, shared with /api/estimate so an emailed
// estimate is computed by exactly the code that drew it on the page — and
// from the four inputs alone, never from numbers the browser sends.
//
// Every constant below is an ASSUMPTION, not a measured Nautilus result;
// the calculator page lists them under "The assumptions." Change one here
// and update that list too.
// ──────────────────────────────────────────────────────────────────────────

export const RANGES = {
  size: { min: 1000, max: 500000, default: 35000 },
  pickers: { min: 1, max: 250, default: 20 },
  accuracy: { min: 70, max: 99, default: 92 },
  wage: { min: 12, max: 60, default: 22 },
};

/* Server-side input sanitizer: coerce, round, and clamp into the range. */
export const clampInput = (value, { min, max }) =>
  Math.max(min, Math.min(max, Math.round(Number(value) || 0)));

export function calculate({ size, pickers, accuracy, wage }) {
  /* Picking time saved — assume 600hrs/yr of pick activity per picker,
     optimized routes cut that by 20%. */
  const pickingSavings = pickers * 600 * 0.2 * wage;

  /* Error reduction — at lower accuracy, more errors. Each error costs
     ~6% of order value. Assume ~2 orders/sqft/year at ~$180 avg. */
  const errorRate = (100 - accuracy) / 100;
  const annualOrders = size * 2;
  const errorSavings = annualOrders * 180 * 0.06 * (errorRate * 0.7);

  /* Shrinkage / inventory accuracy — baseline ~$1.50/sqft/year,
     Nautilus cuts 60%. */
  const shrinkageSavings = size * 1.5 * 0.6;

  /* Cycle counting — saves ~40hrs/yr per picker through continuous
     counting. */
  const cycleCountSavings = pickers * 40 * wage;

  const total =
    pickingSavings + errorSavings + shrinkageSavings + cycleCountSavings;

  /* "Current loss" framing — assume some inefficiency persists, so the
     current annual cost is ~1.4x what Nautilus recovers. Used in the
     headline "you're losing" line. */
  const currentLoss = total * 1.4;

  return {
    pickingSavings,
    errorSavings,
    shrinkageSavings,
    cycleCountSavings,
    total,
    currentLoss,
  };
}
