"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAnimationPaused } from "@/lib/AnimationContext";
import styles from "./WarehouseShowcase.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════════════════════════════════
   WarehouseShowcase

   One warehouse, one scroll, five glimpses of what AI actually does
   inside it:

     01 · AWAKE       — spatial intelligence boots; the floor renders
                        itself from prior scans
     02 · HEAR        — a worker speaks; the system locates + responds
     03 · ANTICIPATE  — depletion forecast flags 3 SKUs; drafts a PO
     04 · ACT         — one picker traces an optimized route
     05 · LEARN       — the day rolls up; the floor "remembers"

   All on-screen text is anchored to 3D world positions — projected to
   screen space each frame so it appears *in* the warehouse rather than
   floating beside it.
   ════════════════════════════════════════════════════════════════════ */

/* ─── LAYOUT ─────────────────────────────────────────────────────────
   95m × 43m warehouse. 4 zones × 5 bays = 20 bays along x. 8 columns
   along z, 5m spacing → ~3.2m walkable aisles between racks. */
const ZONE_COUNT = 4;
const ZONE_LEN = 20;
const ZONE_GAP = 5;
const BAYS_PER_ZONE = 5;
const BAY_W = ZONE_LEN / BAYS_PER_ZONE; // 4
const TOTAL_BAYS = ZONE_COUNT * BAYS_PER_ZONE; // 20
const TOTAL_X = ZONE_COUNT * ZONE_LEN + (ZONE_COUNT - 1) * ZONE_GAP; // 95
const X_START = -TOTAL_X / 2; // -47.5

const COLS = 8;
const COL_SPACING = 5;
const RACK_W = 3.6;
const RACK_H = 5.4;
const RACK_D = 0.9;

const W_DEPTH = (COLS - 1) * COL_SPACING + RACK_D * 2 + 6; // ~42.8
const W_HALF_DEPTH = W_DEPTH / 2; // ~21.4
const DOCK_Z = W_HALF_DEPTH + 8; // ~29.4

/* End-cap cross-aisle z-positions (perimeter loops). */
const OUTER_N_Z = 19;
const OUTER_S_Z = -19;
const OUTER_E_X = 50;
const OUTER_W_X = -50;

/* Cross-aisle x positions: outer ends + zone gap centers. */
const CROSS_X = [
  OUTER_W_X,
  X_START + 1 * ZONE_LEN + 0.5 * ZONE_GAP, // -25
  X_START + 2 * ZONE_LEN + 1.5 * ZONE_GAP, // 0
  X_START + 3 * ZONE_LEN + 2.5 * ZONE_GAP, // 25
  OUTER_E_X,
];

/* Access aisles between columns (and outer wall aisles).
   AISLES_Z[c + s] is the z-coordinate of the aisle from which an item
   at column c, side s is reachable. With COLS=8 and COL_SPACING=5,
   that's [-19, -15, -10, -5, 0, 5, 10, 15, 19]. */
const AISLES_Z = [];
for (let i = 0; i <= COLS; i++) {
  if (i === 0) AISLES_Z.push(OUTER_S_Z);
  else if (i === COLS) AISLES_Z.push(OUTER_N_Z);
  else AISLES_Z.push((i - 0.5 - (COLS - 1) / 2) * COL_SPACING);
}
/* ─── COLORS ────────────────────────────────────────────────────────── */
/* Palette anchored to #050811 — the deepest stop of the section's
   gradient. The floor, fog, and (rarely-seen) scene fallback all share
   that exact value so there is no visible horizon line where the 3D
   floor meets the background. Racks sit one step up the value scale,
   edges one step further, so silhouettes still pop without the floor
   reading as "another object." */
/* ─── COLORS ────────────────────────────────────────────────────────── */
const C_BG = 0x050d1c; // bg — lighter "sky" the warehouse floats in
const C_FOG = 0x050d1c; // matches bg so distant objects fade cleanly
const C_FLOOR = 0x030812; // floor — darker than bg, reads as a deep pool
const C_RACK = 0x122842; // mid-navy racks, slightly darker than before
const C_RACK_EDGE = 0x426b91; // a touch brighter cool edge for silhouette pop
const C_GOLD = 0xd4a853;
const C_GOLD_HOT = 0xf0c878;
const C_RED = 0xc84a4a;
const C_GREEN = 0x6dac5a;

/* ─── MATH ─────────────────────────────────────────────────────────── */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function smoothstep(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}
function localT(p, r) {
  return smoothstep((p - r[0]) / (r[1] - r[0]));
}
function bayToX(b) {
  const zi = Math.floor(b / BAYS_PER_ZONE);
  const bi = b % BAYS_PER_ZONE;
  return X_START + zi * (ZONE_LEN + ZONE_GAP) + (bi + 0.5) * BAY_W;
}

/* ─── ITEMS ─────────────────────────────────────────────────────────
   12 items clustered into 4 access aisles (3 per aisle), arranged so
   a single 4-aisle serpentine route visits every one without
   backtracking. Each (col, side) determines its access aisle. */
const ITEMS_RAW = [
  // Aisle z=10 (between col 5 and col 6)  — east → west
  { bay: 18, col: 6, side: 0, h: 3.8, code: "I1-009", zone: "I" },
  { bay: 8, col: 5, side: 1, h: 2.4, code: "F2-095", zone: "F" },
  { bay: 2, col: 6, side: 0, h: 2.2, code: "B3-441", zone: "A" },
  // Aisle z=5 (between col 4 and col 5)   — west → east
  { bay: 4, col: 4, side: 1, h: 2.6, code: "I3-392", zone: "C" },
  { bay: 11, col: 5, side: 0, h: 2.6, code: "G2-538", zone: "G" },
  { bay: 14, col: 4, side: 1, h: 3.4, code: "H3-133", zone: "H" },
  // Aisle z=-5 (between col 2 and col 3)  — east → west
  { bay: 16, col: 3, side: 0, h: 3.0, code: "E4-628", zone: "E" },
  { bay: 9, col: 2, side: 1, h: 3.2, code: "D1-776", zone: "D" },
  { bay: 3, col: 3, side: 0, h: 3.6, code: "J1-854", zone: "J" },
  // Aisle z=-10 (between col 1 and col 2) — west → east
  { bay: 1, col: 1, side: 1, h: 3.4, code: "B1-047", zone: "B" },
  { bay: 6, col: 2, side: 0, h: 2.8, code: "C3-201", zone: "C" },
  { bay: 15, col: 1, side: 1, h: 3.8, code: "A1-217", zone: "A" },
];

/* Compute every derived position once. */
const ITEMS = ITEMS_RAW.map((it) => {
  const zC = (it.col - (COLS - 1) / 2) * COL_SPACING;
  const itemZ = zC + (it.side === 0 ? -RACK_D / 2 - 0.32 : RACK_D / 2 + 0.32);
  return {
    ...it,
    x: bayToX(it.bay),
    y: it.h,
    z: itemZ,
    accessZ: AISLES_Z[it.col + it.side],
  };
});
const ITEM_POS = ITEMS.map((it) => ({ x: it.x, y: it.y, z: it.z }));

/* Lookup by code so we don't tie narrative beats to array indices. */
const codeIdx = (code) => ITEMS.findIndex((it) => it.code === code);

const HEAR_TARGET_CODE = "B3-441";
const HEAR_TARGET = codeIdx(HEAR_TARGET_CODE);

const PREDICT_CODES = ["I3-392", "D1-776", "A1-217"];
const PREDICT_INDICES = PREDICT_CODES.map(codeIdx);

/* ─── ROUTE ─────────────────────────────────────────────────────────
   Every waypoint is either on a cross-aisle (outer wall or zone gap)
   or on an access aisle z-coordinate. The route never crosses a rack.
   Picks happen at the exact (item.x, item.accessZ) waypoint. */
