"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./WarehouseShowcase.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ═══ Warehouse layout ═══ */
const SHELF_H = 2.6,
  SHELF_D = 1.0,
  SHELF_W = 2.8;
const ROW_X = [-12, -8, -4, 0, 4, 8, 12];
const AISLE_X = [-10, -6, -2, 2, 6, 10];
const Z_SLOTS = [-8, -4.5, -1, 2.5, 6];
const CROSS_TOP = -10.5,
  CROSS_BOT = 9;
const DOCK_X = 0,
  DOCK_Z = 14;

const SHELVES = [];
ROW_X.forEach((rx) => {
  Z_SLOTS.forEach((zs) => {
    SHELVES.push({ x: rx - SHELF_D / 2, z: zs, w: SHELF_D, d: SHELF_W });
  });
});

const PICK_ITEMS = [
  { x: AISLE_X[0], z: -8, label: "A1-047" },
  { x: AISLE_X[4], z: -4.5, label: "E2-392" },
  { x: AISLE_X[1], z: 2.5, label: "B4-201" },
  { x: AISLE_X[3], z: -1, label: "D3-854" },
  { x: AISLE_X[5], z: 6, label: "F5-133" },
  { x: AISLE_X[2], z: -8, label: "C1-776" },
];

const OPT_ROUTE = [
  [DOCK_X, DOCK_Z],
  [DOCK_X, CROSS_BOT],
  [AISLE_X[0], CROSS_BOT],
  [AISLE_X[0], -8],
  [AISLE_X[0], CROSS_TOP],
  [AISLE_X[2], CROSS_TOP],
  [AISLE_X[2], -8],
  [AISLE_X[2], CROSS_TOP],
  [AISLE_X[3], CROSS_TOP],
  [AISLE_X[3], -1],
  [AISLE_X[3], CROSS_BOT],
  [AISLE_X[1], CROSS_BOT],
  [AISLE_X[1], 2.5],
  [AISLE_X[1], CROSS_BOT],
  [AISLE_X[4], CROSS_BOT],
  [AISLE_X[4], -4.5],
  [AISLE_X[4], CROSS_BOT],
  [AISLE_X[5], CROSS_BOT],
  [AISLE_X[5], 6],
  [AISLE_X[5], CROSS_BOT],
  [DOCK_X, CROSS_BOT],
  [DOCK_X, DOCK_Z],
];

const NAIVE_ROUTE = [
  [DOCK_X, DOCK_Z],
  [DOCK_X, CROSS_BOT],
  [AISLE_X[0], CROSS_BOT],
  [AISLE_X[0], -8],
  [AISLE_X[0], CROSS_TOP],
  [AISLE_X[4], CROSS_TOP],
  [AISLE_X[4], -4.5],
  [AISLE_X[4], CROSS_BOT],
  [AISLE_X[1], CROSS_BOT],
  [AISLE_X[1], 2.5],
  [AISLE_X[1], CROSS_TOP],
  [AISLE_X[3], CROSS_TOP],
  [AISLE_X[3], -1],
  [AISLE_X[3], CROSS_BOT],
  [AISLE_X[5], CROSS_BOT],
  [AISLE_X[5], 6],
  [AISLE_X[5], CROSS_TOP],
  [AISLE_X[2], CROSS_TOP],
  [AISLE_X[2], -8],
  [AISLE_X[2], CROSS_BOT],
  [DOCK_X, CROSS_BOT],
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
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
  return len;
}
function pointOnRoute(pts, t) {
  const total = routeTotalLen(pts);
  let target = t * total,
    acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = pts[i].distanceTo(pts[i - 1]);
    if (acc + seg >= target)
      return new THREE.Vector3().lerpVectors(
        pts[i - 1],
        pts[i],
        (target - acc) / seg
      );
    acc += seg;
  }
  return pts[pts.length - 1].clone();
}
function waypointFraction(pts, idx) {
  const total = routeTotalLen(pts);
  let acc = 0;
  for (let i = 1; i <= idx && i < pts.length; i++)
    acc += pts[i].distanceTo(pts[i - 1]);
  return acc / total;
}

