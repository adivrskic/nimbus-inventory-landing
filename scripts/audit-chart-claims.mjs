#!/usr/bin/env node
/**
 * Audit every factual claim the "Chart Room" warehouse showcase makes.
 *
 *   node scripts/audit-chart-claims.mjs
 *
 * The showcase prints specific numbers on screen — unit counts, hours to
 * stockout, a pick count, a distance reduction, a scale bar. Those are
 * claims a prospect can check, so they need to be derived from the drawing
 * rather than written by feel. This script re-derives them from the
 * component's own constants (it parses WarehouseShowcase.jsx, so it cannot
 * drift out of sync with what actually renders) and fails if any disagree.
 *
 * It checks five things:
 *   1. Label consistency — printed numbers match the underlying data.
 *   2. Bay roles — no bay is simultaneously e.g. picked and replenished.
 *   3. Physical scale — the scale bar implies real-world racking dimensions.
 *   4. Route claim — the stated reduction matches a measured baseline.
 *   5. Revision arithmetic — no bay count goes negative.
 *
 * Exit code 1 on any failure, so it can gate a build if wanted.
 */

import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COMPONENT = resolve(
  ROOT,
  "components/WarehouseShowcase/WarehouseShowcase.jsx"
);
const SRC = readFileSync(COMPONENT, "utf8");

/* ── Physical reference values ────────────────────────────────────────────
   Ranges are conventional warehouse-design figures, used here only as a
   sanity envelope — the point is to catch a scale that is wrong by
   multiples, not to police centimetres. */
const REAL = {
  bayWidth: [2.4, 4.0], // pallet bay, m
  rackDepth: [1.0, 3.0], // single ≈1.1, double-deep ≈2.4–2.7
  aisleClear: [2.5, 4.5], // reach truck → counterbalance
};
const WALK_MS = 1.2; // picker walking speed, m/s (planning figure)

// ── extract the component's constants ────────────────────────────────────
const block = SRC.slice(
  SRC.indexOf("const U = {"),
  SRC.indexOf("/* ── Small math/drawing helpers")
);
const sandbox = {};
createContext(sandbox);
runInContext(
  block +
    `\n;Object.assign(globalThis,{HULL,RACK_W,RACK_X,BANKS,ZONES,BOT_Y,
      FIX_BAY,FIX_COUNT,FRONTS,ROUTE,PICKS,RESLOTS,COUNT_OVERRIDES,baseCount});`,
  sandbox
);
const {
  HULL, RACK_W, RACK_X, BANKS, ZONES, BOT_Y,
  FIX_BAY, FIX_COUNT, FRONTS, ROUTE, PICKS, RESLOTS,
  COUNT_OVERRIDES, baseCount,
} = sandbox;

