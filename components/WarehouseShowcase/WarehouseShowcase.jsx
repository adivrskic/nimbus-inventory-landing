"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAnimationPaused } from "@/lib/AnimationContext";
import styles from "./WarehouseShowcase.module.css";

gsap.registerPlugin(ScrollTrigger);

// ====================================================================
// LAYOUT — 4 groups of 5 bays × 12 columns × 2 sides = 480 racks
// ====================================================================
const NUM_GROUPS = 4;
const BAYS_PER_GROUP = 5;
const BAY_COUNT = NUM_GROUPS * BAYS_PER_GROUP; // 20
const COL_COUNT = 12;
const BAY_PITCH = 3.6;
const COL_SPACING = 5.2;
const CROSS_AISLE_WIDTH = 3.5;
const GROUP_WIDTH = BAYS_PER_GROUP * BAY_PITCH; // 18
const TOTAL_WIDTH =
  NUM_GROUPS * GROUP_WIDTH + (NUM_GROUPS - 1) * CROSS_AISLE_WIDTH; // 82.5
const START_X = -TOTAL_WIDTH / 2; // -41.25
const RACK_W = 3.4;
const RACK_H = 4.6;
const RACK_D = 1.0;
const AISLE_WIDTH = COL_SPACING - RACK_D;
const W_DEPTH = (COL_COUNT - 1) * COL_SPACING + RACK_D + 4;
const W_HALF_DEPTH = W_DEPTH / 2;
const DOCK_Z = W_HALF_DEPTH + 5;

const FOG_COLOR = 0x121214;
const COLOR_GOLD = 0xd4a853;
const COLOR_RED = 0xc84545;
const COLOR_GREEN = 0x5a9a4a;
const COLOR_RACK_EDGE = 0x565660;

// ====================================================================
// MATH HELPERS
// ====================================================================
function bayToX(b) {
  const gi = Math.floor(b / BAYS_PER_GROUP);
  const bg = b % BAYS_PER_GROUP;
  return (
    START_X + gi * (GROUP_WIDTH + CROSS_AISLE_WIDTH) + (bg + 0.5) * BAY_PITCH
  );
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function smoothstep(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

// ====================================================================
// ITEMS — order ORD-2847
// ====================================================================
const ITEMS = [
  { col: 1, bay: 1, side: 0, h: 3.4, code: "B1-047", zone: "B" },
  { col: 3, bay: 3, side: 1, h: 2.6, code: "I3-392", zone: "I" },
  { col: 2, bay: 7, side: 0, h: 3.8, code: "C3-201", zone: "C" },
  { col: 5, bay: 0, side: 1, h: 2.2, code: "J1-854", zone: "J" },
  { col: 7, bay: 14, side: 0, h: 3.2, code: "D1-776", zone: "D" },
  { col: 8, bay: 18, side: 1, h: 2.8, code: "H3-133", zone: "H" },
  { col: 10, bay: 4, side: 0, h: 3.6, code: "B3-441", zone: "B" },
  { col: 11, bay: 9, side: 1, h: 2.4, code: "F2-095", zone: "F" },
  { col: 6, bay: 6, side: 0, h: 3.0, code: "A1-217", zone: "A" },
  { col: 4, bay: 16, side: 1, h: 3.4, code: "G2-538", zone: "G" },
  { col: 9, bay: 12, side: 0, h: 2.6, code: "E4-628", zone: "E" },
  { col: 11, bay: 2, side: 1, h: 3.8, code: "I1-009", zone: "I" },
];

const ITEM_POS = ITEMS.map((it) => {
  const zCol = (it.col - (COL_COUNT - 1) / 2) * COL_SPACING;
  const x = bayToX(it.bay);
  const z = zCol + (it.side === 0 ? -RACK_D / 2 - 0.3 : RACK_D / 2 + 0.3);
  return { x, z, y: it.h };
});

// ====================================================================
// ROUTES
// ====================================================================
const NAIVE_WAYPOINTS = [
  [0, DOCK_Z],
  [0, 34],
  [0, -26],
  [-35.85, -26],
  [-42, -26],
  [-42, -10.4],
  [-28.65, -10.4],
  [-21.5, -10.4],
  [-21.5, -20.8],
  [-10.75, -20.8],
  [0, -20.8],
  [0, 0],
  [-39.45, 0],
  [-21.5, 0],
  [-21.5, 5.2],
  [17.95, 5.2],
  [21.5, 5.2],
  [21.5, 15.6],
  [35.85, 15.6],
  [42, 15.6],
  [42, 20.8],
  [-25.05, 20.8],
  [-21.5, 20.8],
  [-21.5, 31.2],
  [-3.55, 31.2],
  [0, 31.2],
  [0, 0],
  [-14.35, 0],
  [0, 0],
  [0, -5.2],
  [28.65, -5.2],
  [21.5, -5.2],
  [21.5, 15.6],
  [10.75, 15.6],
  [0, 15.6],
  [0, 31.2],
  [-32.25, 31.2],
  [0, 31.2],
  [0, DOCK_Z],
];
const NAIVE_PICKUP_FOR_ITEM = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];

const OPTIMAL_WAYPOINTS = [
  [0, DOCK_Z],
  [-42, DOCK_Z],
  [-42, -26],
  [-35.85, -26],
  [42, -26],
  [42, -20.8],
  [-10.75, -20.8],
  [-42, -20.8],
  [-42, -10.4],
  [-28.65, -10.4],
  [42, -10.4],
  [42, -5.2],
  [28.65, -5.2],
  [-42, -5.2],
  [-42, 0],
  [-39.45, 0],
  [-14.35, 0],
  [42, 0],
  [42, 5.2],
  [17.95, 5.2],
  [-42, 5.2],
  [-42, 15.6],
  [10.75, 15.6],
  [35.85, 15.6],
  [42, 15.6],
  [42, 20.8],
  [-25.05, 20.8],
  [-42, 20.8],
  [-42, 31.2],
  [-32.25, 31.2],
  [-3.55, 31.2],
  [0, 31.2],
  [0, DOCK_Z],
];
const OPTIMAL_PICKUP_FOR_ITEM = [3, 9, 6, 15, 19, 23, 26, 30, 16, 12, 22, 29];

function buildRoute(waypoints, pickupForItem) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [x1, z1] = waypoints[i];
    const [x2, z2] = waypoints[i + 1];
    const d = Math.hypot(x2 - x1, z2 - z1);
    segs.push({ s: total, e: total + d, x1, z1, x2, z2, d });
    total += d;
  }
  const distAt = (idx) => {
    let d = 0;
    for (let i = 0; i < idx && i < segs.length; i++) d += segs[i].d;
    return d;
  };
  const pickTs = pickupForItem.map((i) => distAt(i) / total);
  return { waypoints, segs, total, pickTs };
}

