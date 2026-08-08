"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./WarehouseShowcase.module.css";
import { useAnimationPaused } from "@/lib/AnimationContext";

/* ═══════════════════════════════════════════════════════════════════════
   WarehouseShowcase — "THE CHART ROOM"

   Your warehouse as a nautical chart that annotates itself (2D canvas,
   pure vector ink), across five scroll beats:

     01 PLOT      the chart draws itself — hull, racks, bay counts
     02 FIX       a spoken query resolves to a bay: a guide path runs
                  the aisles to it, the bay lights, a fix mark inks
     03 FRONTS    three LOW bays (their printed counts are low from the
                  start) get depletion isobars — PO drafted
     04 COURSE    twelve picks, one serpentine course through the
                  aisles; traversed waypoint by waypoint
     05 REVISION  overnight the chart re-issues: picked bays' counts
                  tick DOWN, the PO lands and the three front bays
                  replenish, two reslot moves re-route stock

   PHYSICAL RULES (this is a floor plan, not abstract art):
   - Every path — fix guide, course, reslot — is Manhattan-routed
     through aisles, the mid cross-aisle, and the perimeter corridors.
     Nothing ever draws through a rack.
   - Quantities are consistent: bay counts print inside their bays at
     PLOT; the FIX label quotes the bay's actual count; FRONT bays are
     visibly low before the front inks over them; REVISION decrements
     exactly the picked bays and replenishes exactly the front bays.

   Chart ink accumulates at 28% across beats; transient construction
   notes (queries, stamps, labels) erase when the next beat starts.
   rAF parks off-screen; paused/reduced-motion freezes ambient time
   while scroll scrubbing still redraws. No three.js in this chunk.

   The stage background is constant chart navy for the whole ride and
   fades to page black only over the final stretch, handing off into
   the (black) section below.
   ═══════════════════════════════════════════════════════════════════════ */

const BEATS = [
  {
    key: "plot",
    num: "01",
    label: "PLOT",
    title: "Your floor, charted.",
    desc: "The plotter lays down every wall, rack, and live count.",
  },
  {
    key: "fix",
    num: "02",
    label: "FIX",
    title: "“Where's the spare blade for 4471?”",
    desc: "Spoken aloud on the floor. A position fix in four tenths of a second.",
  },
  {
    key: "fronts",
    num: "03",
    label: "FRONTS",
    title: "Three stockouts, sighted 48 hours out.",
    desc: "Depletion fronts inked over the low bays — purchase orders already drafted.",
  },
  {
    key: "course",
    num: "04",
    label: "COURSE",
    title: "Twelve picks. One plotted course.",
    /* 201 m and 286 m are measured off this drawing, not invented: the
       plotted serpentine is 2,678 chart units and the textbook "return
       heuristic" baseline for the same twelve picks (enter each aisle from
       the cross-aisle, walk to the deepest pick, come back out) is 3,816 —
       a 29.8% reduction at 7.5 cm/unit. The old copy claimed "fourteen
       minutes handed back per wave", which would have meant a 54% cut on
       an ~12-minute wave: more than double the site's own published
       "20% shorter routes", and impossible on a floor this size. */
    desc: "Aisle by aisle, shortest safe water — 201 metres instead of 286.",
  },
  {
    key: "revision",
    num: "05",
    label: "REVISION",
    title: "The chart corrects itself overnight.",
    desc: "Picks decremented, the PO received, two bays reslotted — a new edition, self-issued.",
  },
];

const NB = BEATS.length;

/* ── Chart geometry — designed in a fixed 1000×620 unit space ───────── */

const U = { w: 1000, h: 620 };

/* Warehouse hull: closed polyline, clockwise from top-left, with two
   dock notches (receiving berths) cut into the west wall. */
const HULL = [
  [96, 78],
  [912, 78],
  [912, 532],
  [96, 532],
  [96, 372],
  [70, 372],
  [70, 316],
  [96, 316],
  [96, 224],
  [70, 224],
  [70, 168],
  [96, 168],
  [96, 78],
];

/* Rack banks: 8 columns × 2 banks, 3 bays per bank. Aisles run the
   full height between columns; the mid gap (y 258–316) is the
   cross-aisle; corridors ring the perimeter inside the hull. */
const RACK_W = 34;
const RACK_X = [200, 280, 360, 440, 520, 600, 680, 760];
const BANKS = [
  [128, 258],
  [316, 470],
];
const ZONES = ["A", "B", "C", "D", "E", "F", "G", "H"];
const TOP_Y = 106; // top corridor centerline
const BOT_Y = 500; // bottom corridor centerline
const GAP_Y = 287; // mid cross-aisle centerline

function bayRect(col, bank, bay) {
  const [y0, y1] = BANKS[bank];
  const h = (y1 - y0) / 3;
  return { x: RACK_X[col], y: y0 + bay * h, w: RACK_W, h };
}
function bayCenter(col, bank, bay) {
  const r = bayRect(col, bank, bay);
  return [r.x + r.w / 2, r.y + r.h / 2];
}
const bayKey = (c, b, k) => `${c}-${b}-${k}`;