const I = (code) => {
  const it = ITEMS[codeIdx(code)];
  return [it.x, it.accessZ];
};
const ROUTE = [
  [0, DOCK_Z],
  [0, OUTER_N_Z],
  [OUTER_E_X, OUTER_N_Z],
  [OUTER_E_X, 10], // drop into aisle z=10
  I("I1-009"), // pick at x=41.5
  I("F2-095"), // pick at x=-8.5
  I("B3-441"), // pick at x=-37.5
  [OUTER_W_X, 10],
  [OUTER_W_X, 5], // drop into aisle z=5
  I("I3-392"), // pick at x=-29.5
  I("G2-538"), // pick at x=8.5
  I("H3-133"), // pick at x=20.5
  [OUTER_E_X, 5],
  [OUTER_E_X, -5], // drop into aisle z=-5
  I("E4-628"), // pick at x=33.5
  I("D1-776"), // pick at x=-4.5
  I("J1-854"), // pick at x=-33.5
  [OUTER_W_X, -5],
  [OUTER_W_X, -10], // drop into aisle z=-10
  I("B1-047"), // pick at x=-41.5
  I("C3-201"), // pick at x=-16.5
  I("A1-217"), // pick at x=29.5
  [OUTER_E_X, -10],
  [OUTER_E_X, OUTER_N_Z],
  [0, OUTER_N_Z],
  [0, DOCK_Z],
];

function buildRoute(waypoints) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [x1, z1] = waypoints[i];
    const [x2, z2] = waypoints[i + 1];
    const d = Math.hypot(x2 - x1, z2 - z1);
    segs.push({ s: total, e: total + d, x1, z1, x2, z2, d });
    total += d;
  }
  return { waypoints, segs, total };
}
const OPT = buildRoute(ROUTE);

/* ─── MATH (single source of truth) ─────────────────────────────────
   Every displayed number is derived from OPT.total + WALK_SPEED +
   NAIVE_RATIO. Change a waypoint, the readouts adjust to match. */
const WALK_SPEED = 1.5; // m/s — picker / AMR average
const NAIVE_RATIO = 1.55; // naive route is ~55% longer than optimal

const OPT_TOTAL = OPT.total;
const OPT_TIME = OPT_TOTAL / WALK_SPEED;
const NAIVE_TOTAL = Math.round(OPT_TOTAL * NAIVE_RATIO);
const NAIVE_TIME = NAIVE_TOTAL / WALK_SPEED;
const SAVED_PCT = Math.round((1 - 1 / NAIVE_RATIO) * 100);
const SAVED_METERS = Math.round(NAIVE_TOTAL - OPT_TOTAL);
const SAVED_SECONDS = Math.round(NAIVE_TIME - OPT_TIME);
const OPT_M = Math.round(OPT_TOTAL);