const NAIVE_ROUTE = buildRoute(NAIVE_WAYPOINTS, NAIVE_PICKUP_FOR_ITEM);
const OPT_ROUTE = buildRoute(OPTIMAL_WAYPOINTS, OPTIMAL_PICKUP_FOR_ITEM);
const NAIVE_TOTAL_DIST = NAIVE_ROUTE.total;
const OPT_TOTAL_DIST = OPT_ROUTE.total;
const SAVINGS_PCT = Math.round((1 - OPT_TOTAL_DIST / NAIVE_TOTAL_DIST) * 100);
const SAVED_METERS = Math.round(NAIVE_TOTAL_DIST - OPT_TOTAL_DIST);

const NAIVE_SECONDS = 188; // 3:08 reference
const OPT_SECONDS = Math.round(
  (OPT_TOTAL_DIST / NAIVE_TOTAL_DIST) * NAIVE_SECONDS
);
const SAVED_SECONDS = NAIVE_SECONDS - OPT_SECONDS;
function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}
const NAIVE_TIME = fmtTime(NAIVE_SECONDS);
const OPT_TIME = fmtTime(OPT_SECONDS);
const SAVED_TIME = fmtTime(SAVED_SECONDS);

function positionOnRoute(route, t) {
  const td = clamp(t, 0, 1) * route.total;
  for (const sg of route.segs) {
    if (td <= sg.e) {
      const k = sg.d > 0 ? (td - sg.s) / sg.d : 0;
      return { x: lerp(sg.x1, sg.x2, k), z: lerp(sg.z1, sg.z2, k) };
    }
  }
  const last = route.waypoints[route.waypoints.length - 1];
  return { x: last[0], z: last[1] };
}

function waypointsUpTo(route, t) {
  const td = clamp(t, 0, 1) * route.total;
  const out = [route.waypoints[0]];
  for (const sg of route.segs) {
    if (td <= sg.e) {
      const k = sg.d > 0 ? (td - sg.s) / sg.d : 0;
      out.push([lerp(sg.x1, sg.x2, k), lerp(sg.z1, sg.z2, k)]);
      return out;
    }
    out.push([sg.x2, sg.z2]);
  }
  return out;
}