/* FIX beat — the queried SKU's bay (zone F, upper bank, middle bay),
   reached from the aisle on its west face. Its count is 17 — the fix
   label quotes it. */
const FIX_BAY = { col: 5, bank: 0, bay: 1 };
const FIX_AISLE_X = 577;
const FIX_COUNT = 17;
/* Guide path dock → bay, corridors and aisles only. */
const GUIDE = [
  [96, 196],
  [148, 196],
  [148, TOP_Y],
  [FIX_AISLE_X, TOP_Y],
  [FIX_AISLE_X, bayCenter(5, 0, 1)[1]],
];

/* FRONTS beat — three bays whose printed counts are LOW from the
   start (9 / 6 / 11); the isobars ink over these exact bays, and the
   REVISION beat replenishes them when the drafted PO lands. */
const FRONTS = [
  { col: 1, bank: 0, bay: 1, count: 9, restock: 48, label: "SKU 2210 · 9 LEFT · T-41H" },
  { col: 4, bank: 1, bay: 1, count: 6, restock: 44, label: "SKU 0087 · 6 LEFT · T-38H" },
  { col: 6, bank: 1, bay: 0, count: 11, restock: 41, label: "SKU 5512 · 11 LEFT · T-46H" },
];

/* COURSE beat — a serpentine through aisles 1/3/5/7: down the left
   corridor, up aisle 1, across the top, down aisle 3, up aisle 5,
   down aisle 7, out to pack-out bottom-right. Pick points sit ON the
   route at the center-y of the bay they serve.
   Verified shortest: every aisle has picks in both halves, so each
   needs a full traversal (4×394) + three 160-unit crossovers; this
   parity (up-first from the dock) totals 2678 units vs 2762 for the
   down-first serpentine — no legal Manhattan route beats it. */
const ROUTE = [
  [96, 196],
  [148, 196],
  [148, BOT_Y],
  [257, BOT_Y],
  [257, 393],
  [257, 237],
  [257, 150],
  [257, TOP_Y],
  [417, TOP_Y],
  [417, 193],
  [417, 342],
  [417, 444],
  [417, BOT_Y],
  [577, BOT_Y],
  [577, 444],
  [577, 342],
  [577, 150],
  [577, TOP_Y],
  [737, TOP_Y],
  [737, 150],
  [737, 237],
  [737, 393],
  [737, BOT_Y],
  [846, BOT_Y],
  [846, 452],
];
/* Which ROUTE indices are picks, and which bay each one serves.
   REVISION decrements exactly these bays. */
const PICKS = [
  { i: 4, col: 1, bank: 1, bay: 1, take: 2 },
  { i: 5, col: 0, bank: 0, bay: 2, take: 1 },
  { i: 6, col: 1, bank: 0, bay: 0, take: 3 },
  { i: 9, col: 3, bank: 0, bay: 1, take: 2 },
  { i: 10, col: 2, bank: 1, bay: 0, take: 1 },
  { i: 11, col: 3, bank: 1, bay: 2, take: 4 },
  { i: 14, col: 4, bank: 1, bay: 2, take: 2 },
  { i: 15, col: 5, bank: 1, bay: 0, take: 1 },
  { i: 16, col: 4, bank: 0, bay: 0, take: 3 },
  { i: 19, col: 7, bank: 0, bay: 0, take: 2 },
  { i: 20, col: 6, bank: 0, bay: 2, take: 1 },
  { i: 21, col: 7, bank: 1, bay: 1, take: 2 },
];

/* REVISION beat — two reslot moves, Manhattan-routed (aisle → top
   corridor / cross-aisle → aisle). Origin bay is erase-hatched, the
   destination bay outlined gold. */
const RESLOTS = [
  {
    from: { col: 2, bank: 0, bay: 0 },
    to: { col: 6, bank: 0, bay: 0 },
    label: "RESLOT → G-1",
    labelAt: [657, TOP_Y - 12],
    path: [
      [360, 150],
      [337, 150],
      [337, TOP_Y],
      [657, TOP_Y],
      [657, 150],
      [680, 150],
    ],
  },
  {
    from: { col: 5, bank: 0, bay: 2 },
    to: { col: 2, bank: 1, bay: 2 },
    label: "RESLOT → C-6",
    labelAt: [457, GAP_Y - 12],
    /* Exits the bay's WEST face (aisle x577) — 494 units vs 574 via the
       east aisle; the destination is west, so never route east first. */
    path: [
      [600, 236],
      [577, 236],
      [577, GAP_Y],
      [337, GAP_Y],
      [337, 444],
      [360, 444],
    ],
  },
];

/* Bay counts: deterministic base values with explicit overrides so
   every number the story quotes is the number printed on the chart. */
const COUNT_OVERRIDES = { [bayKey(5, 0, 1)]: FIX_COUNT };
for (const f of FRONTS) COUNT_OVERRIDES[bayKey(f.col, f.bank, f.bay)] = f.count;
const baseCount = (c, b, k) =>
  COUNT_OVERRIDES[bayKey(c, b, k)] ?? ((c * 29 + b * 17 + k * 41) % 83) + 9;
