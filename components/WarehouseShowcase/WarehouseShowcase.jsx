"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAnimationPaused } from "@/lib/AnimationContext";
import styles from "./WarehouseShowcase.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════════
   WAREHOUSE GEOMETRY — 10 bays × 3 groups × 4 shelves
   Footprint ~52m × 46m, racks 4.2m tall (enterprise FC scale)
   ═══════════════════════════════════════════════════════════════════ */
const SHELF_H = 4.2;
const SHELF_D = 0.85;
const SHELF_W = 2.4;
const AISLE_W = 2.4;
const PAIR_GAP = 0.9;
const PAIR_W = SHELF_D * 2 + PAIR_GAP;
const PITCH_X = AISLE_W + PAIR_W;
const SHELF_GAP_Z = 0.6;
const PITCH_Z = SHELF_W + SHELF_GAP_Z;
const CROSS_W = 2.4;
const CEIL_H = 9.0;

const BAYS_X = 10;
const GROUPS_Z = 3;
const SHELVES_PER_GROUP = 4;
const GROUP_DEPTH = SHELVES_PER_GROUP * PITCH_Z;
const TOTAL_W = BAYS_X * PITCH_X + AISLE_W;
const TOTAL_D = GROUPS_Z * GROUP_DEPTH + (GROUPS_Z + 1) * CROSS_W;
const OX = -TOTAL_W / 2;
const OZ = -TOTAL_D / 2;

const AISLE_X = [];
for (let i = 0; i <= BAYS_X; i++) AISLE_X.push(OX + i * PITCH_X + AISLE_W / 2);
const AISLE_Z = [];
for (let i = 0; i <= GROUPS_Z; i++)
  AISLE_Z.push(OZ + i * (GROUP_DEPTH + CROSS_W) + CROSS_W / 2);

const DOCK_X = 0;
const DOCK_Z = AISLE_Z[AISLE_Z.length - 1] + 5;

const SHELVES = [];
for (let bx = 0; bx < BAYS_X; bx++) {
  const bayLeft = OX + bx * PITCH_X + AISLE_W;
  for (let gz = 0; gz < GROUPS_Z; gz++) {
    const groupStart = OZ + gz * (GROUP_DEPTH + CROSS_W) + CROSS_W;
    for (let sz = 0; sz < SHELVES_PER_GROUP; sz++) {
      const z = groupStart + sz * PITCH_Z;
      SHELVES.push({ x: bayLeft, z, w: SHELF_D, d: SHELF_W });
      SHELVES.push({
        x: bayLeft + SHELF_D + PAIR_GAP,
        z,
        w: SHELF_D,
        d: SHELF_W,
      });
    }
  }
}

const _sz = (gz, s) =>
  OZ + gz * (GROUP_DEPTH + CROSS_W) + CROSS_W + s * PITCH_Z + SHELF_W / 2;

/* ═══════════════════════════════════════════════════════════════════
   PICKS — 12 items, ordered for max naive zigzag
   ═══════════════════════════════════════════════════════════════════ */
const PICK_ITEMS = [
  { x: AISLE_X[1], z: _sz(0, 1), label: "B1-047" },
  { x: AISLE_X[8], z: _sz(2, 0), label: "I3-392" },
  { x: AISLE_X[2], z: _sz(2, 3), label: "C3-201" },
  { x: AISLE_X[9], z: _sz(0, 2), label: "J1-854" },
  { x: AISLE_X[3], z: _sz(0, 0), label: "D1-776" },
  { x: AISLE_X[7], z: _sz(2, 1), label: "H3-133" },
  { x: AISLE_X[1], z: _sz(2, 2), label: "B3-441" },
  { x: AISLE_X[8], z: _sz(0, 3), label: "I1-519" },
  { x: AISLE_X[5], z: _sz(2, 3), label: "F3-208" },
  { x: AISLE_X[4], z: _sz(0, 1), label: "E1-672" },
  { x: AISLE_X[9], z: _sz(2, 2), label: "J3-947" },
  { x: AISLE_X[3], z: _sz(2, 1), label: "D3-318" },
];

const AZ_BOT = AISLE_Z[AISLE_Z.length - 1];
const AZ_TOP = AISLE_Z[0];

/* ═══════════════════════════════════════════════════════════════════
   ROUTE GENERATION
   ═══════════════════════════════════════════════════════════════════ */
function segDist(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++)
    d += Math.sqrt(
      (pts[i][0] - pts[i - 1][0]) ** 2 + (pts[i][1] - pts[i - 1][1]) ** 2
    );
  return d;
}

// Naive: visit picks in declaration order, dumb cross-aisle routing
function buildNaiveSegments() {
  const segs = [];
  let cur = [DOCK_X, DOCK_Z];
  PICK_ITEMS.forEach((item) => {
    const target = [item.x, item.z];
    const midZ = (cur[1] + target[1]) / 2;
    const crossZ =
      Math.abs(midZ - AZ_BOT) < Math.abs(midZ - AZ_TOP) ? AZ_BOT : AZ_TOP;
    segs.push({
      label: `→ ${item.label}`,
      pts: [
        [cur[0], cur[1]],
        [cur[0], crossZ],
        [target[0], crossZ],
        [target[0], target[1]],
      ],
    });
    cur = target;
  });
  segs.push({
    label: "→ Dock",
    pts: [
      [cur[0], cur[1]],
      [cur[0], AZ_BOT],
      [DOCK_X, AZ_BOT],
      [DOCK_X, DOCK_Z],
    ],
  });
  return segs;
}

