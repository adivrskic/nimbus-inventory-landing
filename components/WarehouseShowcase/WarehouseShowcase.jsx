"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAnimationPaused } from "@/lib/AnimationContext";
import styles from "./WarehouseShowcase.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════════════════════════════════
   WarehouseShowcase — Cinematic Edition

   Same five-act story (WAKE · HEAR · ANTICIPATE · ACT · LEARN),
   dramatically refined:

   - Scene colors now track the site's OCEAN GRADIENT instead of flat
     black. The page's html gradient descends from a twilight navy at
     top to near-black abyss at the bottom (with --bg transparent so it
     shows through). The fog + far floor resolve to that twilight navy,
     so the warehouse sits IN the water rather than punching an opaque
     black slab into the gradient. (See color constants + the CSS, which
     makes the section transparent so the gradient flows through.)
   - Moderate ambient lift (no new lights): the existing Ambient +
     Hemisphere lights are raised so racks read as solid lit objects
     while staying moody/cinematic.
   - Per-zone rack base tint: each of the four warehouse zones gets a
     barely-different navy base so the zones read as distinct places
     even at rest.
   - Continuous camera parallax drift across the whole sequence layered
     on top of the per-beat path, so the piece feels like one cinematic
     move rather than five separate dioramas.
   - Cross-fade of floor heat color + rack highlight between beats so
     mode changes never pop.
   - Floor reflections: each gold item halo gets a stretched, dimmed
     mirror sprite on the floor, tying the floating orbs to the ground.
   - Racks gain capped tops (subtle emissive slab) + a shelf bar at
     mid-height. Edges are crisper.
   - Items get billboard halos with additive blending — proper glow
     without a postprocessing pass.
   - Forecast curves use Catmull-Rom interpolation for smooth arcs.
   - AMR picker: lower, sleeker silhouette with a soft forward scan glow.
   ════════════════════════════════════════════════════════════════════ */

/* ─── LAYOUT (unchanged) ────────────────────────────────────────── */
const ZONE_COUNT = 4;
const ZONE_LEN = 20;
const ZONE_GAP = 5;
const BAYS_PER_ZONE = 5;
const BAY_W = ZONE_LEN / BAYS_PER_ZONE;
const TOTAL_BAYS = ZONE_COUNT * BAYS_PER_ZONE;
const TOTAL_X = ZONE_COUNT * ZONE_LEN + (ZONE_COUNT - 1) * ZONE_GAP;
const X_START = -TOTAL_X / 2;

const COLS = 8;
const COL_SPACING = 5;
const RACK_W = 3.6;
const RACK_H = 5.4;
const RACK_D = 0.9;

const W_DEPTH = (COLS - 1) * COL_SPACING + RACK_D * 2 + 6;
const W_HALF_DEPTH = W_DEPTH / 2;
const DOCK_Z = W_HALF_DEPTH + 8;

const OUTER_N_Z = 19;
const OUTER_S_Z = -19;
const OUTER_E_X = 50;
const OUTER_W_X = -50;

const CROSS_X = [
  OUTER_W_X,
  X_START + 1 * ZONE_LEN + 0.5 * ZONE_GAP,
  X_START + 2 * ZONE_LEN + 1.5 * ZONE_GAP,
  X_START + 3 * ZONE_LEN + 2.5 * ZONE_GAP,
  OUTER_E_X,
];

const AISLES_Z = [];
for (let i = 0; i <= COLS; i++) {
  if (i === 0) AISLES_Z.push(OUTER_S_Z);
  else if (i === COLS) AISLES_Z.push(OUTER_N_Z);
  else AISLES_Z.push((i - 0.5 - (COLS - 1) / 2) * COL_SPACING);
}

/* ─── SCENE COLORS — tracked to the site's ocean gradient ──────────
   The site runs the ocean theme: html carries a scroll-attached
   gradient descending from --ocean-surface (#0a2240) at the top of the
   document to --ocean-abyss (#00020a) at the bottom, and --bg is
   transparent so that gradient shows through every section. Previously
   this showcase was hardcoded to pure black everywhere — section bg,
   fog, floor — which punched an opaque black slab into that gradient
   and read as "way too dark."

   Now the scene's fog + far floor resolve to the twilight-navy band the
   gradient is passing through here, so the warehouse sits IN the water:
   - C_FOG / C_FLOOR_OUTER → ocean-twilight (#03122a): far floor + haze
     melt into the gradient tone at this depth.
   - C_FLOOR_INNER → #081a30: the active floor area is lifted a hair so
     it reads as a surface catching light, not a void.
   - C_RACK → #16294a: lifted well clear of the floor so lit faces
     actually emerge under ambient. Biggest single "too dark" fix. */
const SECTION_BG_HEX = "#03122a";
const C_BG = 0x03122a;
const C_FOG = 0x03122a;
const C_FLOOR_OUTER = 0x03122a; // far floor melts into the gradient tone
const C_FLOOR_INNER = 0x081a30; // active floor lifted to catch light
const C_RACK = 0x16294a; // lifted clear of the floor so racks read as lit
const C_RACK_CAP = 0x274a78; // top caps read as "lit" (lifted to match)
const C_RACK_EDGE = 0x5278a8; // brighter cool edge for silhouette
const C_GRID = 0x1a2a4a; // blueprint underlay
const C_GOLD = 0xd4a853;
const C_GOLD_HOT = 0xf3cd84;
const C_RED = 0xc84a4a;
const C_RED_HOT = 0xe26666;
const C_GREEN = 0x6dac5a;
const C_RIM = 0x4f8acc; // cool rim light tint

/* Four warehouse zones across X. Each gets a barely-different navy base
   so the zones read as distinct places even at rest — when a mode lights
   up a rack the eye already understands it as "a place" rather than a
   random box. Differences are intentionally tiny (a few values of blue)
   so it reads as depth/variation, never as stripes. Index by
   Math.floor(bay / BAYS_PER_ZONE). */
const C_ZONE_TINTS = [0x16294a, 0x172c4f, 0x142747, 0x182e52];
function zoneTintForBay(bay) {
  return C_ZONE_TINTS[Math.floor(bay / BAYS_PER_ZONE)] ?? C_RACK;
}

/* ─── MATH ──────────────────────────────────────────────────────── */
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

/* ─── ITEMS (unchanged data, 12 SKUs across 4 aisles) ───────────── */
const ITEMS_RAW = [
  { bay: 18, col: 6, side: 0, h: 3.8, code: "I1-009", zone: "I" },
  { bay: 8, col: 5, side: 1, h: 2.4, code: "F2-095", zone: "F" },
  { bay: 2, col: 6, side: 0, h: 2.2, code: "B3-441", zone: "A" },
  { bay: 4, col: 4, side: 1, h: 2.6, code: "I3-392", zone: "C" },
  { bay: 11, col: 5, side: 0, h: 2.6, code: "G2-538", zone: "G" },
  { bay: 14, col: 4, side: 1, h: 3.4, code: "H3-133", zone: "H" },
  { bay: 16, col: 3, side: 0, h: 3.0, code: "E4-628", zone: "E" },
  { bay: 9, col: 2, side: 1, h: 3.2, code: "D1-776", zone: "D" },
  { bay: 3, col: 3, side: 0, h: 3.6, code: "J1-854", zone: "J" },
  { bay: 1, col: 1, side: 1, h: 3.4, code: "B1-047", zone: "B" },
  { bay: 6, col: 2, side: 0, h: 2.8, code: "C3-201", zone: "C" },
  { bay: 15, col: 1, side: 1, h: 3.8, code: "A1-217", zone: "A" },
];

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
const codeIdx = (code) => ITEMS.findIndex((it) => it.code === code);