// ====================================================================
// PHASES & CAMERA
// ====================================================================
const P = {
  shelfStart: 0.0,
  shelfEnd: 0.18,
  orderStart: 0.18,
  orderEnd: 0.38,
  raceStart: 0.38,
  raceEnd: 0.82,
  completeStart: 0.82,
  completeEnd: 1.0,
};

const CAM_STATES = [
  { p: 0.0, ang: Math.PI * 0.82, rad: 130, h: 38, ty: 4 },
  { p: 0.18, ang: Math.PI * 0.78, rad: 95, h: 22, ty: 3 },
  { p: 0.38, ang: Math.PI * 0.74, rad: 78, h: 14, ty: 2 },
  { p: 0.58, ang: Math.PI * 0.78, rad: 82, h: 24, ty: 1 },
  { p: 0.82, ang: Math.PI * 0.76, rad: 88, h: 22, ty: 1.5 },
  { p: 1.0, ang: Math.PI * 0.72, rad: 92, h: 26, ty: 1.5 },
];

function getCameraAt(t) {
  for (let i = 0; i < CAM_STATES.length - 1; i++) {
    const a = CAM_STATES[i];
    const b = CAM_STATES[i + 1];
    if (t <= b.p) {
      const k = smoothstep((t - a.p) / (b.p - a.p || 1));
      return {
        ang: lerp(a.ang, b.ang, k),
        rad: lerp(a.rad, b.rad, k),
        h: lerp(a.h, b.h, k),
        ty: lerp(a.ty, b.ty, k),
      };
    }
  }
  return CAM_STATES[CAM_STATES.length - 1];
}

const CHAPTER_LABELS = {
  1: "WAREHOUSE",
  2: "ORDER RECEIVED",
  3: "SIDE-BY-SIDE RACE",
  4: "COMPLETE",
};
const CHAPTER_TITLES = {
  1: "Where every pick begins.",
  2: "12 items located across the floor.",
  3: "Two pickers. Same items. Different paths.",
  4: `Optimal saved ${SAVED_TIME} and ${SAVED_METERS}m of walking.`,
};

function chapterFromProgress(p) {
  if (p < P.orderStart) return 1;
  if (p < P.raceStart) return 2;
  if (p < P.completeStart) return 3;
  return 4;
}