// Optimal: snake heuristic — traverse aisles left→right, alternate direction
function buildOptimalRoute() {
  const byAisle = new Map();
  PICK_ITEMS.forEach((item) => {
    const ai = AISLE_X.findIndex((ax) => Math.abs(ax - item.x) < 0.01);
    if (!byAisle.has(ai)) byAisle.set(ai, []);
    byAisle.get(ai).push(item);
  });
  const sortedAisles = [...byAisle.keys()].sort((a, b) => a - b);
  const pts = [
    [DOCK_X, DOCK_Z],
    [DOCK_X, AZ_BOT],
  ];
  let endedAtBottom = true;
  sortedAisles.forEach((ai, i) => {
    const ax = AISLE_X[ai];
    const fromBottom = i % 2 === 0;
    const items = byAisle.get(ai).slice();
    items.sort((a, b) => (fromBottom ? b.z - a.z : a.z - b.z));
    pts.push([ax, fromBottom ? AZ_BOT : AZ_TOP]);
    items.forEach((item) => pts.push([ax, item.z]));
    pts.push([ax, fromBottom ? AZ_TOP : AZ_BOT]);
    endedAtBottom = !fromBottom;
  });
  if (!endedAtBottom) {
    const lastAx = AISLE_X[sortedAisles[sortedAisles.length - 1]];
    pts.push([lastAx, AZ_BOT]);
  }
  pts.push([DOCK_X, AZ_BOT], [DOCK_X, DOCK_Z]);
  return pts;
}

const NAIVE_SEGMENTS = buildNaiveSegments();
NAIVE_SEGMENTS.forEach((s) => {
  s.dist = segDist(s.pts);
});
const OPT_ROUTE = buildOptimalRoute();

const NAIVE_DIST = NAIVE_SEGMENTS.reduce((a, s) => a + s.dist, 0);
const OPT_DIST = segDist(OPT_ROUTE);
const WALK_SPEED = 1.2; // m/s
const NAIVE_TIME_S = NAIVE_DIST / WALK_SPEED;
const OPT_TIME_S = OPT_DIST / WALK_SPEED;
const SAVINGS_PCT = Math.round((1 - OPT_DIST / NAIVE_DIST) * 100);
const OPT_SPEED_FACTOR = NAIVE_DIST / OPT_DIST;

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
}

/* Route helpers */
function buildLinePoints(pts) {
  return pts.map((p) => new THREE.Vector3(p[0], 0.1, p[1]));
}
function routeTotalLen(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += pts[i].distanceTo(pts[i - 1]);
  return l;
}
function pointOnRoute(pts, t) {
  const total = routeTotalLen(pts);
  let target = t * total,
    acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = pts[i].distanceTo(pts[i - 1]);
    if (acc + seg >= target) {
      const f = (target - acc) / seg;
      return pts[i - 1].clone().lerp(pts[i], f);
    }
    acc += seg;
  }
  return pts[pts.length - 1].clone();
}
function waypointFraction(pts, idx) {
  const t = routeTotalLen(pts);
  let a = 0;
  for (let i = 1; i <= idx && i < pts.length; i++)
    a += pts[i].distanceTo(pts[i - 1]);
  return a / t;
}

const GOLD = 0xd4a853;
const GREEN = 0x5a9a4a;
const RED_DIM = 0xa54545;
const WARM_WHITE = 0xffeecc;

/* ═══════════════════════════════════════════════════════════════════
   CAMERA — chapter waypoints, smoothstepped
   ═══════════════════════════════════════════════════════════════════ */
const CAM_PROGRAM = [
  { p: 0.0, pos: [-42, 78, 75], target: [0, 0, 0] }, // Establish (high corner)
  { p: 0.12, pos: [-28, 58, 62], target: [-3, 0, 5] }, // Settle in
  { p: 0.22, pos: [-12, 60, 58], target: [0, 0, 0] }, // Overview
  { p: 0.36, pos: [-2, 82, 22], target: [0, 0, 0] }, // Tilt toward top-down
  { p: 0.5, pos: [0, 78, 18], target: [0, 0, 0] }, // Near-top-down (route)
  { p: 0.6, pos: [-26, 54, 52], target: [0, 0, 0] }, // Race begins (perspective)
  { p: 0.76, pos: [18, 50, 56], target: [0, 0, 0] }, // Drift opposite for parallax
  { p: 0.9, pos: [-8, 75, 72], target: [0, 0, 0] }, // Begin pull back
  { p: 1.0, pos: [0, 115, 105], target: [0, 0, 0] }, // Final scale reveal
];
function getCamForP(p) {
  for (let i = 0; i < CAM_PROGRAM.length - 1; i++) {
    const a = CAM_PROGRAM[i];
    const b = CAM_PROGRAM[i + 1];
    if (p >= a.p && p <= b.p) {
      const t = (p - a.p) / Math.max(0.0001, b.p - a.p);
      const s = t * t * (3 - 2 * t);
      return [
        a.pos[0] + (b.pos[0] - a.pos[0]) * s,
        a.pos[1] + (b.pos[1] - a.pos[1]) * s,
        a.pos[2] + (b.pos[2] - a.pos[2]) * s,
        a.target[0] + (b.target[0] - a.target[0]) * s,
        a.target[1] + (b.target[1] - a.target[1]) * s,
        a.target[2] + (b.target[2] - a.target[2]) * s,
      ];
    }
  }
  const last = CAM_PROGRAM[CAM_PROGRAM.length - 1];
  return [...last.pos, ...last.target];
}

/* ═══════════════════════════════════════════════════════════════════
   TIMELINE & CAPTIONS
   ═══════════════════════════════════════════════════════════════════ */
const DEFAULT_T = {
  shelfStart: 0.06,
  shelfEnd: 0.16,
  itemsStart: 0.18,
  naiveStart: 0.28,
  naiveEnd: 0.46,
  optStart: 0.48,
  optDrawEnd: 0.56,
  raceStart: 0.58,
  raceEnd: 0.86,
  outroStart: 0.86,
  outroEnd: 1.0,
};

