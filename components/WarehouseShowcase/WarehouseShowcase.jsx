"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./WarehouseShowcase.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ═══ Complex warehouse: grid aisles in X and Z ═══ */
const SHELF_H = 2.4,
  SHELF_D = 0.9,
  SHELF_W = 2.4;

// Shelf blocks arranged in a grid with aisles between them
// 4 blocks wide (X) × 3 blocks deep (Z), each block is a 2-row shelving unit
const BLOCK_X = [-13, -5, 3, 11]; // block left edges
const BLOCK_Z = [-9, -2.5, 4]; // block front edges
const BLOCK_W = 5; // width of each 2-row block (2 shelves + gap)

// Aisles: between every block + at edges
const AISLE_X = [-16, -9, -1, 7, 14.5]; // 5 vertical aisles
const AISLE_Z = [-12, -5.75, 0.75, 7.5, 10.5]; // 5 horizontal cross-aisles
const DOCK_X = 0,
  DOCK_Z = 14;

// Generate shelves: 2 rows per block
const SHELVES = [];
BLOCK_X.forEach((bx) => {
  BLOCK_Z.forEach((bz) => {
    SHELVES.push({ x: bx, z: bz, w: SHELF_D, d: SHELF_W });
    SHELVES.push({ x: bx + SHELF_D + 1.2, z: bz, w: SHELF_D, d: SHELF_W });
  });
});

// 8 pick items spread across the grid
const PICK_ITEMS = [
  { x: AISLE_X[0], z: BLOCK_Z[0] + 1.2, label: "A1-047" },
  { x: AISLE_X[3], z: BLOCK_Z[2] + 1.2, label: "D3-392" },
  { x: AISLE_X[1], z: BLOCK_Z[1] + 1.2, label: "B2-201" },
  { x: AISLE_X[2], z: BLOCK_Z[0] + 1.2, label: "C1-854" },
  { x: AISLE_X[4], z: BLOCK_Z[1] + 1.2, label: "E2-133" },
  { x: AISLE_X[1], z: BLOCK_Z[2] + 1.2, label: "B3-776" },
  { x: AISLE_X[3], z: BLOCK_Z[0] + 1.2, label: "D1-441" },
  { x: AISLE_X[2], z: BLOCK_Z[2] + 1.2, label: "C3-519" },
];

// Optimized route: uses mid-cross-aisles to cut through
const OPT_ROUTE = [
  [DOCK_X, DOCK_Z],
  [DOCK_X, AISLE_Z[4]],
  // Sweep left bank via mid-aisle
  [AISLE_X[0], AISLE_Z[4]],
  [AISLE_X[0], BLOCK_Z[0] + 1.2], // pick 1
  [AISLE_X[0], AISLE_Z[1]],
  [AISLE_X[1], AISLE_Z[1]],
  [AISLE_X[1], BLOCK_Z[1] + 1.2], // pick 3
  [AISLE_X[1], AISLE_Z[2]],
  [AISLE_X[1], BLOCK_Z[2] + 1.2], // pick 6
  [AISLE_X[1], AISLE_Z[4]],
  // Cut across mid-aisle to center
  [AISLE_X[2], AISLE_Z[4]],
  [AISLE_X[2], BLOCK_Z[2] + 1.2], // pick 8
  [AISLE_X[2], AISLE_Z[1]],
  [AISLE_X[2], BLOCK_Z[0] + 1.2], // pick 4
  [AISLE_X[2], AISLE_Z[0]],
  // Cross to right bank
  [AISLE_X[3], AISLE_Z[0]],
  [AISLE_X[3], BLOCK_Z[0] + 1.2], // pick 7
  [AISLE_X[3], AISLE_Z[2]],
  [AISLE_X[3], BLOCK_Z[2] + 1.2], // pick 2
  [AISLE_X[3], AISLE_Z[4]],
  [AISLE_X[4], AISLE_Z[4]],
  [AISLE_X[4], BLOCK_Z[1] + 1.2], // pick 5
  [AISLE_X[4], AISLE_Z[4]],
  [DOCK_X, AISLE_Z[4]],
  [DOCK_X, DOCK_Z],
];