// ====================================================================
// COMPONENT
// ====================================================================
export default function WarehouseShowcase() {
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(0);

  const [uiState, setUiState] = useState({
    chapter: 1,
    pickedNaive: 0,
    pickedOpt: 0,
    distNaive: 0,
    distOpt: 0,
    optLead: SAVINGS_PCT,
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
      alpha: false,
    });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(FOG_COLOR);
    scene.fog = new THREE.FogExp2(FOG_COLOR, 0.013);

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.5, 600);
    camera.position.set(95, 22, 0);
    camera.lookAt(0, 3, 0);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 500),
      new THREE.MeshStandardMaterial({ color: 0x1d1d1d, roughness: 0.92 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Aisles + stripes
    const aisleMat = new THREE.MeshStandardMaterial({
      color: 0x2c2c2c,
      roughness: 0.88,
    });
    const stripeMat = new THREE.MeshBasicMaterial({
      color: 0xddc472,
      transparent: true,
      opacity: 0.6,
    });

    for (let col = 0; col < COL_COUNT - 1; col++) {
      const z1 = (col - (COL_COUNT - 1) / 2) * COL_SPACING;
      const z2 = (col + 1 - (COL_COUNT - 1) / 2) * COL_SPACING;
      const ac = (z1 + z2) / 2;
      const lane = new THREE.Mesh(
        new THREE.PlaneGeometry(TOTAL_WIDTH + 10, AISLE_WIDTH - 0.4),
        aisleMat
      );
      lane.rotation.x = -Math.PI / 2;
      lane.position.set(0, 0.005, ac);
      scene.add(lane);
      for (let s = 0; s < 2; s++) {
        const sz = ac + (s === 0 ? -1 : 1) * (AISLE_WIDTH / 2 - 0.3);
        const stripe = new THREE.Mesh(
          new THREE.PlaneGeometry(TOTAL_WIDTH + 10, 0.12),
          stripeMat
        );
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, 0.013, sz);
        scene.add(stripe);
      }
    }
    for (const pz of [W_HALF_DEPTH + 1.5, -(W_HALF_DEPTH + 1.5)]) {
      const lane = new THREE.Mesh(
        new THREE.PlaneGeometry(TOTAL_WIDTH + 10, 2.4),
        aisleMat
      );
      lane.rotation.x = -Math.PI / 2;
      lane.position.set(0, 0.005, pz);
      scene.add(lane);
    }
    for (let g = 0; g < NUM_GROUPS - 1; g++) {
      const cax =
        START_X +
        (g + 1) * GROUP_WIDTH +
        g * CROSS_AISLE_WIDTH +
        CROSS_AISLE_WIDTH / 2;
      const lane = new THREE.Mesh(
        new THREE.PlaneGeometry(CROSS_AISLE_WIDTH - 0.4, W_DEPTH + 6),
        aisleMat
      );
      lane.rotation.x = -Math.PI / 2;
      lane.position.set(cax, 0.007, 0);
      scene.add(lane);
      for (let s = 0; s < 2; s++) {
        const sx = cax + (s === 0 ? -1 : 1) * (CROSS_AISLE_WIDTH / 2 - 0.3);
        const stripe = new THREE.Mesh(
          new THREE.PlaneGeometry(0.12, W_DEPTH + 6),
          stripeMat
        );
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(sx, 0.014, 0);
        scene.add(stripe);
      }
    }

    // Rack texture
    const shelfCanvas = document.createElement("canvas");
    shelfCanvas.width = 128;
    shelfCanvas.height = 256;
    const sctx = shelfCanvas.getContext("2d");
    sctx.fillStyle = "#323236";
    sctx.fillRect(0, 0, 128, 256);
    sctx.fillStyle = "#181818";
    for (let y = 32; y < 256; y += 48) sctx.fillRect(0, y, 128, 3);
    sctx.fillStyle = "#42424a";
    for (let x = 0; x < 128; x += 32) sctx.fillRect(x, 0, 1, 256);
    sctx.fillStyle = "#4c4c54";
    sctx.fillRect(0, 0, 128, 2);
    sctx.fillRect(0, 254, 128, 2);
    const shelfTex = new THREE.CanvasTexture(shelfCanvas);
    shelfTex.wrapS = THREE.RepeatWrapping;
    shelfTex.repeat.set(2.4, 1);

    // Racks
    const rackGeo = new THREE.BoxGeometry(RACK_W, RACK_H, RACK_D);
    rackGeo.translate(0, RACK_H / 2, 0); // origin at bottom for rise scaling
    const rackMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: shelfTex,
      roughness: 0.82,
    });

    const racksGroup = new THREE.Group();
    scene.add(racksGroup);

    const totalRacks = BAY_COUNT * COL_COUNT * 2;
    const racks = new THREE.InstancedMesh(rackGeo, rackMat, totalRacks);
    const dummy = new THREE.Object3D();
    const rackPositions = [];
    let idx = 0;
    for (let col = 0; col < COL_COUNT; col++) {
      const zCol = (col - (COL_COUNT - 1) / 2) * COL_SPACING;
      for (let b = 0; b < BAY_COUNT; b++) {
        const x = bayToX(b);
        for (let s = 0; s < 2; s++) {
          const z = zCol + (s === 0 ? -RACK_D / 2 : RACK_D / 2);
          dummy.position.set(x, 0, z);
          dummy.updateMatrix();
          racks.setMatrixAt(idx++, dummy.matrix);
          rackPositions.push({ x, z });
        }
      }
    }
    racks.instanceMatrix.needsUpdate = true;
    racksGroup.add(racks);

    // Edges
    const edgeBoxGeo = new THREE.EdgesGeometry(rackGeo);
    const edgePts = edgeBoxGeo.attributes.position.array;
    const allEdgePts = [];
    for (const p of rackPositions) {
      for (let i = 0; i < edgePts.length; i += 3) {
        allEdgePts.push(edgePts[i] + p.x, edgePts[i + 1], edgePts[i + 2] + p.z);
      }
    }
    const allEdgesGeo = new THREE.BufferGeometry();
    allEdgesGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(allEdgePts, 3)
    );
    const racksEdges = new THREE.LineSegments(
      allEdgesGeo,
      new THREE.LineBasicMaterial({
        color: COLOR_RACK_EDGE,
        transparent: true,
        opacity: 0.5,
      })
    );
    racksGroup.add(racksEdges);
    racksGroup.scale.y = 0;

    // Lighting
    scene.add(new THREE.AmbientLight(0xd0d0d8, 0.95));
    scene.add(new THREE.HemisphereLight(0xfff5dd, 0x404048, 0.55));
    const sun = new THREE.DirectionalLight(0xfff0d4, 0.35);
    sun.position.set(20, 50, 14);
    scene.add(sun);

    // Items
    const itemObjs = ITEM_POS.map((p) => {
      const sphereMat = new THREE.MeshBasicMaterial({ color: COLOR_GOLD });
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 14, 10),
        sphereMat
      );
      sphere.position.set(p.x, p.y, p.z);
      scene.add(sphere);

      const beamGeo = new THREE.BufferGeometry();
      beamGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute([p.x, p.y, p.z, p.x, 8.5, p.z], 3)
      );
      const beamMat = new THREE.LineBasicMaterial({
        color: COLOR_GOLD,
        transparent: true,
        opacity: 0.18,
      });
      const beam = new THREE.Line(beamGeo, beamMat);
      scene.add(beam);

      const ringMat = new THREE.MeshBasicMaterial({
        color: COLOR_GOLD,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.42, 0.56, 28),
        ringMat
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(p.x, 0.025, p.z);
      scene.add(ring);

      return { sphere, sphereMat, beam, beamMat, ring, ringMat, baseY: p.y };
    });

    // Pickers
    function makeAMR(beaconColor) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.7, 1.0),
        new THREE.MeshStandardMaterial({
          color: 0x2e2e34,
          roughness: 0.5,
          metalness: 0.4,
        })
      );
      body.position.y = 0.35;
      g.add(body);
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.18, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x1c1c20 })
      );
      top.position.y = 0.79;
      g.add(top);
      const beaconMat = new THREE.MeshBasicMaterial({ color: beaconColor });
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 10, 8),
        beaconMat
      );
      beacon.position.y = 0.98;
      g.add(beacon);
      g.userData.beaconMat = beaconMat;
      return g;
    }

    const naivePicker = makeAMR(COLOR_RED);
    const optPicker = makeAMR(COLOR_GOLD);
    naivePicker.position.set(0, 0, DOCK_Z);
    optPicker.position.set(0, 0, DOCK_Z);
    naivePicker.visible = false;
    optPicker.visible = false;
    scene.add(naivePicker);
    scene.add(optPicker);

    // Trails
    function makeTrail(color) {
      const maxSeg = 80;
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
        opacity: 0.9,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      return { mesh, positions, indices, geo, mat };
    }
    const naiveTrail = makeTrail(COLOR_RED);
    const optTrail = makeTrail(COLOR_GOLD);

    function updateTrail(trail, waypoints, width, yOffset) {
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

    // Dock rings
    const dockRing = new THREE.Mesh(
      new THREE.RingGeometry(1.9, 2.15, 40),
      new THREE.MeshBasicMaterial({
        color: COLOR_GOLD,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      })
    );
    dockRing.rotation.x = -Math.PI / 2;
    dockRing.position.set(0, 0.04, DOCK_Z);
    scene.add(dockRing);

    const dockRing2 = new THREE.Mesh(
      new THREE.RingGeometry(3.1, 3.25, 40),
      new THREE.MeshBasicMaterial({
        color: COLOR_GREEN,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })
    );
    dockRing2.rotation.x = -Math.PI / 2;
    dockRing2.position.set(0, 0.04, DOCK_Z);
    scene.add(dockRing2);

    // Per-render-pass state setters
    function applyNaiveView(t) {
      naivePicker.visible = true;
      optPicker.visible = false;
      naiveTrail.mesh.visible = true;
      optTrail.mesh.visible = false;
      naiveTrail.mat.opacity = 0.9;
      for (let i = 0; i < itemObjs.length; i++) {
        const picked = t >= NAIVE_ROUTE.pickTs[i];
        const c = picked ? COLOR_GREEN : COLOR_GOLD;
        itemObjs[i].sphereMat.color.setHex(c);
        itemObjs[i].ringMat.color.setHex(c);
        itemObjs[i].ringMat.opacity = picked ? 0.4 : 0.7;
        itemObjs[i].beamMat.color.setHex(c);
        itemObjs[i].beamMat.opacity = picked ? 0 : 0.18;
      }
    }
    function applyOptView(t) {
      naivePicker.visible = false;
      optPicker.visible = true;
      naiveTrail.mesh.visible = false;
      optTrail.mesh.visible = true;
      optTrail.mat.opacity = 0.9;
      for (let i = 0; i < itemObjs.length; i++) {
        const picked = t >= OPT_ROUTE.pickTs[i];
        const c = picked ? COLOR_GREEN : COLOR_GOLD;
        itemObjs[i].sphereMat.color.setHex(c);
        itemObjs[i].ringMat.color.setHex(c);
        itemObjs[i].ringMat.opacity = picked ? 0.4 : 0.7;
        itemObjs[i].beamMat.color.setHex(c);
        itemObjs[i].beamMat.opacity = picked ? 0 : 0.18;
      }
    }

    // Resize
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

    // ScrollTrigger
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    // Render loop
    let uiTick = 0;
    const t0 = performance.now();
    let rafId;

    function render() {
      const time = (performance.now() - t0) / 1000;
      const p = progressRef.current;
      const chapter = chapterFromProgress(p);
      const isPaused = pausedRef.current;

      // Camera (smoothly interpolated through all chapters)
      const cs = getCameraAt(p);
      camera.position.x = Math.cos(cs.ang) * cs.rad;
      camera.position.z = Math.sin(cs.ang) * cs.rad;
      camera.position.y = cs.h;
      camera.lookAt(0, cs.ty, 0);

      let naivePickedCount = 0;
      let optPickedCount = 0;
      let naiveDist = 0;
      let optDist = 0;

      if (chapter === 1) {
        const rise = smoothstep(
          (p - P.shelfStart) / (P.shelfEnd - P.shelfStart)
        );
        racksGroup.scale.y = rise;
        naivePicker.visible = false;
        optPicker.visible = false;
        naiveTrail.mesh.visible = false;
        optTrail.mesh.visible = false;
        const itemFade = smoothstep((p - P.shelfEnd + 0.06) / 0.08);
        for (const it of itemObjs) {
          it.sphereMat.color.setHex(COLOR_GOLD);
          it.ringMat.color.setHex(COLOR_GOLD);
          it.beamMat.color.setHex(COLOR_GOLD);
          it.sphere.scale.setScalar(itemFade);
          it.ringMat.opacity = 0.7 * itemFade;
          it.beamMat.opacity = 0.18 * itemFade;
        }
        dockRing.material.color.setHex(COLOR_GOLD);
        dockRing.material.opacity = 0.55 * smoothstep((p - P.shelfStart) / 0.1);
        dockRing2.material.opacity = 0;
      } else if (chapter === 2) {
        racksGroup.scale.y = 1;
        naivePicker.visible = false;
        optPicker.visible = false;
        naiveTrail.mesh.visible = false;
        optTrail.mesh.visible = false;
        for (let i = 0; i < itemObjs.length; i++) {
          const it = itemObjs[i];
          it.sphere.scale.setScalar(1);
          it.sphereMat.color.setHex(COLOR_GOLD);
          it.ringMat.color.setHex(COLOR_GOLD);
          it.ringMat.opacity = 0.7;
          it.beamMat.color.setHex(COLOR_GOLD);
          it.beamMat.opacity = 0.18;
          if (!isPaused) {
            it.sphere.position.y =
              it.baseY + Math.sin(time * 1.3 + i * 0.5) * 0.06;
          }
        }
        dockRing.material.color.setHex(COLOR_GOLD);
        dockRing.material.opacity = 0.55;
        dockRing2.material.opacity = 0;
      } else if (chapter === 3) {
        racksGroup.scale.y = 1;
        const raceP = clamp(
          (p - P.raceStart) / (P.raceEnd - P.raceStart),
          0,
          1
        );
        const naiveT = raceP;
        const optT = clamp(raceP * (NAIVE_TOTAL_DIST / OPT_TOTAL_DIST), 0, 1);

        const naivePos = positionOnRoute(NAIVE_ROUTE, naiveT);
        const optPos = positionOnRoute(OPT_ROUTE, optT);
        naivePicker.position.set(naivePos.x, 0, naivePos.z);
        optPicker.position.set(optPos.x, 0, optPos.z);
        naivePicker.userData.beaconMat.color.setHex(COLOR_RED);
        if (optT >= 1) {
          const pulse = 0.5 + Math.sin(time * 3.0) * 0.5;
          optPicker.userData.beaconMat.color.setRGB(
            0.35 * pulse,
            0.6 * pulse,
            0.29 * pulse
          );
        } else {
          optPicker.userData.beaconMat.color.setHex(COLOR_GOLD);
        }

        const nWP = waypointsUpTo(NAIVE_ROUTE, naiveT);
        const oWP = waypointsUpTo(OPT_ROUTE, optT);
        updateTrail(naiveTrail, nWP, 0.55, 0.05);
        updateTrail(optTrail, oWP, 0.55, 0.05);

        for (let i = 0; i < NAIVE_ROUTE.pickTs.length; i++) {
          if (naiveT >= NAIVE_ROUTE.pickTs[i]) naivePickedCount++;
        }
        for (let i = 0; i < OPT_ROUTE.pickTs.length; i++) {
          if (optT >= OPT_ROUTE.pickTs[i]) optPickedCount++;
        }
        naiveDist = naiveT * NAIVE_TOTAL_DIST;
        optDist = optT * OPT_TOTAL_DIST;

        dockRing.material.color.setHex(COLOR_GOLD);
        dockRing.material.opacity = 0.55;
        dockRing2.material.opacity = 0;

        // Split-render
        const halfH = Math.floor(h / 2);
        renderer.setScissorTest(true);

        applyNaiveView(naiveT);
        renderer.setScissor(0, halfH, w, h - halfH);
        renderer.setViewport(0, halfH, w, h - halfH);
        renderer.render(scene, camera);

        applyOptView(optT);
        renderer.setScissor(0, 0, w, halfH);
        renderer.setViewport(0, 0, w, halfH);
        renderer.render(scene, camera);

        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, w, h);
      } else {
        // chapter 4
        racksGroup.scale.y = 1;
        naiveTrail.mesh.visible = true;
        optTrail.mesh.visible = true;
        naiveTrail.mat.opacity = 0.32;
        optTrail.mat.opacity = 0.42;
        naivePicker.visible = true;
        optPicker.visible = true;
        naivePicker.position.set(-1.8, 0, DOCK_Z);
        optPicker.position.set(1.8, 0, DOCK_Z);
        naivePicker.userData.beaconMat.color.setHex(COLOR_GREEN);
        optPicker.userData.beaconMat.color.setHex(COLOR_GREEN);
        for (const it of itemObjs) {
          it.sphere.scale.setScalar(1);
          it.sphereMat.color.setHex(COLOR_GREEN);
          it.ringMat.color.setHex(COLOR_GREEN);
          it.ringMat.opacity = 0.45;
          it.beamMat.opacity = 0;
        }
        const pulse = 0.55 + Math.sin(time * 1.8) * 0.2;
        dockRing.material.color.setHex(COLOR_GREEN);
        dockRing.material.opacity = pulse;
        const pulse2 = 0.18 + Math.sin(time * 1.8 + 0.6) * 0.14;
        dockRing2.material.opacity = pulse2;
        updateTrail(naiveTrail, NAIVE_WAYPOINTS, 0.4, 0.04);
        updateTrail(optTrail, OPTIMAL_WAYPOINTS, 0.45, 0.05);

        naivePickedCount = optPickedCount = ITEMS.length;
        naiveDist = NAIVE_TOTAL_DIST;
        optDist = OPT_TOTAL_DIST;
      }

      // Single-pass render for non-race chapters
      if (chapter !== 3) {
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, w, h);
        renderer.render(scene, camera);
      }

      // Throttled UI update
      uiTick++;
      if (uiTick >= 5) {
        uiTick = 0;
        // Live OPT-LEADS metric: optimal distance saved as percentage at this moment
        let lead = SAVINGS_PCT;
        if (chapter === 3 && naiveDist > 1) {
          lead = Math.max(
            0,
            Math.min(
              99,
              Math.round((1 - optDist / Math.max(1, naiveDist)) * 100)
            )
          );
        }
        setUiState({
          chapter,
          pickedNaive: naivePickedCount,
          pickedOpt: optPickedCount,
          distNaive: Math.round(naiveDist),
          distOpt: Math.round(optDist),
          optLead: lead,
        });
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
      shelfTex.dispose();
    };
  }, []);

  const ch = uiState.chapter;
  const dots = [1, 2, 3, 4].map((n) => (
    <span
      key={n}
      className={`${styles.chapterDot} ${
        ch >= n ? styles.chapterDotActive : ""
      }`}
    />
  ));

  const manifestVisible = ch <= 2;
  const raceVisible = ch === 3;
  const scorecardVisible = ch === 4;

  return (
    <section ref={sectionRef} className={styles.section}>
      <div ref={stickyRef} className={styles.sticky}>
        <canvas ref={canvasRef} className={styles.canvas} />

        {/* Manifest panel — chapters 1 & 2 */}
        <div
          className={styles.manifestPanel}
          style={{ opacity: manifestVisible ? 1 : 0 }}
        >
          <div className={styles.manifestHead}>
            <span className={styles.manifestHeadKey}>◆ ORD-2847</span>
            <span className={styles.manifestHeadCount}>
              {String(ch).padStart(2, "0")} / 04
            </span>
          </div>
          <div className={styles.manifestList}>
            {ITEMS.slice(0, 6).map((it) => (
              <div key={it.code} className={styles.manifestRow}>
                <span>{it.code}</span>
                <span className={styles.manifestArrow}>▸</span>
              </div>
            ))}
            <div className={styles.manifestMore}>+ {ITEMS.length - 6} more</div>
          </div>
          <div className={styles.manifestFoot}>
            <span>lookup</span>
            <span className={styles.manifestFootMs}>38 ms</span>
          </div>
        </div>

        {/* Race overlays — chapter 3 */}
        <div
          className={styles.raceOverlay}
          style={{ opacity: raceVisible ? 1 : 0 }}
        >
          <div className={styles.naiveLabel}>NAIVE</div>
          <div className={styles.naiveStats}>
            <div>
              <span className={styles.statLabel}>walked </span>
              <span className={styles.naiveValue}>{uiState.distNaive}m</span>
            </div>
            <div>
              <span className={styles.statLabel}>picked </span>
              <span className={styles.naiveValue}>
                {uiState.pickedNaive} / 12
              </span>
            </div>
          </div>
          <div className={styles.dividerWrap}>
            <span className={styles.dividerLineL} />
            <span className={styles.dividerPill}>
              OPTIMAL LEADS · {uiState.optLead}%
            </span>
            <span className={styles.dividerLineR} />
          </div>
          <div className={styles.optimalLabel}>OPTIMAL</div>
          <div className={styles.optimalStats}>
            <div>
              <span className={styles.statLabel}>walked </span>
              <span className={styles.optValue}>{uiState.distOpt}m</span>
            </div>
            <div>
              <span className={styles.statLabel}>picked </span>
              <span className={styles.optValue}>{uiState.pickedOpt} / 12</span>
            </div>
          </div>
        </div>

        {/* Scorecard — chapter 4 */}
        <div
          className={styles.scorecard}
          style={{ opacity: scorecardVisible ? 1 : 0 }}
        >
          <div className={styles.scorecardHead}>
            <span className={styles.scorecardHeadKey}>◆ ORD-2847</span>
            <span className={styles.scorecardHeadCount}>04 / 04</span>
          </div>
          <div className={styles.scoreRow}>
            <div className={styles.scoreRowHead}>
              <span className={styles.scoreNaive}>NAIVE</span>
              <span className={styles.scoreTimeNaive}>{NAIVE_TIME}</span>
            </div>
            <div className={styles.scoreRowFoot}>
              <span>walked</span>
              <span>{Math.round(NAIVE_TOTAL_DIST)} m</span>
            </div>
          </div>
          <div className={styles.scoreRow}>
            <div className={styles.scoreRowHead}>
              <span className={styles.scoreOpt}>OPTIMAL</span>
              <span className={styles.scoreTimeOpt}>{OPT_TIME}</span>
            </div>
            <div className={styles.scoreRowFoot}>
              <span>walked</span>
              <span className={styles.scoreOpt}>
                {Math.round(OPT_TOTAL_DIST)} m
              </span>
            </div>
          </div>
          <div className={styles.savedBlock}>
            <div className={styles.savedLabel}>SAVED</div>
            <div className={styles.savedRow}>
              <span className={styles.savedPct}>{SAVINGS_PCT}%</span>
              <span className={styles.savedDetail}>
                {SAVED_METERS}m · {SAVED_TIME}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom caption */}
        <div className={styles.bottomCaption}>
          <div className={styles.chapterDots}>
            {dots}
            <span className={styles.chapterLabel}>{CHAPTER_LABELS[ch]}</span>
          </div>
          <div className={styles.chapterTitle}>{CHAPTER_TITLES[ch]}</div>
        </div>
      </div>
      <div className={styles.scrollSpace} />
    </section>
  );
}