/* ═══ Scroll phases (as fractions of total scroll 0-1) ═══ */
const T = {
  shelfStart: 0,
  shelfEnd: 0.08,
  itemsStart: 0.08,
  itemsEnd: 0.16,
  naiveStart: 0.16,
  naiveEnd: 0.24,
  routeStart: 0.2,
  pickStart: 0.26,
  pickEnd: 0.78,
  returnStart: 0.78,
  returnEnd: 0.88,
  outroStart: 0.88,
  outroEnd: 1.0,
};

/* ═══ Captions keyed to scroll ═══ */
const CAPTIONS = [
  {
    start: 0,
    end: 0.08,
    label: "Smart Picking",
    title: "AI-optimized pick routing.",
    stat: "Scroll to explore",
  },
  {
    start: 0.08,
    end: 0.2,
    label: "01 — Order received",
    title: "6 items located across the floor.",
    stat: "< 50ms lookup",
  },
  {
    start: 0.2,
    end: 0.28,
    label: "02 — Route optimized",
    title: "AI plots the shortest pick path.",
    stat: "41% less distance",
  },
  {
    start: 0.28,
    end: 0.85,
    label: "03 — Pick in progress",
    title: "Following the optimal route.",
    stat: "99.7% accuracy",
  },
  {
    start: 0.85,
    end: 1.0,
    label: "04 — Complete",
    title: "Packed, verified, shipped.",
    stat: "2m 12s · 41% faster",
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
    // No fog — grid extends to edges

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
    // Warm fill from below
    const fill = new THREE.HemisphereLight(0x1a1508, 0x000000, 0.15);
    scene.add(fill);

    /* ── Floor — massive grid fills entire viewport ── */
    const GRID_SIZE = 200;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE),
      new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0x0d0d0d, 0x080808);
    grid.position.y = 0.01;
    scene.add(grid);

    // Aisle stripes
    const stripeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.012,
    });
    AISLE_X.forEach((ax) => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 26), stripeMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(ax, 0.015, -0.5);
      scene.add(s);
    });

    /* ── Dock ── */
    const dock = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.2, 3.5),
      new THREE.MeshStandardMaterial({
        color: 0x0c0a04,
        emissive: GOLD,
        emissiveIntensity: 0.04,
      })
    );
    dock.position.set(DOCK_X, 0.1, DOCK_Z);
    scene.add(dock);
    const dockE = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(5, 0.2, 3.5)),
      new THREE.LineBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.12,
      })
    );
    dockE.position.copy(dock.position);
    scene.add(dockE);

    /* ── Shelves ── */
    const shelfGeo = new THREE.BoxGeometry(1, 1, 1);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.75,
      metalness: 0.12,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x1e1e1e });
    const shelfMeshes = [];
    SHELVES.forEach((s) => {
      const mesh = new THREE.Mesh(shelfGeo, shelfMat.clone());
      mesh.scale.set(s.w, 0.05, s.d);
      mesh.position.set(s.x + s.w / 2, 0.025, s.z + s.d / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(shelfGeo),
        edgeMat.clone()
      );
      edges.scale.copy(mesh.scale);
      edges.position.copy(mesh.position);
      scene.add(edges);
      shelfMeshes.push({ mesh, edges });
    });

    /* ── Pick markers ── */
    const markers = [];
    PICK_ITEMS.forEach((item) => {
      const group = new THREE.Group();
      group.visible = false;
      const cz = item.z + SHELF_W / 2;
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
      ring.position.set(item.x, 0.04, cz);
      group.add(ring);
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 1, 4),
        new THREE.MeshBasicMaterial({
          color: GOLD,
          transparent: true,
          opacity: 0.15,
        })
      );
      beam.position.set(item.x, 0.5, cz);
      group.add(beam);
      const diamond = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.28, 1),
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
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.28, 1)),
        new THREE.LineBasicMaterial({
          color: GOLD,
          transparent: true,
          opacity: 0.5,
        })
      );
      dEdges.position.copy(diamond.position);
      group.add(dEdges);
      const light = new THREE.PointLight(GOLD, 0, 7);
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
    for (let i = 0; i < optPts.length - 1; i++) {
      optPairs.push(optPts[i].clone(), optPts[i + 1].clone());
    }
    const optGeo = new THREE.BufferGeometry().setFromPoints(optPairs);
    const optMat = new THREE.LineBasicMaterial({
      color: GOLD,
      transparent: true,
      opacity: 0,
    });
    scene.add(new THREE.LineSegments(optGeo, optMat));

    const naivePts = buildLinePoints(NAIVE_ROUTE);
    const naivePairs = [];
    for (let i = 0; i < naivePts.length - 1; i++) {
      naivePairs.push(naivePts[i].clone(), naivePts[i + 1].clone());
    }
    const naiveGeo = new THREE.BufferGeometry().setFromPoints(naivePairs);
    const naiveMat = new THREE.LineDashedMaterial({
      color: RED_DIM,
      transparent: true,
      opacity: 0,
      dashSize: 0.3,
      gapSize: 0.2,
    });
    const naiveLine = new THREE.LineSegments(naiveGeo, naiveMat);
    naiveLine.computeLineDistances();
    scene.add(naiveLine);

    // Pick fractions along optimized route
    const pickWaypoints = [3, 6, 9, 12, 15, 18]; // waypoint indices where items are
    const pickFracs = pickWaypoints.map((idx) => waypointFraction(optPts, idx));

    /* ── Picker orb ── */
    const picker = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
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

    /* ═══ State driven by scroll progress (0-1) ═══ */
    const state = {
      p: 0,
      shelfH: 0,
      routeVis: 0,
      routeProgress: 0,
      naiveVis: 0,
      pickProgress: 0,
    };

    /* ── Single ScrollTrigger drives everything ── */
    ScrollTrigger.create({
      trigger: scrollEl,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.8,
      onUpdate: (self) => {
        state.p = self.progress;

        // Shelf height
        state.shelfH =
          self.progress < T.shelfEnd
            ? self.progress / T.shelfEnd
            : self.progress > T.outroStart
            ? 1 - (self.progress - T.outroStart) / (T.outroEnd - T.outroStart)
            : 1;

        // Items visibility (handled in animate)

        // Naive route flash
        if (self.progress >= T.naiveStart && self.progress < T.naiveEnd) {
          const t =
            (self.progress - T.naiveStart) / (T.naiveEnd - T.naiveStart);
          state.naiveVis = t < 0.5 ? t * 2 * 0.3 : (1 - t) * 2 * 0.3;
        } else state.naiveVis = 0;

        // Route draw (slightly ahead of picker)
        if (self.progress >= T.routeStart) {
          const routeEnd = T.returnEnd;
          state.routeVis =
            Math.min(1, (self.progress - T.routeStart) / 0.04) * 0.65;
          state.routeProgress = Math.min(
            1,
            (self.progress - T.routeStart) / (routeEnd - T.routeStart)
          );
        } else {
          state.routeVis = 0;
          state.routeProgress = 0;
        }

        // Pick progress (picker orb)
        if (self.progress >= T.pickStart && self.progress <= T.returnEnd) {
          state.pickProgress = Math.min(
            1,
            (self.progress - T.pickStart) / (T.returnEnd - T.pickStart)
          );
        }

        // Outro: fade route
        if (self.progress > T.outroStart) {
          state.routeVis *=
            1 - (self.progress - T.outroStart) / (T.outroEnd - T.outroStart);
        }

        // Captions
        for (let i = CAPTIONS.length - 1; i >= 0; i--) {
          if (self.progress >= CAPTIONS[i].start) {
            setCaption(CAPTIONS[i]);
            break;
          }
        }
      },
    });

    /* ── Animate ── */
    let frameId;
    const clock = new THREE.Clock();
    const camTarget = new THREE.Vector3();
    const camPos = new THREE.Vector3(0, 36, 34);

    function animate() {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const p = state.p;
      const curH = SHELF_H * Math.max(0, Math.min(1, state.shelfH));

      // Shelf height
      shelfMeshes.forEach(({ mesh, edges }) => {
        const h = Math.max(0.05, curH);
        mesh.scale.y = h;
        mesh.position.y = h / 2;
        edges.scale.y = h;
        edges.position.y = h / 2;
      });

      // Markers: show/hide based on scroll + animate
      const showItems = p >= T.itemsStart && p < T.outroStart;
      markers.forEach((m, i) => {
        const itemShow = showItems && p >= T.itemsStart + i * 0.008;
        if (itemShow && !m.group.visible) {
          m.group.visible = true;
          gsap.to(m.light, { intensity: 2.5, duration: 0.4 });
          gsap.fromTo(
            m.diamond.scale,
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 1, z: 1, duration: 0.4, ease: "back.out(2)" }
          );
        }
        if (!itemShow && m.group.visible) {
          m.group.visible = false;
          m.light.intensity = 0;
          m.picked = false;
          m.diamond.material.color.setHex(GOLD);
          m.diamond.material.emissive.setHex(GOLD);
          m.ring.material.color.setHex(GOLD);
          m.light.color.setHex(GOLD);
        }
        if (!m.group.visible) return;

        // Check if picker reached this item
        if (!m.picked && state.pickProgress > 0) {
          const pickIdx = [0, 5, 3, 2, 1, 4][i]; // PICK_ITEMS order → route visit order
          if (pickIdx !== undefined && state.pickProgress >= pickFracs[i]) {
            m.picked = true;
            m.diamond.material.color.setHex(GREEN);
            m.diamond.material.emissive.setHex(GREEN);
            m.ring.material.color.setHex(GREEN);
            m.light.color.setHex(GREEN);
          }
        }

        const my = curH + 1.1 + Math.sin(t * 1.4 + i * 1.3) * 0.1;
        m.diamond.position.y = my;
        m.dEdges.position.y = my;
        m.light.position.y = my;
        m.beam.scale.y = my;
        m.beam.position.y = my / 2;
        m.diamond.rotation.y = t * 0.6 + i;
        m.diamond.rotation.x = Math.sin(t * 0.4 + i) * 0.15;
        m.dEdges.rotation.copy(m.diamond.rotation);
        m.ring.rotation.z = t * 0.2 + i;
      });

      // Route drawing
      optMat.opacity = state.routeVis;
      optGeo.setDrawRange(
        0,
        Math.max(2, Math.floor(state.routeProgress * optPairs.length))
      );
      naiveMat.opacity = state.naiveVis;

      // Picker orb position
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
        // Direct overhead: camera looks straight down, follows picker
        const px = picker.position.x;
        const pz = picker.position.z;
        const idealPos = new THREE.Vector3(px, 22, pz + 0.5);
        const idealTarget = new THREE.Vector3(px, 0, pz);
        camPos.lerp(idealPos, 0.06);
        camTarget.lerp(idealTarget, 0.06);
      } else if (p < T.pickStart) {
        // Pre-pick: cinematic orbit
        const orbitT = Math.min(1, p / T.pickStart);
        const angle = orbitT * Math.PI * 0.4;
        const radius = 32 - orbitT * 10;
        const height = 36 - orbitT * 14;
        const idealPos = new THREE.Vector3(
          Math.sin(angle) * radius,
          height,
          Math.cos(angle) * radius
        );
        const idealTarget = new THREE.Vector3(0, curH * 0.5, 0);
        camPos.lerp(idealPos, 0.05);
        camTarget.lerp(idealTarget, 0.05);
      } else {
        // Outro: return to initial
        const idealPos = new THREE.Vector3(0, 36, 34);
        const idealTarget = new THREE.Vector3(0, 0, 0);
        camPos.lerp(idealPos, 0.04);
        camTarget.lerp(idealTarget, 0.04);
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
