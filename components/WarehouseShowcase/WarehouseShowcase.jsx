"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAnimationPaused } from "@/lib/AnimationContext";
import styles from "./WarehouseShowcase.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ═══ Warehouse: mathematically aligned to grid ═══ */
const SHELF_H = 2.4,
  SHELF_D = 0.8,
  SHELF_W = 2.2;
const AISLE_W = 2.0,
  PAIR_GAP = 0.8;
const PAIR_W = SHELF_D * 2 + PAIR_GAP;
const PITCH_X = AISLE_W + PAIR_W;
const SHELF_GAP_Z = 0.6;
const PITCH_Z = SHELF_W + SHELF_GAP_Z;
const CROSS_W = 2.0;
const BAYS_X = 6,
  GROUPS_Z = 3,
  SHELVES_PER_GROUP = 3;
const GROUP_DEPTH = SHELVES_PER_GROUP * PITCH_Z;
const TOTAL_W = BAYS_X * PITCH_X;
const TOTAL_D = GROUPS_Z * GROUP_DEPTH + (GROUPS_Z + 1) * CROSS_W;
const OX = -TOTAL_W / 2,
  OZ = -TOTAL_D / 2;

const AISLE_X = [];
for (let i = 0; i <= BAYS_X; i++) AISLE_X.push(OX + i * PITCH_X + AISLE_W / 2);
const AISLE_Z = [];
for (let i = 0; i <= GROUPS_Z; i++)
  AISLE_Z.push(OZ + i * (GROUP_DEPTH + CROSS_W) + CROSS_W / 2);
const DOCK_X = 0,
  DOCK_Z = AISLE_Z[AISLE_Z.length - 1] + 4;

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
const PICK_ITEMS = [
  { x: AISLE_X[0], z: _sz(0, 1), label: "A1-047" },
  { x: AISLE_X[5], z: _sz(2, 0), label: "F3-392" },
  { x: AISLE_X[1], z: _sz(1, 2), label: "B2-201" },
  { x: AISLE_X[3], z: _sz(0, 0), label: "D1-854" },
  { x: AISLE_X[6], z: _sz(1, 1), label: "G2-133" },
  { x: AISLE_X[2], z: _sz(2, 2), label: "C3-776" },
  { x: AISLE_X[4], z: _sz(0, 2), label: "E1-441" },
  { x: AISLE_X[3], z: _sz(2, 1), label: "D3-519" },
];

const AZ_BOT = AISLE_Z[AISLE_Z.length - 1],
  AZ_TOP = AISLE_Z[0];

// Optimal route
const OPT_ROUTE = [
  [DOCK_X, DOCK_Z],
  [DOCK_X, AZ_BOT],
  [AISLE_X[0], AZ_BOT],
  [AISLE_X[0], _sz(0, 1)],
  [AISLE_X[0], AISLE_Z[1]],
  [AISLE_X[1], AISLE_Z[1]],
  [AISLE_X[1], _sz(1, 2)],
  [AISLE_X[1], AISLE_Z[2]],
  [AISLE_X[2], AISLE_Z[2]],
  [AISLE_X[2], _sz(2, 2)],
  [AISLE_X[2], AZ_BOT],
  [AISLE_X[3], AZ_BOT],
  [AISLE_X[3], _sz(2, 1)],
  [AISLE_X[3], AISLE_Z[1]],
  [AISLE_X[3], _sz(0, 0)],
  [AISLE_X[3], AZ_TOP],
  [AISLE_X[4], AZ_TOP],
  [AISLE_X[4], _sz(0, 2)],
  [AISLE_X[4], AISLE_Z[2]],
  [AISLE_X[5], AISLE_Z[2]],
  [AISLE_X[5], _sz(2, 0)],
  [AISLE_X[5], AZ_BOT],
  [AISLE_X[6], AZ_BOT],
  [AISLE_X[6], _sz(1, 1)],
  [AISLE_X[6], AZ_BOT],
  [DOCK_X, AZ_BOT],
  [DOCK_X, DOCK_Z],
];

