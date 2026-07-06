"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./WarehouseShowcase.module.css";
import { useAnimationPaused } from "@/lib/AnimationContext";

/* ═══════════════════════════════════════════════════════════════════════
   WarehouseShowcase — "THE CHART ROOM"

   Your warehouse as a nautical chart that annotates itself. No 3D, no
   isometric scene — a plotter draws a survey chart of the floor (2D
   canvas, pure vector ink), and five scroll beats play out as chart
   operations:

     01 PLOT      the chart draws itself — hull, racks, graticule,
                  soundings (live stock counts) type in
     02 FIX       a spoken query becomes a position fix — bearing lines
                  triangulate the SKU, a fix mark inks at the bay
     03 FRONTS    depletion fronts (isobar clusters) ink over three
                  zones, 48 hours before landfall — PO drafted
     04 COURSE    twelve picks become one plotted course; the route is
                  traversed waypoint by waypoint
     05 REVISION  overnight the chart re-issues itself — reslot arrows,
                  soundings roll, a new edition stamp

   A chart accumulates ink: each beat's annotations REMAIN at reduced
   opacity after their beat, so by REVISION the floor reads as a lived-in
   working document, not a slideshow.

   Everything is drawn per-frame from (beat, local-t, time) — fully
   scrubbable in both directions. The rAF parks when the section is
   off-screen (IntersectionObserver resumes it); the animations-paused /
   reduced-motion context freezes ambient time but scroll scrubbing
   still redraws (direct manipulation).

   Perf note: this removes three.js from the showcase chunk entirely —
   the only WebGL left on the home page is the AI section terrain.
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
    desc: "Depletion fronts inked before they make landfall — purchase orders already drafted.",
  },
  {
    key: "course",
    num: "04",
    label: "COURSE",
    title: "Twelve picks. One plotted course.",
    desc: "Shortest safe water between every pick — fourteen minutes handed back per wave.",
  },
  {
    key: "revision",
    num: "05",
    label: "REVISION",
    title: "The chart corrects itself overnight.",
    desc: "Every shift ends with a new edition — reslots, counts, and contours, self-issued.",
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

/* Rack banks: 8 columns × 2 banks of long vertical strips. */
const RACK_W = 34;
const RACK_X = [200, 280, 360, 440, 520, 600, 680, 760];
const BANKS = [
  [128, 258],
  [316, 470],
];
const ZONES = ["A", "B", "C", "D", "E", "F", "G", "H"];

/* Soundings — live stock counts scattered through the aisles. */
const SOUNDINGS = [];
{
  const aisleX = [166];
  for (let i = 0; i < RACK_X.length - 1; i++)
    aisleX.push((RACK_X[i] + RACK_W + RACK_X[i + 1]) / 2);
  aisleX.push(846);
  const rows = [160, 218, 348, 406, 462];
  aisleX.forEach((x, i) =>
    rows.forEach((y, j) => {
      if ((i * 5 + j) % 3 === 0) return; // thin the field
      SOUNDINGS.push({ x, y, v: ((i * 37 + j * 53) % 88) + 8 });
    })
  );
}

/* FIX beat — the queried SKU's bay. */
const FIX = { x: 617, y: 176 };

/* FRONTS beat — three depletion zones. */
const FRONTS = [
  { x: 262, y: 196, r: 52, label: "SKU 2210 · T-41H" },
  { x: 452, y: 398, r: 58, label: "SKU 0087 · T-38H" },
  { x: 706, y: 402, r: 46, label: "SKU 5512 · T-46H" },
];

/* COURSE beat — twelve pick waypoints threading the aisles. */
const WPTS = [
  [104, 196],
  [166, 168],
  [166, 300],
  [246, 340],
  [326, 300],
  [326, 430],
  [412, 462],
  [498, 398],
  [578, 348],
  [658, 288],
  [738, 208],
  [826, 152],
];

/* REVISION beat — reslot moves (from → to). */
const RESLOTS = [
  { from: [297, 420], to: [617, 420], label: "RESLOT → F-2" },
  { from: [777, 168], to: [377, 190], label: "RESLOT → C-1" },
];

/* ── Small math/drawing helpers ─────────────────────────────────────── */

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (v) => v * v * (3 - 2 * v);
/* Local window: 0→1 across [a,b] of a beat's local t. */
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

/* Point at fraction f along a polyline. */
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