/* Which bays print a count: alternate bays for legibility, plus every
   bay the story touches (fix / fronts / picks / reslots). */
const LABELED = new Set();
for (let c = 0; c < 8; c++)
  for (let b = 0; b < 2; b++)
    for (let k = 0; k < 3; k++) if ((c + b + k) % 2 === 0) LABELED.add(bayKey(c, b, k));
LABELED.add(bayKey(5, 0, 1));
for (const f of FRONTS) LABELED.add(bayKey(f.col, f.bank, f.bay));
for (const p of PICKS) LABELED.add(bayKey(p.col, p.bank, p.bay));
for (const r of RESLOTS) {
  LABELED.add(bayKey(r.from.col, r.from.bank, r.from.bay));
  LABELED.add(bayKey(r.to.col, r.to.bank, r.to.bay));
}
const PICK_BY_BAY = new Map(PICKS.map((p) => [bayKey(p.col, p.bank, p.bay), p]));
const FRONT_BY_BAY = new Map(FRONTS.map((f) => [bayKey(f.col, f.bank, f.bay), f]));

/* ── Small math/drawing helpers ─────────────────────────────────────── */

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (v) => v * v * (3 - 2 * v);
const win = (t, a, b) => ease(clamp01((t - a) / (b - a)));

function polyLengths(pts) {
  const lens = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(total);
  }
  return { lens, total };
}
const HULL_LEN = polyLengths(HULL);
const ROUTE_LEN = polyLengths(ROUTE);
const GUIDE_LEN = polyLengths(GUIDE);

function pointAt(pts, { lens, total }, f) {
  const d = f * total;
  for (let i = 1; i < pts.length; i++) {
    if (lens[i] >= d) {
      const seg = lens[i] - lens[i - 1] || 1;
      const k = (d - lens[i - 1]) / seg;
      return [
        pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k,
        pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k,
      ];
    }
  }
  return pts[pts.length - 1];
}

/* Ground color: constant chart navy (#051221 — the same deep-ocean
   family as the AI section) for the whole ride, with ONE fade at the
   very end down to page black (#000, Integrations' --dark background)
   so the chart hands off into the section below it. No entry fade —
   the chart opens on its own paper color. */
const NAVY = [5, 18, 33];
const groundColor = (p) => {
  const k = ease(clamp01((1 - p) / 0.1));
  return `rgb(${Math.round(NAVY[0] * k)}, ${Math.round(NAVY[1] * k)}, ${Math.round(NAVY[2] * k)})`;
};