// Naive route — broken into segments per pick
const NAIVE_SEGMENTS = [
  {
    label: "Dock → A1",
    pts: [
      [DOCK_X, DOCK_Z],
      [DOCK_X, AZ_BOT],
      [AISLE_X[0], AZ_BOT],
      [AISLE_X[0], _sz(0, 1)],
    ],
  },
  {
    label: "A1 → F3",
    pts: [
      [AISLE_X[0], _sz(0, 1)],
      [AISLE_X[0], AZ_TOP],
      [AISLE_X[5], AZ_TOP],
      [AISLE_X[5], AISLE_Z[2]],
      [AISLE_X[5], _sz(2, 0)],
    ],
  },
  {
    label: "F3 → B2",
    pts: [
      [AISLE_X[5], _sz(2, 0)],
      [AISLE_X[5], AZ_BOT],
      [AISLE_X[1], AZ_BOT],
      [AISLE_X[1], _sz(1, 2)],
    ],
  },
  {
    label: "B2 → D1",
    pts: [
      [AISLE_X[1], _sz(1, 2)],
      [AISLE_X[1], AZ_TOP],
      [AISLE_X[3], AZ_TOP],
      [AISLE_X[3], _sz(0, 0)],
    ],
  },
  {
    label: "D1 → G2",
    pts: [
      [AISLE_X[3], _sz(0, 0)],
      [AISLE_X[3], AZ_BOT],
      [AISLE_X[6], AZ_BOT],
      [AISLE_X[6], _sz(1, 1)],
    ],
  },
  {
    label: "G2 → C3",
    pts: [
      [AISLE_X[6], _sz(1, 1)],
      [AISLE_X[6], AZ_TOP],
      [AISLE_X[2], AZ_TOP],
      [AISLE_X[2], AISLE_Z[2]],
      [AISLE_X[2], _sz(2, 2)],
    ],
  },
  {
    label: "C3 → E1",
    pts: [
      [AISLE_X[2], _sz(2, 2)],
      [AISLE_X[2], AZ_BOT],
      [AISLE_X[4], AZ_BOT],
      [AISLE_X[4], AZ_TOP],
      [AISLE_X[4], _sz(0, 2)],
    ],
  },
  {
    label: "E1 → D3",
    pts: [
      [AISLE_X[4], _sz(0, 2)],
      [AISLE_X[4], AZ_BOT],
      [AISLE_X[3], AZ_BOT],
      [AISLE_X[3], _sz(2, 1)],
    ],
  },
  {
    label: "D3 → Dock",
    pts: [
      [AISLE_X[3], _sz(2, 1)],
      [AISLE_X[3], AZ_BOT],
      [DOCK_X, AZ_BOT],
      [DOCK_X, DOCK_Z],
    ],
  },
];

// Compute distances per segment (1 unit ≈ 1m, speed ≈ 1.2 m/s)
function segDist(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++)
    d += Math.sqrt(
      (pts[i][0] - pts[i - 1][0]) ** 2 + (pts[i][1] - pts[i - 1][1]) ** 2
    );
  return d;
}
NAIVE_SEGMENTS.forEach((s) => {
  s.dist = segDist(s.pts);
  s.time = s.dist / 1.2;
});

const GOLD = 0xd4a853,
  GREEN = 0x5a9a4a,
  RED_DIM = 0x993333;

/* ── Route helpers ── */
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

/* ═══ Timeline defaults ═══ */
const DEFAULT_T = {
  shelfStart: 0,
  shelfEnd: 0.12,
  itemsStart: 0.12,
  naiveStart: 0.22,
  naiveEnd: 0.5,
  routeStart: 0.42,
  routeDrawEnd: 0.58,
  pickStart: 0.58,
  returnEnd: 0.84,
  outroStart: 0.84,
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
    start: 0.12,
    label: "01 — Order received",
    title: "8 items located across the grid.",
    stat: "< 50ms lookup",
  },
  {
    start: 0.22,
    label: "02 — Naive path drawn",
    title: "Sequential pick order — zigzags.",
    stat: "Watch each leg appear",
  },
  {
    start: 0.42,
    label: "03 — Optimal route",
    title: "AI calculates shortest path.",
    stat: "43% less distance",
  },
  {
    start: 0.58,
    label: "04 — Pick in progress",
    title: "Following the optimal route.",
    stat: "99.7% accuracy",
  },
  {
    start: 0.84,
    label: "05 — Complete",
    title: "Packed, verified, shipped.",
    stat: "2m 08s · 43% faster",
  },
];