export default function WarehouseShowcase({ onDemo }) {
  const sectionRef = useRef(null);
  const spaceRef = useRef(null);
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

    /* next/font hashes family names — read the real stacks off the DOM
       so canvas text matches the site's type. */
    const rootStyle = getComputedStyle(document.body);
    const MONO = rootStyle.getPropertyValue("--mono").trim() || "monospace";

    /* Ink palette. */
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

    const px = (n) => n * dpr; // crisp pixel sizes, independent of chart scale
    const font = (size, family = MONO) => `${px(size)}px ${family}`;

    /* ── primitive helpers (all in chart units via X()/Y()) ── */

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

    const rect = (x, y, w, h, f, width, stroke) => {
      const pts = [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
        [x, y],
      ];
      tracePoly(pts, polyLengths(pts), f, width, stroke);
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

    /* Typed text with a plotter cursor while incomplete. */
    const typed = (str, f, x, y, size, fillStyle, align = "left") => {
      const n = Math.round(str.length * clamp01(f));
      const s = str.slice(0, n) + (f < 1 && n < str.length ? "▏" : "");
      text(s, x, y, size, fillStyle, align, 0.6);
    };

    /* Diagonal hatch inside a rect, clipped, progressive left→right. */
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

    /* A stamped annotation box (chart-office rubber stamp). */
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
          0.1 * Math.sin(a * 3 + seed * 7.3) +
          0.06 * Math.sin(a * 5 + seed * 3.1);
        const xx = cx + Math.cos(a) * r * wob;
        const yy = cy + Math.sin(a) * r * wob * 0.78;
        if (i === 0) ctx.moveTo(X(xx), Y(yy));
        else ctx.lineTo(X(xx), Y(yy));
      }
      ctx.stroke();
      ctx.restore();
    };

    /* ── static furniture layers ── */

    const drawFrame = (a) => {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = INK(0.35);
      ctx.lineWidth = px(1);
      ctx.strokeRect(X(30), Y(22), 940 * sc, 576 * sc);
      ctx.strokeStyle = INK(0.14);
      ctx.strokeRect(X(38), Y(30), 924 * sc, 560 * sc);
      // graduation ticks along the outer frame
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

    const drawScaleBar = (a) => {
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      line(620, 508, 780, 508, INK(0.45), 1);
      for (let i = 0; i <= 4; i++)
        line(620 + i * 40, 504, 620 + i * 40, 512, INK(0.45), 1);
      text("0", 620, 494, 8.5, INK(0.35), "center");
      text("40 m", 780, 494, 8.5, INK(0.35), "center");
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
      }
    };

    const drawRacks = (t, learnT) => {
      RACK_X.forEach((rx, i) => {
        BANKS.forEach(([y0, y1], b) => {
          const idx = i * 2 + b;
          const f = win(t, 0.04 * idx, 0.04 * idx + 0.3);
          if (f <= 0) return;
          rect(rx, y0, RACK_W, y1 - y0, f, 1, INK(0.55));
          hatch(rx, y0, RACK_W, y1 - y0, win(f, 0.5, 1), INK(0.13));
        });
        if (t > 0.85)
          text(ZONES[i], rx + RACK_W / 2, 116, 9.5, INK(0.5), "center");
      });
      /* REVISION: erase-hatch the vacated bays. */
      if (learnT > 0) {
        RESLOTS.forEach((r, i) => {
          const f = win(learnT, 0.1 + i * 0.15, 0.45 + i * 0.15);
          hatch(r.from[0] - 17, r.from[1] - 26, 34, 52, f, RED(0.4), 5);
        });
      }
    };

    const drawSoundings = (t, learnT) => {
      SOUNDINGS.forEach((s, i) => {
        const f = win(t, 0.55 + (i % 9) * 0.045, 0.72 + (i % 9) * 0.045);
        if (f <= 0) return;
        let v = s.v;
        let col = INK(0.34 * f);
        /* REVISION: counts along yesterday's course roll to new values. */
        if (learnT > 0 && i % 4 === 0) {
          const roll = win(learnT, 0.3, 0.7);
          if (roll > 0.5) {
            v = s.v + ((i * 11) % 17) - 8;
            col = roll < 0.9 ? GOLD(0.7) : INK(0.4);
          }
        }
        text(String(v), s.x, s.y, 9.5, col, "center");
      });
    };

    /* ── beat layers ── */

    const drawFix = (t, a, sa, time) => {
      if (t <= 0 || (a <= 0 && sa <= 0)) return;
      ctx.save();

      /* Transient annotations (query, bearings, stamps) draw at sa —
         they ERASE when the next beat starts, like construction lines
         on a working chart. The fix mark itself is permanent ink (a). */
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

        /* Bearing lines sweep in from chart landmarks. */
        const bearings = [
          { from: [862, 148], brg: "227°" },
          { from: [96, 532], brg: "048°" },
          { from: [96, 78], brg: "169°" },
        ];
        bearings.forEach((bl, i) => {
          const f = win(t, 0.18 + i * 0.08, 0.42 + i * 0.08);
          if (f <= 0) return;
          const ex = bl.from[0] + (FIX.x - bl.from[0]) * f;
          const ey = bl.from[1] + (FIX.y - bl.from[1]) * f;
          line(bl.from[0], bl.from[1], ex, ey, INK(0.3), 0.9, [6, 4]);
          if (f >= 1)
            text(
              bl.brg,
              (bl.from[0] + FIX.x) / 2 + 12,
              (bl.from[1] + FIX.y) / 2 - 8,
              8.5,
              INK(0.4)
            );
        });
      }
      ctx.globalAlpha = a;

      const fixIn = win(t, 0.48, 0.6);
      if (fixIn > 0 && a > 0) {
        /* The fix: crosshair rings + time-driven ping. */
        circle(FIX.x, FIX.y, 7 * fixIn, GOLD(0.95), 1.4);
        circle(FIX.x, FIX.y, 12 * fixIn, GOLD(0.55), 1);
        line(FIX.x - 18, FIX.y, FIX.x - 9, FIX.y, GOLD(0.9), 1.2);
        line(FIX.x + 9, FIX.y, FIX.x + 18, FIX.y, GOLD(0.9), 1.2);
        line(FIX.x, FIX.y - 18, FIX.x, FIX.y - 9, GOLD(0.9), 1.2);
        line(FIX.x, FIX.y + 9, FIX.x, FIX.y + 18, GOLD(0.9), 1.2);
        if (!pausedRef.current) {
          const ping = (time * 0.55) % 1;
          circle(FIX.x, FIX.y, 12 + ping * 34, GOLD(0.4 * (1 - ping)), 1);
        }
        /* Leader + label. */
        /* Leader + answer label are transient (sa): they'd clutter the
           racks once later beats take over. Runs down-left into open
           aisle water — right of the fix sits the compass rose. */
        const lf = win(t, 0.56, 0.75);
        if (lf > 0 && sa > 0) {
          ctx.globalAlpha = sa;
          line(FIX.x, FIX.y + 20, FIX.x, FIX.y + 44, GOLD(0.5), 0.9);
          /* Centered under the fix — stays inside the canvas at every
             viewport width (a right/left-anchored label overflows the
             chart edge once the chart shrinks on phones). */
          typed(
            "SKU 4471-B · ZONE F · BAY 07 · LVL 2",
            win(t, 0.6, 0.85),
            FIX.x,
            FIX.y + 56,
            10,
            INK(0.85),
            "center"
          );
          ctx.globalAlpha = a;
        }
        ctx.globalAlpha = sa;
        stamp("FIX 0.4 S", 500, 96, win(t, 0.8, 0.95), GOLD(0.9), "center");
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
        for (let ring = 0; ring < 3; ring++) {
          const rr = fr.r * (0.45 + ring * 0.3);
          isobar(
            fr.x,
            fr.y,
            rr,
            i * 3 + ring,
            win(f, ring * 0.18, 0.7 + ring * 0.1),
            RED(0.55 - ring * 0.13),
            1.1 - ring * 0.15
          );
        }
        const pulse = pausedRef.current
          ? 0.6
          : 0.45 + 0.3 * Math.sin(time * 2 + i * 2.1);
        if (f > 0.5) circle(fr.x, fr.y, 2.6, null, 0, RED(pulse));
        if (f > 0.75)
          typed(
            fr.label,
            win(f, 0.75, 1),
            fr.x,
            fr.y - fr.r * 0.95 - 12,
            9,
            RED(0.8),
            "center"
          );
      });
      ctx.globalAlpha = sa;
      stamp(
        "3 DEPLETION FRONTS · NEXT 48 H",
        500,
        56,
        win(t, 0.55, 0.7),
        RED(0.85),
        "center"
      );
      stamp(
        "DRAFT PO READY — 3 LINES",
        500,
        96,
        win(t, 0.78, 0.92),
        GOLD(0.9),
        "center"
      );
      ctx.restore();
    };

    const WPT_META = polyLengths(WPTS);

    const drawCourse = (t, a, sa) => {
      if (t <= 0 || a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;

      /* Plot phase — dashed legs + numbered waypoints appear in order. */
      const plotF = win(t, 0, 0.5);
      tracePoly(WPTS, WPT_META, plotF, 1, INK(0.4), [7, 5]);
      WPTS.forEach(([wx, wy], i) => {
        const wf = win(plotF, i / WPTS.length, (i + 0.6) / WPTS.length);
        if (wf <= 0) return;
        circle(wx, wy, 5.5 * wf, INK(0.6), 1);
        if (wf > 0.8) text(String(i + 1), wx, wy - 13, 8.5, INK(0.5), "center");
      });

      /* Traverse phase — gold line consumes the plan, vessel marker. */
      const runF = win(t, 0.52, 0.95);
      if (runF > 0) {
        tracePoly(WPTS, WPT_META, runF, 1.8, GOLD(0.9));
        const [vx, vy] = pointAt(WPTS, WPT_META, runF);
        circle(vx, vy, 4, null, 0, GOLD(1));
        circle(vx, vy, 8, GOLD(0.45), 1);
        WPTS.forEach(([wx, wy], i) => {
          if (WPT_META.lens[i] <= runF * WPT_META.total)
            circle(wx, wy, 3, null, 0, GOLD(0.9));
        });
      }

      ctx.globalAlpha = sa;
      stamp(
        "COURSE · 12 WPT · 14 MIN SAVED",
        500,
        56,
        win(t, 0.62, 0.78),
        GOLD(0.9),
        "center"
      );
      ctx.restore();
    };

    const drawRevision = (t, a) => {
      if (t <= 0 || a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;

      /* Reslot arrows — dashed, with an arrowhead and destination glow. */
      RESLOTS.forEach((r, i) => {
        const f = win(t, 0.06 + i * 0.16, 0.42 + i * 0.16);
        if (f <= 0) return;
        const [fx, fy] = r.from;
        const [tx, ty] = r.to;
        const mx = (fx + tx) / 2;
        const my = Math.min(fy, ty) - 46;
        /* Quadratic arc sampled into a polyline for progressive draw. */
        const pts = [];
        for (let k = 0; k <= 24; k++) {
          const u = k / 24;
          const iu = 1 - u;
          pts.push([
            iu * iu * fx + 2 * iu * u * mx + u * u * tx,
            iu * iu * fy + 2 * iu * u * my + u * u * ty,
          ]);
        }
        tracePoly(pts, polyLengths(pts), f, 1.1, GOLD(0.65), [5, 4]);
        if (f >= 1) {
          const [ax, ay] = pts[24];
          const [bx2, by2] = pts[22];
          const ang = Math.atan2(ay - by2, ax - bx2);
          ctx.strokeStyle = GOLD(0.85);
          ctx.lineWidth = px(1.2);
          ctx.beginPath();
          ctx.moveTo(X(ax), Y(ay));
          ctx.lineTo(
            X(ax - Math.cos(ang - 0.45) * 9),
            Y(ay - Math.sin(ang - 0.45) * 9)
          );
          ctx.moveTo(X(ax), Y(ay));
          ctx.lineTo(
            X(ax - Math.cos(ang + 0.45) * 9),
            Y(ay - Math.sin(ang + 0.45) * 9)
          );
          ctx.stroke();
          rect(tx - 17, ty - 26, 34, 52, 1, 1.2, GOLD(0.7));
          text(r.label, mx, my - 10, 9, GOLD(0.8), "center");
        }
      });

      /* A fresh contour inks around the fast-mover aisle. */
      const cf = win(t, 0.45, 0.8);
      isobar(497, 330, 90, 11, cf, GOLD(0.3), 1);
      isobar(497, 330, 62, 12, win(t, 0.52, 0.85), GOLD(0.4), 1);

      /* y=96 (not 56) — the demo CTA docks top-center on narrow
         viewports during this beat; keep the stamp clear of it. */
      stamp(
        "NEW EDITION · REV 1,249 · SELF-ISSUED 03:00",
        500,
        96,
        win(t, 0.6, 0.75),
        INK(0.8),
        "center"
      );
      ctx.restore();
    };

    /* ── frame loop ── */

    let rafId = 0;
    let running = false;
    let time = 0;
    let last = performance.now();
    let lastP = -1;

    const frame = (now) => {
      if (!visibleRef.current) {
        running = false; // park — resumed on re-entry
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

      /* Beat-layer intensities: current beat animates with its local t;
         PAST beats stay inked at 28% (a chart accumulates); future = 0.
         Beat 0's plot progress is locked at 1 once passed. */
      const tFor = (i) => (mode > i ? 1 : mode === i ? local : 0);
      const aFor = (i) => (mode > i ? 0.28 : mode === i ? 1 : 0);
      /* Stamp/annotation alpha: full during the beat, erased across the
         first fifth of the next beat, gone after — construction notes
         don't accumulate the way chart ink does. */
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
      drawSoundings(plotT, tFor(4));

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
        <div className={styles.stage}>
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