// Scale bar, read straight out of the draw call so it can't drift.
const bar = /line\((\d+), 556, (\d+), 556/.exec(SRC);
const barLabel = /text\("(\d+) m"/.exec(SRC);
if (!bar || !barLabel) fail("Could not find the scale bar in the component.");
const M = Number(barLabel[1]) / (Number(bar[2]) - Number(bar[1]));

const key = (c, b, k) => `${c}-${b}-${k}`;
const len = (p) =>
  p.reduce((t, c, i) => (i ? t + Math.hypot(c[0] - p[i - 1][0], c[1] - p[i - 1][1]) : 0), 0);
const within = ([lo, hi], v) => v >= lo && v <= hi;

const pass = [];
const failures = [];
const check = (cond, label, detail) =>
  (cond ? pass : failures).push(detail ? `${label} — ${detail}` : label);

// ── 1. scale ─────────────────────────────────────────────────────────────
const span = (i) => {
  const v = HULL.map((p) => p[i]);
  return Math.max(...v) - Math.min(...v);
};
const bayWidth = ((BANKS[0][1] - BANKS[0][0]) / 3) * M;
const rackDepth = RACK_W * M;
const aisleClear = (RACK_X[1] - RACK_X[0]) * M - rackDepth;

console.log("── Scale");
console.log(`   1 unit = ${M} m   (bar: ${bar[2] - bar[1]} u = ${barLabel[1]} m)`);
console.log(`   building   ${(span(0) * M).toFixed(0)} × ${(span(1) * M).toFixed(0)} m` +
  `  ≈ ${Math.round(span(0) * M * span(1) * M * 10.764).toLocaleString()} sq ft`);
console.log(`   bay width  ${bayWidth.toFixed(2)} m`);
console.log(`   rack depth ${rackDepth.toFixed(2)} m`);
console.log(`   aisle      ${aisleClear.toFixed(2)} m`);

check(within(REAL.bayWidth, bayWidth), "Bay width is realistic", `${bayWidth.toFixed(2)} m`);
check(within(REAL.rackDepth, rackDepth), "Rack depth is realistic", `${rackDepth.toFixed(2)} m`);
check(within(REAL.aisleClear, aisleClear), "Aisle clearance is realistic", `${aisleClear.toFixed(2)} m`);

// ── 2. route claim vs a measured baseline ────────────────────────────────
// Baseline = the textbook "return heuristic": enter each aisle from the
// cross-aisle, walk to the deepest pick, come back out.
const byAisle = new Map();
for (const p of PICKS) {
  const [x, y] = ROUTE[p.i];
  if (!byAisle.has(x)) byAisle.set(x, []);
  byAisle.get(x).push(y);
}
const aisles = [...byAisle.keys()].sort((a, b) => a - b);
const DOCK = ROUTE[0], PACK = ROUTE[ROUTE.length - 1], SPINE = 148;
let base = Math.abs(SPINE - DOCK[0]) + Math.abs(BOT_Y - DOCK[1]);
let x = SPINE;
for (const ax of aisles) {
  base += Math.abs(ax - x) + 2 * Math.abs(BOT_Y - Math.min(...byAisle.get(ax)));
  x = ax;
}
base += Math.abs(PACK[0] - x) + Math.abs(PACK[1] - BOT_Y);

const shown = len(ROUTE);
const reductionPct = (1 - shown / base) * 100;

console.log("\n── Course");
console.log(`   plotted    ${shown.toFixed(0)} u = ${(shown * M).toFixed(0)} m`);
console.log(`   baseline   ${base.toFixed(0)} u = ${(base * M).toFixed(0)} m  (return heuristic)`);
console.log(`   reduction  ${reductionPct.toFixed(1)}%  ` +
  `→ ${(((base - shown) * M) / WALK_MS / 60).toFixed(1)} min/wave at ${WALK_MS} m/s`);

const claimedPct = /· (\d+)% SHORTER/.exec(SRC);
check(!!claimedPct, "Course stamp states a reduction percentage");
if (claimedPct) {
  const c = Number(claimedPct[1]);
  check(Math.abs(c - reductionPct) <= 3, `Stamp's "${c}% SHORTER" matches the measured ${reductionPct.toFixed(1)}%`);
}
const dist = /(\d+) metres instead of (\d+)/.exec(SRC);
check(!!dist, "Course caption states both distances");
if (dist) {
  check(Math.abs(Number(dist[1]) - shown * M) <= 3, `Caption's ${dist[1]} m matches the plotted ${(shown * M).toFixed(0)} m`);
  check(Math.abs(Number(dist[2]) - base * M) <= 3, `Caption's ${dist[2]} m matches the baseline ${(base * M).toFixed(0)} m`);
}

// ── 3. label consistency ─────────────────────────────────────────────────
console.log("\n── Labels");
check(SRC.includes(`ZONE ${ZONES[FIX_BAY.col]} · BAY ${FIX_BAY.bay + 1}`),
  `FIX label matches geometry (ZONE ${ZONES[FIX_BAY.col]} · BAY ${FIX_BAY.bay + 1})`);
check(COUNT_OVERRIDES[key(FIX_BAY.col, FIX_BAY.bank, FIX_BAY.bay)] === FIX_COUNT,
  `FIX bay prints the ${FIX_COUNT} units its label quotes`);
check(SRC.includes(`${FRONTS.length} DEPLETION FRONTS`), `Front stamp count matches data (${FRONTS.length})`);
check(SRC.includes(`${FRONTS.length} LINES`), `Draft-PO line count matches front count (${FRONTS.length})`);
check(SRC.includes(`${PICKS.length} WPT`), `Waypoint stamp matches pick count (${PICKS.length})`);

const horizon = /NEXT (\d+) H/.exec(SRC);
for (const f of FRONTS) {
  const m = /SKU (\d+) · (\d+) LEFT · T-(\d+)H/.exec(f.label);
  check(!!m, `Front label parses: ${f.label}`);
  if (!m) continue;
  check(Number(m[2]) === f.count, `SKU ${m[1]} label count (${m[2]}) matches data (${f.count})`);
  if (horizon)
    check(Number(m[3]) <= Number(horizon[1]),
      `SKU ${m[1]} T-${m[3]}H is inside the stated ${horizon[1]}h horizon`);
  const perDay = (f.count / Number(m[3])) * 24;
  console.log(`   SKU ${m[1]}: ${f.count} left, T-${m[3]}h → ${perDay.toFixed(1)}/day, ` +
    `restock +${f.restock} = ${(f.restock / perDay).toFixed(1)} days cover`);
}

// ── 4. bay roles ─────────────────────────────────────────────────────────
const pickKeys = new Set(PICKS.map((p) => key(p.col, p.bank, p.bay)));
const frontKeys = new Set(FRONTS.map((f) => key(f.col, f.bank, f.bay)));
const fromKeys = new Set(RESLOTS.map((r) => key(r.from.col, r.from.bank, r.from.bay)));
const toKeys = new Set(RESLOTS.map((r) => key(r.to.col, r.to.bank, r.to.bay)));
const overlaps = (a, b) => [...a].some((k) => b.has(k));
const fixKey = key(FIX_BAY.col, FIX_BAY.bank, FIX_BAY.bay);

console.log("\n── Bay roles");
check(!pickKeys.has(fixKey), "The queried bay isn't also picked");
check(!frontKeys.has(fixKey), "The queried bay isn't also a depletion front");
check(!overlaps(frontKeys, pickKeys), "No bay is both a depletion front and a pick");
check(!overlaps(fromKeys, pickKeys), "No reslot origin is also picked");
check(!overlaps(toKeys, pickKeys), "No reslot destination is also picked");
check(!overlaps(fromKeys, frontKeys), "No reslot origin is also a front");

// ── 5. revision arithmetic ───────────────────────────────────────────────
console.log("\n── Revision");
let negative = 0;
for (const p of PICKS) {
  const k = key(p.col, p.bank, p.bay);
  const before = COUNT_OVERRIDES[k] ?? baseCount(p.col, p.bank, p.bay);
  if (before - p.take < 0) negative++;
}
check(negative === 0, "No bay count goes negative when picks are decremented");
console.log(`   ${PICKS.reduce((s, p) => s + p.take, 0)} units across ${PICKS.length} lines`);
check(SRC.includes("two bays reslotted") === (RESLOTS.length === 2),
  `Reslot copy matches data (${RESLOTS.length})`);

// ── report ───────────────────────────────────────────────────────────────
console.log(`\n${pass.length} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(
    "\nThe showcase prints these numbers to prospects. Fix the data or the copy —\n" +
      "don't adjust this audit to agree with a wrong figure."
  );
  process.exit(1);
}
console.log("All Chart Room claims are derived from the drawing and internally consistent.");

function fail(msg) {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(1);
}