function fmtTime(s) {
  const sec = Math.max(0, Math.round(s));
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, "0")}`;
}

function positionOnRoute(t) {
  const td = clamp(t, 0, 1) * OPT_TOTAL;
  for (const sg of OPT.segs) {
    if (td <= sg.e) {
      const k = sg.d > 0 ? (td - sg.s) / sg.d : 0;
      return { x: lerp(sg.x1, sg.x2, k), z: lerp(sg.z1, sg.z2, k) };
    }
  }
  const last = OPT.waypoints[OPT.waypoints.length - 1];
  return { x: last[0], z: last[1] };
}

/* PICK_TS — the route progress at which each item is reached. We find
   the waypoint that matches the item's (x, accessZ), then divide its
   cumulative segment distance by OPT_TOTAL. */
const PICK_TS = ITEMS.map((it) => {
  let cum = 0;
  for (let i = 0; i < ROUTE.length; i++) {
    const [x, z] = ROUTE[i];
    if (Math.abs(x - it.x) < 0.05 && Math.abs(z - it.accessZ) < 0.05) {
      return cum / OPT_TOTAL;
    }
    if (i < ROUTE.length - 1) {
      const [nx, nz] = ROUTE[i + 1];
      cum += Math.hypot(nx - x, nz - z);
    }
  }
  return 0.5;
});

/* ─── MODE WINDOWS ─────────────────────────────────────────────────── */
const M_WAKE = [0.0, 0.14];
const M_HEAR = [0.14, 0.32];
const M_PREDICT = [0.32, 0.52];
const M_ACT = [0.52, 0.8];
const M_LEARN = [0.8, 1.0];

const MODE_DEFS = [
  { id: "wake", num: "01", label: "AWAKE", title: "The floor comes online." },
  {
    id: "hear",
    num: "02",
    label: "HEAR",
    title: "“Where's the spare blade for unit 4471?”",
  },
  {
    id: "predict",
    num: "03",
    label: "ANTICIPATE",
    title: "Three SKUs project to deplete within 48 hours.",
  },
  {
    id: "act",
    num: "04",
    label: "ACT",
    title: `Twelve picks. One optimal path. ${fmtTime(OPT_TIME)} of walking.`,
  },
  {
    id: "learn",
    num: "05",
    label: "LEARN",
    title: "The floor knows more today than yesterday.",
  },
];

function modeFromP(p) {
  if (p < M_HEAR[0]) return 0;
  if (p < M_PREDICT[0]) return 1;
  if (p < M_ACT[0]) return 2;
  if (p < M_LEARN[0]) return 3;
  return 4;
}

/* ─── CAMERA STATES ─────────────────────────────────────────────────
   Tighter framing throughout — the warehouse should fill the screen,
   not float in a sea of negative space. ACT mode is now strictly
   overhead so the optimized path reads as a single continuous figure.
   LEARN ends in the same near-vertical pose WAKE started in, so the
   warehouse "going back to sleep" closes the loop on the intro. */
const CAMS = [
  // WAKE: straight-down top-down → drop into oblique reveal
  { p: 0.0, ang: Math.PI * 0.5, rad: 5, h: 95, tx: 0, ty: 4, tz: 0 },
  { p: 0.1, ang: Math.PI * 0.55, rad: 55, h: 36, tx: 0, ty: 3, tz: 0 },
  // HEAR: drop in, ground-level, near the worker
  { p: 0.18, ang: Math.PI * 0.42, rad: 38, h: 13, tx: -14, ty: 3, tz: 4 },
  { p: 0.3, ang: Math.PI * 0.4, rad: 36, h: 11, tx: -12, ty: 3, tz: 4 },
  // PREDICT: side oblique, low and close
  { p: 0.38, ang: Math.PI * 0.3, rad: 46, h: 14, tx: 4, ty: 4, tz: 2 },
  { p: 0.5, ang: Math.PI * 0.36, rad: 44, h: 13, tx: 8, ty: 4, tz: 4 },
  // ACT: OVERHEAD — fixed top-down, the path is the subject
  { p: 0.58, ang: Math.PI * 0.5, rad: 4, h: 72, tx: 0, ty: 0, tz: 0 },
  { p: 0.78, ang: Math.PI * 0.5, rad: 4, h: 70, tx: 0, ty: 0, tz: 0 },
  // LEARN: hold overhead while the floor "remembers", then lift to
  //        the WAKE-start pose as the racks collapse back to 2D
  { p: 0.88, ang: Math.PI * 0.5, rad: 4, h: 78, tx: 0, ty: 0, tz: 0 },
  { p: 1.0, ang: Math.PI * 0.5, rad: 5, h: 95, tx: 0, ty: 4, tz: 0 },
];

function camAt(t) {
  for (let i = 0; i < CAMS.length - 1; i++) {
    const a = CAMS[i],
      b = CAMS[i + 1];
    if (t <= b.p) {
      const k = smoothstep((t - a.p) / (b.p - a.p || 1));
      return {
        ang: lerp(a.ang, b.ang, k),
        rad: lerp(a.rad, b.rad, k),
        h: lerp(a.h, b.h, k),
        tx: lerp(a.tx, b.tx, k),
        ty: lerp(a.ty, b.ty, k),
        tz: lerp(a.tz, b.tz, k),
      };
    }
  }
  return CAMS[CAMS.length - 1];
}

/* ─── CUSTOM FLOOR SHADER ────────────────────────────────────────────
   A dark gradient floor with a subtle radial glow under whatever the
   active mode focuses on, plus persistent learning heat-points. */
const FLOOR_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const FLOOR_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vWorld;
  uniform vec3 uBase;
  uniform vec2 uFocus;
  uniform float uHeat;
  uniform float uGlobal;
  uniform vec3 uHeatColor;
  uniform vec3 uHeatPoints[4];
  uniform float uHeatPointsLen;
  void main() {
    float d0 = length(vWorld.xz) / 90.0;
    // Center is a subtle navy lift (~#0d142a) over the base; edges fall
    // exactly to uBase (= the gradient endpoint #050811) so the floor's
    // outer ring is invisible against the section background.
    vec3 col = mix(uBase * 2.5, uBase, smoothstep(0.0, 1.0, d0));

    float df = distance(vWorld.xz, uFocus);
    float focus = 1.0 - smoothstep(0.0, 16.0, df);
    col += uHeatColor * focus * uHeat * 0.6;

    for (int i = 0; i < 4; i++) {
      if (float(i) >= uHeatPointsLen) break;
      vec3 p = uHeatPoints[i];
      float dd = distance(vWorld.xz, p.xz);
      float k = 1.0 - smoothstep(0.0, 20.0, dd);
      col += uHeatColor * k * p.y * uGlobal * 0.35;
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ════════════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════════════ */

export default function WarehouseShowcase() {
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(0);

  /* Card DOM refs — populated by ref callbacks on each card div. */
  const cardElems = useRef({});
  const setCardRef = useCallback(
    (key) => (el) => {
      cardElems.current[key] = el;
    },
    []
  );

  /* SVG leader-line / anchor-dot refs — same callback-ref pattern as
     cards. The render loop sets x1/y1/x2/y2 on each line and cx/cy on
     each dot every frame. */
  const lineElems = useRef({});
  const dotElems = useRef({});
  const setLineRef = useCallback(
    (key) => (el) => {
      lineElems.current[key] = el;
    },
    []
  );
  const setDotRef = useCallback(
    (key) => (el) => {
      dotElems.current[key] = el;
    },
    []
  );

  /* Card 3D anchors — mutated each frame and projected to screen
     space. Fields:
       x/y/z      world position (the thing being annotated)
       opacity    fade in/out
       scale      extra scale multiplier (1 = neutral)
       lift       screen-space pixels to offset the card upward from
                  the anchor (creates room for a leader line)
       slide      screen-space pixels to offset the card sideways
       showLeader if true, draw an SVG hairline from anchor to card
                  and a tiny gold dot at the anchor itself */
  const anchorsRef = useRef({
    wake: {
      x: 0,
      y: 16,
      z: -4,
      opacity: 0,
      scale: 1,
      lift: 0,
      slide: 0,
      showLeader: false,
    },
    hear: {
      x: 0,
      y: 4,
      z: 0,
      opacity: 0,
      scale: 1,
      lift: 130,
      slide: 0,
      showLeader: true,
    },
    forecast: {
      x: 0,
      y: 0,
      z: 0,
      opacity: 0,
      scale: 1,
      lift: 140,
      slide: 0,
      showLeader: true,
    },
    act: {
      x: 0,
      y: 0,
      z: 0,
      opacity: 0,
      scale: 1,
      lift: 110,
      slide: 0,
      showLeader: true,
    },
    learn: {
      x: 0,
      y: 8,
      z: 0,
      opacity: 0,
      scale: 1,
      lift: 0,
      slide: 0,
      showLeader: false,
    },
  });

  /* Live readouts for mode 4 (ACT) — picker stats update via React
     state so the DOM numbers stay reactive. Card POSITIONS update via
     direct DOM mutation in the animation loop. */
  const [ui, setUi] = useState({
    mode: 0,
    distOpt: 0,
    timeOpt: "0:00",
    pickedOpt: 0,
  });

  const { paused } = useAnimationPaused();
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    let w = canvas.clientWidth || section.clientWidth || 1280;
    let h = canvas.clientHeight || 720;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true, // <- transparent canvas
      powerPreference: "high-performance",
    });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0); // <- clear to transparent

    const scene = new THREE.Scene();
    scene.background = null; // <- gradient shows through
    scene.fog = new THREE.FogExp2(C_FOG, 0.012);

    const camera = new THREE.PerspectiveCamera(46, w / h, 0.5, 700);
    camera.position.set(80, 30, 0);
    camera.lookAt(0, 3, 0);

    /* ─── FLOOR (custom shader) ────────────────────────────────────── */
    const floorUniforms = {
      uBase: { value: new THREE.Color(C_FLOOR) },
      uFocus: { value: new THREE.Vector2(0, 0) },
      uHeat: { value: 0 },
      uGlobal: { value: 0 },
      uHeatColor: { value: new THREE.Color(C_GOLD) },
      uHeatPoints: {
        value: [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, 0),
        ],
      },
      uHeatPointsLen: { value: 0 },
    };
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.ShaderMaterial({
        uniforms: floorUniforms,
        vertexShader: FLOOR_VERT,
        fragmentShader: FLOOR_FRAG,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    /* ─── GRID (blueprint underlay) ─────────────────────────────────── */
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);
    const gridMat = new THREE.LineBasicMaterial({
      // Navy-tinted instead of cool grey — sits in the same family as
      // racks + floor. Opacity nudged up slightly because the much
      // darker floor would otherwise eat the grid entirely.
      color: 0x223a5a,
      transparent: true,
      opacity: 0.22,
    });
    // longitudinal grid (along x): one line per column boundary
    for (let c = 0; c <= COLS; c++) {
      const zC = (c - COLS / 2) * COL_SPACING;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-TOTAL_X / 2 - 6, 0.005, zC),
        new THREE.Vector3(TOTAL_X / 2 + 6, 0.005, zC),
      ]);
      gridGroup.add(new THREE.Line(geo, gridMat));
    }
    // transverse grid (along z): one line per bay boundary
    for (let b = 0; b <= TOTAL_BAYS; b++) {
      const x = X_START + b * BAY_W + Math.floor(b / BAYS_PER_ZONE) * ZONE_GAP;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.005, -W_DEPTH / 2 - 2),
        new THREE.Vector3(x, 0.005, W_DEPTH / 2 + 2),
      ]);
      gridGroup.add(new THREE.Line(geo, gridMat));
    }

    /* ─── AISLE STRIPES (subtle gold lines down each aisle) ─────────── */
    const stripeMat = new THREE.MeshBasicMaterial({
      color: C_GOLD,
      transparent: true,
      opacity: 0.16,
    });
    for (let i = 1; i < AISLES_Z.length - 1; i++) {
      const z = AISLES_Z[i];
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(TOTAL_X + 14, 0.07),
        stripeMat
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, 0.014, z);
      scene.add(mesh);
    }

    /* ─── RACKS (instanced) ─────────────────────────────────────────── */
    const rackGeo = new THREE.BoxGeometry(RACK_W, RACK_H, RACK_D);
    rackGeo.translate(0, RACK_H / 2, 0);
    const rackMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.78,
      metalness: 0.05,
    });
    const RACK_INSTANCES = TOTAL_BAYS * COLS * 2;
    const racks = new THREE.InstancedMesh(rackGeo, rackMat, RACK_INSTANCES);
    racks.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(RACK_INSTANCES * 3),
      3
    );
    const dummy = new THREE.Object3D();
    const baseRackColor = new THREE.Color(C_RACK);
    const rackPositions = [];
    const rackIdByKey = {};
    let idx = 0;
    for (let col = 0; col < COLS; col++) {
      const zC = (col - (COLS - 1) / 2) * COL_SPACING;
      for (let b = 0; b < TOTAL_BAYS; b++) {
        const x = bayToX(b);
        for (let s = 0; s < 2; s++) {
          const z = zC + (s === 0 ? -RACK_D / 2 : RACK_D / 2);
          dummy.position.set(x, 0, z);
          dummy.scale.set(1, 0, 1);
          dummy.updateMatrix();
          racks.setMatrixAt(idx, dummy.matrix);
          racks.setColorAt(idx, baseRackColor);
          rackPositions.push({ x, z, bay: b, col, side: s });
          rackIdByKey[`${b}-${col}-${s}`] = idx;
          idx++;
        }
      }
    }
    racks.instanceMatrix.needsUpdate = true;
    racks.instanceColor.needsUpdate = true;
    scene.add(racks);

    /* Single buffered LineSegments for every rack's edges. */
    const edgeGeo = new THREE.EdgesGeometry(rackGeo);
    const ep = edgeGeo.attributes.position.array;
    const allEdges = [];
    for (const p of rackPositions) {
      for (let i = 0; i < ep.length; i += 3) {
        allEdges.push(ep[i] + p.x, ep[i + 1], ep[i + 2] + p.z);
      }
    }
    const racksEdges = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(allEdges, 3)
      ),
      new THREE.LineBasicMaterial({
        color: C_RACK_EDGE,
        transparent: true,
        opacity: 0.55,
      })
    );
    racksEdges.scale.y = 0;
    scene.add(racksEdges);

    /* ─── LIGHTING ──────────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xcfcfd6, 0.78));
    scene.add(new THREE.HemisphereLight(0xfff0d4, 0x202028, 0.4));
    const key = new THREE.DirectionalLight(0xfff4dc, 0.35);
    key.position.set(20, 50, 18);
    scene.add(key);

    /* ─── ITEMS (gold orbs, light beams, ground rings) ──────────────── */
    function makeItem(p, idxItem) {
      const grp = new THREE.Group();
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 16, 12),
        new THREE.MeshBasicMaterial({ color: C_GOLD })
      );
      sphere.position.set(p.x, p.y, p.z);
      grp.add(sphere);

      const beamGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p.x, p.y, p.z),
        new THREE.Vector3(p.x, 9, p.z),
      ]);
      const beam = new THREE.Line(
        beamGeo,
        new THREE.LineBasicMaterial({
          color: C_GOLD,
          transparent: true,
          opacity: 0.2,
        })
      );
      grp.add(beam);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.46, 0.62, 32),
        new THREE.MeshBasicMaterial({
          color: C_GOLD,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(p.x, 0.022, p.z);
      grp.add(ring);

      scene.add(grp);
      return {
        grp,
        sphere,
        beam,
        ring,
        sphereMat: sphere.material,
        beamMat: beam.material,
        ringMat: ring.material,
        baseY: p.y,
        x: p.x,
        z: p.z,
        idx: idxItem,
      };
    }
    const itemObjs = ITEM_POS.map(makeItem);

    /* ─── FORECAST CURVES (3D space curves for ANTICIPATE) ───────── */
    const forecastCurves = PREDICT_INDICES.map((itemIdx) => {
      const p = ITEM_POS[itemIdx];
      const pts = [];
      const N = 60;
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const x = p.x + Math.sin(t * Math.PI * 0.7) * 1.8;
        const y = p.y + t * 6.4;
        const z = p.z - t * 2.6;
        pts.push(new THREE.Vector3(x, y, z));
      }
      const positions = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        positions[i * 3] = pts[i].x;
        positions[i * 3 + 1] = pts[i].y;
        positions[i * 3 + 2] = pts[i].z;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setDrawRange(0, 0);
      const mat = new THREE.LineBasicMaterial({
        color: C_RED,
        transparent: true,
        opacity: 0.9,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);

      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 10),
        new THREE.MeshBasicMaterial({ color: C_RED })
      );
      tip.visible = false;
      scene.add(tip);

      return { line, mat, geo, N, pts, tip, itemIdx };
    });

    /* ─── PICKER (procedural AMR) ───────────────────────────────────── */
    function makePicker() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.8, 1.1),
        new THREE.MeshStandardMaterial({
          color: 0x303038,
          roughness: 0.48,
          metalness: 0.55,
        })
      );
      body.position.y = 0.4;
      g.add(body);
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.18, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x1a1a20 })
      );
      top.position.y = 0.89;
      g.add(top);
      const beaconMat = new THREE.MeshBasicMaterial({ color: C_GOLD });
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 10, 8),
        beaconMat
      );
      beacon.position.y = 1.09;
      g.add(beacon);
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(1.05, 24),
        new THREE.MeshBasicMaterial({
          color: C_GOLD,
          transparent: true,
          opacity: 0.35,
        })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.005;
      g.add(glow);
      g.userData = { beaconMat, glow };
      return g;
    }
    const picker = makePicker();
    picker.position.set(0, 0, DOCK_Z);
    picker.visible = false;
    scene.add(picker);

    /* ─── WORKER (HEAR mode) ────────────────────────────────────────── */
    const worker = (() => {
      const g = new THREE.Group();
      const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.48, 1.3, 12),
        new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.6 })
      );
      torso.position.y = 0.9;
      g.add(torso);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 14, 12),
        new THREE.MeshStandardMaterial({ color: 0x36363c, roughness: 0.6 })
      );
      head.position.y = 1.85;
      g.add(head);
      const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(0.29, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: C_GOLD })
      );
      helmet.position.y = 1.93;
      g.add(helmet);
      // Worker stands east of the target item, in the same aisle, so
      // the beam arcs across the warehouse to the resolved SKU.
      g.position.set(-10, 0, 6);
      g.visible = false;
      return g;
    })();
    scene.add(worker);

    /* ─── VOICE BEAM (HEAR mode) ────────────────────────────────────── */
    const beamMat = new THREE.LineBasicMaterial({
      color: C_GOLD_HOT,
      transparent: true,
      opacity: 0,
    });
    const voiceGeo = new THREE.BufferGeometry();
    voiceGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(6), 3)
    );
    const voiceBeam = new THREE.Line(voiceGeo, beamMat);
    scene.add(voiceBeam);

    /* ─── PICKER TRAIL ──────────────────────────────────────────────── */
    function makeTrail(color) {
      const maxSeg = 220;
      const positions = new Float32Array(maxSeg * 4 * 3);
      const indices = new Uint16Array(maxSeg * 6);
      const geo = new THREE.BufferGeometry();
      const posAttr = new THREE.BufferAttribute(positions, 3);
      posAttr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute("position", posAttr);
      const idxAttr = new THREE.BufferAttribute(indices, 1);
      idxAttr.setUsage(THREE.DynamicDrawUsage);
      geo.setIndex(idxAttr);
      geo.setDrawRange(0, 0);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      return { mesh, positions, indices, geo, mat };
    }
    const trail = makeTrail(C_GOLD);

    function updateTrail(waypoints, width, yOffset) {
      const positions = trail.positions;
      const indices = trail.indices;
      let vi = 0,
        ii = 0;
      for (let i = 0; i < waypoints.length - 1; i++) {
        const [x1, z1] = waypoints[i];
        const [x2, z2] = waypoints[i + 1];
        const dx = x2 - x1,
          dz = z2 - z1;
        const len = Math.hypot(dx, dz);
        if (len < 0.01) continue;
        const px = (-dz / len) * (width / 2);
        const pz = (dx / len) * (width / 2);
        positions[vi * 3] = x1 + px;
        positions[vi * 3 + 1] = yOffset;
        positions[vi * 3 + 2] = z1 + pz;
        positions[(vi + 1) * 3] = x1 - px;
        positions[(vi + 1) * 3 + 1] = yOffset;
        positions[(vi + 1) * 3 + 2] = z1 - pz;
        positions[(vi + 2) * 3] = x2 + px;
        positions[(vi + 2) * 3 + 1] = yOffset;
        positions[(vi + 2) * 3 + 2] = z2 + pz;
        positions[(vi + 3) * 3] = x2 - px;
        positions[(vi + 3) * 3 + 1] = yOffset;
        positions[(vi + 3) * 3 + 2] = z2 - pz;
        indices[ii] = vi;
        indices[ii + 1] = vi + 1;
        indices[ii + 2] = vi + 2;
        indices[ii + 3] = vi + 1;
        indices[ii + 4] = vi + 3;
        indices[ii + 5] = vi + 2;
        vi += 4;
        ii += 6;
        if (vi + 4 > positions.length / 3) break;
      }
      trail.geo.attributes.position.needsUpdate = true;
      trail.geo.index.needsUpdate = true;
      trail.geo.setDrawRange(0, ii);
    }

    function waypointsUpTo(t) {
      const td = clamp(t, 0, 1) * OPT_TOTAL;
      const out = [OPT.waypoints[0]];
      for (const sg of OPT.segs) {
        if (td <= sg.e) {
          const k = sg.d > 0 ? (td - sg.s) / sg.d : 0;
          out.push([lerp(sg.x1, sg.x2, k), lerp(sg.z1, sg.z2, k)]);
          return out;
        }
        out.push([sg.x2, sg.z2]);
      }
      return out;
    }

    /* ─── DOCK RING ─────────────────────────────────────────────────── */
    const dockRing = new THREE.Mesh(
      new THREE.RingGeometry(2.0, 2.4, 40),
      new THREE.MeshBasicMaterial({
        color: C_GOLD,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })
    );
    dockRing.rotation.x = -Math.PI / 2;
    dockRing.position.set(0, 0.03, DOCK_Z);
    scene.add(dockRing);

    /* ─── PARTICLE ATTENTION SWARM ──────────────────────────────────── */
    const N_PARTICLES = 240;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(N_PARTICLES * 3);
    const partRand = new Float32Array(N_PARTICLES * 3);
    for (let i = 0; i < N_PARTICLES; i++) {
      partRand[i * 3] = Math.random() * Math.PI * 2;
      partRand[i * 3 + 1] = 3 + Math.random() * 9;
      partRand[i * 3 + 2] = 0.5 + Math.random() * 4;
    }
    partGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(partPos, 3).setUsage(THREE.DynamicDrawUsage)
    );
    const partMat = new THREE.PointsMaterial({
      color: C_GOLD,
      size: 0.12,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    /* ─── 3D-ANCHORED CARD PROJECTION ────────────────────────────────
       For each card key:
         1. Project the 3D anchor to screen.
         2. Position the card at (anchor + screen-space lift/slide) so
            it sits above/beside the action instead of on top of it.
         3. Update the SVG leader line from anchor → card edge.
         4. Update the small gold tick dot at the anchor itself.
       Direct DOM/SVG mutation each frame — no React re-render. */
    const tmpProj = new THREE.Vector3();

    function projectAnchor(key) {
      const a = anchorsRef.current[key];
      const el = cardElems.current[key];
      const line = lineElems.current[key];
      const dot = dotElems.current[key];
      if (!el) return;

      const hide = () => {
        el.style.opacity = "0";
        if (line) line.style.opacity = "0";
        if (dot) dot.style.opacity = "0";
      };

      if (!a || a.opacity <= 0.005) {
        hide();
        return;
      }

      tmpProj.set(a.x, a.y, a.z).project(camera);

      // Behind the camera: hide.
      if (tmpProj.z > 1) {
        hide();
        return;
      }

      const sx = (tmpProj.x * 0.5 + 0.5) * w;
      const sy = (-tmpProj.y * 0.5 + 0.5) * h;

      // Soft fade as the anchor approaches the frustum edge.
      const FALL = 0.92;
      let edge = 1;
      const ax = Math.abs(tmpProj.x);
      const ay = Math.abs(tmpProj.y);
      if (ax > FALL) edge *= Math.max(0, 1 - (ax - FALL) * 18);
      if (ay > FALL) edge *= Math.max(0, 1 - (ay - FALL) * 18);

      // Depth-based scale — closer anchors get bigger cards.
      const dx = a.x - camera.position.x;
      const dy = a.y - camera.position.y;
      const dz = a.z - camera.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const distScale = clamp(60 / dist, 0.6, 1.25) * (a.scale ?? 1);

      // Screen-space offset for the card. Lifts it above the action
      // so the leader line has room. Scales with distScale so the
      // visual gap stays consistent at different zooms.
      const lift = (a.lift ?? 0) * distScale;
      const slide = (a.slide ?? 0) * distScale;
      const cardX = sx + slide;
      const cardY = sy - lift;

      // Card sits with its BOTTOM-CENTER at (cardX, cardY) when the
      // anchor is below, so it visually "hangs" from the leader line.
      // When lift is 0, fall back to a center-anchored card (used for
      // WAKE/LEARN where the card floats free above the floor).
      const yAnchorPct = lift > 4 ? -100 : -50;
      el.style.transform =
        `translate3d(${cardX}px, ${cardY}px, 0) ` +
        `translate(-50%, ${yAnchorPct}%) scale(${distScale})`;
      el.style.opacity = String(a.opacity * edge);

      // Leader line — anchor → card bottom edge. Hidden when the card
      // is anchored without a lift (WAKE/LEARN) or when showLeader is
      // explicitly off.
      if (line) {
        if (a.showLeader && lift > 4) {
          line.setAttribute("x1", sx);
          line.setAttribute("y1", sy - 4);
          line.setAttribute("x2", cardX);
          line.setAttribute("y2", cardY - 2);
          line.style.opacity = String(a.opacity * edge * 0.55);
        } else {
          line.style.opacity = "0";
        }
      }
      // Anchor tick — small gold square at the anchor point.
      if (dot) {
        if (a.showLeader) {
          dot.setAttribute("cx", sx);
          dot.setAttribute("cy", sy);
          dot.style.opacity = String(a.opacity * edge * 0.9);
        } else {
          dot.style.opacity = "0";
        }
      }
    }

    /* ─── RESIZE ───────────────────────────────────────────────────── */
    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        ScrollTrigger.refresh();
      }, 120);
    };
    window.addEventListener("resize", onResize);
    resize();

    /* ─── SCROLLTRIGGER ────────────────────────────────────────────── */
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top 72px",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    /* ─── HELPERS ──────────────────────────────────────────────────── */
    const tmpColor = new THREE.Color();
    const tmpMatrix = new THREE.Matrix4();
    const tmpVec = new THREE.Vector3();
    const tmpQuat = new THREE.Quaternion();
    const tmpScale = new THREE.Vector3();

    function setRackRiseY(scale) {
      for (let i = 0; i < RACK_INSTANCES; i++) {
        racks.getMatrixAt(i, tmpMatrix);
        tmpMatrix.decompose(tmpVec, tmpQuat, tmpScale);
        tmpScale.set(1, scale, 1);
        tmpMatrix.compose(tmpVec, tmpQuat, tmpScale);
        racks.setMatrixAt(i, tmpMatrix);
      }
      racks.instanceMatrix.needsUpdate = true;
      racksEdges.scale.y = scale;
    }

    function highlightRack(instId, hex, intensity = 1) {
      if (instId === undefined) return;
      const c = new THREE.Color().setHex(hex);
      const base = new THREE.Color(C_RACK);
      base.lerp(c, intensity);
      racks.setColorAt(instId, base);
      racks.instanceColor.needsUpdate = true;
    }

    function resetRackColors() {
      const c = new THREE.Color(C_RACK);
      for (let i = 0; i < RACK_INSTANCES; i++) racks.setColorAt(i, c);
      racks.instanceColor.needsUpdate = true;
    }

    function rackIdForItem(itemIdx) {
      const it = ITEMS[itemIdx];
      return rackIdByKey[`${it.bay}-${it.col}-${it.side}`];
    }

    /* ─── RENDER LOOP ───────────────────────────────────────────────── */
    let uiTick = 0;
    const t0 = performance.now();
    let rafId;

    function render() {
      const time = (performance.now() - t0) / 1000;
      const p = progressRef.current;
      const mode = modeFromP(p);
      const isPaused = pausedRef.current;

      /* Camera */
      const cs = camAt(p);
      camera.position.x = Math.cos(cs.ang) * cs.rad + cs.tx * 0.2;
      camera.position.z = Math.sin(cs.ang) * cs.rad + cs.tz * 0.2;
      camera.position.y = cs.h;
      camera.lookAt(cs.tx, cs.ty, cs.tz);

      /* Defaults — modes override */
      picker.visible = false;
      worker.visible = false;
      voiceBeam.material.opacity = 0;
      trail.mesh.visible = false;
      dockRing.material.opacity = 0;
      partMat.opacity = 0;
      forecastCurves.forEach((fc) => {
        fc.geo.setDrawRange(0, 0);
        fc.tip.visible = false;
        fc.mat.opacity = 0.9;
      });

      // Reset all card anchors to invisible; modes set their own.
      const A = anchorsRef.current;
      A.wake.opacity = 0;
      A.hear.opacity = 0;
      A.forecast.opacity = 0;
      A.act.opacity = 0;
      A.learn.opacity = 0;

      let liveDist = 0,
        livePicks = 0;

      // ─── MODE 0 · WAKE ─────────────────────────────────────────────
      if (mode === 0) {
        const t = localT(p, M_WAKE);
        // Racks rise in cascade — by bay index, staggered.
        for (const r of rackPositions) {
          const stagger = (r.bay / TOTAL_BAYS) * 0.5;
          const s = smoothstep((t - stagger) / 0.5);
          const id = rackIdByKey[`${r.bay}-${r.col}-${r.side}`];
          racks.getMatrixAt(id, tmpMatrix);
          tmpMatrix.decompose(tmpVec, tmpQuat, tmpScale);
          tmpScale.set(1, s, 1);
          tmpMatrix.compose(tmpVec, tmpQuat, tmpScale);
          racks.setMatrixAt(id, tmpMatrix);
        }
        racks.instanceMatrix.needsUpdate = true;
        racksEdges.scale.y = smoothstep(t * 1.4 - 0.3);

        const itemAlpha = smoothstep((t - 0.6) / 0.4);
        for (const it of itemObjs) {
          it.sphere.scale.setScalar(itemAlpha * 0.9);
          it.ringMat.opacity = 0.6 * itemAlpha;
          it.beamMat.opacity = 0.16 * itemAlpha;
          it.sphereMat.color.setHex(C_GOLD);
          it.ringMat.color.setHex(C_GOLD);
          it.beamMat.color.setHex(C_GOLD);
          it.sphere.position.y = it.baseY;
        }

        floorUniforms.uHeat.value = 0;
        floorUniforms.uGlobal.value = 0;
        floorUniforms.uHeatPointsLen.value = 0;

        // Anchor the WAKE card high above the warehouse center.
        A.wake.x = 0;
        A.wake.y = 16;
        A.wake.z = -4;
        A.wake.opacity = smoothstep((t - 0.05) / 0.4);
      }

      // ─── MODE 1 · HEAR ─────────────────────────────────────────────
      else if (mode === 1) {
        const t = localT(p, M_HEAR);
        setRackRiseY(1);
        racksEdges.scale.y = 1;
        resetRackColors();

        // Worker stays in place; faces the target.
        worker.visible = true;
        const tgt = ITEM_POS[HEAR_TARGET];
        const fdx = tgt.x - worker.position.x;
        const fdz = tgt.z - worker.position.z;
        worker.rotation.y = Math.atan2(fdx, fdz);

        // Items: dim except the target SKU.
        for (let i = 0; i < itemObjs.length; i++) {
          const it = itemObjs[i];
          const isTarget = i === HEAR_TARGET;
          it.sphere.scale.setScalar(
            isTarget ? 1 + 0.18 * Math.sin(time * 5) : 0.65
          );
          it.sphereMat.color.setHex(isTarget ? C_GOLD_HOT : C_GOLD);
          it.ringMat.color.setHex(isTarget ? C_GOLD_HOT : C_GOLD);
          it.ringMat.opacity = isTarget ? 0.95 : 0.22;
          it.beamMat.color.setHex(isTarget ? C_GOLD_HOT : C_GOLD);
          it.beamMat.opacity = isTarget ? 0.65 : 0.05;
          if (!isPaused) {
            it.sphere.position.y =
              it.baseY + (isTarget ? Math.sin(time * 3) * 0.12 : 0);
          }
        }

        const targetRackId = rackIdForItem(HEAR_TARGET);
        const beamReveal = smoothstep((t - 0.2) / 0.35);
        highlightRack(targetRackId, C_GOLD_HOT, 0.6 * beamReveal);

        // Voice beam from worker to target item.
        const sx = worker.position.x,
          sy = 1.9,
          sz = worker.position.z;
        const ex = tgt.x,
          ey = tgt.y,
          ez = tgt.z;
        const positions = voiceBeam.geometry.attributes.position.array;
        positions[0] = sx;
        positions[1] = sy;
        positions[2] = sz;
        const beamK = beamReveal;
        positions[3] = lerp(sx, ex, beamK);
        positions[4] = lerp(sy, ey, beamK) + Math.sin(beamK * Math.PI) * 1.8;
        positions[5] = lerp(sz, ez, beamK);
        voiceBeam.geometry.attributes.position.needsUpdate = true;
        voiceBeam.material.opacity = beamReveal * 0.9;

        const swarmAlpha = smoothstep((t - 0.35) / 0.4);
        partMat.opacity = swarmAlpha * 0.85;
        partMat.color.setHex(C_GOLD);
        for (let i = 0; i < N_PARTICLES; i++) {
          const phase = partRand[i * 3] + time * 0.4;
          const r = partRand[i * 3 + 1] * 0.4;
          const yJit = partRand[i * 3 + 2] * 0.5;
          partPos[i * 3] = tgt.x + Math.cos(phase) * r;
          partPos[i * 3 + 1] = tgt.y + Math.sin(phase * 1.7) * yJit;
          partPos[i * 3 + 2] = tgt.z + Math.sin(phase) * r;
        }
        partGeo.attributes.position.needsUpdate = true;

        floorUniforms.uFocus.value.set(tgt.x, tgt.z);
        floorUniforms.uHeat.value = swarmAlpha;
        floorUniforms.uHeatColor.value.setHex(C_GOLD);
        floorUniforms.uGlobal.value = 0;
        floorUniforms.uHeatPointsLen.value = 0;

        // Card anchor: midway between worker and target, raised up so
        // it doesn't overlap either entity, and visible at the HEAR
        // camera angle.
        // Anchor at the resolved SKU. The leader line will trace from
        // the item's actual 3D position up to the card.
        A.hear.x = tgt.x;
        A.hear.y = tgt.y;
        A.hear.z = tgt.z;
        A.hear.opacity = smoothstep((t - 0.2) / 0.3);
      }

      // ─── MODE 2 · ANTICIPATE ───────────────────────────────────────
      else if (mode === 2) {
        const t = localT(p, M_PREDICT);
        setRackRiseY(1);
        racksEdges.scale.y = 1;
        resetRackColors();

        const pulse = 0.7 + Math.sin(time * 2.4) * 0.3;
        PREDICT_INDICES.forEach((iIdx) => {
          const rid = rackIdForItem(iIdx);
          highlightRack(rid, C_RED, 0.4 + 0.25 * pulse);
        });

        for (let i = 0; i < itemObjs.length; i++) {
          const it = itemObjs[i];
          const isPred = PREDICT_INDICES.includes(i);
          it.sphere.scale.setScalar(
            isPred ? 1 + 0.22 * Math.sin(time * 4 + i) : 0.55
          );
          it.sphereMat.color.setHex(isPred ? C_RED : C_GOLD);
          it.ringMat.color.setHex(isPred ? C_RED : C_GOLD);
          it.ringMat.opacity = isPred ? 0.9 : 0.13;
          it.beamMat.color.setHex(isPred ? C_RED : C_GOLD);
          it.beamMat.opacity = isPred ? 0.65 : 0.03;
          if (!isPaused) {
            it.sphere.position.y =
              it.baseY + (isPred ? Math.sin(time * 3 + i) * 0.13 : 0);
          }
        }

        forecastCurves.forEach((fc, k) => {
          const fk = smoothstep((t - 0.15 - k * 0.06) / 0.35);
          const n = Math.floor(fc.N * fk);
          fc.geo.setDrawRange(0, n);
          fc.mat.opacity = 0.85 * fk;
          if (n > 0) {
            fc.tip.visible = true;
            fc.tip.position.copy(fc.pts[Math.max(0, n - 1)]);
            const s = 0.18 + Math.sin(time * 4 + k) * 0.04;
            fc.tip.scale.setScalar(1 + s);
          }
        });

        // Centroid of predicted items — both the floor focus and the
        // forecast card anchor.
        let cx = 0,
          cz = 0;
        PREDICT_INDICES.forEach((i) => {
          cx += ITEM_POS[i].x;
          cz += ITEM_POS[i].z;
        });
        cx /= PREDICT_INDICES.length;
        cz /= PREDICT_INDICES.length;

        const swarmA = smoothstep((t - 0.3) / 0.35);
        partMat.opacity = swarmA * 0.7;
        partMat.color.setHex(C_RED);
        for (let i = 0; i < N_PARTICLES; i++) {
          const phase = partRand[i * 3] + time * 0.3;
          const r = partRand[i * 3 + 1] * 0.6;
          partPos[i * 3] = cx + Math.cos(phase) * r;
          partPos[i * 3 + 1] = 0.4 + partRand[i * 3 + 2] * 1.2;
          partPos[i * 3 + 2] = cz + Math.sin(phase) * r;
        }
        partGeo.attributes.position.needsUpdate = true;

        floorUniforms.uFocus.value.set(cx, cz);
        floorUniforms.uHeat.value = swarmA * 0.7;
        floorUniforms.uHeatColor.value.setHex(C_RED);
        floorUniforms.uGlobal.value = 0;
        floorUniforms.uHeatPointsLen.value = 0;

        // Anchor at the centroid of the three predicted items, at
        // their typical bin height — the leader rises from "the
        // things that are depleting" up to the forecast card.
        A.forecast.x = cx;
        A.forecast.y = 3;
        A.forecast.z = cz;
        A.forecast.opacity = smoothstep((t - 0.4) / 0.3);
      }

      // ─── MODE 3 · ACT ──────────────────────────────────────────────
      else if (mode === 3) {
        const t = localT(p, M_ACT);
        setRackRiseY(1);
        racksEdges.scale.y = 1;
        resetRackColors();

        const optT = t;
        const pos = positionOnRoute(optT);
        picker.visible = true;
        picker.position.set(pos.x, 0, pos.z);

        const ahead = positionOnRoute(clamp(optT + 0.005, 0, 1));
        const dx = ahead.x - pos.x,
          dz = ahead.z - pos.z;
        if (dx !== 0 || dz !== 0) {
          picker.rotation.y = Math.atan2(dx, dz);
        }

        const wp = waypointsUpTo(optT);
        updateTrail(wp, 0.7, 0.05);
        trail.mesh.visible = true;
        trail.mat.opacity = 0.9;
        trail.mat.color.setHex(C_GOLD);

        picker.userData.beaconMat.color.setHex(C_GOLD_HOT);
        picker.userData.glow.material.opacity = 0.32 + Math.sin(time * 5) * 0.1;

        let picked = 0;
        for (let i = 0; i < itemObjs.length; i++) {
          const it = itemObjs[i];
          const wasPicked = optT >= PICK_TS[i];
          if (wasPicked) picked++;
          const sinceWindow = clamp((optT - PICK_TS[i]) / 0.02, 0, 1);
          if (wasPicked && sinceWindow < 1) {
            // pickup animation: item lifts toward the picker
            const lift = sinceWindow;
            it.sphere.position.x = lerp(it.x, pos.x, lift);
            it.sphere.position.y = lerp(it.baseY, 1.3, lift);
            it.sphere.position.z = lerp(it.z, pos.z, lift);
            it.sphere.scale.setScalar(1 + 0.5 * (1 - lift));
            it.sphereMat.color.setHex(C_GOLD_HOT);
            it.ringMat.opacity = 0.5 * (1 - lift);
            it.beamMat.opacity = 0;
          } else if (wasPicked) {
            it.sphere.scale.setScalar(0);
            it.ringMat.opacity = 0.25;
            it.ringMat.color.setHex(C_GREEN);
            it.beamMat.opacity = 0;
          } else {
            it.sphere.position.set(it.x, it.baseY, it.z);
            it.sphere.scale.setScalar(0.88);
            it.sphereMat.color.setHex(C_GOLD);
            it.ringMat.color.setHex(C_GOLD);
            it.ringMat.opacity = 0.55;
            it.beamMat.color.setHex(C_GOLD);
            it.beamMat.opacity = 0.18;
          }
        }
        livePicks = picked;
        liveDist = optT * OPT_TOTAL;

        partMat.opacity = 0.6;
        partMat.color.setHex(C_GOLD);
        for (let i = 0; i < N_PARTICLES; i++) {
          const phase = partRand[i * 3] + time * 0.6;
          const r = partRand[i * 3 + 1] * 0.3;
          partPos[i * 3] = pos.x + Math.cos(phase) * r;
          partPos[i * 3 + 1] = 0.4 + partRand[i * 3 + 2] * 0.5;
          partPos[i * 3 + 2] = pos.z + Math.sin(phase) * r;
        }
        partGeo.attributes.position.needsUpdate = true;

        floorUniforms.uFocus.value.set(pos.x, pos.z);
        floorUniforms.uHeat.value = 0.75;
        floorUniforms.uHeatColor.value.setHex(C_GOLD);
        floorUniforms.uGlobal.value = 0;
        floorUniforms.uHeatPointsLen.value = 0;

        dockRing.material.opacity = 0.4;
        dockRing.material.color.setHex(C_GOLD);

        // ACT card floats above and slightly behind the picker, in
        // world space — it follows the picker around the warehouse.
        // Anchor at the picker. From the overhead camera, the leader
        // line traces straight up from the picker's position on the
        // floor to the live-stats card hanging above.
        A.act.x = pos.x;
        A.act.y = 0.5;
        A.act.z = pos.z;
        A.act.opacity = smoothstep(t * 4);
      }

      // ─── MODE 4 · LEARN ────────────────────────────────────────────
      // Two phases:
      //   1) t in [0, 0.55]: "the floor remembers" — racks held up,
      //      heat-points pulse, particles drift, card visible.
      //   2) t in [0.55, 1.0]: reverse the WAKE intro. Racks cascade
      //      back to scale.y=0 with REVERSE bay stagger so the
      //      last-built racks collapse first. Items, particles,
      //      picker, dock, trail, and card all fade to zero. We end
      //      on an empty 2D floor — same composition WAKE began with.
      else {
        const t = localT(p, M_LEARN);
        const collapseT = smoothstep((t - 0.55) / 0.45);
        const standing = 1 - collapseT; // 1 → 0 across the collapse

        resetRackColors();

        // Per-rack cascading collapse — last-built first.
        let maxScale = 0;
        for (const r of rackPositions) {
          const stagger = (1 - r.bay / TOTAL_BAYS) * 0.55;
          const localCollapse = smoothstep((collapseT - stagger) / 0.45);
          const s = 1 - localCollapse;
          if (s > maxScale) maxScale = s;
          const id = rackIdByKey[`${r.bay}-${r.col}-${r.side}`];
          racks.getMatrixAt(id, tmpMatrix);
          tmpMatrix.decompose(tmpVec, tmpQuat, tmpScale);
          tmpScale.set(1, s, 1);
          tmpMatrix.compose(tmpVec, tmpQuat, tmpScale);
          racks.setMatrixAt(id, tmpMatrix);
        }
        racks.instanceMatrix.needsUpdate = true;
        racksEdges.scale.y = maxScale;

        // Items collapse and fade with the racks.
        for (const it of itemObjs) {
          it.sphere.position.set(it.x, it.baseY * standing, it.z);
          it.sphere.scale.setScalar(0.65 * standing);
          it.sphereMat.color.setHex(C_GREEN);
          it.ringMat.color.setHex(C_GREEN);
          it.ringMat.opacity = 0.35 * standing;
          it.beamMat.color.setHex(C_GREEN);
          it.beamMat.opacity = 0;
        }

        // Picker: parked at dock, beacon green, fades out at the end.
        picker.visible = standing > 0.02;
        picker.position.set(0, 0, DOCK_Z);
        picker.rotation.y = 0;
        picker.userData.beaconMat.color.setHex(C_GREEN);
        picker.userData.glow.material.opacity = 0.25 * standing;

        updateTrail(ROUTE, 0.5, 0.04);
        trail.mesh.visible = standing > 0.02;
        trail.mat.opacity = 0.26 * standing;
        trail.mat.color.setHex(C_GOLD);

        // Heat-points pulse and then fade with the collapse.
        const heatPulse = 0.6 + Math.sin(time * 1.4) * 0.15;
        const hp = floorUniforms.uHeatPoints.value;
        hp[0].set(bayToX(2), heatPulse * 0.9, 0);
        hp[1].set(bayToX(8), heatPulse * 1.0, 4);
        hp[2].set(bayToX(14), heatPulse * 0.8, -4);
        hp[3].set(bayToX(18), heatPulse * 0.7, 2);
        floorUniforms.uHeatPointsLen.value = 4;
        floorUniforms.uHeatColor.value.setHex(C_GOLD);
        floorUniforms.uGlobal.value = smoothstep(t * 2.4) * standing;
        floorUniforms.uHeat.value = 0;

        partMat.opacity = 0.35 * standing;
        partMat.color.setHex(C_GOLD);
        for (let i = 0; i < N_PARTICLES; i++) {
          const phase = partRand[i * 3] + time * 0.15;
          partPos[i * 3] = Math.cos(phase) * (14 + partRand[i * 3 + 1] * 2);
          partPos[i * 3 + 1] = 0.4 + partRand[i * 3 + 2] * 0.6;
          partPos[i * 3 + 2] =
            Math.sin(phase * 1.3) * (9 + partRand[i * 3 + 2] * 2);
        }
        partGeo.attributes.position.needsUpdate = true;

        dockRing.material.opacity = 0.5 * standing;
        dockRing.material.color.setHex(C_GREEN);

        // LEARN card sits at warehouse center. Fades in during phase 1
        // and out during the collapse so the final frame is empty.
        A.learn.x = 0;
        A.learn.y = 8;
        A.learn.z = 0;
        A.learn.opacity = smoothstep(t * 2.6) * standing;
      }

      renderer.render(scene, camera);

      /* Project all card anchors to screen space. Direct DOM mutation
         (no React re-render) for per-frame performance. */
      projectAnchor("wake");
      projectAnchor("hear");
      projectAnchor("forecast");
      projectAnchor("act");
      projectAnchor("learn");

      /* React state — only for live numeric readouts that flow into
         React-controlled DOM (the ACT stats card). Throttled. */
      uiTick++;
      if (uiTick >= 5) {
        uiTick = 0;
        const distOpt = Math.round(liveDist);
        const timeOpt = fmtTime((distOpt / Math.max(1, OPT_TOTAL)) * OPT_TIME);
        setUi({ mode, distOpt, timeOpt, pickedOpt: livePicks });
      }

      rafId = requestAnimationFrame(render);
    }
    render();

    /* ─── CLEANUP ──────────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      st.kill();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material))
            obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, []);

  /* ════════════════════════════════════════════════════════════════
     OVERLAY UI — every panel is anchored to a 3D world position via
     direct DOM transform updates in the render loop. Cards live in
     the scene.
     ════════════════════════════════════════════════════════════════ */
  const m = ui.mode;
  const def = MODE_DEFS[m];

  return (
    <section ref={sectionRef} className={styles.section} id="wareh">
      <div ref={stickyRef} className={styles.sticky}>
        <canvas ref={canvasRef} className={styles.canvas} />

        {/* ─── Corner editorial keys (only true 2D affordances) ─── */}
        <div className={styles.corner + " " + styles.cornerTL}>
          <span className={styles.cornerKey}>FLOOR · 01</span>
          <span className={styles.cornerSub}>Nimbus / live</span>
        </div>
        <div className={styles.corner + " " + styles.cornerTR}>
          <span className={styles.cornerKey}>
            {def.num} · {def.label}
          </span>
          <span className={styles.cornerSub}>
            <span className={styles.dot} /> active
          </span>
        </div>

        {/* ─── LEADER-LINE OVERLAY ───────────────────────────────────
            One SVG fills the canvas area; one line + one dot per card.
            The render loop sets endpoints each frame so each leader
            tethers its card to the 3D anchor it annotates.
            Rendered BEFORE the cards so leaders terminate behind the
            card edge instead of running across it. */}
        <svg className={styles.leaderSvg} aria-hidden="true">
          <line ref={setLineRef("wake")} className={styles.leaderLine} />
          <line ref={setLineRef("hear")} className={styles.leaderLine} />
          <line
            ref={setLineRef("forecast")}
            className={styles.leaderLine + " " + styles.leaderLineRed}
          />
          <line ref={setLineRef("act")} className={styles.leaderLine} />
          <line ref={setLineRef("learn")} className={styles.leaderLine} />
          <circle
            ref={setDotRef("wake")}
            className={styles.leaderDot}
            r="3.5"
          />
          <circle
            ref={setDotRef("hear")}
            className={styles.leaderDot}
            r="3.5"
          />
          <circle
            ref={setDotRef("forecast")}
            className={styles.leaderDot + " " + styles.leaderDotRed}
            r="3.5"
          />
          <circle ref={setDotRef("act")} className={styles.leaderDot} r="3.5" />
          <circle
            ref={setDotRef("learn")}
            className={styles.leaderDot}
            r="3.5"
          />
        </svg>

        {/* ─── 3D-ANCHORED CARDS ─────────────────────────────────────
            Each card is absolutely positioned at (0,0) and moved into
            place by the render loop via transform: translate. Content
            follows a HEADLINE + SUPPORT hierarchy — the big number /
            word is the visual element; tiny mono key/value rows back
            it up. */}

        {/* WAKE — system boot, floats above warehouse center */}
        <div
          ref={setCardRef("wake")}
          className={styles.modeCard + " " + styles.wakeCard}
        >
          <div className={styles.cardLabel}>01 · BOOTING</div>
          <div className={styles.cardHeadline}>99.7%</div>
          <div className={styles.cardSubhead}>spatial coverage</div>
          <div className={styles.cardRule} />
          <div className={styles.cardSupport}>
            {TOTAL_BAYS} bays · {COLS} columns · {TOTAL_BAYS * COLS * 2} bin
            faces
          </div>
        </div>

        {/* HEAR — voice command card, anchored at resolved SKU */}
        <div
          ref={setCardRef("hear")}
          className={styles.modeCard + " " + styles.hearCard}
        >
          <div className={styles.cardLabel}>
            <span className={styles.hearWave}>
              {[...Array(7)].map((_, i) => (
                <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </span>
            02 · VOICE
          </div>
          <div className={styles.cardQuery}>
            “Where's the spare blade for unit 4471?”
          </div>
          <div className={styles.cardRule} />
          <div className={styles.cardResolve}>
            <span className={styles.cardResolveKey}>{HEAR_TARGET_CODE}</span>
            <span className={styles.cardResolveLoc}>Zone A · Bay 5 · L3</span>
          </div>
          <div className={styles.cardSupport}>28m walk · 0:14 ETA</div>
        </div>

        {/* PREDICT — depletion forecast, anchored at item centroid */}
        <div
          ref={setCardRef("forecast")}
          className={styles.modeCard + " " + styles.forecastCard}
        >
          <div className={styles.cardLabel + " " + styles.cardLabelRed}>
            03 · DEPLETION FORECAST
          </div>
          <div className={styles.cardHeadline}>3 SKUs</div>
          <div className={styles.cardSubhead}>critical · 48h window</div>
          <div className={styles.cardRule} />
          <div className={styles.forecastRows}>
            <div className={styles.forecastRow}>
              <span className={styles.forecastSku}>I3-392</span>
              <span className={styles.forecastEta}>31h</span>
            </div>
            <div className={styles.forecastRow}>
              <span className={styles.forecastSku}>D1-776</span>
              <span className={styles.forecastEta}>38h</span>
            </div>
            <div className={styles.forecastRow}>
              <span className={styles.forecastSku}>A1-217</span>
              <span className={styles.forecastEta}>47h</span>
            </div>
          </div>
          <div className={styles.cardSupport}>
            PO #2847 drafted ·{" "}
            <span className={styles.cardSupportAccent}>awaiting review</span>
          </div>
        </div>

        {/* ACT — live picker stats, follows the AMR from overhead */}
        <div
          ref={setCardRef("act")}
          className={styles.modeCard + " " + styles.actCard}
        >
          <div className={styles.cardLabel}>
            04 · ROUTE
            <span className={styles.cardLabelMeta}>executing</span>
          </div>
          <div className={styles.cardHeadline}>
            {String(ui.pickedOpt).padStart(2, "0")}
            <span className={styles.cardHeadlineDenom}>/12</span>
          </div>
          <div className={styles.cardSubhead}>picked</div>
          <div className={styles.cardRule} />
          <div className={styles.actRow}>
            <span className={styles.actRowVal}>{ui.distOpt}m</span>
            <span className={styles.actRowKey}>walked</span>
            <span className={styles.actRowSep}>·</span>
            <span className={styles.actRowVal + " " + styles.actRowAccent}>
              −{SAVED_PCT}%
            </span>
            <span className={styles.actRowKey}>vs naive</span>
          </div>
          <div className={styles.cardSupport}>
            naive {NAIVE_TOTAL}m · {fmtTime(NAIVE_TIME)} → optimal {OPT_M}m ·{" "}
            {fmtTime(OPT_TIME)}
          </div>
        </div>

        {/* LEARN — day rollup, centered above the warehouse */}
        <div
          ref={setCardRef("learn")}
          className={styles.modeCard + " " + styles.learnCard}
        >
          <div className={styles.cardLabel}>
            05 · DAY ROLLUP
            <span className={styles.cardLabelMeta}>floor learned</span>
          </div>
          <div className={styles.cardHeadline}>564</div>
          <div className={styles.cardSubhead}>picks · 47 orders · 1:28 avg</div>
          <div className={styles.cardRule} />
          <div className={styles.learnFacts}>
            <span>
              <span className={styles.learnFactsAccent}>−12%</span> avg pick
              time
            </span>
            <span className={styles.actRowSep}>·</span>
            <span>
              <span className={styles.learnFactsGood}>3</span> anomalies caught
            </span>
          </div>
          <div className={styles.cardSupport}>
            Tomorrow's plan recalculated.
          </div>
        </div>

        {/* ─── MODE INDICATOR (bottom, editorial chapter marker) ─── */}
        <div className={styles.modeIndicator}>
          <div className={styles.modeRow}>
            {MODE_DEFS.map((mdef, i) => (
              <span
                key={mdef.id}
                className={
                  styles.modeTick +
                  " " +
                  (i === m
                    ? styles.modeTickActive
                    : i < m
                    ? styles.modeTickPast
                    : "")
                }
              />
            ))}
            <span className={styles.modeNum}>{def.num}</span>
            <span className={styles.modeLabel}>{def.label}</span>
          </div>
          <div className={styles.modeTitle}>{def.title}</div>
        </div>
      </div>
      <div className={styles.scrollSpace} />
    </section>
  );
}