// Naive route: visits in item order 1→2→3→4→5→6→7→8, zigzags constantly
const NAIVE_ROUTE = [
  [DOCK_X, DOCK_Z],
  [DOCK_X, AISLE_Z[4]],
  [AISLE_X[0], AISLE_Z[4]],
  [AISLE_X[0], BLOCK_Z[0] + 1.2], // pick 1
  [AISLE_X[0], AISLE_Z[0]],
  [AISLE_X[3], AISLE_Z[0]],
  [AISLE_X[3], AISLE_Z[2]],
  [AISLE_X[3], BLOCK_Z[2] + 1.2], // pick 2
  [AISLE_X[3], AISLE_Z[4]],
  [AISLE_X[1], AISLE_Z[4]],
  [AISLE_X[1], BLOCK_Z[1] + 1.2], // pick 3
  [AISLE_X[1], AISLE_Z[0]],
  [AISLE_X[2], AISLE_Z[0]],
  [AISLE_X[2], BLOCK_Z[0] + 1.2], // pick 4
  [AISLE_X[2], AISLE_Z[4]],
  [AISLE_X[4], AISLE_Z[4]],
  [AISLE_X[4], BLOCK_Z[1] + 1.2], // pick 5
  [AISLE_X[4], AISLE_Z[0]],
  [AISLE_X[1], AISLE_Z[0]],
  [AISLE_X[1], AISLE_Z[2]],
  [AISLE_X[1], BLOCK_Z[2] + 1.2], // pick 6
  [AISLE_X[1], AISLE_Z[4]],
  [AISLE_X[3], AISLE_Z[4]],
  [AISLE_X[3], AISLE_Z[0]],
  [AISLE_X[3], BLOCK_Z[0] + 1.2], // pick 7
  [AISLE_X[3], AISLE_Z[4]],
  [AISLE_X[2], AISLE_Z[4]],
  [AISLE_X[2], AISLE_Z[2]],
  [AISLE_X[2], BLOCK_Z[2] + 1.2], // pick 8
  [AISLE_X[2], AISLE_Z[4]],
  [DOCK_X, AISLE_Z[4]],
  [DOCK_X, DOCK_Z],
];

const GOLD = 0xd4a853,
  GREEN = 0x5a9a4a,
  RED_DIM = 0x993333;