const HEAR_TARGET_CODE = "B3-441";
const HEAR_TARGET = codeIdx(HEAR_TARGET_CODE);

const PREDICT_CODES = ["I3-392", "D1-776", "A1-217"];
const PREDICT_INDICES = PREDICT_CODES.map(codeIdx);

/* ─── ROUTE (unchanged) ─────────────────────────────────────────── */
const I = (code) => {
  const it = ITEMS[codeIdx(code)];
  return [it.x, it.accessZ];
};
const ROUTE = [
  [0, DOCK_Z],
  [0, OUTER_N_Z],
  [OUTER_E_X, OUTER_N_Z],
  [OUTER_E_X, 10],
  I("I1-009"),
  I("F2-095"),
  I("B3-441"),
  [OUTER_W_X, 10],
  [OUTER_W_X, 5],
  I("I3-392"),
  I("G2-538"),
  I("H3-133"),
  [OUTER_E_X, 5],
  [OUTER_E_X, -5],
  I("E4-628"),
  I("D1-776"),
  I("J1-854"),
  [OUTER_W_X, -5],
  [OUTER_W_X, -10],
  I("B1-047"),
  I("C3-201"),
  I("A1-217"),
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

const WALK_SPEED = 1.5;
const NAIVE_RATIO = 1.55;
const OPT_TOTAL = OPT.total;
const OPT_TIME = OPT_TOTAL / WALK_SPEED;
const NAIVE_TOTAL = Math.round(OPT_TOTAL * NAIVE_RATIO);
const NAIVE_TIME = NAIVE_TOTAL / WALK_SPEED;
const SAVED_PCT = Math.round((1 - 1 / NAIVE_RATIO) * 100);
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

/* ─── MODE WINDOWS ──────────────────────────────────────────────── */
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

/* ─── CAMERA STATES — refined cinematography ────────────────────── */
const CAMS = [
  // WAKE: pure top-down ortho-feel → drop into low oblique reveal
  { p: 0.0, ang: Math.PI * 0.5, rad: 3, h: 98, tx: 0, ty: 2, tz: 0 },
  { p: 0.1, ang: Math.PI * 0.55, rad: 58, h: 32, tx: 0, ty: 3, tz: 0 },
  // HEAR: low cinematic angle near the worker
  { p: 0.18, ang: Math.PI * 0.4, rad: 36, h: 12, tx: -16, ty: 3, tz: 4 },
  { p: 0.3, ang: Math.PI * 0.36, rad: 34, h: 10, tx: -14, ty: 3, tz: 4 },
  // PREDICT: side oblique with slow drift
  { p: 0.38, ang: Math.PI * 0.28, rad: 44, h: 13, tx: 4, ty: 4, tz: 2 },
  { p: 0.5, ang: Math.PI * 0.34, rad: 42, h: 12, tx: 8, ty: 4, tz: 4 },
  // ACT: overhead, slight pull-back for cinematic life
  { p: 0.58, ang: Math.PI * 0.5, rad: 4, h: 70, tx: 0, ty: 0, tz: 0 },
  { p: 0.78, ang: Math.PI * 0.5, rad: 4, h: 80, tx: 0, ty: 0, tz: 0 },
  // LEARN: hold overhead, then lift back to pure top-down close
  { p: 0.88, ang: Math.PI * 0.5, rad: 4, h: 84, tx: 0, ty: 0, tz: 0 },
  { p: 1.0, ang: Math.PI * 0.5, rad: 3, h: 98, tx: 0, ty: 2, tz: 0 },
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

/* ─── CUSTOM FLOOR SHADER ───────────────────────────────────────────
   Key changes vs original:
   - Outer radius fades to EXACTLY C_FLOOR_OUTER (= section bg tone).
     The transition is wide and gentle, so the floor disappears
     into the page background long before the canvas edge.
   - Inner navy lift is subtle (one stop, not 2.5x).
   - Optional blueprint grid that breathes with time.
   - Memory heat-points pulse with uTime for the LEARN beat. */
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
  uniform vec3 uOuter;
  uniform vec3 uInner;
  uniform vec2 uFocus;
  uniform float uHeat;
  uniform float uGlobal;
  uniform vec3 uHeatColor;
  uniform vec3 uHeatPoints[4];
  uniform float uHeatPointsLen;
  uniform float uTime;
  uniform float uGridStrength;

  // Soft 2D pseudo-noise via fract
  float n2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float d0 = length(vWorld.xz);
    // Wide gentle fade: lift is fully present until r≈12, blends out
    // by r≈70 so the visible floor never reaches the canvas edge.
    float fadeOut = smoothstep(10.0, 70.0, d0);
    vec3 col = mix(uInner, uOuter, fadeOut);

    // Whisper-thin blueprint grid — only readable near the action
    vec2 gridUV = vWorld.xz * 0.2;
    vec2 grid = abs(fract(gridUV + 0.5) - 0.5);
    float gMin = min(grid.x, grid.y);
    float gridLine = (1.0 - smoothstep(0.0, 0.035, gMin));
    col += vec3(0.025, 0.045, 0.085) * gridLine * (1.0 - fadeOut) * uGridStrength;

    // Active focus glow (current mode's interest point)
    float df = distance(vWorld.xz, uFocus);
    float focus = 1.0 - smoothstep(0.0, 18.0, df);
    col += uHeatColor * focus * uHeat * 0.75;

    // Memory heat points — pulse slowly for "the floor remembers"
    for (int i = 0; i < 4; i++) {
      if (float(i) >= uHeatPointsLen) break;
      vec3 p = uHeatPoints[i];
      float dd = distance(vWorld.xz, p.xz);
      float k = 1.0 - smoothstep(0.0, 22.0, dd);
      float pulse = 0.65 + sin(uTime * 0.8 + float(i) * 1.7) * 0.35;
      col += uHeatColor * k * p.y * uGlobal * 0.45 * pulse;
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ─── HALO SPRITE TEXTURE — generated once, reused everywhere ────── */
function makeHaloTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255, 235, 180, 1)");
  grad.addColorStop(0.3, "rgba(240, 200, 120, 0.55)");
  grad.addColorStop(0.7, "rgba(212, 168, 83, 0.12)");
  grad.addColorStop(1, "rgba(212, 168, 83, 0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ════════════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════════════ */

export default function WarehouseShowcase() {
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(0);

  const cardElems = useRef({});
  const setCardRef = useCallback(
    (key) => (el) => {
      cardElems.current[key] = el;
    },
    []
  );

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
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    scene.background = null;
    // Lower density → racks at the far end stay readable; the floor
    // shader handles the long-range fade to bg color instead.
    scene.fog = new THREE.FogExp2(C_FOG, 0.008);

    const camera = new THREE.PerspectiveCamera(46, w / h, 0.5, 700);
    camera.position.set(80, 30, 0);
    camera.lookAt(0, 3, 0);

    /* ─── FLOOR ─────────────────────────────────────────────────── */
    const floorUniforms = {
      uOuter: { value: new THREE.Color(C_FLOOR_OUTER) },
      uInner: { value: new THREE.Color(C_FLOOR_INNER) },
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
      uTime: { value: 0 },
      uGridStrength: { value: 1 },
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

    /* ─── GRID UNDERLAY (architectural blueprint) ───────────────── */
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);
    const gridMat = new THREE.LineBasicMaterial({
      color: C_GRID,
      transparent: true,
      opacity: 0.32,
    });
    for (let c = 0; c <= COLS; c++) {
      const zC = (c - COLS / 2) * COL_SPACING;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-TOTAL_X / 2 - 6, 0.005, zC),
        new THREE.Vector3(TOTAL_X / 2 + 6, 0.005, zC),
      ]);
      gridGroup.add(new THREE.Line(geo, gridMat));
    }
    for (let b = 0; b <= TOTAL_BAYS; b++) {
      const x = X_START + b * BAY_W + Math.floor(b / BAYS_PER_ZONE) * ZONE_GAP;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.005, -W_DEPTH / 2 - 2),
        new THREE.Vector3(x, 0.005, W_DEPTH / 2 + 2),
      ]);
      gridGroup.add(new THREE.Line(geo, gridMat));
    }

    /* ─── AISLE STRIPES ─────────────────────────────────────────── */
    const stripeMat = new THREE.MeshBasicMaterial({
      color: C_GOLD,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    for (let i = 1; i < AISLES_Z.length - 1; i++) {
      const z = AISLES_Z[i];
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(TOTAL_X + 14, 0.06),
        stripeMat
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, 0.014, z);
      scene.add(mesh);
    }

    /* ─── RACKS (instanced body + instanced cap + instanced shelf) ──
       Adding two thin instanced meshes on top of every rack gives
       each rack much more visual weight without breaking the
       single-draw efficiency of InstancedMesh. */
    const rackGeo = new THREE.BoxGeometry(RACK_W, RACK_H, RACK_D);
    rackGeo.translate(0, RACK_H / 2, 0);
    const rackMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.65,
      metalness: 0.15,
    });

    // Cap: thin slab on top of each rack, slightly emissive so tops
    // catch "light" and read as lit even when ambient light is low.
    const capGeo = new THREE.BoxGeometry(RACK_W * 1.02, 0.15, RACK_D * 1.06);
    capGeo.translate(0, RACK_H + 0.075, 0);
    const capMat = new THREE.MeshStandardMaterial({
      color: C_RACK_CAP,
      roughness: 0.45,
      metalness: 0.5,
      emissive: new THREE.Color(C_RACK_CAP).multiplyScalar(0.4),
      emissiveIntensity: 0.45,
    });

    // Shelf: one horizontal bar at mid-height for added structural
    // detail. Subtle but reads as "this is a rack with shelves."
    const shelfGeo = new THREE.BoxGeometry(RACK_W * 0.98, 0.06, RACK_D * 1.01);
    shelfGeo.translate(0, RACK_H * 0.5, 0);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: C_RACK_EDGE,
      roughness: 0.4,
      metalness: 0.3,
      transparent: true,
      opacity: 0.55,
    });

    const RACK_INSTANCES = TOTAL_BAYS * COLS * 2;
    const racks = new THREE.InstancedMesh(rackGeo, rackMat, RACK_INSTANCES);
    racks.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(RACK_INSTANCES * 3),
      3
    );
    const caps = new THREE.InstancedMesh(capGeo, capMat, RACK_INSTANCES);
    const shelves = new THREE.InstancedMesh(shelfGeo, shelfMat, RACK_INSTANCES);

    const dummy = new THREE.Object3D();
    const tintColor = new THREE.Color();
    /* Per-instance base color, keyed by instance id. Each rack's resting
       color is its zone tint (not one shared navy), so resetRackColors
       and the highlight cross-fade can restore the correct per-zone base
       rather than flattening every rack to the same value. */
    const rackBaseColors = new Array(RACK_INSTANCES);
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
          caps.setMatrixAt(idx, dummy.matrix);
          shelves.setMatrixAt(idx, dummy.matrix);
          const tintHex = zoneTintForBay(b);
          tintColor.setHex(tintHex);
          racks.setColorAt(idx, tintColor);
          rackBaseColors[idx] = tintHex;
          rackPositions.push({ x, z, bay: b, col, side: s });
          rackIdByKey[`${b}-${col}-${s}`] = idx;
          idx++;
        }
      }
    }
    racks.instanceMatrix.needsUpdate = true;
    racks.instanceColor.needsUpdate = true;
    caps.instanceMatrix.needsUpdate = true;
    shelves.instanceMatrix.needsUpdate = true;
    scene.add(racks);
    scene.add(caps);
    scene.add(shelves);

    /* Edge silhouettes — a single LineSegments containing the edges of
       every rack body. Adds the crisp outline that reads even at
       distance. Opacity lowered 0.65 → 0.5 now that the rack bodies are
       lifted out of the dark — the racks read as solid volumes rather
       than wireframes, so the edge only needs to define the silhouette,
       not carry the whole shape. */
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
        opacity: 0.5,
      })
    );
    racksEdges.scale.y = 0;
    scene.add(racksEdges);

    /* ─── LIGHTING — 3-point cinematic (ambient lifted, no new lights) ──
       The scene previously sat near pure black, so the ambient + hemi
       fill were too low to pull the rack bodies out of the floor. With
       the rack base color lifted (and the section now showing the ocean
       gradient through it), we raise the two FILL lights — no new lights
       added — for a moderate, still-moody lift. */
    // Ambient: lifted 0.35 → 0.62 and warmed toward the scene's navy so
    // base illumination matches the water tone rather than a cold grey.
    scene.add(new THREE.AmbientLight(0x5a6a92, 0.62));

    // Hemisphere sky→ground fill raised 0.45 → 0.7. Ground term is the
    // ocean-twilight navy so undersides pick up the same color the floor
    // and the page gradient carry, keeping everything in one palette.
    scene.add(new THREE.HemisphereLight(0xfff0d4, 0x081a30, 0.7));

    // Key: warm directional from above & one side — defines form
    const key = new THREE.DirectionalLight(0xffe7c2, 0.7);
    key.position.set(30, 60, 22);
    scene.add(key);

    // Rim: cool blue from opposite side — creates separation at edges
    const rim = new THREE.DirectionalLight(C_RIM, 0.35);
    rim.position.set(-30, 22, -18);
    scene.add(rim);

    // Fill: soft amber from below to lift undersides of caps/shelves
    const fill = new THREE.PointLight(0xd4a853, 0.5, 80);
    fill.position.set(0, -8, 0);
    scene.add(fill);

    /* ─── ATMOSPHERIC DEPTH (removed) ───────────────────────────────
       Earlier this section created two additive haze planes for
       cinematic depth. Even at low opacity, additive blending
       *necessarily* brightens every pixel they cover — which made
       the warehouse area read as a lighter blue-grey than the
       section beneath the canvas.

       Cinematic depth now comes only from:
         - 3-point lighting on the racks (key/rim/fill)
         - rack edge silhouettes
         - mode-driven focus heat under the active action
         - active-mode particle swarms
         - very low-opacity ambient dust (below)

       The empty air now reads as the page's ocean gradient, so the
       warehouse flows seamlessly into the page beneath. */

    /* ─── ITEMS — sphere + halo billboard + beam + ground ring + reflection ─── */
    const haloTex = makeHaloTexture();

    function makeItem(p, idxItem) {
      const grp = new THREE.Group();

      // Inner emissive core
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 18, 14),
        new THREE.MeshBasicMaterial({ color: C_GOLD_HOT })
      );
      sphere.position.set(p.x, p.y, p.z);
      grp.add(sphere);

      // Outer halo billboard — gives the orb proper glow
      const haloMat = new THREE.SpriteMaterial({
        map: haloTex,
        color: C_GOLD,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const halo = new THREE.Sprite(haloMat);
      halo.position.set(p.x, p.y, p.z);
      halo.scale.set(1.6, 1.6, 1);
      grp.add(halo);

      /* Floor reflection — a flattened, dimmed mirror of the halo laid
         on the floor directly under the orb. Sells the "polished concrete"
         read and ties the floating orb to the ground plane. It's a
         separate sprite (not depth-writing, additive) scaled wide and
         short, sitting just above the floor. The render loop keeps its
         x/z under the orb, its opacity a fraction of the halo's, and its
         scale proportional — so picked/scaled items pull their reflection
         with them. */
      const reflMat = new THREE.SpriteMaterial({
        map: haloTex,
        color: C_GOLD,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const refl = new THREE.Sprite(reflMat);
      refl.position.set(p.x, 0.04, p.z);
      refl.scale.set(2.0, 0.55, 1); // wide + squashed = floor smear
      grp.add(refl);

      // Vertical beam with gradient via 2-segment line
      const beamGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p.x, p.y, p.z),
        new THREE.Vector3(p.x, p.y + 1.2, p.z),
        new THREE.Vector3(p.x, 9.5, p.z),
      ]);
      const beamColors = new Float32Array([
        1,
        1,
        1, // bright at item
        0.85,
        0.7,
        0.3,
        0.1,
        0.08,
        0.04, // fades upward
      ]);
      beamGeo.setAttribute("color", new THREE.BufferAttribute(beamColors, 3));
      const beam = new THREE.Line(
        beamGeo,
        new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.55,
        })
      );
      grp.add(beam);

      // Ground ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.46, 0.62, 36),
        new THREE.MeshBasicMaterial({
          color: C_GOLD,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(p.x, 0.022, p.z);
      grp.add(ring);

      scene.add(grp);
      return {
        grp,
        sphere,
        halo,
        haloMat,
        refl,
        reflMat,
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

    /* Keep each item's floor reflection sitting under its orb, dimmer and
       squashed. Called once per frame after the per-mode block has set
       the orb's halo opacity/scale/position, so reflections inherit
       whatever the active mode did to the orbs (picked, scaled, hidden).
       Reflection tracks the halo color so red/green beats reflect too. */
    function syncReflections() {
      for (const it of itemObjs) {
        const hOpacity = it.haloMat.opacity;
        const hScaleX = it.halo.scale.x;
        it.refl.position.set(it.sphere.position.x, 0.04, it.sphere.position.z);
        it.refl.scale.set(
          Math.max(0.001, hScaleX * 1.25),
          Math.max(0.001, hScaleX * 0.34),
          1
        );
        it.reflMat.color.copy(it.haloMat.color);
        it.reflMat.opacity = hOpacity * 0.32;
      }
    }

    /* ─── FORECAST CURVES — Catmull-Rom for smoothness ─────────── */
    const forecastCurves = PREDICT_INDICES.map((itemIdx) => {
      const p = ITEM_POS[itemIdx];
      // Control points: ground level → slight wave up → arching peak
      const controls = [
        new THREE.Vector3(p.x, p.y, p.z),
        new THREE.Vector3(p.x + 0.6, p.y + 1.6, p.z - 0.4),
        new THREE.Vector3(p.x - 0.4, p.y + 3.4, p.z - 1.2),
        new THREE.Vector3(p.x + 1.1, p.y + 5.0, p.z - 2.0),
        new THREE.Vector3(p.x - 0.5, p.y + 6.4, p.z - 2.6),
      ];
      const curve = new THREE.CatmullRomCurve3(controls, false, "centripetal");
      const N = 72;
      const pts = curve.getPoints(N - 1);
      const positions = new Float32Array(N * 3);
      const colors = new Float32Array(N * 3);
      const red = new THREE.Color(C_RED);
      const redHot = new THREE.Color(C_RED_HOT);
      const tmpCol = new THREE.Color();
      for (let i = 0; i < N; i++) {
        positions[i * 3] = pts[i].x;
        positions[i * 3 + 1] = pts[i].y;
        positions[i * 3 + 2] = pts[i].z;
        // Color gradient: red at base → bright red-hot at tip
        tmpCol.copy(red).lerp(redHot, i / (N - 1));
        colors[i * 3] = tmpCol.r;
        colors[i * 3 + 1] = tmpCol.g;
        colors[i * 3 + 2] = tmpCol.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geo.setDrawRange(0, 0);
      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);

      // Pulsing tip with its own halo billboard
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 10),
        new THREE.MeshBasicMaterial({ color: C_RED_HOT })
      );
      tip.visible = false;
      scene.add(tip);

      const tipHaloMat = new THREE.SpriteMaterial({
        map: haloTex,
        color: C_RED,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const tipHalo = new THREE.Sprite(tipHaloMat);
      tipHalo.scale.set(1.3, 1.3, 1);
      tipHalo.visible = false;
      scene.add(tipHalo);

      return { line, mat, geo, N, pts, tip, tipHalo, tipHaloMat, itemIdx };
    });

    /* ─── PICKER (AMR) — sleeker silhouette + forward scan glow ── */
    function makePicker() {
      const g = new THREE.Group();

      // Lower, wider base — reads as an autonomous mobile robot
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.5, 1.2),
        new THREE.MeshStandardMaterial({
          color: 0x2a2a36,
          roughness: 0.5,
          metalness: 0.6,
        })
      );
      base.position.y = 0.25;
      g.add(base);

      // Beveled top stack (suggests a cargo platform)
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.18, 1.0),
        new THREE.MeshStandardMaterial({
          color: 0x1a1a24,
          roughness: 0.35,
          metalness: 0.65,
        })
      );
      top.position.y = 0.59;
      g.add(top);

      // Cargo "slot" — visual indication that picked items live here
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.06, 0.7),
        new THREE.MeshBasicMaterial({
          color: C_GOLD,
          transparent: true,
          opacity: 0.6,
        })
      );
      slot.position.y = 0.72;
      g.add(slot);

      // Beacon: bright top accent
      const beaconMat = new THREE.MeshBasicMaterial({ color: C_GOLD_HOT });
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 10),
        beaconMat
      );
      beacon.position.y = 0.85;
      g.add(beacon);

      // Beacon halo billboard
      const beaconHalo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: haloTex,
          color: C_GOLD,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      beaconHalo.position.y = 0.85;
      beaconHalo.scale.set(1.0, 1.0, 1);
      g.add(beaconHalo);

      // Ground glow
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(1.2, 32),
        new THREE.MeshBasicMaterial({
          color: C_GOLD,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.005;
      g.add(glow);

      // Forward scan beam — a thin glowing wedge in front of the AMR
      const scanGeo = new THREE.PlaneGeometry(2.2, 1.4);
      const scanMat = new THREE.MeshBasicMaterial({
        color: C_GOLD_HOT,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const scan = new THREE.Mesh(scanGeo, scanMat);
      scan.rotation.x = -Math.PI / 2;
      scan.position.set(0, 0.008, 0.9); // in front of body
      g.add(scan);

      g.userData = { beaconMat, glow, beaconHalo, scanMat };
      return g;
    }
    const picker = makePicker();
    picker.position.set(0, 0, DOCK_Z);
    picker.visible = false;
    scene.add(picker);

    /* ─── WORKER ───────────────────────────────────────────────── */
    const worker = (() => {
      const g = new THREE.Group();
      const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.48, 1.3, 14),
        new THREE.MeshStandardMaterial({
          color: 0x2a2a30,
          roughness: 0.55,
          metalness: 0.15,
        })
      );
      torso.position.y = 0.9;
      g.add(torso);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 16, 14),
        new THREE.MeshStandardMaterial({
          color: 0x36363c,
          roughness: 0.6,
        })
      );
      head.position.y = 1.85;
      g.add(head);
      // Hi-vis vest band
      const vest = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.18, 14),
        new THREE.MeshBasicMaterial({ color: C_GOLD_HOT })
      );
      vest.position.y = 1.15;
      g.add(vest);
      // Hardhat
      const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(0.29, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: C_GOLD })
      );
      helmet.position.y = 1.93;
      g.add(helmet);

      g.position.set(-10, 0, 6);
      g.visible = false;
      return g;
    })();
    scene.add(worker);

    /* ─── VOICE BEAM ───────────────────────────────────────────── */
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

    /* ─── PICKER TRAIL (with subtle additive glow underlay) ────── */
    function makeTrail(color, additive = false) {
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
        depthWrite: false,
        ...(additive && { blending: THREE.AdditiveBlending }),
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      return { mesh, positions, indices, geo, mat };
    }
    const trailGlow = makeTrail(C_GOLD, true); // wide soft additive glow
    const trail = makeTrail(C_GOLD); // crisp ribbon

    function updateTrailMesh(t, waypoints, width, yOffset) {
      const positions = t.positions;
      const indices = t.indices;
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
      t.geo.attributes.position.needsUpdate = true;
      t.geo.index.needsUpdate = true;
      t.geo.setDrawRange(0, ii);
    }
    function updateTrail(waypoints) {
      updateTrailMesh(trail, waypoints, 0.7, 0.06);
      updateTrailMesh(trailGlow, waypoints, 2.2, 0.05);
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

    /* ─── DOCK RING + DOCK PAD ─────────────────────────────────── */
    const dockRing = new THREE.Mesh(
      new THREE.RingGeometry(2.0, 2.4, 48),
      new THREE.MeshBasicMaterial({
        color: C_GOLD,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    dockRing.rotation.x = -Math.PI / 2;
    dockRing.position.set(0, 0.03, DOCK_Z);
    scene.add(dockRing);

    // Subtle dock pad — a slightly raised platform indicator
    const dockPad = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.MeshBasicMaterial({
        color: C_GOLD,
        transparent: true,
        opacity: 0.05,
        depthWrite: false,
      })
    );
    dockPad.rotation.x = -Math.PI / 2;
    dockPad.position.set(0, 0.012, DOCK_Z);
    scene.add(dockPad);

    /* ─── PARTICLE SWARM ────────────────────────────────────────── */
    const N_PARTICLES = 260;
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
      size: 0.14,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    /* ─── AMBIENT DUST — always-on subtle motes for atmosphere ──
       A second much sparser, slower particle system drifting through
       the whole warehouse. Never the focus, but gives the empty air
       a hint of life. */
    const N_DUST = 90;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(N_DUST * 3);
    const dustRand = new Float32Array(N_DUST * 4);
    for (let i = 0; i < N_DUST; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 110;
      dustPos[i * 3 + 1] = Math.random() * 12;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
      dustRand[i * 4] = Math.random() * Math.PI * 2;
      dustRand[i * 4 + 1] = 0.08 + Math.random() * 0.18;
      dustRand[i * 4 + 2] = 0.5 + Math.random() * 1.5;
      dustRand[i * 4 + 3] = Math.random();
    }
    dustGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(dustPos, 3).setUsage(THREE.DynamicDrawUsage)
    );
    const dustMat = new THREE.PointsMaterial({
      // Warmer neutral — the cool blue of the prior version was
      // additively tinting the scene toward blue-grey when combined
      // with the (now removed) haze planes.
      color: 0xa8b8d0,
      size: 0.05,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    /* ─── 3D-ANCHORED CARDS — projection unchanged ─────────────── */
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
      if (tmpProj.z > 1) {
        hide();
        return;
      }

      const sx = (tmpProj.x * 0.5 + 0.5) * w;
      const sy = (-tmpProj.y * 0.5 + 0.5) * h;

      const FALL = 0.92;
      let edge = 1;
      const ax = Math.abs(tmpProj.x);
      const ay = Math.abs(tmpProj.y);
      if (ax > FALL) edge *= Math.max(0, 1 - (ax - FALL) * 18);
      if (ay > FALL) edge *= Math.max(0, 1 - (ay - FALL) * 18);

      const dx = a.x - camera.position.x;
      const dy = a.y - camera.position.y;
      const dz = a.z - camera.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const distScale = clamp(60 / dist, 0.6, 1.25) * (a.scale ?? 1);
      const lift = (a.lift ?? 0) * distScale;
      const slide = (a.slide ?? 0) * distScale;
      let cardX = sx + slide;
      let cardY = sy - lift;

      const yAnchorPct = lift > 4 ? -100 : -50;

      /* ── Top-edge clamp ──
         The card is anchored via CSS translate(-50%, yAnchorPct%). For
         -100%, the card extends UPWARD from cardY by its full scaled
         height; for -50%, half above and half below. Without a clamp,
         a 3D anchor that projects high in the scene + a large lift can
         push the card's top edge above the .sticky overflow boundary,
         where it gets clipped into the Nav region (.sticky starts at
         top: var(--nav-height), so its interior coordinate origin is
         already below the Nav, but a card with negative top edge in
         that coordinate space disappears into the bottom of the Nav).

         Compute the card's scaled height in screen pixels and require
         its top edge to be at least SAFE_TOP px below the sticky's
         coordinate origin. SAFE_TOP = 24 keeps cards out of the corner
         editorial keys' band as well. */
      const SAFE_TOP = 24;
      const scaledH = (el.offsetHeight || 0) * distScale;
      const topAnchorOffset = yAnchorPct === -100 ? scaledH : scaledH * 0.5;
      const minCardY = topAnchorOffset + SAFE_TOP;
      if (cardY < minCardY) cardY = minCardY;

      /* Horizontal clamp — cards are centered with translate(-50%), so
         keep their half-width (post-scale) plus a 16px gutter inside the
         canvas on both sides. `w` is the canvas client width set in
         resize(). Skip if the card is wider than the viewport (the CSS
         width cap handles that case). */
      const SAFE_X = 16;
      const halfW = ((el.offsetWidth || 0) * distScale) / 2;
      const minCardX = halfW + SAFE_X;
      const maxCardX = w - halfW - SAFE_X;
      if (maxCardX > minCardX) {
        cardX = Math.min(Math.max(cardX, minCardX), maxCardX);
      }

      el.style.transform =
        `translate3d(${cardX}px, ${cardY}px, 0) ` +
        `translate(-50%, ${yAnchorPct}%) scale(${distScale})`;
      el.style.opacity = String(a.opacity * edge);

      if (line) {
        if (a.showLeader && lift > 4) {
          line.setAttribute("x1", sx);
          line.setAttribute("y1", sy - 4);
          line.setAttribute("x2", cardX);
          line.setAttribute("y2", cardY - 2);
          line.style.opacity = String(a.opacity * edge * 0.6);
        } else {
          line.style.opacity = "0";
        }
      }
      if (dot) {
        if (a.showLeader) {
          dot.setAttribute("cx", sx);
          dot.setAttribute("cy", sy);
          dot.style.opacity = String(a.opacity * edge * 0.95);
        } else {
          dot.style.opacity = "0";
        }
      }
    }

    /* ─── RESIZE ───────────────────────────────────────────────── */
    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      /* Portrait/phone aspect crops the wide warehouse hard at the 46°
         desktop FOV. Widen the lens on narrow viewports so the full floor
         reads. (Mirrors AISection's camZMobile pull-back.) The render
         loop only writes camera.position, never fov, so this sticks. */
      camera.fov = w < 768 ? 62 : 46;
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

    /* ─── SCROLLTRIGGER ─────────────────────────────────────────── */
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top 72px",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    /* ─── HELPERS ──────────────────────────────────────────────── */
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
        caps.setMatrixAt(i, tmpMatrix);
        shelves.setMatrixAt(i, tmpMatrix);
      }
      racks.instanceMatrix.needsUpdate = true;
      caps.instanceMatrix.needsUpdate = true;
      shelves.instanceMatrix.needsUpdate = true;
      racksEdges.scale.y = scale;
    }

    /* Highlight a rack toward `hex` by `intensity`, lerping FROM that
       rack's own per-zone base color (not a shared navy) so unhighlighted
       neighbors keep their zone tint and the highlight reads as a tint on
       top of the existing place. */
    const tmpHi = new THREE.Color();
    const tmpBase = new THREE.Color();
    function highlightRack(instId, hex, intensity = 1) {
      if (instId === undefined) return;
      tmpHi.setHex(hex);
      tmpBase.setHex(rackBaseColors[instId] ?? C_RACK);
      tmpBase.lerp(tmpHi, intensity);
      racks.setColorAt(instId, tmpBase);
      racks.instanceColor.needsUpdate = true;
    }

    /* Reset every rack to its per-zone base color. */
    const tmpReset = new THREE.Color();
    function resetRackColors() {
      for (let i = 0; i < RACK_INSTANCES; i++) {
        tmpReset.setHex(rackBaseColors[i] ?? C_RACK);
        racks.setColorAt(i, tmpReset);
      }
      racks.instanceColor.needsUpdate = true;
    }

    function rackIdForItem(itemIdx) {
      const it = ITEMS[itemIdx];
      return rackIdByKey[`${it.bay}-${it.col}-${it.side}`];
    }

    /* ─── MODE CROSS-FADE STATE ──────────────────────────────────
       The floor heat color + the active highlight tint are smoothed
       frame-to-frame toward the current mode's target rather than being
       set instantly, so the moment the scroll crosses a mode boundary
       the color shifts over a few frames instead of popping. Position
       and intensity of the heat are still driven directly by each mode
       (they're already continuous); only the COLOR is eased here, which
       is where the visible pop was. */
    const heatColorCur = new THREE.Color(C_GOLD);
    const heatColorTgt = new THREE.Color(C_GOLD);
    const COLOR_EASE = 0.18; // ~6-frame settle; raise for snappier

    /* ─── RENDER LOOP ──────────────────────────────────────────── */
    let uiTick = 0;
    const t0 = performance.now();
    let rafId;

    function render() {
      const time = (performance.now() - t0) / 1000;
      const p = progressRef.current;
      const mode = modeFromP(p);
      const isPaused = pausedRef.current;

      floorUniforms.uTime.value = time;

      /* Camera — base path + sub-beat breathing + a continuous parallax
         drift across the WHOLE sequence so the five beats feel like one
         cinematic move rather than separate dioramas. The global drift is
         a slow lateral + height sway scaled down hard during the overhead
         ACT/LEARN beats (where the path is pinned top-down). */
      const cs = camAt(p);
      const isOverhead = p > M_ACT[0] && p < M_LEARN[1];
      const breathScale = isOverhead ? 0.0 : 1.0;
      const breathRad = Math.sin(time * 0.32) * 0.6 * breathScale;
      const breathAng = Math.sin(time * 0.22) * 0.008 * breathScale;

      /* Continuous parallax drift — a function of scroll progress (not
         time), so it's deterministic and scrubs with the user. One slow
         full-cycle sway across the whole section. Damped in the overhead
         band so it doesn't fight the pinned top-down framing. */
      const driftScale = isOverhead ? 0.15 : 1.0;
      const driftX = Math.sin(p * Math.PI * 2.0) * 3.4 * driftScale;
      const driftH = Math.cos(p * Math.PI * 1.0) * 2.2 * driftScale;

      const ang = cs.ang + breathAng;
      const rad = cs.rad + breathRad;
      camera.position.x = Math.cos(ang) * rad + cs.tx * 0.2 + driftX;
      camera.position.z = Math.sin(ang) * rad + cs.tz * 0.2;
      camera.position.y = cs.h + driftH;
      camera.lookAt(cs.tx, cs.ty, cs.tz);

      /* Defaults */
      picker.visible = false;
      worker.visible = false;
      voiceBeam.material.opacity = 0;
      trail.mesh.visible = false;
      trailGlow.mesh.visible = false;
      dockRing.material.opacity = 0;
      partMat.opacity = 0;
      forecastCurves.forEach((fc) => {
        fc.geo.setDrawRange(0, 0);
        fc.tip.visible = false;
        fc.tipHalo.visible = false;
        fc.mat.opacity = 0.95;
      });

      const A = anchorsRef.current;
      A.wake.opacity = 0;
      A.hear.opacity = 0;
      A.forecast.opacity = 0;
      A.act.opacity = 0;
      A.learn.opacity = 0;

      let liveDist = 0,
        livePicks = 0;

      /* Each mode sets heatColorTgt (the COLOR it wants the floor heat to
         be); the actual uniform is eased toward it at the bottom of the
         frame so boundary crossings cross-fade instead of pop. Default
         target is gold; red/green beats override below. */
      heatColorTgt.setHex(C_GOLD);

      // ─── MODE 0 · WAKE ─────────────────────────────────────────
      if (mode === 0) {
        const t = localT(p, M_WAKE);
        for (const r of rackPositions) {
          const stagger = (r.bay / TOTAL_BAYS) * 0.5;
          const s = smoothstep((t - stagger) / 0.5);
          const id = rackIdByKey[`${r.bay}-${r.col}-${r.side}`];
          racks.getMatrixAt(id, tmpMatrix);
          tmpMatrix.decompose(tmpVec, tmpQuat, tmpScale);
          tmpScale.set(1, s, 1);
          tmpMatrix.compose(tmpVec, tmpQuat, tmpScale);
          racks.setMatrixAt(id, tmpMatrix);
          caps.setMatrixAt(id, tmpMatrix);
          shelves.setMatrixAt(id, tmpMatrix);
        }
        racks.instanceMatrix.needsUpdate = true;
        caps.instanceMatrix.needsUpdate = true;
        shelves.instanceMatrix.needsUpdate = true;
        racksEdges.scale.y = smoothstep(t * 1.4 - 0.3);

        const itemAlpha = smoothstep((t - 0.6) / 0.4);
        for (const it of itemObjs) {
          it.sphere.scale.setScalar(itemAlpha * 0.9);
          it.halo.scale.setScalar(itemAlpha * 1.6);
          it.haloMat.opacity = 0.7 * itemAlpha;
          it.ringMat.opacity = 0.6 * itemAlpha;
          it.beamMat.opacity = 0.5 * itemAlpha;
          it.sphereMat.color.setHex(C_GOLD_HOT);
          it.ringMat.color.setHex(C_GOLD);
          it.haloMat.color.setHex(C_GOLD);
          it.sphere.position.y = it.baseY;
        }

        floorUniforms.uHeat.value = 0;
        floorUniforms.uGlobal.value = 0;
        floorUniforms.uHeatPointsLen.value = 0;
        floorUniforms.uGridStrength.value = 1 * (0.4 + 0.6 * t);

        A.wake.x = 0;
        A.wake.y = 16;
        A.wake.z = -4;
        A.wake.opacity = smoothstep((t - 0.05) / 0.4);
      }

      // ─── MODE 1 · HEAR ─────────────────────────────────────────
      else if (mode === 1) {
        const t = localT(p, M_HEAR);
        setRackRiseY(1);
        racksEdges.scale.y = 1;
        resetRackColors();

        worker.visible = true;
        const tgt = ITEM_POS[HEAR_TARGET];
        const fdx = tgt.x - worker.position.x;
        const fdz = tgt.z - worker.position.z;
        worker.rotation.y = Math.atan2(fdx, fdz);

        for (let i = 0; i < itemObjs.length; i++) {
          const it = itemObjs[i];
          const isTarget = i === HEAR_TARGET;
          const targetScale = isTarget ? 1 + 0.18 * Math.sin(time * 5) : 0.65;
          it.sphere.scale.setScalar(targetScale);
          it.halo.scale.setScalar(
            isTarget ? 2.2 + 0.3 * Math.sin(time * 4) : 1.2
          );
          it.haloMat.opacity = isTarget ? 1 : 0.35;
          it.sphereMat.color.setHex(isTarget ? C_GOLD_HOT : C_GOLD);
          it.ringMat.color.setHex(isTarget ? C_GOLD_HOT : C_GOLD);
          it.haloMat.color.setHex(isTarget ? C_GOLD_HOT : C_GOLD);
          it.ringMat.opacity = isTarget ? 0.95 : 0.22;
          it.beamMat.opacity = isTarget ? 0.85 : 0.18;
          if (!isPaused) {
            it.sphere.position.y =
              it.baseY + (isTarget ? Math.sin(time * 3) * 0.12 : 0);
            it.halo.position.y = it.sphere.position.y;
          }
        }

        const targetRackId = rackIdForItem(HEAR_TARGET);
        const beamReveal = smoothstep((t - 0.2) / 0.35);
        highlightRack(targetRackId, C_GOLD_HOT, 0.6 * beamReveal);

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
        heatColorTgt.setHex(C_GOLD);
        floorUniforms.uGlobal.value = 0;
        floorUniforms.uHeatPointsLen.value = 0;
        floorUniforms.uGridStrength.value = 1;

        A.hear.x = tgt.x;
        A.hear.y = tgt.y;
        A.hear.z = tgt.z;
        A.hear.opacity = smoothstep((t - 0.2) / 0.3);
      }

      // ─── MODE 2 · ANTICIPATE ───────────────────────────────────
      else if (mode === 2) {
        const t = localT(p, M_PREDICT);
        setRackRiseY(1);
        racksEdges.scale.y = 1;
        resetRackColors();

        const pulse = 0.7 + Math.sin(time * 2.4) * 0.3;
        PREDICT_INDICES.forEach((iIdx) => {
          const rid = rackIdForItem(iIdx);
          highlightRack(rid, C_RED, 0.45 + 0.25 * pulse);
        });

        for (let i = 0; i < itemObjs.length; i++) {
          const it = itemObjs[i];
          const isPred = PREDICT_INDICES.includes(i);
          it.sphere.scale.setScalar(
            isPred ? 1 + 0.22 * Math.sin(time * 4 + i) : 0.55
          );
          it.halo.scale.setScalar(isPred ? 2.0 : 0.9);
          it.haloMat.opacity = isPred ? 0.95 : 0.22;
          it.sphereMat.color.setHex(isPred ? C_RED_HOT : C_GOLD);
          it.ringMat.color.setHex(isPred ? C_RED : C_GOLD);
          it.haloMat.color.setHex(isPred ? C_RED : C_GOLD);
          it.ringMat.opacity = isPred ? 0.9 : 0.13;
          it.beamMat.opacity = isPred ? 0.85 : 0.1;
          if (!isPaused) {
            it.sphere.position.y =
              it.baseY + (isPred ? Math.sin(time * 3 + i) * 0.13 : 0);
            it.halo.position.y = it.sphere.position.y;
          }
        }

        forecastCurves.forEach((fc, k) => {
          const fk = smoothstep((t - 0.15 - k * 0.06) / 0.35);
          const n = Math.floor(fc.N * fk);
          fc.geo.setDrawRange(0, n);
          fc.mat.opacity = 0.95 * fk;
          if (n > 0) {
            fc.tip.visible = true;
            fc.tipHalo.visible = true;
            const tipPos = fc.pts[Math.max(0, n - 1)];
            fc.tip.position.copy(tipPos);
            fc.tipHalo.position.copy(tipPos);
            const s = 0.18 + Math.sin(time * 4 + k) * 0.04;
            fc.tip.scale.setScalar(1 + s);
            fc.tipHalo.scale.setScalar(1.3 + s * 1.5);
            fc.tipHaloMat.opacity = 0.85 * fk;
          }
        });

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
        floorUniforms.uHeat.value = swarmA * 0.75;
        heatColorTgt.setHex(C_RED);
        floorUniforms.uGlobal.value = 0;
        floorUniforms.uHeatPointsLen.value = 0;
        floorUniforms.uGridStrength.value = 1;

        A.forecast.x = cx;
        A.forecast.y = 3;
        A.forecast.z = cz;
        A.forecast.opacity = smoothstep((t - 0.4) / 0.3);
      }

      // ─── MODE 3 · ACT ──────────────────────────────────────────
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
        updateTrail(wp);
        trail.mesh.visible = true;
        trailGlow.mesh.visible = true;
        trail.mat.opacity = 0.9;
        trailGlow.mat.opacity = 0.45;

        picker.userData.beaconMat.color.setHex(C_GOLD_HOT);
        picker.userData.glow.material.opacity = 0.4 + Math.sin(time * 5) * 0.12;
        picker.userData.scanMat.opacity = 0.16 + Math.sin(time * 3) * 0.06;

        let picked = 0;
        for (let i = 0; i < itemObjs.length; i++) {
          const it = itemObjs[i];
          const wasPicked = optT >= PICK_TS[i];
          if (wasPicked) picked++;
          const sinceWindow = clamp((optT - PICK_TS[i]) / 0.02, 0, 1);
          if (wasPicked && sinceWindow < 1) {
            const lift = sinceWindow;
            it.sphere.position.x = lerp(it.x, pos.x, lift);
            it.sphere.position.y = lerp(it.baseY, 1.0, lift);
            it.sphere.position.z = lerp(it.z, pos.z, lift);
            it.halo.position.copy(it.sphere.position);
            it.sphere.scale.setScalar(1 + 0.5 * (1 - lift));
            it.halo.scale.setScalar(2.2 * (1 - lift * 0.6));
            it.haloMat.opacity = 0.9 * (1 - lift);
            it.sphereMat.color.setHex(C_GOLD_HOT);
            it.ringMat.opacity = 0.5 * (1 - lift);
            it.beamMat.opacity = 0;
          } else if (wasPicked) {
            it.sphere.scale.setScalar(0);
            it.halo.scale.setScalar(0);
            it.haloMat.opacity = 0;
            it.ringMat.opacity = 0.3;
            it.ringMat.color.setHex(C_GREEN);
            it.beamMat.opacity = 0;
          } else {
            it.sphere.position.set(it.x, it.baseY, it.z);
            it.halo.position.copy(it.sphere.position);
            it.sphere.scale.setScalar(0.88);
            it.halo.scale.setScalar(1.5);
            it.haloMat.opacity = 0.6;
            it.sphereMat.color.setHex(C_GOLD_HOT);
            it.ringMat.color.setHex(C_GOLD);
            it.haloMat.color.setHex(C_GOLD);
            it.ringMat.opacity = 0.55;
            it.beamMat.opacity = 0.45;
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
        floorUniforms.uHeat.value = 0.8;
        heatColorTgt.setHex(C_GOLD);
        floorUniforms.uGlobal.value = 0;
        floorUniforms.uHeatPointsLen.value = 0;
        floorUniforms.uGridStrength.value = 1;

        dockRing.material.opacity = 0.4;
        dockRing.material.color.setHex(C_GOLD);

        A.act.x = pos.x;
        A.act.y = 0.5;
        A.act.z = pos.z;
        A.act.opacity = smoothstep(t * 4);
      }

      // ─── MODE 4 · LEARN ────────────────────────────────────────
      else {
        const t = localT(p, M_LEARN);
        const collapseT = smoothstep((t - 0.55) / 0.45);
        const standing = 1 - collapseT;

        resetRackColors();

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
          caps.setMatrixAt(id, tmpMatrix);
          shelves.setMatrixAt(id, tmpMatrix);
        }
        racks.instanceMatrix.needsUpdate = true;
        caps.instanceMatrix.needsUpdate = true;
        shelves.instanceMatrix.needsUpdate = true;
        racksEdges.scale.y = maxScale;

        for (const it of itemObjs) {
          it.sphere.position.set(it.x, it.baseY * standing, it.z);
          it.halo.position.copy(it.sphere.position);
          it.sphere.scale.setScalar(0.65 * standing);
          it.halo.scale.setScalar(1.3 * standing);
          it.haloMat.opacity = 0.5 * standing;
          it.sphereMat.color.setHex(C_GREEN);
          it.ringMat.color.setHex(C_GREEN);
          it.haloMat.color.setHex(C_GREEN);
          it.ringMat.opacity = 0.35 * standing;
          it.beamMat.opacity = 0;
        }

        picker.visible = standing > 0.02;
        picker.position.set(0, 0, DOCK_Z);
        picker.rotation.y = 0;
        picker.userData.beaconMat.color.setHex(C_GREEN);
        picker.userData.glow.material.opacity = 0.3 * standing;
        picker.userData.scanMat.opacity = 0.1 * standing;

        updateTrail(ROUTE);
        trail.mesh.visible = standing > 0.02;
        trailGlow.mesh.visible = standing > 0.02;
        trail.mat.opacity = 0.32 * standing;
        trailGlow.mat.opacity = 0.18 * standing;

        const heatPulse = 0.6 + Math.sin(time * 1.4) * 0.15;
        const hp = floorUniforms.uHeatPoints.value;
        hp[0].set(bayToX(2), heatPulse * 0.9, 0);
        hp[1].set(bayToX(8), heatPulse * 1.0, 4);
        hp[2].set(bayToX(14), heatPulse * 0.8, -4);
        hp[3].set(bayToX(18), heatPulse * 0.7, 2);
        floorUniforms.uHeatPointsLen.value = 4;
        heatColorTgt.setHex(C_GOLD);
        floorUniforms.uGlobal.value = smoothstep(t * 2.4) * standing;
        floorUniforms.uHeat.value = 0;
        floorUniforms.uGridStrength.value = 1 * standing + 0.4 * collapseT;

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

        A.learn.x = 0;
        A.learn.y = 8;
        A.learn.z = 0;
        A.learn.opacity = smoothstep(t * 2.6) * standing;
      }

      /* Cross-fade the floor heat color toward this frame's target so
         mode boundaries don't pop the color. */
      heatColorCur.lerp(heatColorTgt, COLOR_EASE);
      floorUniforms.uHeatColor.value.copy(heatColorCur);

      /* Keep each orb's floor reflection in sync after the mode block
         has finalized orb opacity/scale/position. */
      syncReflections();

      /* Ambient dust — always animated, regardless of mode */
      for (let i = 0; i < N_DUST; i++) {
        const phase = dustRand[i * 4] + time * dustRand[i * 4 + 1];
        dustPos[i * 3] += Math.cos(phase) * 0.005;
        dustPos[i * 3 + 1] += Math.sin(phase * 0.7) * 0.003 + 0.002;
        dustPos[i * 3 + 2] += Math.sin(phase) * 0.005;
        if (dustPos[i * 3 + 1] > 13) dustPos[i * 3 + 1] = 0;
      }
      dustGeo.attributes.position.needsUpdate = true;

      /* (haze planes removed — see note above) */

      renderer.render(scene, camera);

      projectAnchor("wake");
      projectAnchor("hear");
      projectAnchor("forecast");
      projectAnchor("act");
      projectAnchor("learn");

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
      haloTex.dispose();
    };
  }, []);

  const m = ui.mode;
  const def = MODE_DEFS[m];

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      id="wareh"
      style={{ "--section-bg": SECTION_BG_HEX }}
    >
      <div ref={stickyRef} className={styles.sticky}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

        {/* Vignette overlay — pure CSS, layered above canvas, gives the
            scene cinematic edges without costing GPU cycles */}
        <div className={styles.vignette} aria-hidden="true" />

        {/* ─── Corner editorial keys ─── */}
        <div className={styles.corner + " " + styles.cornerTL}>
          <span className={styles.cornerBracket}>
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path
                d="M0 0 L16 0 M0 0 L0 16"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </span>
          <span className={styles.cornerKey}>FLOOR · 01</span>
          <span className={styles.cornerSub}>Nautilus / live</span>
        </div>
        <div className={styles.corner + " " + styles.cornerTR}>
          <span className={styles.cornerBracket + " " + styles.cornerBracketTR}>
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path
                d="M0 0 L16 0 M16 0 L16 16"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </span>
          <span className={styles.cornerKey}>
            {def.num} · {def.label}
          </span>
          <span className={styles.cornerSub}>
            <span className={styles.dot} /> active
          </span>
        </div>

        {/* ─── LEADER-LINE OVERLAY ─── */}
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

        {/* ─── 3D-ANCHORED CARDS ─── */}
        <div
          ref={setCardRef("wake")}
          className={styles.modeCard + " " + styles.wakeCard}
        >
          <div className={styles.cardLabel}>
            <span className={styles.cardLabelTick} />
            01 · BOOTING
          </div>
          <div className={styles.cardHeadline}>99.7%</div>
          <div className={styles.cardSubhead}>spatial coverage</div>
          <div className={styles.cardRule} />
          <div className={styles.cardSupport}>
            {TOTAL_BAYS} bays · {COLS} columns · {TOTAL_BAYS * COLS * 2} bin
            faces
          </div>
        </div>

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

        <div
          ref={setCardRef("forecast")}
          className={styles.modeCard + " " + styles.forecastCard}
        >
          <div className={styles.cardLabel + " " + styles.cardLabelRed}>
            <span
              className={styles.cardLabelTick + " " + styles.cardLabelTickRed}
            />
            03 · DEPLETION FORECAST
          </div>
          <div className={styles.cardHeadline}>3 SKUs</div>
          <div className={styles.cardSubhead}>critical · 48h window</div>
          <div className={styles.cardRule} />
          <div className={styles.forecastRows}>
            <div className={styles.forecastRow}>
              <span className={styles.forecastSku}>I3-392</span>
              <span className={styles.forecastBar}>
                <span style={{ width: "78%" }} />
              </span>
              <span className={styles.forecastEta}>31h</span>
            </div>
            <div className={styles.forecastRow}>
              <span className={styles.forecastSku}>D1-776</span>
              <span className={styles.forecastBar}>
                <span style={{ width: "61%" }} />
              </span>
              <span className={styles.forecastEta}>38h</span>
            </div>
            <div className={styles.forecastRow}>
              <span className={styles.forecastSku}>A1-217</span>
              <span className={styles.forecastBar}>
                <span style={{ width: "44%" }} />
              </span>
              <span className={styles.forecastEta}>47h</span>
            </div>
          </div>
          <div className={styles.cardSupport}>
            PO #2847 drafted ·{" "}
            <span className={styles.cardSupportAccent}>awaiting review</span>
          </div>
        </div>

        <div
          ref={setCardRef("act")}
          className={styles.modeCard + " " + styles.actCard}
        >
          <div className={styles.cardLabel}>
            <span className={styles.cardLabelTick} />
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

        <div
          ref={setCardRef("learn")}
          className={styles.modeCard + " " + styles.learnCard}
        >
          <div className={styles.cardLabel}>
            <span className={styles.cardLabelTick} />
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

        {/* ─── MODE INDICATOR ─── */}
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