const CAPTIONS = [
  {
    start: 0,
    label: "Smart Picking",
    title: "AI-optimized pick routing.",
    stat: "Scroll to explore",
  },
  {
    start: 0.18,
    label: "01 — Order received",
    title: `${PICK_ITEMS.length} items located across ~${Math.round(
      TOTAL_W
    )}m × ${Math.round(TOTAL_D)}m floor.`,
    stat: "< 50ms lookup",
  },
  {
    start: 0.28,
    label: "02 — Naive sequence",
    title: "Pick items in order. Watch the zigzags.",
    stat: `${Math.round(NAIVE_DIST)}m · ${fmtTime(NAIVE_TIME_S)}`,
  },
  {
    start: 0.48,
    label: "03 — Optimal route",
    title: "AI plans a single sweep.",
    stat: `${Math.round(OPT_DIST)}m · ${SAVINGS_PCT}% shorter`,
  },
  {
    start: 0.58,
    label: "04 — Side-by-side race",
    title: "Two pickers. Same items. Different paths.",
    stat: `${Math.round(NAIVE_DIST)}m vs ${Math.round(OPT_DIST)}m`,
  },
  {
    start: 0.76,
    label: "05 — Optimal complete",
    title: "Back at dock. Naive still picking.",
    stat: `${fmtTime(OPT_TIME_S)} · ${SAVINGS_PCT}% faster`,
  },
  {
    start: 0.88,
    label: "06 — Both complete",
    title: `Optimal saved ${fmtTime(
      NAIVE_TIME_S - OPT_TIME_S
    )} and ${Math.round(NAIVE_DIST - OPT_DIST)}m of walking.`,
    stat: `Naive ${fmtTime(NAIVE_TIME_S)} · Optimal ${fmtTime(OPT_TIME_S)}`,
  },
];