/* ── Route helpers ── */
function buildLinePoints(pts) {
  return pts.map(([x, z]) => new THREE.Vector3(x, 0.1, z));
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
    const s = pts[i].distanceTo(pts[i - 1]);
    if (acc + s >= target)
      return new THREE.Vector3().lerpVectors(
        pts[i - 1],
        pts[i],
        (target - acc) / s
      );
    acc += s;
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

/* ═══ Evenly spaced scroll timeline (6 phases) ═══ */
const T = {
  // Phase 1: Shelf growth
  shelfStart: 0,
  shelfEnd: 0.15,
  // Phase 2: Items appear
  itemsStart: 0.15,
  // Phase 3: Naive route shown
  naiveStart: 0.3,
  naiveEnd: 0.45,
  // Phase 4: Optimal route draws
  routeStart: 0.38,
  routeDrawEnd: 0.58,
  // Phase 5: Picker traversal
  pickStart: 0.58,
  returnEnd: 0.84,
  // Phase 6: Outro
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
    start: 0.15,
    label: "01 — Order received",
    title: "8 items located across the grid.",
    stat: "< 50ms lookup",
  },
  {
    start: 0.3,
    label: "02 — Comparing routes",
    title: "Naive path vs optimized path.",
    stat: "Red = naive · Gold = optimal",
  },
  {
    start: 0.45,
    label: "03 — Optimal route found",
    title: "Shortest path calculated.",
    stat: "43% less travel distance",
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

export default function WarehouseShowcase() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const [caption, setCaption] = useState(CAPTIONS[0]);

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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500);

    /* ── Lighting ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 0.45);
    dir.position.set(10, 28, 14);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 70;
    dir.shadow.camera.left = -25;
    dir.shadow.camera.right = 25;
    dir.shadow.camera.top = 25;
    dir.shadow.camera.bottom = -25;
    scene.add(dir);
    scene.add(new THREE.HemisphereLight(0x1a1508, 0x000000, 0.15));

    /* ── Floor ── */
    const GS = 200;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(GS, GS),
      new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(GS, GS, 0x0d0d0d, 0x080808);
    grid.position.y = 0.01;
    scene.add(grid);

    // Aisle floor markings (both directions)
    const sM = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.012,
    });
    AISLE_X.forEach((ax) => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 30), sM);
      s.rotation.x = -Math.PI / 2;
      s.position.set(ax, 0.015, -1);
      scene.add(s);
    });
    AISLE_Z.forEach((az) => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(36, 1.0), sM);
      s.rotation.x = -Math.PI / 2;
      s.position.set(-1, 0.015, az);
      scene.add(s);
    });

    /* ── Dock ── */
    const dock = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.2, 3),
      new THREE.MeshStandardMaterial({
        color: 0x0c0a04,
        emissive: GOLD,
        emissiveIntensity: 0.04,
      })
    );
    dock.position.set(DOCK_X, 0.1, DOCK_Z);
    scene.add(dock);
    const dE = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(6, 0.2, 3)),
      new THREE.LineBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.12,
      })
    );
    dE.position.copy(dock.position);
    scene.add(dE);
    // Start ring
    const sRing = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.5, 32),
      new THREE.MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      })
    );
    sRing.rotation.x = -Math.PI / 2;
    sRing.position.set(DOCK_X, 0.03, DOCK_Z);
    scene.add(sRing);

    /* ── Shelves (start flat) ── */
    const shelfGeo = new THREE.BoxGeometry(1, 1, 1);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.75,
      metalness: 0.12,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x1e1e1e });
    const shelfMeshes = [];
    SHELVES.forEach((s) => {
      const m = new THREE.Mesh(shelfGeo, shelfMat.clone());
      m.scale.set(s.w, 0.05, s.d);
      m.position.set(s.x + s.w / 2, 0.025, s.z + s.d / 2);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      const e = new THREE.LineSegments(
        new THREE.EdgesGeometry(shelfGeo),
        edgeMat.clone()
      );
      e.scale.copy(m.scale);
      e.position.copy(m.position);
      scene.add(e);
      shelfMeshes.push({ mesh: m, edges: e });
    });
    const shelfState = { height: 0 };

    /* ── Pick markers ── */
    const markers = [];
    PICK_ITEMS.forEach((item) => {
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
        picked: false,
      });
    });

    /* ── Routes ── */
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

    const naivePts = buildLinePoints(NAIVE_ROUTE);
    const naivePairs = [];
    for (let i = 0; i < naivePts.length - 1; i++)
      naivePairs.push(naivePts[i].clone(), naivePts[i + 1].clone());
    const naiveGeo = new THREE.BufferGeometry().setFromPoints(naivePairs);
    const naiveMat = new THREE.LineDashedMaterial({
      color: RED_DIM,
      transparent: true,
      opacity: 0,
      dashSize: 0.4,
      gapSize: 0.25,
    });
    const naiveLine = new THREE.LineSegments(naiveGeo, naiveMat);
    naiveLine.computeLineDistances();
    scene.add(naiveLine);

    // Pick fractions: which route waypoint index each item is reached at
    const pickWaypoints = [3, 7, 5, 12, 21, 8, 15, 11];
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
    picker.visible = false;
    scene.add(picker);
    const pLight = new THREE.PointLight(GOLD, 0, 8);
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
      naiveVis: 0,
      naiveProgress: 0,
      pickProgress: 0,
    };

    ScrollTrigger.create({
      trigger: scrollEl,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => {
        const p = (state.p = self.progress);

        // Shelf height: grows 0→0.15, flattens in outro
        state.shelfH =
          p < T.shelfEnd
            ? p / T.shelfEnd
            : p > T.outroStart
            ? Math.max(0, 1 - (p - T.outroStart) / (T.outroEnd - T.outroStart))
            : 1;

        // Naive route: fade in during compare phase, draw progressively, fade out as optimal takes over
        if (p >= T.naiveStart && p < T.routeDrawEnd) {
          const fadeIn = Math.min(1, (p - T.naiveStart) / 0.04);
          const fadeOut = p > 0.48 ? Math.max(0, 1 - (p - 0.48) / 0.08) : 1;
          state.naiveVis = fadeIn * fadeOut * 0.35;
          state.naiveProgress = Math.min(
            1,
            (p - T.naiveStart) / (T.naiveEnd - T.naiveStart)
          );
        } else {
          state.naiveVis = 0;
          state.naiveProgress = 0;
        }

        // Optimized route: draw during phases 3-4, fully drawn by pickStart
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

        // Pick progress: picker moves during phase 5
        if (p >= T.pickStart && p <= T.returnEnd) {
          state.pickProgress = Math.min(
            1,
            (p - T.pickStart) / (T.returnEnd - T.pickStart)
          );
        }

        // Outro: fade route
        if (p > T.outroStart)
          state.routeVis *= Math.max(
            0,
            1 - (p - T.outroStart) / (T.outroEnd - T.outroStart)
          );

        // Captions
        for (let i = CAPTIONS.length - 1; i >= 0; i--) {
          if (p >= CAPTIONS[i].start) {
            setCaption(CAPTIONS[i]);
            break;
          }
        }
      },
    });

    /* ── Animate ── */
    let frameId;
    const clock = new THREE.Clock();
    const camPos = new THREE.Vector3(0, 36, 34);
    const camTarget = new THREE.Vector3();

    function animate() {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const p = state.p;
      const curH = SHELF_H * Math.max(0, Math.min(1, state.shelfH));

      // Shelves
      shelfMeshes.forEach(({ mesh, edges }) => {
        const h = Math.max(0.05, curH);
        mesh.scale.y = h;
        mesh.position.y = h / 2;
        edges.scale.y = h;
        edges.position.y = h / 2;
      });

      // Markers
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
        m.diamond.rotation.y = t * 0.6 + i;
        m.diamond.rotation.x = Math.sin(t * 0.4 + i) * 0.12;
        m.dEdges.rotation.copy(m.diamond.rotation);
        m.ring.rotation.z = t * 0.2 + i;
      });

      sRing.rotation.z = t * 0.12;

      // Routes
      optMat.opacity = state.routeVis;
      optGeo.setDrawRange(
        0,
        Math.max(2, Math.floor(state.routeProgress * optPairs.length))
      );
      naiveMat.opacity = state.naiveVis;
      naiveGeo.setDrawRange(
        0,
        Math.max(2, Math.floor(state.naiveProgress * naivePairs.length))
      );

      // Picker
      const pickerMoving = p >= T.pickStart && p <= T.returnEnd;
      picker.visible = pickerMoving;
      if (pickerMoving) {
        const pt = pointOnRoute(optPts, state.pickProgress);
        picker.position.set(pt.x, 0.35, pt.z);
        pLight.position.set(pt.x, 2, pt.z);
        pLight.intensity = 5;
      } else {
        pLight.intensity = 0;
      }

      // ═══ CAMERA ═══
      if (pickerMoving) {
        // Direct overhead following picker
        camPos.lerp(
          new THREE.Vector3(picker.position.x, 30, picker.position.z + 0.5),
          0.05
        );
        camTarget.lerp(
          new THREE.Vector3(picker.position.x, 0, picker.position.z),
          0.05
        );
      } else if (p < T.pickStart) {
        // Pre-pick: orbit in
        const orbitT = Math.min(1, p / T.pickStart);
        const angle = orbitT * Math.PI * 0.35;
        const radius = 34 - orbitT * 12;
        const height = 38 - orbitT * 16;
        camPos.lerp(
          new THREE.Vector3(
            Math.sin(angle) * radius,
            height,
            Math.cos(angle) * radius
          ),
          0.04
        );
        camTarget.lerp(new THREE.Vector3(0, curH * 0.5, 0), 0.04);
      } else {
        // Outro: return overhead
        camPos.lerp(new THREE.Vector3(0, 38, 34), 0.03);
        camTarget.lerp(new THREE.Vector3(0, 0, 0), 0.03);
      }

      camera.position.copy(camPos);
      camera.lookAt(camTarget);
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

  return (
    <section ref={sectionRef} id="warehouse" className={styles.section}>
      <div className={styles.sticky}>
        <div className={styles.canvasWrap}>
          <canvas ref={canvasRef} />
        </div>
        <div className={styles.infoBar}>
          <div key={caption.label} className={styles.phaseCard}>
            <span className={styles.phaseLabel}>{caption.label}</span>
            <h3 className={styles.phaseTitle}>{caption.title}</h3>
            <span className={styles.phaseStat}>{caption.stat}</span>
          </div>
        </div>
      </div>
      <div ref={scrollRef} className={styles.scrollSpace} />
    </section>
  );
}