/* ═══ Stat sprite helper ═══ */
function makeStatSprite(text, subtext) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 56;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 16px monospace";
  ctx.fillStyle = "rgba(153,51,51,0.9)";
  ctx.textAlign = "center";
  ctx.fillText(text, 80, 20);
  ctx.font = "11px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText(subtext, 80, 40);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.2, 1.1, 1);
  sprite.visible = false;
  return sprite;
}

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
  const [debugTick, setDebugTick] = useState(0);
  const [scrollH, setScrollH] = useState(180);
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
    routeVis: 0,
    routeProgress: 0,
    naiveSegIdx: 0,
    naiveSegProg: 0,
    pickProgress: 0,
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
    const canvas = canvasRef.current,
      section = sectionRef.current,
      scrollEl = scrollRef.current;
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
    const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 200);

    /* ── Lighting ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 28, 14);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 70;
    dir.shadow.camera.left = -35;
    dir.shadow.camera.right = 35;
    dir.shadow.camera.top = 35;
    dir.shadow.camera.bottom = -35;
    scene.add(dir);
    scene.add(new THREE.HemisphereLight(0x2a2010, 0x080808, 0.3));

    /* ── Floor ── */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const gMat = new THREE.LineBasicMaterial({ color: 0x151515 });
    for (let i = -40; i <= 40; i += 2) {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i, 0.005, -40),
        new THREE.Vector3(i, 0.005, 40),
      ]);
      scene.add(new THREE.Line(g, gMat));
      const g2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-40, 0.005, i),
        new THREE.Vector3(40, 0.005, i),
      ]);
      scene.add(new THREE.Line(g2, gMat));
    }

    /* ── Aisle markings ── */
    const sM = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.5,
    });
    AISLE_X.forEach((ax) => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 44), sM);
      s.rotation.x = -Math.PI / 2;
      s.position.set(ax, 0.015, -2);
      scene.add(s);
    });
    AISLE_Z.forEach((az) => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(50, 1.0), sM);
      s.rotation.x = -Math.PI / 2;
      s.position.set(-2, 0.015, az);
      scene.add(s);
    });

    /* ── Dock ── */
    const dockRing = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.0, 32),
      new THREE.MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      })
    );
    dockRing.rotation.x = -Math.PI / 2;
    dockRing.position.set(DOCK_X, 0.02, DOCK_Z);
    scene.add(dockRing);
    const sRing = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.2, 32),
      new THREE.MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
      })
    );
    sRing.rotation.x = -Math.PI / 2;
    sRing.position.set(DOCK_X, 0.02, DOCK_Z);
    scene.add(sRing);

    /* ── Shelves ── */
    const shelfMeshes = [];
    SHELVES.forEach((s) => {
      const geo = new THREE.BoxGeometry(s.w, SHELF_H, s.d);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: 0x1c1c1c,
          roughness: 0.6,
          metalness: 0.3,
        })
      );
      mesh.position.set(s.x + s.w / 2, SHELF_H / 2, s.z + s.d / 2);
      mesh.castShadow = true;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({
          color: 0x333333,
          transparent: true,
          opacity: 0.4,
        })
      );
      edges.position.copy(mesh.position);
      scene.add(mesh);
      scene.add(edges);
      shelfMeshes.push({ mesh, edges });
    });

    /* ── Pick markers with text labels ── */
    const PICK_TIMES = [
      "0:12",
      "0:24",
      "0:18",
      "0:31",
      "0:15",
      "0:22",
      "0:28",
      "0:20",
    ];
    function makeTextSprite(text, subtext) {
      const cv = document.createElement("canvas");
      cv.width = 128;
      cv.height = 64;
      const cx = cv.getContext("2d");
      cx.font = "bold 18px monospace";
      cx.fillStyle = "rgba(212,168,83,0.9)";
      cx.textAlign = "center";
      cx.fillText(text, 64, 24);
      cx.font = "12px monospace";
      cx.fillStyle = "rgba(255,255,255,0.5)";
      cx.fillText(subtext, 64, 44);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthTest: false,
        })
      );
      sprite.scale.set(2.5, 1.25, 1);
      return sprite;
    }

    const markers = [];
    PICK_ITEMS.forEach((item, idx) => {
      const group = new THREE.Group();
      group.visible = false;
      const cz = item.z;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.35, 0.48, 32),
        new THREE.MeshBasicMaterial({
          color: GOLD,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(item.x, 0.04, cz);
      group.add(ring);
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 1, 4),
        new THREE.MeshBasicMaterial({
          color: GOLD,
          transparent: true,
          opacity: 0.12,
        })
      );
      beam.position.set(item.x, 0.5, cz);
      group.add(beam);
      const diamond = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.25, 1),
        new THREE.MeshStandardMaterial({
          color: GOLD,
          emissive: GOLD,
          emissiveIntensity: 0.7,
          roughness: 0.2,
          metalness: 0.5,
          transparent: true,
          opacity: 0.9,
        })
      );
      diamond.position.set(item.x, 1, cz);
      group.add(diamond);
      const dEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.25, 1)),
        new THREE.LineBasicMaterial({
          color: GOLD,
          transparent: true,
          opacity: 0.4,
        })
      );
      dEdges.position.copy(diamond.position);
      group.add(dEdges);
      const light = new THREE.PointLight(GOLD, 0, 6);
      light.position.set(item.x, 1, cz);
      group.add(light);
      const sprite = makeTextSprite(item.label, PICK_TIMES[idx]);
      sprite.position.set(item.x, SHELF_H + 2.8, cz);
      group.add(sprite);
      scene.add(group);
      markers.push({
        group,
        ring,
        diamond,
        dEdges,
        beam,
        light,
        cz,
        item,
        sprite,
        picked: false,
      });
    });

    /* ── Naive route: per-segment lines + stat sprites ── */
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
        dashSize: 0.4,
        gapSize: 0.25,
      });
      const line = new THREE.LineSegments(geo, mat);
      line.computeLineDistances();
      scene.add(line);

      // Stat sprite at midpoint of segment
      const mid = pts[Math.floor(pts.length / 2)];
      const statSprite = makeStatSprite(
        `${seg.dist.toFixed(1)}m`,
        `${seg.time.toFixed(1)}s · ${seg.label}`
      );
      statSprite.position.set(mid.x, 4.5, mid.z);
      scene.add(statSprite);

      return {
        geo,
        mat,
        line,
        pairs,
        statSprite,
        dist: seg.dist,
        time: seg.time,
      };
    });

    /* ── Optimal route ── */
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

    const pickWaypoints = [3, 20, 6, 14, 23, 9, 17, 12];
    const pickFracs = pickWaypoints.map((idx) => waypointFraction(optPts, idx));

    /* ── Picker ── */
    const picker = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshStandardMaterial({
        color: GOLD,
        emissive: GOLD,
        emissiveIntensity: 1.5,
        roughness: 0.1,
      })
    );
    picker.position.set(DOCK_X, 0.35, DOCK_Z);
    picker.visible = false;
    scene.add(picker);
    const pLight = new THREE.PointLight(GOLD, 0, 8);
    pLight.position.set(DOCK_X, 2, DOCK_Z);
    scene.add(pLight);

    /* ── Resize ── */
    const resize = () => {
      const w = canvas.parentElement.clientWidth,
        h = canvas.parentElement.clientHeight;
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
      routeVis: 0,
      routeProgress: 0,
      naiveSegIdx: 0,
      naiveSegProg: 0,
      pickProgress: 0,
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
          p < T.shelfEnd
            ? p / T.shelfEnd
            : p > T.outroStart
            ? Math.max(0, 1 - (p - T.outroStart) / (T.outroEnd - T.outroStart))
            : 1;

        // Naive segments: draw one at a time across naiveStart→naiveEnd
        const naiveSpan = T.naiveEnd - T.naiveStart;
        const numSegs = NAIVE_SEGMENTS.length;
        if (p >= T.naiveStart && p < T.naiveEnd + 0.05) {
          const naiveLocal = (p - T.naiveStart) / naiveSpan;
          state.naiveSegIdx = Math.min(
            numSegs - 1,
            Math.floor(naiveLocal * numSegs)
          );
          const segLocal = naiveLocal * numSegs - state.naiveSegIdx;
          state.naiveSegProg = Math.min(1, segLocal);
        } else if (p >= T.naiveEnd + 0.05) {
          state.naiveSegIdx = numSegs - 1;
          state.naiveSegProg = 1;
        } else {
          state.naiveSegIdx = -1;
          state.naiveSegProg = 0;
        }

        // Optimal route
        if (p >= T.routeStart) {
          state.routeVis = Math.min(1, (p - T.routeStart) / 0.04) * 0.65;
          state.routeProgress = Math.min(
            1,
            (p - T.routeStart) / (T.routeDrawEnd - T.routeStart)
          );
        } else {
          state.routeVis = 0;
          state.routeProgress = 0;
        }

        // Pick progress
        if (p >= T.pickStart && p <= T.returnEnd) {
          state.pickProgress = Math.min(
            1,
            (p - T.pickStart) / (T.returnEnd - T.pickStart)
          );
        }

        // Outro
        if (p > T.outroStart)
          state.routeVis *= Math.max(
            0,
            1 - (p - T.outroStart) / (T.outroEnd - T.outroStart)
          );

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
          routeVis: state.routeVis,
          routeProgress: state.routeProgress,
          naiveSegIdx: state.naiveSegIdx,
          naiveSegProg: state.naiveSegProg,
          pickProgress: state.pickProgress,
          phase: phaseName,
        });
      },
    });

    /* ── Animate ── */
    let frameId;
    const clock = new THREE.Clock();
    const camPos = new THREE.Vector3(0, 50, 44);
    const camTarget = new THREE.Vector3();

    function animate() {
      frameId = requestAnimationFrame(animate);
      if (pausedRef.current) return;
      const T = tRef.current;
      const t = clock.getElapsedTime();
      const p = state.p;
      const curH = SHELF_H * Math.max(0, Math.min(1, state.shelfH));

      shelfMeshes.forEach(({ mesh, edges }) => {
        const h = Math.max(0.05, curH);
        mesh.scale.y = h;
        mesh.position.y = h / 2;
        edges.scale.y = h;
        edges.position.y = h / 2;
      });

      const showItems = p >= T.itemsStart && p < T.outroStart;
      markers.forEach((m, i) => {
        const vis = showItems && p >= T.itemsStart + i * 0.005;
        if (vis && !m.group.visible) {
          m.group.visible = true;
          gsap.to(m.light, { intensity: 2, duration: 0.4 });
          gsap.fromTo(
            m.diamond.scale,
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 1, z: 1, duration: 0.4, ease: "back.out(2)" }
          );
        }
        if (!vis && m.group.visible) {
          m.group.visible = false;
          m.light.intensity = 0;
          m.picked = false;
          m.diamond.material.color.setHex(GOLD);
          m.diamond.material.emissive.setHex(GOLD);
          m.ring.material.color.setHex(GOLD);
          m.light.color.setHex(GOLD);
        }
        if (!m.group.visible) return;
        if (
          !m.picked &&
          state.pickProgress > 0 &&
          state.pickProgress >= pickFracs[i]
        ) {
          m.picked = true;
          m.diamond.material.color.setHex(GREEN);
          m.diamond.material.emissive.setHex(GREEN);
          m.ring.material.color.setHex(GREEN);
          m.light.color.setHex(GREEN);
        }
        const my = curH + 0.9 + Math.sin(t * 1.4 + i * 1.3) * 0.08;
        m.diamond.position.y = my;
        m.dEdges.position.y = my;
        m.light.position.y = my;
        m.beam.scale.y = my;
        m.beam.position.y = my / 2;
        if (m.sprite) m.sprite.position.y = my + 1.6;
        m.diamond.rotation.y = t * 0.6 + i;
        m.diamond.rotation.x = Math.sin(t * 0.4 + i) * 0.12;
        m.dEdges.rotation.copy(m.diamond.rotation);
        m.ring.rotation.z = t * 0.2 + i;
      });

      sRing.rotation.z = t * 0.12;

      // Naive segments — draw one at a time, fade out old ones when optimal appears
      const optOverlap = p >= T.routeStart;
      naiveSegs.forEach((seg, i) => {
        if (i < state.naiveSegIdx) {
          // Completed segment: show fully, fade when optimal draws
          seg.mat.opacity = optOverlap
            ? Math.max(0, 0.35 - (p - T.routeStart) * 2)
            : 0.35;
          seg.geo.setDrawRange(0, seg.pairs.length);
          seg.statSprite.visible = !optOverlap && p >= T.naiveStart;
          seg.statSprite.material.opacity = optOverlap ? 0 : 0.8;
        } else if (i === state.naiveSegIdx) {
          // Currently drawing segment
          seg.mat.opacity = optOverlap
            ? Math.max(0, 0.35 - (p - T.routeStart) * 2)
            : 0.35;
          seg.geo.setDrawRange(
            0,
            Math.max(2, Math.floor(state.naiveSegProg * seg.pairs.length))
          );
          seg.statSprite.visible = state.naiveSegProg > 0.8 && !optOverlap;
          seg.statSprite.material.opacity =
            state.naiveSegProg > 0.8
              ? Math.min(0.8, (state.naiveSegProg - 0.8) * 4)
              : 0;
        } else {
          // Not yet drawn
          seg.mat.opacity = 0;
          seg.geo.setDrawRange(0, 0);
          seg.statSprite.visible = false;
        }
      });

      // Optimal route
      optMat.opacity = state.routeVis;
      optGeo.setDrawRange(
        0,
        Math.max(2, Math.floor(state.routeProgress * optPairs.length))
      );

      // Picker
      const pickerMoving = p >= T.pickStart && p <= T.returnEnd;
      picker.visible = pickerMoving;
      if (pickerMoving) {
        if (!picker.userData.smoothP)
          picker.userData.smoothP = state.pickProgress;
        picker.userData.smoothP +=
          (state.pickProgress - picker.userData.smoothP) * 0.12;
        const pt = pointOnRoute(
          optPts,
          Math.min(0.999, picker.userData.smoothP)
        );
        picker.position.set(pt.x, 0.35, pt.z);
        pLight.position.set(pt.x, 2, pt.z);
        pLight.intensity += (5 - pLight.intensity) * 0.1;
      } else {
        picker.userData.smoothP = 0;
        pLight.intensity *= 0.9;
        if (pLight.intensity < 0.01) pLight.intensity = 0;
      }

      // Camera
      if (pickerMoving) {
        camPos.lerp(
          new THREE.Vector3(picker.position.x, 42, picker.position.z),
          0.03
        );
        camTarget.lerp(
          new THREE.Vector3(picker.position.x, 0, picker.position.z),
          0.03
        );
      } else if (p > T.returnEnd) {
        camPos.lerp(new THREE.Vector3(0, 50, 44), 0.025);
        camTarget.lerp(new THREE.Vector3(0, 0, 0), 0.025);
      } else {
        const orbitT = Math.min(1, p / Math.max(0.01, T.pickStart));
        const angle = orbitT * Math.PI * 0.4;
        const radius = 44 - orbitT * 14;
        const height = 50 - orbitT * 8;
        camPos.lerp(
          new THREE.Vector3(
            Math.sin(angle) * radius,
            height,
            Math.cos(angle) * radius
          ),
          0.04
        );
        camTarget.lerp(new THREE.Vector3(0, 0, 0), 0.04);
      }

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
              minWidth: 280,
              maxHeight: "90vh",
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

            {/* Live */}
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
                <span style={{ opacity: 0.4 }}>routeVis:</span>{" "}
                {d.routeVis.toFixed(3)}{" "}
                <span style={{ opacity: 0.3 }}>prog:</span>{" "}
                {d.routeProgress.toFixed(3)}
              </div>
              <div>
                <span style={{ opacity: 0.4 }}>pickProg:</span>{" "}
                {d.pickProgress.toFixed(3)}
              </div>
              <div>
                <span style={{ opacity: 0.4 }}>camY:</span> {d.camY.toFixed(1)}
              </div>
            </div>

            {/* ScrollHeight */}
            <div style={{ marginBottom: 8 }}>
              <label
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span style={{ opacity: 0.4 }}>scrollSpace:</span>
                <span style={{ color: "var(--accent)" }}>{scrollH}vh</span>
              </label>
              <input
                type="range"
                min={100}
                max={500}
                step={10}
                value={scrollH}
                onChange={(e) => setScrollH(Number(e.target.value))}
                style={{ width: "100%", marginTop: 2 }}
              />
            </div>

            {/* Timeline */}
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
                    width: 80,
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

            {/* Timeline vis */}
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
                  background: "rgba(153,51,51,0.25)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: `${T.routeStart * 100}%`,
                  width: `${(T.routeDrawEnd - T.routeStart) * 100}%`,
                  height: "100%",
                  background: "rgba(212,168,83,0.15)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: `${T.pickStart * 100}%`,
                  width: `${(T.returnEnd - T.pickStart) * 100}%`,
                  height: "100%",
                  background: "rgba(90,154,74,0.15)",
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
              <span>route</span>
              <span>pick</span>
              <span>outro</span>
            </div>

            {/* Vignette */}
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

            {/* JSON export */}
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