export default function WarehouseShowcase() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const [caption, setCaption] = useState(CAPTIONS[0]);
  const tRef = useRef({ ...DEFAULT_T });
  const { paused } = useAnimationPaused();
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Debug
  const [showDebug, setShowDebug] = useState(false);
  const [, setDebugTick] = useState(0);
  const [scrollH, setScrollH] = useState(280);
  const [vig, setVig] = useState({
    size: 80,
    cx: 50,
    cy: 32,
    stop1: 90,
    midOp: 3,
    edgeOp: 89,
  });
  const debugRef = useRef({
    p: 0,
    shelfH: 0,
    optRouteVis: 0,
    optRouteProg: 0,
    naiveSegIdx: 0,
    naiveSegProg: 0,
    raceProg: 0,
    optProg: 0,
    naiveProg: 0,
    phase: "—",
    camY: 0,
  });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "d" || e.key === "D") setShowDebug((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!showDebug) return;
    const id = setInterval(() => setDebugTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [showDebug]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    const scrollEl = scrollRef.current;
    if (!canvas || !section || !scrollEl) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.011);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 250);

    /* ── Lighting ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir = new THREE.DirectionalLight(0xfff5e0, 0.85);
    dir.position.set(16, 40, 20);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 100;
    dir.shadow.camera.left = -45;
    dir.shadow.camera.right = 45;
    dir.shadow.camera.top = 45;
    dir.shadow.camera.bottom = -45;
    dir.shadow.bias = -0.0002;
    scene.add(dir);
    scene.add(new THREE.HemisphereLight(0x3a2810, 0x080808, 0.35));

    /* ── Floor ── */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    /* ── Floor grid — single merged LineSegments ── */
    const gridPts = [];
    const HW = 58;
    const HD = 52;
    const STEP = 2;
    for (let x = -HW; x <= HW; x += STEP)
      gridPts.push(
        new THREE.Vector3(x, 0.005, -HD),
        new THREE.Vector3(x, 0.005, HD)
      );
    for (let z = -HD; z <= HD; z += STEP)
      gridPts.push(
        new THREE.Vector3(-HW, 0.005, z),
        new THREE.Vector3(HW, 0.005, z)
      );
    const gridGeo = new THREE.BufferGeometry().setFromPoints(gridPts);
    scene.add(
      new THREE.LineSegments(
        gridGeo,
        new THREE.LineBasicMaterial({
          color: 0x141414,
          transparent: true,
          opacity: 0.6,
        })
      )
    );

    /* ── Aisle stripes ── */
    const stripeMat = new THREE.MeshBasicMaterial({
      color: 0x141414,
      transparent: true,
      opacity: 0.55,
    });
    AISLE_X.forEach((ax) => {
      const s = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, TOTAL_D + 4),
        stripeMat
      );
      s.rotation.x = -Math.PI / 2;
      s.position.set(ax, 0.015, 0);
      scene.add(s);
    });
    AISLE_Z.forEach((az) => {
      const s = new THREE.Mesh(
        new THREE.PlaneGeometry(TOTAL_W + 4, 1.1),
        stripeMat
      );
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, 0.015, az);
      scene.add(s);
    });

    /* ── Zone letters on floor ── */
    const ZONE_LETTERS = "ABCDEFGHIJ";
    function makeZoneSprite(letter) {
      const cv = document.createElement("canvas");
      cv.width = 128;
      cv.height = 128;
      const cx = cv.getContext("2d");
      cx.font = "bold 96px sans-serif";
      cx.fillStyle = "rgba(212,168,83,0.18)";
      cx.textAlign = "center";
      cx.textBaseline = "middle";
      cx.fillText(letter, 64, 64);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 2.4),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true })
      );
      m.rotation.x = -Math.PI / 2;
      return m;
    }
    for (let bx = 0; bx < BAYS_X; bx++) {
      const bayCenter = OX + bx * PITCH_X + AISLE_W + PAIR_W / 2;
      const m = makeZoneSprite(ZONE_LETTERS[bx]);
      m.position.set(bayCenter, 0.02, OZ + CROSS_W / 2 - 0.4);
      scene.add(m);
    }

    /* ── Ceiling trusses ── */
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.7,
      metalness: 0.5,
    });
    const NUM_TRUSSES = 6;
    for (let i = 0; i < NUM_TRUSSES; i++) {
      const z = OZ + (i / (NUM_TRUSSES - 1)) * TOTAL_D;
      const truss = new THREE.Mesh(
        new THREE.BoxGeometry(TOTAL_W + 6, 0.25, 0.4),
        trussMat
      );
      truss.position.set(0, CEIL_H, z);
      scene.add(truss);
    }

    /* ── Overhead lights ── */
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      emissive: WARM_WHITE,
      emissiveIntensity: 0.6,
      roughness: 0.4,
    });
    const ceilLightCount = 12;
    for (let i = 0; i < ceilLightCount; i++) {
      const lx = OX + (i + 0.5) * (TOTAL_W / ceilLightCount);
      [0.3, 0.7].forEach((zf) => {
        const lz = OZ + zf * TOTAL_D;
        const fix = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.5, 0.35, 12),
          lightMat
        );
        fix.position.set(lx, CEIL_H - 0.4, lz);
        scene.add(fix);
        const disk = new THREE.Mesh(
          new THREE.CircleGeometry(0.5, 16),
          new THREE.MeshBasicMaterial({
            color: WARM_WHITE,
            transparent: true,
            opacity: 0.5,
          })
        );
        disk.rotation.x = -Math.PI / 2;
        disk.position.set(lx, CEIL_H - 0.58, lz);
        scene.add(disk);
        const pl = new THREE.PointLight(WARM_WHITE, 0.6, 14, 2);
        pl.position.set(lx, CEIL_H - 0.8, lz);
        scene.add(pl);
        const pool = new THREE.Mesh(
          new THREE.CircleGeometry(2.2, 24),
          new THREE.MeshBasicMaterial({
            color: WARM_WHITE,
            transparent: true,
            opacity: 0.04,
          })
        );
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(lx, 0.025, lz);
        scene.add(pool);
      });
    }

    /* ── Dock ── */
    const dockOuter = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.55, 48),
      new THREE.MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
      })
    );
    dockOuter.rotation.x = -Math.PI / 2;
    dockOuter.position.set(DOCK_X, 0.02, DOCK_Z);
    scene.add(dockOuter);
    const dockInner = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.1, 48),
      new THREE.MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      })
    );
    dockInner.rotation.x = -Math.PI / 2;
    dockInner.position.set(DOCK_X, 0.025, DOCK_Z);
    scene.add(dockInner);

    /* ── Shelves: InstancedMesh + merged edges ── */
    const shelfGeo = new THREE.BoxGeometry(1, 1, 1);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      roughness: 0.55,
      metalness: 0.35,
    });
    const shelvesInst = new THREE.InstancedMesh(
      shelfGeo,
      shelfMat,
      SHELVES.length
    );
    shelvesInst.castShadow = true;
    shelvesInst.receiveShadow = true;
    scene.add(shelvesInst);

    const unitEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
    const unitEdgePosArr = unitEdges.attributes.position.array;
    const edgeFloats = [];
    SHELVES.forEach((s) => {
      const cx = s.x + s.w / 2;
      const cz = s.z + s.d / 2;
      for (let i = 0; i < unitEdgePosArr.length; i += 3) {
        edgeFloats.push(
          unitEdgePosArr[i] * s.w + cx,
          unitEdgePosArr[i + 1],
          unitEdgePosArr[i + 2] * s.d + cz
        );
      }
    });
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(edgeFloats, 3)
    );
    const edgesObj = new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({
        color: 0x3a3a3a,
        transparent: true,
        opacity: 0.45,
      })
    );
    scene.add(edgesObj);

    const dummy = new THREE.Object3D();
    let lastShelfH = -1;
    function updateShelfHeights(h) {
      if (Math.abs(h - lastShelfH) < 0.005) return;
      lastShelfH = h;
      const yScale = Math.max(0.05, h);
      SHELVES.forEach((s, i) => {
        dummy.position.set(s.x + s.w / 2, yScale / 2, s.z + s.d / 2);
        dummy.scale.set(s.w, yScale, s.d);
        dummy.updateMatrix();
        shelvesInst.setMatrixAt(i, dummy.matrix);
      });
      shelvesInst.instanceMatrix.needsUpdate = true;
      edgesObj.scale.y = yScale;
      edgesObj.position.y = yScale / 2;
    }
    updateShelfHeights(0);

    /* ── Pick markers ── */
    function makeTextSprite(text, subtext) {
      const cv = document.createElement("canvas");
      cv.width = 192;
      cv.height = 96;
      const cx = cv.getContext("2d");
      cx.font = "bold 26px monospace";
      cx.fillStyle = "rgba(212,168,83,0.95)";
      cx.textAlign = "center";
      cx.fillText(text, 96, 36);
      cx.font = "16px monospace";
      cx.fillStyle = "rgba(255,255,255,0.5)";
      cx.fillText(subtext, 96, 62);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthTest: false,
        })
      );
      sprite.scale.set(3.6, 1.8, 1);
      return sprite;
    }
    const PICK_TIMES = PICK_ITEMS.map((_, i) => `${10 + ((i * 7) % 25)}s`);

    const markers = [];
    PICK_ITEMS.forEach((item, idx) => {
      const group = new THREE.Group();
      group.visible = false;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.4, 0.55, 32),
        new THREE.MeshBasicMaterial({
          color: GOLD,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(item.x, 0.04, item.z);
      group.add(ring);
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 1, 4),
        new THREE.MeshBasicMaterial({
          color: GOLD,
          transparent: true,
          opacity: 0.14,
        })
      );
      beam.position.set(item.x, 0.5, item.z);
      group.add(beam);
      const diamond = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.3, 1),
        new THREE.MeshStandardMaterial({
          color: GOLD,
          emissive: GOLD,
          emissiveIntensity: 0.8,
          roughness: 0.2,
          metalness: 0.5,
        })
      );
      diamond.position.set(item.x, 1, item.z);
      group.add(diamond);
      const dEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.3, 1)),
        new THREE.LineBasicMaterial({
          color: GOLD,
          transparent: true,
          opacity: 0.5,
        })
      );
      dEdges.position.copy(diamond.position);
      group.add(dEdges);
      const light = new THREE.PointLight(GOLD, 0, 7);
      light.position.set(item.x, 1.2, item.z);
      group.add(light);
      const sprite = makeTextSprite(item.label, PICK_TIMES[idx]);
      sprite.position.set(item.x, SHELF_H + 1.6, item.z);
      group.add(sprite);
      scene.add(group);
      markers.push({
        group,
        ring,
        diamond,
        dEdges,
        beam,
        light,
        item,
        sprite,
        pickedNaive: false,
        pickedOpt: false,
      });
    });

    /* ── Naive route lines ── */
    const naiveSegs = NAIVE_SEGMENTS.map((seg) => {
      const pts = buildLinePoints(seg.pts);
      const pairs = [];
      for (let i = 0; i < pts.length - 1; i++)
        pairs.push(pts[i].clone(), pts[i + 1].clone());
      const geo = new THREE.BufferGeometry().setFromPoints(pairs);
      const mat = new THREE.LineDashedMaterial({
        color: RED_DIM,
        transparent: true,
        opacity: 0,
        dashSize: 0.5,
        gapSize: 0.3,
      });
      const line = new THREE.LineSegments(geo, mat);
      line.computeLineDistances();
      scene.add(line);
      return { geo, mat, line, pairs };
    });

    /* ── Optimal route line ── */
    const optPts = buildLinePoints(OPT_ROUTE);
    const optPairs = [];
    for (let i = 0; i < optPts.length - 1; i++)
      optPairs.push(optPts[i].clone(), optPts[i + 1].clone());
    const optGeo = new THREE.BufferGeometry().setFromPoints(optPairs);
    const optMat = new THREE.LineBasicMaterial({
      color: GOLD,
      transparent: true,
      opacity: 0,
    });
    scene.add(new THREE.LineSegments(optGeo, optMat));

    // Find each pick's fraction along the optimal route
    const optPickFracs = PICK_ITEMS.map((item) => {
      let bestIdx = 0;
      let bestD = Infinity;
      OPT_ROUTE.forEach((p, i) => {
        const d = (p[0] - item.x) ** 2 + (p[1] - item.z) ** 2;
        if (d < bestD) {
          bestD = d;
          bestIdx = i;
        }
      });
      return waypointFraction(optPts, bestIdx);
    });

    // Naive pick fractions: pick i is at the end of segment i
    const naivePickFracs = (() => {
      const fracs = [];
      let acc = 0;
      NAIVE_SEGMENTS.forEach((s, i) => {
        acc += s.dist;
        if (i < PICK_ITEMS.length) fracs.push(acc / NAIVE_DIST);
      });
      return fracs;
    })();

    /* ── Two pickers ── */
    function makePicker(color) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 20, 20),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 1.4,
          roughness: 0.15,
        })
      );
      g.add(body);
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.65, 24),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
        })
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = -0.3;
      g.add(halo);
      const lt = new THREE.PointLight(color, 3, 10);
      lt.position.y = 0.5;
      g.add(lt);
      g.position.set(DOCK_X, 0.4, DOCK_Z);
      g.visible = false;
      scene.add(g);
      return { group: g, body, halo, light: lt };
    }
    const pickerOpt = makePicker(GOLD);
    const pickerNaive = makePicker(RED_DIM);

    // Trails
    function makeTrail(color) {
      const N = 24;
      const positions = new Float32Array(N * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
      });
      const line = new THREE.Line(geo, mat);
      line.visible = false;
      scene.add(line);
      return { line, positions, geo, N, history: [] };
    }
    const trailOpt = makeTrail(GOLD);
    const trailNaive = makeTrail(RED_DIM);

    /* ── Resize ── */
    const resize = () => {
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    /* ═══ State ═══ */
    const state = {
      p: 0,
      shelfH: 0,
      optRouteVis: 0,
      optRouteProg: 0,
      naiveSegIdx: -1,
      naiveSegProg: 0,
      raceProg: 0,
      optProg: 0,
      naiveProg: 0,
    };

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => {
        const T = tRef.current;
        const p = (state.p = self.progress);

        state.shelfH =
          p < T.shelfStart
            ? 0
            : p < T.shelfEnd
            ? (p - T.shelfStart) / (T.shelfEnd - T.shelfStart)
            : p > T.outroStart
            ? Math.max(
                0.15,
                1 - (p - T.outroStart) / (T.outroEnd - T.outroStart)
              )
            : 1;

        // Naive route segments
        const naiveSpan = T.naiveEnd - T.naiveStart;
        const numSegs = NAIVE_SEGMENTS.length;
        if (p >= T.naiveStart && p < T.naiveEnd) {
          const local = (p - T.naiveStart) / naiveSpan;
          state.naiveSegIdx = Math.min(
            numSegs - 1,
            Math.floor(local * numSegs)
          );
          state.naiveSegProg = Math.min(1, local * numSegs - state.naiveSegIdx);
        } else if (p >= T.naiveEnd) {
          state.naiveSegIdx = numSegs - 1;
          state.naiveSegProg = 1;
        } else {
          state.naiveSegIdx = -1;
          state.naiveSegProg = 0;
        }

        // Optimal route
        if (p >= T.optStart) {
          state.optRouteVis = Math.min(1, (p - T.optStart) / 0.04) * 0.75;
          state.optRouteProg = Math.min(
            1,
            (p - T.optStart) / (T.optDrawEnd - T.optStart)
          );
        } else {
          state.optRouteVis = 0;
          state.optRouteProg = 0;
        }

        // Race
        if (p >= T.raceStart && p <= T.raceEnd) {
          state.raceProg = (p - T.raceStart) / (T.raceEnd - T.raceStart);
          state.naiveProg = Math.min(1, state.raceProg);
          state.optProg = Math.min(1, state.raceProg * OPT_SPEED_FACTOR);
        } else if (p > T.raceEnd) {
          state.raceProg = 1;
          state.naiveProg = 1;
          state.optProg = 1;
        } else {
          state.raceProg = 0;
          state.naiveProg = 0;
          state.optProg = 0;
        }

        if (p > T.outroStart) {
          const fade = Math.max(
            0,
            1 - (p - T.outroStart) / (T.outroEnd - T.outroStart)
          );
          state.optRouteVis *= fade;
        }

        // Captions
        let phaseName = "—";
        for (let i = CAPTIONS.length - 1; i >= 0; i--) {
          if (p >= CAPTIONS[i].start) {
            setCaption(CAPTIONS[i]);
            phaseName = CAPTIONS[i].label;
            break;
          }
        }

        Object.assign(debugRef.current, {
          p,
          shelfH: state.shelfH,
          optRouteVis: state.optRouteVis,
          optRouteProg: state.optRouteProg,
          naiveSegIdx: state.naiveSegIdx,
          naiveSegProg: state.naiveSegProg,
          raceProg: state.raceProg,
          optProg: state.optProg,
          naiveProg: state.naiveProg,
          phase: phaseName,
        });
      },
    });

    /* ── Build naive polyline for the naive picker ── */
    const naivePolyline = [];
    NAIVE_SEGMENTS.forEach((s, i) => {
      s.pts.forEach((p, j) => {
        if (i === 0 || j > 0) naivePolyline.push([p[0], p[1]]);
      });
    });
    const naivePtsVec = buildLinePoints(naivePolyline);

    /* ── Animate ── */
    let frameId;
    const clock = new THREE.Clock();
    const camPos = new THREE.Vector3(
      CAM_PROGRAM[0].pos[0],
      CAM_PROGRAM[0].pos[1],
      CAM_PROGRAM[0].pos[2]
    );
    const camTarget = new THREE.Vector3(0, 0, 0);

    function animate() {
      frameId = requestAnimationFrame(animate);
      if (pausedRef.current) return;
      const T = tRef.current;
      const t = clock.getElapsedTime();
      const p = state.p;
      const curH = SHELF_H * Math.max(0, Math.min(1, state.shelfH));
      updateShelfHeights(curH);

      // Markers
      const showItems = p >= T.itemsStart && p < T.outroStart;
      markers.forEach((m, i) => {
        const vis = showItems && p >= T.itemsStart + i * 0.004;
        if (vis && !m.group.visible) {
          m.group.visible = true;
          gsap.to(m.light, { intensity: 2.2, duration: 0.4 });
          gsap.fromTo(
            m.diamond.scale,
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 1, z: 1, duration: 0.4, ease: "back.out(2)" }
          );
        }
        if (!vis && m.group.visible) {
          m.group.visible = false;
          m.light.intensity = 0;
          m.pickedNaive = false;
          m.pickedOpt = false;
          m.diamond.material.color.setHex(GOLD);
          m.diamond.material.emissive.setHex(GOLD);
          m.diamond.material.emissiveIntensity = 0.8;
          m.ring.material.color.setHex(GOLD);
          m.light.color.setHex(GOLD);
        }
        if (!m.group.visible) return;

        if (
          !m.pickedOpt &&
          state.optProg > 0 &&
          state.optProg >= optPickFracs[i]
        ) {
          m.pickedOpt = true;
          m.diamond.material.color.setHex(GREEN);
          m.diamond.material.emissive.setHex(GREEN);
          m.ring.material.color.setHex(GREEN);
          m.light.color.setHex(GREEN);
        }
        if (
          !m.pickedNaive &&
          state.naiveProg > 0 &&
          state.naiveProg >= naivePickFracs[i]
        ) {
          m.pickedNaive = true;
          if (!m.pickedOpt) m.diamond.material.emissiveIntensity = 0.4;
        }

        const my = curH * 0.6 + 1.2 + Math.sin(t * 1.3 + i * 1.1) * 0.1;
        m.diamond.position.y = my;
        m.dEdges.position.y = my;
        m.light.position.y = my;
        m.beam.scale.y = my;
        m.beam.position.y = my / 2;
        if (m.sprite) m.sprite.position.y = curH + 1.6;
        m.diamond.rotation.y = t * 0.55 + i;
        m.diamond.rotation.x = Math.sin(t * 0.4 + i) * 0.12;
        m.dEdges.rotation.copy(m.diamond.rotation);
        m.ring.rotation.z = t * 0.2 + i;
      });

      // Naive route render
      const optDrawing = p >= T.optStart;
      naiveSegs.forEach((seg, i) => {
        let baseOp = 0;
        if (i <= state.naiveSegIdx) baseOp = 0.5;
        if (optDrawing) baseOp = Math.min(baseOp, 0.18);
        if (p > T.raceEnd) baseOp *= Math.max(0, 1 - (p - T.raceEnd) * 4);

        seg.mat.opacity = baseOp;
        if (i < state.naiveSegIdx || p >= T.naiveEnd) {
          seg.geo.setDrawRange(0, seg.pairs.length);
        } else if (i === state.naiveSegIdx) {
          seg.geo.setDrawRange(
            0,
            Math.max(2, Math.floor(state.naiveSegProg * seg.pairs.length))
          );
        } else {
          seg.geo.setDrawRange(0, 0);
        }
      });

      // Optimal route render
      optMat.opacity = state.optRouteVis;
      optGeo.setDrawRange(
        0,
        Math.max(2, Math.floor(state.optRouteProg * optPairs.length))
      );

      // Pickers
      const inRace = p >= T.raceStart && p <= T.outroEnd;
      pickerOpt.group.visible = inRace;
      pickerNaive.group.visible = inRace;
      trailOpt.line.visible = inRace;
      trailNaive.line.visible = inRace;

      if (inRace) {
        if (pickerOpt.group.userData.smoothP == null)
          pickerOpt.group.userData.smoothP = 0;
        pickerOpt.group.userData.smoothP +=
          (state.optProg - pickerOpt.group.userData.smoothP) * 0.14;
        const optPt = pointOnRoute(
          optPts,
          Math.min(0.9995, pickerOpt.group.userData.smoothP)
        );
        pickerOpt.group.position.set(optPt.x, 0.4, optPt.z);

        if (pickerNaive.group.userData.smoothP == null)
          pickerNaive.group.userData.smoothP = 0;
        pickerNaive.group.userData.smoothP +=
          (state.naiveProg - pickerNaive.group.userData.smoothP) * 0.14;
        const naivePt = pointOnRoute(
          naivePtsVec,
          Math.min(0.9995, pickerNaive.group.userData.smoothP)
        );
        pickerNaive.group.position.set(naivePt.x, 0.4, naivePt.z);

        const optDone = state.optProg >= 0.999;
        const naiveDone = state.naiveProg >= 0.999;
        pickerOpt.halo.rotation.z = t * 1.4;
        pickerNaive.halo.rotation.z = -t * 1.0;
        pickerOpt.halo.scale.setScalar(
          optDone ? 1 + Math.sin(t * 4) * 0.15 : 1
        );
        if (optDone) {
          pickerOpt.body.material.color.setHex(GREEN);
          pickerOpt.body.material.emissive.setHex(GREEN);
          pickerOpt.light.color.setHex(GREEN);
        } else {
          pickerOpt.body.material.color.setHex(GOLD);
          pickerOpt.body.material.emissive.setHex(GOLD);
          pickerOpt.light.color.setHex(GOLD);
        }
        if (naiveDone) {
          pickerNaive.body.material.color.setHex(GREEN);
          pickerNaive.body.material.emissive.setHex(GREEN);
          pickerNaive.light.color.setHex(GREEN);
        }

        function updateTrail(trail, pos) {
          trail.history.push([pos.x, 0.15, pos.z]);
          if (trail.history.length > trail.N) trail.history.shift();
          const arr = trail.positions;
          const fallback = trail.history[trail.history.length - 1] || [
            pos.x,
            0.15,
            pos.z,
          ];
          for (let i = 0; i < trail.N; i++) {
            const src = trail.history[i] || fallback;
            arr[i * 3] = src[0];
            arr[i * 3 + 1] = src[1];
            arr[i * 3 + 2] = src[2];
          }
          trail.geo.attributes.position.needsUpdate = true;
        }
        updateTrail(trailOpt, pickerOpt.group.position);
        updateTrail(trailNaive, pickerNaive.group.position);
      } else {
        pickerOpt.group.userData.smoothP = 0;
        pickerNaive.group.userData.smoothP = 0;
        trailOpt.history.length = 0;
        trailNaive.history.length = 0;
      }

      // Camera — chapter program
      const [cx, cy, cz, tx, ty, tz] = getCamForP(p);
      camPos.lerp(new THREE.Vector3(cx, cy, cz), 0.045);
      camTarget.lerp(new THREE.Vector3(tx, ty, tz), 0.045);
      camera.position.copy(camPos);
      camera.lookAt(camTarget);
      debugRef.current.camY = camPos.y;

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  const d = debugRef.current;
  const T = tRef.current;

  return (
    <section ref={sectionRef} id="warehouse" className={styles.section}>
      <div className={styles.sticky}>
        <div className={styles.canvasWrap}>
          <canvas ref={canvasRef} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 1,
              background: `radial-gradient(circle ${vig.size}vmin at ${
                vig.cx
              }% ${vig.cy}%, transparent 0%, transparent ${
                vig.stop1
              }%, rgba(0,0,0,${vig.midOp / 100}) ${Math.round(
                vig.stop1 + (100 - vig.stop1) * 0.5
              )}%, rgba(0,0,0,${vig.edgeOp / 100}) 100%)`,
            }}
          />
        </div>
        <div className={styles.infoBar}>
          <div key={caption.label} className={styles.phaseCard}>
            <span className={styles.phaseLabel}>{caption.label}</span>
            <h3 className={styles.phaseTitle}>{caption.title}</h3>
            <span className={styles.phaseStat}>{caption.stat}</span>
          </div>
        </div>

        {showDebug && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 100,
              background: "rgba(0,0,0,0.88)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "14px 16px",
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.7,
              minWidth: 300,
              maxHeight: "92vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--accent)",
                marginBottom: 8,
              }}
            >
              Warehouse Debug{" "}
              <span style={{ fontWeight: 400, opacity: 0.4 }}>
                (D to close)
              </span>
            </div>

            <div
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                paddingBottom: 6,
                marginBottom: 8,
              }}
            >
              <div>
                <span style={{ opacity: 0.4 }}>scroll:</span>{" "}
                <span style={{ color: "#5a9a4a" }}>
                  {(d.p * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span style={{ opacity: 0.4 }}>phase:</span> {d.phase}
              </div>
              <div>
                <span style={{ opacity: 0.4 }}>shelfH:</span>{" "}
                {d.shelfH.toFixed(3)}
              </div>
              <div>
                <span style={{ opacity: 0.4 }}>naiveSeg:</span> {d.naiveSegIdx}/
                {NAIVE_SEGMENTS.length - 1}{" "}
                <span style={{ opacity: 0.3 }}>prog:</span>{" "}
                {d.naiveSegProg.toFixed(3)}
              </div>
              <div>
                <span style={{ opacity: 0.4 }}>optRoute vis:</span>{" "}
                {d.optRouteVis.toFixed(2)}{" "}
                <span style={{ opacity: 0.3 }}>prog:</span>{" "}
                {d.optRouteProg.toFixed(2)}
              </div>
              <div>
                <span style={{ opacity: 0.4 }}>race:</span>{" "}
                {d.raceProg.toFixed(2)}{" "}
                <span style={{ opacity: 0.3 }}>opt:</span>{" "}
                {d.optProg.toFixed(2)}{" "}
                <span style={{ opacity: 0.3 }}>naive:</span>{" "}
                {d.naiveProg.toFixed(2)}
              </div>
              <div>
                <span style={{ opacity: 0.4 }}>camY:</span> {d.camY.toFixed(1)}
              </div>
              <div style={{ marginTop: 4, opacity: 0.5, fontSize: 9 }}>
                naive {NAIVE_DIST.toFixed(0)}m · opt {OPT_DIST.toFixed(0)}m ·{" "}
                {SAVINGS_PCT}% saved
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span style={{ opacity: 0.4 }}>scrollSpace:</span>
                <span style={{ color: "var(--accent)" }}>{scrollH}vh</span>
              </label>
              <input
                type="range"
                min={150}
                max={500}
                step={10}
                value={scrollH}
                onChange={(e) => setScrollH(Number(e.target.value))}
                style={{ width: "100%", marginTop: 2 }}
              />
            </div>

            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "var(--accent)",
                marginBottom: 4,
              }}
            >
              Timeline (0–1)
            </div>
            {Object.keys(DEFAULT_T).map((key) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    width: 84,
                    opacity: 0.4,
                    flexShrink: 0,
                    fontSize: 9,
                  }}
                >
                  {key}:
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(T[key] * 100)}
                  onChange={(e) => {
                    tRef.current[key] = Number(e.target.value) / 100;
                    setDebugTick((t) => t + 1);
                  }}
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    width: 30,
                    textAlign: "right",
                    color: "var(--accent)",
                    fontSize: 9,
                  }}
                >
                  {(T[key] * 100).toFixed(0)}%
                </span>
              </div>
            ))}

            <div
              style={{
                marginTop: 6,
                height: 16,
                background: "rgba(255,255,255,0.03)",
                borderRadius: 3,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: `${T.shelfStart * 100}%`,
                  width: `${(T.shelfEnd - T.shelfStart) * 100}%`,
                  height: "100%",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: `${T.naiveStart * 100}%`,
                  width: `${(T.naiveEnd - T.naiveStart) * 100}%`,
                  height: "100%",
                  background: "rgba(165,69,69,0.25)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: `${T.optStart * 100}%`,
                  width: `${(T.optDrawEnd - T.optStart) * 100}%`,
                  height: "100%",
                  background: "rgba(212,168,83,0.18)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: `${T.raceStart * 100}%`,
                  width: `${(T.raceEnd - T.raceStart) * 100}%`,
                  height: "100%",
                  background: "rgba(90,154,74,0.18)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: `${T.outroStart * 100}%`,
                  width: `${(T.outroEnd - T.outroStart) * 100}%`,
                  height: "100%",
                  background: "rgba(255,255,255,0.04)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: `${d.p * 100}%`,
                  top: 0,
                  width: 2,
                  height: "100%",
                  background: "var(--accent)",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 7,
                opacity: 0.2,
                marginTop: 1,
              }}
            >
              <span>shelf</span>
              <span>naive</span>
              <span>opt</span>
              <span>race</span>
              <span>outro</span>
            </div>

            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "var(--accent)",
                marginTop: 8,
                marginBottom: 4,
              }}
            >
              Vignette
            </div>
            {[
              { key: "size", label: "size", min: 20, max: 100 },
              { key: "cx", label: "cx %", min: 0, max: 100 },
              { key: "cy", label: "cy %", min: 0, max: 100 },
              { key: "stop1", label: "transparent", min: 20, max: 100 },
              { key: "midOp", label: "mid op", min: 0, max: 100 },
              { key: "edgeOp", label: "edge op", min: 0, max: 100 },
            ].map(({ key, label, min, max }) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 2,
                }}
              >
                <span style={{ width: 60, opacity: 0.4, fontSize: 9 }}>
                  {label}:
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={1}
                  value={vig[key]}
                  onChange={(e) =>
                    setVig((v) => ({ ...v, [key]: Number(e.target.value) }))
                  }
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    width: 24,
                    textAlign: "right",
                    color: "var(--accent)",
                    fontSize: 9,
                  }}
                >
                  {vig[key]}
                </span>
              </div>
            ))}

            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(
                    JSON.stringify(
                      { timeline: tRef.current, vignette: vig, scrollH },
                      null,
                      2
                    )
                  )
                }
                style={{
                  flex: 1,
                  padding: "5px 0",
                  background: "rgba(212,168,83,0.08)",
                  border: "1px solid rgba(212,168,83,0.15)",
                  color: "var(--accent)",
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  cursor: "pointer",
                  borderRadius: 4,
                }}
              >
                Copy JSON
              </button>
            </div>
            <div
              style={{
                marginTop: 4,
                padding: 6,
                background: "rgba(255,255,255,0.02)",
                borderRadius: 4,
                fontSize: 7,
                color: "rgba(255,255,255,0.2)",
                wordBreak: "break-all",
                maxHeight: 60,
                overflowY: "auto",
              }}
            >
              {JSON.stringify({
                timeline: tRef.current,
                vignette: vig,
                scrollH,
              })}
            </div>
          </div>
        )}
      </div>
      <div
        ref={scrollRef}
        className={styles.scrollSpace}
        style={{ height: `${scrollH}vh` }}
      />
    </section>
  );
}