export default function WarehouseShowcase({ onDemo }) {
  const sectionRef = useRef(null);
  const spaceRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const revRef = useRef(null);
  const { paused } = useAnimationPaused();
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const visibleRef = useRef(false);
  const resumeRef = useRef(null);

  const jumpTo = useCallback((i) => {
    const space = spaceRef.current;
    if (!space) return;
    const top = space.getBoundingClientRect().top + window.scrollY;
    const range = space.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + ((i + 0.05) / NB) * range,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) resumeRef.current?.();
      },
      { rootMargin: "160px 0px" }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const space = spaceRef.current;
    if (!canvas || !space) return;
    const ctx = canvas.getContext("2d");

    const rootStyle = getComputedStyle(document.body);
    const MONO = rootStyle.getPropertyValue("--mono").trim() || "monospace";

    const INK = (a) => `rgba(214, 228, 240, ${a})`;
    const GOLD = (a) => `rgba(212, 168, 83, ${a})`;
    const RED = (a) => `rgba(201, 107, 94, ${a})`;

    let dpr = 1;
    let sc = 1;
    let ox = 0;
    let oy = 0;
    const X = (x) => ox + x * sc;
    const Y = (y) => oy + y * sc;

    const resize = () => {
      const stage = canvas.parentElement;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      /* Fit the chart into the stage's top ~78% — the bottom band is
         reserved for the DOM caption so ink and type never collide. */
      const fit = Math.min((w * dpr) / U.w, (h * dpr * 0.78) / U.h) * 0.94;
      sc = fit;
      ox = (w * dpr - U.w * sc) / 2;
      oy = (h * dpr * 0.8 - U.h * sc) / 2;
    };
    resize();
    window.addEventListener("resize", resize);

    const px = (n) => n * dpr;
    const font = (size) => `${px(size)}px ${MONO}`;

    /* ── primitives (chart units via X()/Y()) ── */

    const tracePoly = (pts, meta, f, width, stroke, dash) => {
      if (f <= 0) return;
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = px(width);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      if (dash) ctx.setLineDash(dash.map(px));
      ctx.beginPath();
      const target = f * meta.total;
      ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
      for (let i = 1; i < pts.length; i++) {
        if (meta.lens[i] <= target) {
          ctx.lineTo(X(pts[i][0]), Y(pts[i][1]));
        } else {
          const [ex, ey] = pointAt(pts, meta, f);
          ctx.lineTo(X(ex), Y(ey));
          break;
        }
      }
      ctx.stroke();
      ctx.restore();
    };

    const rect = (x, y, w, h, f, width, stroke, fill) => {
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(X(x), Y(y), w * sc, h * sc);
      }
      if (stroke) {
        const pts = [
          [x, y],
          [x + w, y],
          [x + w, y + h],
          [x, y + h],
          [x, y],
        ];
        tracePoly(pts, polyLengths(pts), f, width, stroke);
      }
    };

    const circle = (x, y, r, stroke, width, fill) => {
      ctx.beginPath();
      ctx.arc(X(x), Y(y), r * sc, 0, Math.PI * 2);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = px(width || 1);
        ctx.stroke();
      }
    };

    const line = (x1, y1, x2, y2, stroke, width, dash) => {
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = px(width);
      if (dash) ctx.setLineDash(dash.map(px));
      ctx.beginPath();
      ctx.moveTo(X(x1), Y(y1));
      ctx.lineTo(X(x2), Y(y2));
      ctx.stroke();
      ctx.restore();
    };

    const text = (str, x, y, size, fillStyle, align = "left", ls = 0) => {
      ctx.save();
      ctx.font = font(size);
      ctx.fillStyle = fillStyle;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      if (ls) ctx.letterSpacing = `${px(ls)}px`;
      ctx.fillText(str, X(x), Y(y));
      ctx.restore();
    };

    const typed = (str, f, x, y, size, fillStyle, align = "left") => {
      const n = Math.round(str.length * clamp01(f));
      const s = str.slice(0, n) + (f < 1 && n < str.length ? "▏" : "");
      text(s, x, y, size, fillStyle, align, 0.6);
    };

    const hatch = (x, y, w, h, f, stroke, gap = 7) => {
      if (f <= 0) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(X(x), Y(y), w * sc * clamp01(f), h * sc);
      ctx.clip();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = px(0.75);
      ctx.beginPath();
      for (let gx = x - h; gx < x + w; gx += gap) {
        ctx.moveTo(X(gx), Y(y + h));
        ctx.lineTo(X(gx + h), Y(y));
      }
      ctx.stroke();
      ctx.restore();
    };

    const stamp = (str, x, y, f, color, align = "left") => {
      if (f <= 0) return;
      ctx.save();
      ctx.globalAlpha *= Math.min(1, f * 2);
      ctx.font = font(10.5);
      const wpx = ctx.measureText(str).width + px(18);
      const hpx = px(24);
      let bx = X(x);
      if (align === "right") bx -= wpx;
      if (align === "center") bx -= wpx / 2;
      const by = Y(y) - hpx / 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = px(1);
      ctx.strokeRect(bx, by, wpx, hpx);
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = `${px(1.2)}px`;
      ctx.fillText(str, bx + px(9), by + hpx / 2 + px(0.5));
      ctx.restore();
    };

    /* Wobbly closed isobar ring (deterministic wobble by seed). */
    const isobar = (cx, cy, r, seed, f, stroke, width) => {
      if (f <= 0) return;
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = px(width);
      ctx.beginPath();
      const steps = 46;
      const endA = Math.PI * 2 * clamp01(f);
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * endA;
        const wob =
          1 +
          0.09 * Math.sin(a * 3 + seed * 7.3) +
          0.05 * Math.sin(a * 5 + seed * 3.1);
        const xx = cx + Math.cos(a) * r * wob;
        const yy = cy + Math.sin(a) * r * wob * 0.82;
        if (i === 0) ctx.moveTo(X(xx), Y(yy));
        else ctx.lineTo(X(xx), Y(yy));
      }
      ctx.stroke();
      ctx.restore();
    };

    /* Arrowhead at the end of a polyline. */
    const arrowhead = (pts, color) => {
      const [ax, ay] = pts[pts.length - 1];
      const [bx2, by2] = pts[pts.length - 2];
      const ang = Math.atan2(ay - by2, ax - bx2);
      ctx.strokeStyle = color;
      ctx.lineWidth = px(1.2);
      ctx.beginPath();
      ctx.moveTo(X(ax), Y(ay));
      ctx.lineTo(X(ax - Math.cos(ang - 0.45) * 9), Y(ay - Math.sin(ang - 0.45) * 9));
      ctx.moveTo(X(ax), Y(ay));
      ctx.lineTo(X(ax - Math.cos(ang + 0.45) * 9), Y(ay - Math.sin(ang + 0.45) * 9));
      ctx.stroke();
    };

    /* ── static furniture ── */

    const drawFrame = (a) => {
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = INK(0.35);
      ctx.lineWidth = px(1);
      ctx.strokeRect(X(30), Y(22), 940 * sc, 576 * sc);
      ctx.strokeStyle = INK(0.14);
      ctx.strokeRect(X(38), Y(30), 924 * sc, 560 * sc);
      ctx.strokeStyle = INK(0.3);
      ctx.beginPath();
      for (let gx = 60; gx < 970; gx += 25) {
        const tall = gx % 100 === 60 ? 6 : 3;
        ctx.moveTo(X(gx), Y(22));
        ctx.lineTo(X(gx), Y(22 + tall));
        ctx.moveTo(X(gx), Y(598));
        ctx.lineTo(X(gx), Y(598 - tall));
      }
      for (let gy = 50; gy < 590; gy += 25) {
        const tall = gy % 100 === 50 ? 6 : 3;
        ctx.moveTo(X(30), Y(gy));
        ctx.lineTo(X(30 + tall), Y(gy));
        ctx.moveTo(X(970), Y(gy));
        ctx.lineTo(X(970 - tall), Y(gy));
      }
      ctx.stroke();
      ctx.restore();
    };

    const drawGraticule = (a) => {
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = INK(0.06);
      ctx.lineWidth = px(0.75);
      ctx.beginPath();
      for (let gx = 130; gx < 970; gx += 100) {
        ctx.moveTo(X(gx), Y(30));
        ctx.lineTo(X(gx), Y(590));
      }
      for (let gy = 120; gy < 590; gy += 100) {
        ctx.moveTo(X(38), Y(gy));
        ctx.lineTo(X(962), Y(gy));
      }
      ctx.stroke();
      ctx.restore();
    };

    const drawCompass = (a, time) => {
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      const cx = 862;
      const cy = 148;
      circle(cx, cy, 30, INK(0.4), 1);
      circle(cx, cy, 24, INK(0.16), 0.75);
      const wob = pausedRef.current ? 0 : Math.sin(time * 0.4) * 0.04;
      const ang = -0.32 + wob;
      ctx.strokeStyle = GOLD(0.85);
      ctx.lineWidth = px(1.2);
      ctx.beginPath();
      ctx.moveTo(X(cx - Math.cos(ang) * 20), Y(cy + Math.sin(ang) * 20));
      ctx.lineTo(X(cx + Math.cos(ang) * 20), Y(cy - Math.sin(ang) * 20));
      ctx.stroke();
      circle(cx, cy, 2.2, null, 0, GOLD(0.9));
      text("N", cx, cy - 40, 10, INK(0.5), "center");
      ctx.restore();
    };

    /* Scale bar lives OUTSIDE the hull (between hull and frame) so the
       bottom corridor stays clear for the course.

       SCALE IS LOAD-BEARING — don't retune it casually. 160 units = 12 m,
       i.e. 1 unit = 7.5 cm, which is what makes the racking physically
       honest:
         bay width   43.3 u = 3.25 m  (real pallet bay 2.7–3.6 m)
         rack depth  34   u = 2.55 m  (double-deep rack ≈ 2.4–2.7 m)
         aisle clear 46   u = 3.45 m  (reach/counterbalance 2.7–4.3 m)
         building   842×454 u = 63×34 m ≈ 23,200 sq ft
       It previously read 40 m, which made every bay 10.8 m wide and every
       aisle 11.5 m — a warehouse no forklift has ever seen. The COURSE
       distance claim is derived from this scale too (see BEATS). */
    const drawScaleBar = (a) => {
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      line(620, 556, 780, 556, INK(0.45), 1);
      for (let i = 0; i <= 4; i++)
        line(620 + i * 40, 552, 620 + i * 40, 560, INK(0.45), 1);
      text("0", 620, 572, 8.5, INK(0.35), "center");
      text("12 m", 780, 572, 8.5, INK(0.35), "center");
      ctx.restore();
    };

    const drawHull = (f) => {
      tracePoly(HULL, HULL_LEN, f, 1.6, INK(0.75));
      if (f > 0 && f < 1) {
        const [hx, hy] = pointAt(HULL, HULL_LEN, f);
        circle(hx, hy, 3, null, 0, GOLD(0.9)); // the plotter pen
      }
      if (f >= 0.999) {
        text("RECEIVING 01", 60, 152, 8.5, INK(0.4), "left");
        text("RECEIVING 02", 60, 300, 8.5, INK(0.4), "left");
        text("PACK-OUT", 846, 478, 8.5, INK(0.4), "center");
      }
    };

    const drawRacks = (t, revT) => {
      RACK_X.forEach((rx, i) => {
        BANKS.forEach(([y0, y1], b) => {
          const idx = i * 2 + b;
          const f = win(t, 0.04 * idx, 0.04 * idx + 0.3);
          if (f <= 0) return;
          rect(rx, y0, RACK_W, y1 - y0, f, 1, INK(0.55));
          hatch(rx, y0, RACK_W, y1 - y0, win(f, 0.5, 1), INK(0.09));
          /* Bay separators — each rack column is 3 bays per bank. */
          if (f >= 1) {
            const h = (y1 - y0) / 3;
            line(rx, y0 + h, rx + RACK_W, y0 + h, INK(0.28), 0.75);
            line(rx, y0 + 2 * h, rx + RACK_W, y0 + 2 * h, INK(0.28), 0.75);
          }
        });
        if (t > 0.85) text(ZONES[i], rx + RACK_W / 2, 118, 9.5, INK(0.5), "center");
      });
      /* REVISION: erase-hatch the reslot origin bays. */
      if (revT > 0) {
        RESLOTS.forEach((r, i) => {
          const br = bayRect(r.from.col, r.from.bank, r.from.bay);
          const f = win(revT, 0.1 + i * 0.15, 0.45 + i * 0.15);
          hatch(br.x, br.y, br.w, br.h, f, RED(0.4), 5);
        });
      }
    };

    /* Bay counts — printed INSIDE their bays. REVISION rolls exactly
       the picked bays down by their pick qty and the front bays up by
       their restock qty (the PO landing). */
    const drawCounts = (t, revT) => {
      let li = 0;
      for (let c = 0; c < 8; c++)
        for (let b = 0; b < 2; b++)
          for (let k = 0; k < 3; k++) {
            const key = bayKey(c, b, k);
            if (!LABELED.has(key)) continue;
            li++;
            const f = win(t, 0.5 + (li % 11) * 0.04, 0.68 + (li % 11) * 0.04);
            if (f <= 0) continue;
            let v = baseCount(c, b, k);
            let col = INK(0.4 * f);
            if (revT > 0) {
              const roll = win(revT, 0.3, 0.7);
              const pick = PICK_BY_BAY.get(key);
              const front = FRONT_BY_BAY.get(key);
              if (pick && roll > 0.5) {
                v = v - pick.take;
                col = roll < 0.9 ? GOLD(0.75) : INK(0.42);
              } else if (front && roll > 0.5) {
                v = v + front.restock;
                col = roll < 0.95 ? GOLD(0.9) : INK(0.45);
              }
            }
            const [cx, cy] = bayCenter(c, b, k);
            text(String(v), cx, cy, 8, col, "center");
          }
    };

    /* ── beat layers ── */

    const drawFix = (t, a, sa, time) => {
      if (t <= 0 || (a <= 0 && sa <= 0)) return;
      ctx.save();

      const [bx, by] = bayCenter(FIX_BAY.col, FIX_BAY.bank, FIX_BAY.bay);
      const br = bayRect(FIX_BAY.col, FIX_BAY.bank, FIX_BAY.bay);
      const mx = FIX_AISLE_X; // fix marker sits in the aisle, west face

      /* Transient: query + guide path + answer label + stamp. */
      ctx.globalAlpha = sa;
      if (sa > 0) {
        typed(
          "Q: “WHERE'S THE SPARE BLADE FOR UNIT 4471?”",
          win(t, 0, 0.22),
          500,
          56,
          11,
          INK(0.75),
          "center"
        );
        /* Guide path: dock → corridors → aisle → bay. Aisles only. */
        tracePoly(GUIDE, GUIDE_LEN, win(t, 0.2, 0.5), 1, INK(0.4), [6, 4]);
        const lf = win(t, 0.62, 0.85);
        if (lf > 0) {
          typed(
            `SKU 4471-B · ZONE F · BAY 2 · ${FIX_COUNT} UNITS`,
            lf,
            mx,
            GAP_Y,
            10,
            INK(0.85),
            "center"
          );
        }
        stamp("FIX 0.4 S", 500, 96, win(t, 0.8, 0.95), GOLD(0.9), "center");
      }

      /* Permanent ink: the lit bay + the fix mark in the aisle. */
      ctx.globalAlpha = a;
      const fixIn = win(t, 0.48, 0.6);
      if (fixIn > 0 && a > 0) {
        rect(br.x, br.y, br.w, br.h, 1, 1.2, GOLD(0.85 * fixIn), GOLD(0.1 * fixIn));
        circle(mx, by, 6 * fixIn, GOLD(0.95), 1.4);
        line(mx - 14, by, mx - 7, by, GOLD(0.9), 1.2);
        line(mx + 7, by, mx + 14, by, GOLD(0.9), 1.2);
        line(mx, by - 14, mx, by - 7, GOLD(0.9), 1.2);
        line(mx, by + 7, mx, by + 14, GOLD(0.9), 1.2);
        /* Tick from the aisle marker to the bay face it points at. */
        line(mx + 14, by, br.x, by, GOLD(0.6), 1);
        if (!pausedRef.current) {
          const ping = (time * 0.55) % 1;
          circle(mx, by, 10 + ping * 30, GOLD(0.4 * (1 - ping)), 1);
        }
      }
      ctx.restore();
    };

    const drawFronts = (t, a, sa, time) => {
      if (t <= 0 || a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      FRONTS.forEach((fr, i) => {
        const f = win(t, i * 0.14, 0.42 + i * 0.14);
        if (f <= 0) return;
        const br = bayRect(fr.col, fr.bank, fr.bay);
        const [cx, cy] = bayCenter(fr.col, fr.bank, fr.bay);
        /* The low bay itself: red outline + faint red fill. */
        rect(br.x, br.y, br.w, br.h, 1, 1.1, RED(0.7 * f), RED(0.08 * f));
        /* Tight isobars hugging the bay — a front centered on it. */
        for (let ring = 0; ring < 3; ring++) {
          isobar(
            cx,
            cy,
            26 + ring * 11,
            i * 3 + ring,
            win(f, ring * 0.18, 0.7 + ring * 0.1),
            RED(0.5 - ring * 0.12),
            1.05 - ring * 0.15
          );
        }
        const pulse = pausedRef.current ? 0.6 : 0.45 + 0.3 * Math.sin(time * 2 + i * 2.1);
        if (f > 0.5) circle(cx, cy, 2.4, null, 0, RED(pulse));
        /* Label on open floor, never on a rack: bank-0 bays label in the
           mid cross-aisle; lower-bank bays label under the bottom
           corridor — EXCEPT a lower bank's top bay (bay 0), which labels
           in the cross-aisle just above it. That also keeps the two
           lower-bank fronts (cols 4 and 6) from printing on the same
           line and colliding at narrow stage widths. */
        const ly = fr.bank === 0 || fr.bay === 0 ? GAP_Y : BOT_Y + 14;
        if (f > 0.75)
          typed(fr.label, win(f, 0.75, 1), cx, ly, 9, RED(0.8), "center");
      });
      ctx.globalAlpha = sa;
      stamp("3 DEPLETION FRONTS · NEXT 48 H", 500, 56, win(t, 0.55, 0.7), RED(0.85), "center");
      stamp("DRAFT PO READY — 3 LINES", 500, 96, win(t, 0.78, 0.92), GOLD(0.9), "center");
      ctx.restore();
    };

    const drawCourse = (t, a, sa) => {
      if (t <= 0 || a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;

      /* Plot phase — dashed legs through the aisles, numbered picks. */
      const plotF = win(t, 0, 0.5);
      tracePoly(ROUTE, ROUTE_LEN, plotF, 1, INK(0.4), [7, 5]);
      PICKS.forEach((p, n) => {
        const [wx, wy] = ROUTE[p.i];
        const wf = win(plotF * ROUTE_LEN.total, ROUTE_LEN.lens[p.i], ROUTE_LEN.lens[p.i] + 40);
        if (wf <= 0) return;
        circle(wx, wy, 5.5 * wf, INK(0.6), 1);
        /* Tick from the aisle point to the bay face being picked. */
        const br = bayRect(p.col, p.bank, p.bay);
        const face = br.x + br.w / 2 > wx ? br.x : br.x + br.w;
        line(wx + Math.sign(face - wx) * 6, wy, face, wy, INK(0.35), 0.9);
        if (wf > 0.8)
          text(String(n + 1), wx, wy - 13, 8.5, INK(0.5), "center");
      });

      /* Traverse phase — gold line consumes the plan, vessel marker. */
      const runF = win(t, 0.52, 0.95);
      if (runF > 0) {
        tracePoly(ROUTE, ROUTE_LEN, runF, 1.8, GOLD(0.9));
        const [vx, vy] = pointAt(ROUTE, ROUTE_LEN, runF);
        circle(vx, vy, 4, null, 0, GOLD(1));
        circle(vx, vy, 8, GOLD(0.45), 1);
        PICKS.forEach((p) => {
          if (ROUTE_LEN.lens[p.i] <= runF * ROUTE_LEN.total) {
            const [wx, wy] = ROUTE[p.i];
            circle(wx, wy, 3, null, 0, GOLD(0.9));
          }
        });
      }

      ctx.globalAlpha = sa;
      stamp("COURSE · 12 WPT · 30% SHORTER", 500, 56, win(t, 0.62, 0.78), GOLD(0.9), "center");
      ctx.restore();
    };

    const drawRevision = (t, a) => {
      if (t <= 0 || a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;

      /* Reslot moves — Manhattan paths through aisles and corridors. */
      RESLOTS.forEach((r, i) => {
        const f = win(t, 0.06 + i * 0.16, 0.42 + i * 0.16);
        if (f <= 0) return;
        const meta = polyLengths(r.path);
        tracePoly(r.path, meta, f, 1.1, GOLD(0.65), [5, 4]);
        if (f >= 1) {
          arrowhead(r.path, GOLD(0.85));
          const tb = bayRect(r.to.col, r.to.bank, r.to.bay);
          rect(tb.x, tb.y, tb.w, tb.h, 1, 1.2, GOLD(0.7));
          text(r.label, r.labelAt[0], r.labelAt[1], 9, GOLD(0.8), "center");
        }
      });

      /* The PO lands: replenished front bays get healthy gold rings. */
      const rf = win(t, 0.45, 0.8);
      if (rf > 0) {
        FRONTS.forEach((fr, i) => {
          const [cx, cy] = bayCenter(fr.col, fr.bank, fr.bay);
          isobar(cx, cy, 24, 20 + i, win(rf, i * 0.1, 0.7 + i * 0.1), GOLD(0.45), 1);
          isobar(cx, cy, 33, 24 + i, win(rf, 0.15 + i * 0.1, 0.85 + i * 0.1), GOLD(0.3), 0.9);
          /* +N tag sits in the aisle beside the bay, never on a rack. */
          if (rf > 0.7)
            text(`+${fr.restock}`, RACK_X[fr.col] - 8, cy, 8.5, GOLD(0.8), "right");
        });
      }

      /* y=56, not 96: the wide edition stamp centered at x=500 spans
         past x=657, which is exactly where RESLOT → G-1 prints on the
         top corridor — at y=96 the two overlapped into unreadable
         mush. y=56 is the free band between the chart frame and the
         hull that the other beats' first stamp uses. */
      stamp("NEW EDITION · REV 1,249 · SELF-ISSUED 03:00", 500, 56, win(t, 0.6, 0.75), INK(0.8), "center");
      ctx.restore();
    };

    /* ── frame loop ── */

    let rafId = 0;
    let running = false;
    let time = 0;
    let last = performance.now();
    let lastP = -1;
    let lastGround = "";

    const frame = (now) => {
      if (!visibleRef.current) {
        running = false;
        return;
      }
      rafId = requestAnimationFrame(frame);

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const rect2 = space.getBoundingClientRect();
      const range = space.offsetHeight - window.innerHeight;
      const p = clamp01(range > 0 ? -rect2.top / range : 0);

      if (!pausedRef.current) time += dt;
      else if (Math.abs(p - lastP) < 0.0004 && lastP >= 0) return;
      lastP = p;

      /* Ground: constant navy; fades to black only at the exit. */
      const g = groundColor(p);
      if (g !== lastGround && stageRef.current) {
        stageRef.current.style.backgroundColor = g;
        lastGround = g;
      }

      const f = Math.min(p * NB, NB - 0.0001);
      const mode = Math.floor(f);
      const local = f - mode;

      if (mode !== activeRef.current) {
        activeRef.current = mode;
        setActive(mode);
      }
      if (revRef.current)
        revRef.current.textContent =
          mode >= 4 && local > 0.65 ? "ED. 1,249" : "ED. 1,248";

      const tFor = (i) => (mode > i ? 1 : mode === i ? local : 0);
      const aFor = (i) => (mode > i ? 0.28 : mode === i ? 1 : 0);
      const saFor = (i) =>
        mode === i ? 1 : mode === i + 1 ? 1 - win(local, 0, 0.2) : 0;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const plotT = tFor(0);
      drawGraticule(win(plotT, 0.35, 0.7));
      drawFrame(win(plotT, 0.25, 0.55));
      drawHull(win(plotT, 0, 0.4));
      drawRacks(win(plotT, 0.18, 0.85), tFor(4));
      drawCompass(win(plotT, 0.5, 0.75), time);
      drawScaleBar(win(plotT, 0.55, 0.8));
      drawCounts(plotT, tFor(4));

      drawFix(tFor(1), aFor(1), saFor(1), time);
      drawFronts(tFor(2), aFor(2), saFor(2), time);
      drawCourse(tFor(3), aFor(3), saFor(3));
      drawRevision(tFor(4), aFor(4));
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    };
    resumeRef.current = start;
    start();

    return () => {
      cancelAnimationFrame(rafId);
      resumeRef.current = null;
      window.removeEventListener("resize", resize);
    };
  }, []);

  const beat = BEATS[active];

  return (
    <section
      ref={sectionRef}
      id="warehouse"
      className={styles.section}
      aria-label="A day on the floor, charted by Nautilus"
    >
      <div ref={spaceRef} className={styles.scrollSpace}>
        <div ref={stageRef} className={styles.stage}>
          <canvas ref={canvasRef} className={styles.chart} aria-hidden="true" />

          {/* Title block — chart legend, bottom-left */}
          <div className={styles.titleBlock}>
            <div className={styles.tbName}>NAUTILUS · CHART ROOM</div>
            <div className={styles.tbMeta}>
              WAREHOUSE No.4 — SOUNDINGS IN UNITS
            </div>
            <div ref={revRef} className={styles.tbRev}>
              ED. 1,248
            </div>
          </div>

          {/* Beat caption — bottom center */}
          <div className={styles.caption}>
            <div className={styles.capLabel} key={beat.key}>
              {beat.num} — {beat.label}
            </div>
            <div className={styles.capTitles}>
              {BEATS.map((b, i) => (
                <div
                  key={b.key}
                  className={`${styles.capLayer} ${
                    i === active ? styles.capActive : ""
                  }`}
                  aria-hidden={i !== active}
                >
                  <h3 className={styles.capTitle}>{b.title}</h3>
                  <p className={styles.capDesc}>{b.desc}</p>
                </div>
              ))}
            </div>
            <div className={styles.ticks} aria-label="Chapters">
              {BEATS.map((b, i) => (
                <button
                  key={b.key}
                  type="button"
                  className={`${styles.tick} ${
                    i === active
                      ? styles.tickActive
                      : i < active
                        ? styles.tickPast
                        : ""
                  }`}
                  aria-label={`${b.label} (${b.num} of 0${NB})`}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => jumpTo(i)}
                />
              ))}
            </div>
          </div>

          {/* CTA — surfaces on the final beat */}
          <button
            type="button"
            className={`${styles.cta} ${active === NB - 1 ? styles.ctaOn : ""}`}
            onClick={onDemo}
            tabIndex={active === NB - 1 ? 0 : -1}
          >
            Chart your own floor — book a demo
            <span aria-hidden="true"> →</span>
          </button>
        </div>
      </div>
    </section>
  );
}
