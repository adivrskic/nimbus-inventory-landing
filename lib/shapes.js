/* ──────────────────────────────────────────────────────────────────────────
   lib/shapes.js
   ──────────────────────────────────────────────────────────────────────────
   Particle-position generators for the AI section. Each generator returns
   a Float32Array of length n*3 (xyz interleaved) describing one shape.

   These are scenes, not icons. Each one uses the full 50k particle budget
   to compose multiple semantic sub-structures — the goal is "here is a
   recognizable, dense visual of the concept" rather than "here is an
   abstract outline that hints at the concept."

   Allocations (% of particle budget per scene):

     VOICE      source 6%  · rings 22%  · freq bars 36%  · rays 14%
                sparks 11%  · ambient 11%
     SPATIAL    floor 18%  · building edges 8%  · shelves 36%  · items 18%
                ceiling 6%  · worker 5%  · ambient 9%
     SEARCH     lens 20%   · handle 10%  · magnified content 22%
                outer grid 28%  · result 6%  · beam 8%  · ambient 6%
     CHART      Y-axis 6%  · X-axis 7%  · ticks 4%  · grid lines 8%
                bars 28%  · data markers 7%  · trend 10%  · forecast 13%
                Y-labels 4%  · ambient 13%

   All shapes share the S scale constant, gaussRand() helper, and
   shufflePositions() (which destroys index↔feature correlation so
   particles don't stream into one feature first, another second, etc.
   Without shuffling you see visible "rivers" of particles flowing into
   the dominant sub-structure during the morph).

   ─── PUBLIC API ──────────────────────────────────────────────────────

     generateScattered(n, mobile?)       — the unformed background cloud

     generateVoiceScene(n, rx, ry, rz)   — keys: "voice"
     generateSpatialScene(n, rx, ry, rz) — keys: "spatial"
     generateSearchScene(n, rx, ry, rz)  — keys: "search"
     generateChartScene(n, rx, ry, rz)   — keys: "chart"

     offsetShape(positions, dx)          — translate along X
     offsetShapeY(positions, dy)         — translate along Y
     isoShape(positions, rx, ry, rz)     — apply 3D rotation

   Each generator's last operation is isoTransform(...) using the
   rotXDeg/rotYDeg/rotZDeg parameters, so the SECTIONS rotation values
   in AISection.jsx still drive the final orientation.
   ────────────────────────────────────────────────────────────────────────── */

/* Shape scale. Bump higher for bigger shapes; lower for smaller. */
const S = 1.95;

/* ── isoTransform ──
   Applies 3D rotation to a particle position buffer.
   All angles in DEGREES. Rotations are applied Z → Y → X. */
function isoTransform(positions, rotXDeg = -17, rotYDeg = 23, rotZDeg = 0) {
  const ax = (rotXDeg * Math.PI) / 180;
  const ay = (rotYDeg * Math.PI) / 180;
  const az = (rotZDeg * Math.PI) / 180;
  const cx = Math.cos(ax),
    sx = Math.sin(ax);
  const cy = Math.cos(ay),
    sy = Math.sin(ay);
  const cz = Math.cos(az),
    sz = Math.sin(az);
  const p = new Float32Array(positions.length);
  for (let i = 0; i < positions.length / 3; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];

    const x1 = x * cz - y * sz;
    const y1 = x * sz + y * cz;
    const x2 = x1 * cy + z * sy;
    const z2 = -x1 * sy + z * cy;
    const y3 = y1 * cx - z2 * sx;
    const z3 = y1 * sx + z2 * cx;

    p[i * 3] = x2;
    p[i * 3 + 1] = y3;
    p[i * 3 + 2] = z3;
  }
  return p;
}

/* Shuffle xyz triplets so particle index has no correlation with shape
   feature. Without this, particles 0–8333 all converge to floor first,
   8334–16667 to shelves second, etc — creating visible streams as the
   shape forms. With it, each particle's final position is independent
   of its index, so the formation looks like a uniform settle. */
function shufflePositions(p) {
  const n = p.length / 3;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const i3 = i * 3,
      j3 = j * 3;
    let tmp;
    tmp = p[i3];
    p[i3] = p[j3];
    p[j3] = tmp;
    tmp = p[i3 + 1];
    p[i3 + 1] = p[j3 + 1];
    p[j3 + 1] = tmp;
    tmp = p[i3 + 2];
    p[i3 + 2] = p[j3 + 2];
    p[j3 + 2] = tmp;
  }
  return p;
}

/* Gaussian-ish random number, clamped to [-3, 3]. Used everywhere for
   "soft" placement noise that gives each shape feature a real thickness
   rather than a single-pixel-thin mathematical surface. */
function gaussRand() {
  const u = 1 - Math.random(),
    v = Math.random();
  return Math.max(
    -3,
    Math.min(3, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))
  );
}

/* ── generateScattered ──
   Bounding box for the unformed particle cloud. Particles drift through
   this volume when sFormation is low. With the new shape-blending in
   AISection.jsx, particles spend most of their time at sFormation ≈ 1
   (morphing between adjacent scenes) and only fall through scattered
   when the user is well above or well below the whole AI section. */
export function generateScattered(n, mobile = false) {
  const p = new Float32Array(n * 3);
  const rx = mobile ? 16 : 20;
  const ry = mobile ? 10 : 12;
  const rz = mobile ? 22 : 26;
  for (let i = 0; i < n; i++) {
    p[i * 3] = (Math.random() - 0.5) * rx;
    p[i * 3 + 1] = (Math.random() - 0.5) * ry;
    p[i * 3 + 2] = (Math.random() - 0.5) * rz;
  }
  return p;
}

/* ── Helper: fill a line segment with particles ──
   Distributes `count` particles uniformly along the segment from `a` to
   `b` (both [x, y, z] arrays). `jitter` is the perpendicular spread in
   world units (NOT scaled by S). */
function fillLine(p, startIdx, count, a, b, jitter = 0.04) {
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    p[(startIdx + i) * 3] = a[0] + (b[0] - a[0]) * t + gaussRand() * jitter;
    p[(startIdx + i) * 3 + 1] = a[1] + (b[1] - a[1]) * t + gaussRand() * jitter;
    p[(startIdx + i) * 3 + 2] = a[2] + (b[2] - a[2]) * t + gaussRand() * jitter;
  }
  return startIdx + count;
}

/* ── Helper: fill a rectangular box volume with particles ──
   Uniform random distribution inside the box [cx ± hw, cy ± hh, cz ± hd].
   `jitter` is added on top of the box-uniform position for soft edges. */
function fillBox(p, startIdx, count, cx, cy, cz, hw, hh, hd, jitter = 0.02) {
  for (let i = 0; i < count; i++) {
    p[(startIdx + i) * 3] =
      cx + (Math.random() - 0.5) * 2 * hw + gaussRand() * jitter;
    p[(startIdx + i) * 3 + 1] =
      cy + (Math.random() - 0.5) * 2 * hh + gaussRand() * jitter;
    p[(startIdx + i) * 3 + 2] =
      cz + (Math.random() - 0.5) * 2 * hd + gaussRand() * jitter;
  }
  return startIdx + count;
}

/* ── Helper: fill a ring (annulus in XY plane) ──
   Particles distributed around a circle of radius `radius` in the XY
   plane at z=`z`. `thickness` is the radial spread; `zJitter` is the
   spread in z. */
function fillRing(p, startIdx, count, cx, cy, z, radius, thickness, zJitter) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = radius + gaussRand() * thickness;
    p[(startIdx + i) * 3] = cx + Math.cos(a) * r;
    p[(startIdx + i) * 3 + 1] = cy + Math.sin(a) * r;
    p[(startIdx + i) * 3 + 2] = z + gaussRand() * zJitter;
  }
  return startIdx + count;
}

/* ═══════════════════════════════════════════════════════════════════════
   VOICE SCENE — pulse halo
   ───────────────────────────────────────────────────────────────────────
   A dense source with 5 concentric ring bands and a smooth radial
   fill between them. Returns { positions, phases }: positions is the
   usual Float32Array, phases is a parallel Float32Array of per-particle
   ring indices (0..4 for ring particles, -1 for source/fill/ambient).
   The phases drive the consecutive ring glow in the shader — see
   lib/shaders.js. Other scene generators continue to return a plain
   Float32Array; only voice uses the dual-return shape.
   ═══════════════════════════════════════════════════════════════════════ */
export function generateVoiceScene(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);
  const phases = new Float32Array(n);
  const TWO_PI = Math.PI * 2;

  /* Ring definitions: radius, radial-thickness σ (sharpness), z-thickness σ,
       particle fraction. Densities decrease outward (older waves
       dissipating); radial thickness grows outward (waves spread). The
       spacing widens too — each gap larger than the previous — which is
       physically right for outward propagation. */
  const rings = [
    { r: 1.15 * S, dr: 0.085 * S, dz: 0.09 * S, frac: 0.16, idx: 0 },
    { r: 1.95 * S, dr: 0.11 * S, dz: 0.13 * S, frac: 0.14, idx: 1 },
    { r: 2.85 * S, dr: 0.15 * S, dz: 0.18 * S, frac: 0.12, idx: 2 },
    { r: 3.8 * S, dr: 0.22 * S, dz: 0.24 * S, frac: 0.09, idx: 3 },
    { r: 4.75 * S, dr: 0.32 * S, dz: 0.32 * S, frac: 0.06, idx: 4 },
  ];

  const srcN = Math.floor(n * 0.16); /* brighter source */
  const fillN = Math.floor(n * 0.15);
  /* ambient ≈ 12% remainder */

  let idx = 0;

  /* ─── SOURCE — dense flattened cluster at origin ─────────────────
       Larger than the previous version so the center reads as the
       gravity well of the halo even with five rings competing for
       attention. Slightly flattened in z to match the planar rings. */
  const srcSigma = 0.22 * S;
  const srcSigmaZ = 0.12 * S;
  for (let i = 0; i < srcN; i++) {
    p[idx * 3] = gaussRand() * srcSigma;
    p[idx * 3 + 1] = gaussRand() * srcSigma;
    p[idx * 3 + 2] = gaussRand() * srcSigmaZ;
    phases[idx] = -1.0;
    idx++;
  }

  /* ─── RINGS — thick toroidal bands at increasing radii ───────────
       Lower dr than before gives sharper ring definition. Phase index
       encodes which ring this particle belongs to so the shader can
       pulse each ring on its own timing. */
  for (const ring of rings) {
    const ringN = Math.floor(n * ring.frac);
    for (let i = 0; i < ringN; i++) {
      const theta = Math.random() * TWO_PI;
      const radial = ring.r + gaussRand() * ring.dr;
      p[idx * 3] = radial * Math.cos(theta);
      p[idx * 3 + 1] = radial * Math.sin(theta);
      p[idx * 3 + 2] = gaussRand() * ring.dz;
      phases[idx] = ring.idx;
      idx++;
    }
  }

  /* ─── RADIAL FILL — smooth density gradient between rings ────────
       Exponential decay from source outward, rejection-sampled to clip
       the long tail. Fills the gaps so the field reads as one coherent
       halo. No phase — static between pulses. */
  const fillDecay = 1.7 * S;
  const fillRMax = 4.9 * S;
  for (let i = 0; i < fillN; i++) {
    let r;
    do {
      r = -fillDecay * Math.log(Math.random() + 1e-9);
    } while (r > fillRMax);
    if (r < 0.32 * S) r = 0.32 * S + Math.random() * 0.5 * S;
    const theta = Math.random() * TWO_PI;
    p[idx * 3] = r * Math.cos(theta);
    p[idx * 3 + 1] = r * Math.sin(theta);
    p[idx * 3 + 2] = gaussRand() * 0.18 * S;
    phases[idx] = -1.0;
    idx++;
  }

  /* ─── AMBIENT — soft outer halo for morph slack ──────────────────
       Faint scatter just beyond the outermost ring. No phase. */
  for (let i = idx; i < n; i++) {
    const theta = Math.random() * TWO_PI;
    const r = 4.5 * S + Math.random() * 1.3 * S;
    p[i * 3] = r * Math.cos(theta);
    p[i * 3 + 1] = r * Math.sin(theta);
    p[i * 3 + 2] = gaussRand() * 0.5 * S;
    phases[i] = -1.0;
  }

  /* Shuffle positions and phases together so a particle's index has
       no relationship to its ring assignment after generation. */
  shufflePositionsAndAttribute(p, phases);

  return {
    positions: isoTransform(p, rotXDeg, rotYDeg, rotZDeg),
    phases,
  };
}

/* Helper next to shufflePositions in lib/shapes.js — shuffles position
     triplets AND a parallel scalar-per-particle attribute in sync. */
function shufflePositionsAndAttribute(p, attr) {
  const n = p.length / 3;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const i3 = i * 3,
      j3 = j * 3;
    let tmp;
    tmp = p[i3];
    p[i3] = p[j3];
    p[j3] = tmp;
    tmp = p[i3 + 1];
    p[i3 + 1] = p[j3 + 1];
    p[j3 + 1] = tmp;
    tmp = p[i3 + 2];
    p[i3 + 2] = p[j3 + 2];
    p[j3 + 2] = tmp;
    tmp = attr[i];
    attr[i] = attr[j];
    attr[j] = tmp;
  }
}
/* ═══════════════════════════════════════════════════════════════════════
   SPATIAL SCENE — miniature isometric warehouse
   ───────────────────────────────────────────────────────────────────────
   What it shows: a 3D warehouse model with a floor grid, shelving units,
   inventory items on the shelves, and a worker marker. Reads as
   "spatial intelligence" / "real-time map of your warehouse" rather
   than the previous abstract cube.

   Spatial layout (natural orientation, before isoTransform):
     - Floor: horizontal plane at y = -1.6S, dot grid pattern
     - Building edges: 12 edges of a wide low cuboid (the warehouse outline)
     - Shelves: 4 tall thin boxes standing on the floor, each with
       3 horizontal "shelf level" lines visible
     - Items: small cubes scattered on the shelves
     - Ceiling beams: 3 horizontal lines crossing the top
     - Worker: small upright figure (2 particles stacked: head + body)
   ═══════════════════════════════════════════════════════════════════════ */
export function generateSpatialScene(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  const floorN = Math.floor(n * 0.18);
  const edgesN = Math.floor(n * 0.08);
  const shelvesN = Math.floor(n * 0.36);
  const itemsN = Math.floor(n * 0.18);
  const ceilingN = Math.floor(n * 0.06);
  const workerN = Math.floor(n * 0.05);
  /* ambient ≈ 9% */

  /* Warehouse footprint — wider than tall, like a real building */
  const halfW = 2.5 * S; // x half-width
  const halfH = 1.6 * S; // y half-height (vertical)
  const halfD = 2.0 * S; // z half-depth

  const floorY = -halfH;
  const ceilingY = +halfH;

  let idx = 0;

  /* ─── FLOOR GRID — dot pattern on the floor plane ────────────────
     Particles snap to a 14×11 grid with jitter; reads as a tiled floor
     or a survey grid rather than uniform fuzz. */
  const gridX = 14;
  const gridZ = 11;
  const perFloorCell = Math.floor(floorN / (gridX * gridZ));
  const cellW = (halfW * 2) / gridX;
  const cellD = (halfD * 2) / gridZ;
  for (let gx = 0; gx < gridX; gx++) {
    for (let gz = 0; gz < gridZ; gz++) {
      const cx = -halfW + (gx + 0.5) * cellW;
      const cz = -halfD + (gz + 0.5) * cellD;
      const lastCell = gx === gridX - 1 && gz === gridZ - 1;
      const limit = lastCell ? floorN : idx + perFloorCell;
      while (idx < limit && idx < floorN) {
        p[idx * 3] = cx + gaussRand() * cellW * 0.18;
        p[idx * 3 + 1] = floorY + gaussRand() * 0.025 * S;
        p[idx * 3 + 2] = cz + gaussRand() * cellD * 0.18;
        idx++;
      }
    }
  }

  /* ─── BUILDING EDGES — wireframe outline of the warehouse cuboid ──
     12 edges connecting 8 corners. Same pattern as the old cube but
     much wider/lower aspect ratio, so the silhouette reads as a
     building, not a die. */
  const v = [
    [-halfW, -halfH, -halfD],
    [+halfW, -halfH, -halfD],
    [+halfW, -halfH, +halfD],
    [-halfW, -halfH, +halfD],
    [-halfW, +halfH, -halfD],
    [+halfW, +halfH, -halfD],
    [+halfW, +halfH, +halfD],
    [-halfW, +halfH, +halfD],
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const perEdge = Math.floor(edgesN / 12);
  for (let e = 0; e < 12; e++) {
    const count = e === 11 ? floorN + edgesN - idx : perEdge;
    idx = fillLine(p, idx, count, v[edges[e][0]], v[edges[e][1]], 0.05);
  }

  /* ─── SHELVING UNITS — 4 tall thin boxes arranged in 2 rows ───────
     Each shelf is a rectangular volume with vertical "uprights" at the
     4 corners (more particles on edges) + 3 horizontal "shelf level"
     bands across the front face. Reads as actual storage racks. */
  const shelfPositions = [
    [-halfW * 0.6, 0, -halfD * 0.45],
    [+halfW * 0.6, 0, -halfD * 0.45],
    [-halfW * 0.6, 0, +halfD * 0.45],
    [+halfW * 0.6, 0, +halfD * 0.45],
  ];
  const shelfW = 0.85 * S;
  const shelfH = 2.4 * S; // tall
  const shelfD = 0.45 * S;
  const perShelf = Math.floor(shelvesN / 4);
  for (let si = 0; si < 4; si++) {
    const [cx, cy, cz] = shelfPositions[si];
    const baseY = floorY + 0.05 * S;
    const topY = baseY + shelfH;

    const isLast = si === 3;
    const shelfEnd = isLast ? floorN + edgesN + shelvesN : idx + perShelf;

    /* Distribute this shelf's particles across:
       45% — 4 vertical uprights (corner edges)
       35% — 3 horizontal shelf-level bands
       20% — sparse interior fill */
    const allocUprights = Math.floor((shelfEnd - idx) * 0.45);
    const allocBands = Math.floor((shelfEnd - idx) * 0.35);
    /* fill = remainder */

    /* 4 vertical uprights */
    const upCorners = [
      [cx - shelfW / 2, cz - shelfD / 2],
      [cx + shelfW / 2, cz - shelfD / 2],
      [cx + shelfW / 2, cz + shelfD / 2],
      [cx - shelfW / 2, cz + shelfD / 2],
    ];
    const perUpright = Math.floor(allocUprights / 4);
    for (let u = 0; u < 4; u++) {
      const count = u === 3 ? allocUprights - 3 * perUpright : perUpright;
      idx = fillLine(
        p,
        idx,
        count,
        [upCorners[u][0], baseY, upCorners[u][1]],
        [upCorners[u][0], topY, upCorners[u][1]],
        0.025
      );
    }

    /* 3 horizontal shelf levels — at 1/4, 1/2, 3/4 of the shelf height.
       Each level is 4 line segments (front, back, left, right edges)
       to make it read as an actual shelf surface. */
    const numLevels = 3;
    const perLevel = Math.floor(allocBands / numLevels);
    for (let lv = 0; lv < numLevels; lv++) {
      const t = (lv + 1) / (numLevels + 1);
      const y = baseY + t * shelfH;
      const perEdgeBand = Math.floor(perLevel / 4);
      const lc = [
        [cx - shelfW / 2, y, cz - shelfD / 2],
        [cx + shelfW / 2, y, cz - shelfD / 2],
        [cx + shelfW / 2, y, cz + shelfD / 2],
        [cx - shelfW / 2, y, cz + shelfD / 2],
      ];
      idx = fillLine(p, idx, perEdgeBand, lc[0], lc[1], 0.018);
      idx = fillLine(p, idx, perEdgeBand, lc[1], lc[2], 0.018);
      idx = fillLine(p, idx, perEdgeBand, lc[2], lc[3], 0.018);
      const lastBand = lv === numLevels - 1;
      const remain = lastBand ? floorN + edgesN + shelvesN - idx : perEdgeBand;
      idx = fillLine(p, idx, Math.max(0, remain), lc[3], lc[0], 0.018);
    }

    /* Sparse fill inside the shelf volume — looks like contents
       packed at varying densities on each level */
    while (idx < shelfEnd) {
      const lv = Math.floor(Math.random() * numLevels);
      const t = (lv + 1) / (numLevels + 1);
      const y = baseY + t * shelfH;
      p[idx * 3] = cx + (Math.random() - 0.5) * shelfW * 0.92;
      p[idx * 3 + 1] = y + gaussRand() * 0.08 * S;
      p[idx * 3 + 2] = cz + (Math.random() - 0.5) * shelfD * 0.85;
      idx++;
    }
  }

  /* ─── ITEMS ON SHELVES — small cubes scattered on shelf surfaces ──
     Each item is a tight cluster of ~8 particles forming a small box,
     placed randomly on one of the 12 shelf levels (4 shelves × 3
     levels). The cluster size makes them read as discrete inventory
     units rather than noise. */
  const itemEnd = floorN + edgesN + shelvesN + itemsN;
  const particlesPerItem = 8;
  const numItems = Math.floor(itemsN / particlesPerItem);
  for (let it = 0; it < numItems; it++) {
    const shelf = shelfPositions[Math.floor(Math.random() * 4)];
    const lvIdx = Math.floor(Math.random() * 3);
    const t = (lvIdx + 1) / 4;
    const cy = floorY + 0.05 * S + t * shelfH;
    const ix = shelf[0] + (Math.random() - 0.5) * shelfW * 0.7;
    const iz = shelf[2] + (Math.random() - 0.5) * shelfD * 0.6;
    const itemSize = (0.08 + Math.random() * 0.07) * S;
    const itemH = (0.12 + Math.random() * 0.1) * S;
    idx = fillBox(
      p,
      idx,
      particlesPerItem,
      ix,
      cy + itemH / 2,
      iz,
      itemSize / 2,
      itemH / 2,
      itemSize / 2,
      0.015
    );
    if (idx >= itemEnd) break;
  }
  /* Fill any remaining item budget with stragglers */
  while (idx < itemEnd) {
    const shelf = shelfPositions[Math.floor(Math.random() * 4)];
    const lvIdx = Math.floor(Math.random() * 3);
    const t = (lvIdx + 1) / 4;
    const cy = floorY + 0.05 * S + t * shelfH;
    p[idx * 3] = shelf[0] + (Math.random() - 0.5) * shelfW * 0.7;
    p[idx * 3 + 1] = cy + 0.08 * S + gaussRand() * 0.05 * S;
    p[idx * 3 + 2] = shelf[2] + (Math.random() - 0.5) * shelfD * 0.6;
    idx++;
  }

  /* ─── CEILING BEAMS — 3 horizontal lines across the top ──────────
     Suggests the warehouse roof structure. Crosses front-to-back
     above the shelves. */
  const numBeams = 3;
  const perBeam = Math.floor(ceilingN / numBeams);
  const beamY = ceilingY - 0.05 * S;
  for (let b = 0; b < numBeams; b++) {
    const z = -halfD * 0.7 + (b / (numBeams - 1)) * halfD * 1.4;
    const count =
      b === numBeams - 1
        ? floorN + edgesN + shelvesN + itemsN + ceilingN - idx
        : perBeam;
    idx = fillLine(
      p,
      idx,
      count,
      [-halfW * 0.95, beamY, z],
      [+halfW * 0.95, beamY, z],
      0.03
    );
  }

  /* ─── WORKER — small upright figure in the aisle ──────────────────
     Two stacked tight clusters (body + head) standing on the floor
     between the shelving units. Adds scale and "this is a place
     people actually work" reading. */
  const workerX = 0;
  const workerZ = 0;
  const workerBaseY = floorY + 0.05 * S;
  const bodyH = 0.45 * S;
  const headR = 0.1 * S;
  const bodyCount = Math.floor(workerN * 0.7);
  const headCount = workerN - bodyCount;
  /* Body — vertical capsule-ish */
  for (let i = 0; i < bodyCount; i++) {
    const t = Math.random();
    p[idx * 3] = workerX + gaussRand() * 0.04 * S;
    p[idx * 3 + 1] = workerBaseY + t * bodyH + gaussRand() * 0.02 * S;
    p[idx * 3 + 2] = workerZ + gaussRand() * 0.04 * S;
    idx++;
  }
  /* Head — small dense cluster on top */
  for (let i = 0; i < headCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const theta = Math.acos(2 * Math.random() - 1);
    const r = headR * Math.pow(Math.random(), 0.5);
    p[idx * 3] = workerX + r * Math.sin(theta) * Math.cos(a);
    p[idx * 3 + 1] = workerBaseY + bodyH + 0.06 * S + r * Math.cos(theta);
    p[idx * 3 + 2] = workerZ + r * Math.sin(theta) * Math.sin(a);
    idx++;
  }

  /* ─── AMBIENT — diffuse haze around the building ─────────────────
     Spread mostly OUTSIDE the building footprint so it doesn't muddy
     the warehouse interior. */
  for (let i = idx; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (Math.random() * 1.5 + 1.0) * Math.max(halfW, halfD);
    p[i * 3] = Math.cos(a) * r + gaussRand() * 0.3;
    p[i * 3 + 1] = gaussRand() * halfH * 1.2;
    p[i * 3 + 2] = Math.sin(a) * r + gaussRand() * 0.3;
  }

  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ═══════════════════════════════════════════════════════════════════════
   SEARCH SCENE — magnifier over a data grid
   ───────────────────────────────────────────────────────────────────────
   What it shows: a magnifying glass hovering over a structured grid of
   data points (rows × columns, like a database). Inside the lens, the
   data is MAGNIFIED — a denser, larger pattern of points. A focused
   beam runs from the lens center to a highlighted "result" cluster.

   Spatial layout (natural orientation, before isoTransform):
     - Outer grid: rows × cols of small dots in a flat plane at z=0
     - Lens: front rim + back rim + side ring, hovering above the grid
     - Handle: cylinder pointing down-right at -45° from lens edge
     - Magnified content: denser dot pattern inside the lens area
     - Result: bright cluster off to the side of the lens
     - Beam: line of particles from lens center toward the result
   ═══════════════════════════════════════════════════════════════════════ */
export function generateSearchScene(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  const lensN = Math.floor(n * 0.2);
  const handleN = Math.floor(n * 0.1);
  const magnifiedN = Math.floor(n * 0.22);
  const gridN = Math.floor(n * 0.28);
  const resultN = Math.floor(n * 0.06);
  const beamN = Math.floor(n * 0.08);
  /* ambient ≈ 6% */

  const lensR = 2.4 * S;
  const lensThickness = 0.35 * S;
  const lensCx = 0;
  const lensCy = 0.6 * S;

  let idx = 0;

  /* ─── LENS — front rim, back rim, side ring ─────────────────────
     Three concentric ring-like structures separated in z give the lens
     real volumetric thickness. */
  const lensFrontN = Math.floor(lensN * 0.42);
  const lensBackN = Math.floor(lensN * 0.42);
  const lensSideN = lensN - lensFrontN - lensBackN;
  /* Front rim */
  for (let i = 0; i < lensFrontN; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = lensR + gaussRand() * 0.18 * S;
    p[idx * 3] = lensCx + Math.cos(a) * r;
    p[idx * 3 + 1] = lensCy + Math.sin(a) * r;
    p[idx * 3 + 2] = lensThickness / 2 + gaussRand() * 0.05 * S;
    idx++;
  }
  /* Back rim */
  for (let i = 0; i < lensBackN; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = lensR + gaussRand() * 0.18 * S;
    p[idx * 3] = lensCx + Math.cos(a) * r;
    p[idx * 3 + 1] = lensCy + Math.sin(a) * r;
    p[idx * 3 + 2] = -lensThickness / 2 + gaussRand() * 0.05 * S;
    idx++;
  }
  /* Side ring — particles around the lens edge between front and back */
  for (let i = 0; i < lensSideN; i++) {
    const a = Math.random() * Math.PI * 2;
    const z = (Math.random() - 0.5) * lensThickness;
    p[idx * 3] = lensCx + Math.cos(a) * lensR;
    p[idx * 3 + 1] = lensCy + Math.sin(a) * lensR;
    p[idx * 3 + 2] = z + gaussRand() * 0.03 * S;
    idx++;
  }

  /* ─── HANDLE — cylinder extending down-right from lens edge ─────── */
  const handleAngle = -Math.PI / 4;
  const handleDirX = Math.cos(handleAngle);
  const handleDirY = Math.sin(handleAngle);
  const handleStartX = lensCx + handleDirX * lensR;
  const handleStartY = lensCy + handleDirY * lensR;
  const handleLen = 2.2 * S;
  const handleRad = 0.16 * S;
  const perpX = -handleDirY;
  const perpY = handleDirX;
  for (let i = 0; i < handleN; i++) {
    const t = Math.random();
    const a = Math.random() * Math.PI * 2;
    const baseX = handleStartX + handleDirX * t * handleLen;
    const baseY = handleStartY + handleDirY * t * handleLen;
    const offRadial = Math.cos(a) * handleRad;
    const offZ = Math.sin(a) * handleRad;
    p[idx * 3] = baseX + perpX * offRadial + gaussRand() * 0.025 * S;
    p[idx * 3 + 1] = baseY + perpY * offRadial + gaussRand() * 0.025 * S;
    p[idx * 3 + 2] = offZ + gaussRand() * 0.025 * S;
    idx++;
  }

  /* ─── OUTER GRID — rows × cols of data points behind the lens ────
     Sparse grid pattern at z = -lensThickness, spreading across the
     full scene. Reads as "the searchable database." */
  const gridCols = 22;
  const gridRows = 14;
  const gridW = 7.5 * S;
  const gridH = 4.5 * S;
  const gridStartX = -gridW / 2;
  const gridStartY = -gridH / 2 + lensCy;
  const cellWg = gridW / (gridCols - 1);
  const cellHg = gridH / (gridRows - 1);
  const perGridCell = Math.max(1, Math.floor(gridN / (gridCols * gridRows)));
  const gridEnd = idx + gridN;
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const gx = gridStartX + col * cellWg;
      const gy = gridStartY + row * cellHg;
      /* Skip grid cells that fall inside the lens — those are
         handled by the magnified-content allocation */
      const dx = gx - lensCx;
      const dy = gy - lensCy;
      const distSq = dx * dx + dy * dy;
      if (distSq < lensR * lensR * 0.9) continue;

      for (let k = 0; k < perGridCell && idx < gridEnd; k++) {
        p[idx * 3] = gx + gaussRand() * 0.04 * S;
        p[idx * 3 + 1] = gy + gaussRand() * 0.04 * S;
        p[idx * 3 + 2] = -lensThickness * 1.2 + gaussRand() * 0.05 * S;
        idx++;
      }
    }
  }
  /* If grid wasn't fully consumed (due to lens-skip), fill remainder
     with extra sparse points outside the lens */
  while (idx < gridEnd) {
    const a = Math.random() * Math.PI * 2;
    const r = ((Math.random() * 0.4 + 0.8) * Math.max(gridW, gridH)) / 2;
    p[idx * 3] = lensCx + Math.cos(a) * r;
    p[idx * 3 + 1] = lensCy + Math.sin(a) * r;
    p[idx * 3 + 2] = -lensThickness * 1.2 + gaussRand() * 0.05 * S;
    idx++;
  }

  /* ─── MAGNIFIED CONTENT — denser grid inside the lens ──────────────
     Higher-density dot pattern + a couple of clearly-bright "found"
     markers. Sits at z = 0 so it's "in" the lens. */
  const magCols = 7;
  const magRows = 5;
  const magW = lensR * 1.5;
  const magH = lensR * 1.5;
  const magStartX = lensCx - magW / 2;
  const magStartY = lensCy - magH / 2;
  const magCellW = magW / (magCols - 1);
  const magCellH = magH / (magRows - 1);
  const perMagCell = Math.floor(magnifiedN / (magCols * magRows));
  const magEnd = idx + magnifiedN;
  for (let row = 0; row < magRows; row++) {
    for (let col = 0; col < magCols; col++) {
      const gx = magStartX + col * magCellW;
      const gy = magStartY + row * magCellH;
      /* Constrain to inside the lens */
      const dx = gx - lensCx;
      const dy = gy - lensCy;
      if (dx * dx + dy * dy > lensR * lensR * 0.75) continue;

      for (let k = 0; k < perMagCell && idx < magEnd; k++) {
        p[idx * 3] = gx + gaussRand() * 0.06 * S;
        p[idx * 3 + 1] = gy + gaussRand() * 0.06 * S;
        p[idx * 3 + 2] = gaussRand() * 0.1 * S;
        idx++;
      }
    }
  }
  /* Fill remainder with random points inside the lens circle */
  while (idx < magEnd) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.55) * lensR * 0.85;
    p[idx * 3] = lensCx + Math.cos(a) * r;
    p[idx * 3 + 1] = lensCy + Math.sin(a) * r;
    p[idx * 3 + 2] = gaussRand() * 0.1 * S;
    idx++;
  }

  /* ─── RESULT — bright tight cluster off to the upper-left of lens ──
     Suggests the "found" item the search resolved to. */
  const resultX = lensCx - lensR * 1.8;
  const resultY = lensCy + lensR * 0.85;
  for (let i = 0; i < resultN; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.4) * 0.22 * S;
    p[idx * 3] = resultX + Math.cos(a) * r + gaussRand() * 0.02 * S;
    p[idx * 3 + 1] = resultY + Math.sin(a) * r + gaussRand() * 0.02 * S;
    p[idx * 3 + 2] = gaussRand() * 0.05 * S;
    idx++;
  }

  /* ─── BEAM — line of particles from lens center to result ────────
     Thin sparse line that draws the eye from "search" to "result". */
  for (let i = 0; i < beamN; i++) {
    const t = Math.random();
    p[idx * 3] = lensCx + (resultX - lensCx) * t + gaussRand() * 0.04 * S;
    p[idx * 3 + 1] = lensCy + (resultY - lensCy) * t + gaussRand() * 0.04 * S;
    p[idx * 3 + 2] = gaussRand() * 0.04 * S;
    idx++;
  }

  /* ─── AMBIENT — sparse halo around the scene ─────────────────────── */
  for (let i = idx; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (Math.random() * 2.0 + 4.0) * S;
    p[i * 3] = lensCx + Math.cos(a) * r + gaussRand() * 0.5;
    p[i * 3 + 1] = lensCy + Math.sin(a) * r * 0.7 + gaussRand() * 0.5;
    p[i * 3 + 2] = gaussRand() * 0.9;
  }

  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ═══════════════════════════════════════════════════════════════════════
   CHART SCENE — full bar chart with axes, grid, trend line, forecast
   ───────────────────────────────────────────────────────────────────────
   What it shows: a complete data visualization — axes, grid lines, tick
   marks, bars with edges and fill, data point markers at bar tops, a
   smooth trend line connecting the tops, a forecast arrow extending
   beyond the last bar to suggest "predictive analytics."

   Spatial layout (natural orientation, before isoTransform):
     - Y-axis: vertical line on the left, x = -halfW
     - X-axis: horizontal line at the bottom, y = floorY
     - Tick marks: short horizontal segments on Y-axis at each grid level
     - Grid lines: 5 horizontal dashed lines across the chart area
     - Bars: 8 vertical bars, edge-emphasized
     - Data point markers: small clusters at each bar's top
     - Trend line: smooth curve interpolating bar tops
     - Forecast arrow: extends past the last bar, ends in an arrowhead
   ═══════════════════════════════════════════════════════════════════════ */
export function generateChartScene(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  const yAxisN = Math.floor(n * 0.06);
  const xAxisN = Math.floor(n * 0.07);
  const ticksN = Math.floor(n * 0.04);
  const gridLinesN = Math.floor(n * 0.08);
  const barsN = Math.floor(n * 0.28);
  const markersN = Math.floor(n * 0.07);
  const trendN = Math.floor(n * 0.1);
  const forecastN = Math.floor(n * 0.13);
  const ylabelsN = Math.floor(n * 0.04);
  /* ambient ≈ 13% */

  const heights = [0.7, 1.1, 1.5, 1.2, 1.9, 2.4, 2.0, 2.9];
  const numBars = heights.length;
  const barW = 0.38 * S;
  const barD = 0.38 * S;
  const barGap = 0.16 * S;
  const totalW = numBars * barW + (numBars - 1) * barGap;
  const chartFloorY = -1.5 * S;
  const chartLeft = -totalW / 2 - 0.3 * S;
  const chartRight = totalW / 2;
  const chartTop = chartFloorY + 3.4 * S;
  const barStartX = -totalW / 2 + barW / 2;

  const bars = [];
  for (let i = 0; i < numBars; i++) {
    const cx = barStartX + i * (barW + barGap);
    const h = heights[i] * S;
    bars.push({
      cx,
      xMin: cx - barW / 2,
      xMax: cx + barW / 2,
      zMin: -barD / 2,
      zMax: barD / 2,
      yMin: chartFloorY,
      yMax: chartFloorY + h,
      yTop: chartFloorY + h,
    });
  }

  let idx = 0;

  /* ─── Y-AXIS — vertical line on the left ──────────────────────── */
  idx = fillLine(
    p,
    idx,
    yAxisN,
    [chartLeft, chartFloorY, 0],
    [chartLeft, chartTop, 0],
    0.025
  );

  /* ─── X-AXIS — horizontal line at the bottom ──────────────────── */
  idx = fillLine(
    p,
    idx,
    xAxisN,
    [chartLeft, chartFloorY, 0],
    [chartRight + 0.3 * S, chartFloorY, 0],
    0.025
  );

  /* ─── Y-AXIS TICK MARKS — short horizontals at each grid level ─── */
  const numTicks = 5;
  const tickLen = 0.12 * S;
  const perTick = Math.floor(ticksN / numTicks);
  for (let t = 0; t < numTicks; t++) {
    const y = chartFloorY + ((t + 1) / numTicks) * 3.0 * S;
    const count = t === numTicks - 1 ? yAxisN + xAxisN + ticksN - idx : perTick;
    idx = fillLine(
      p,
      idx,
      count,
      [chartLeft - tickLen, y, 0],
      [chartLeft, y, 0],
      0.018
    );
  }

  /* ─── GRID LINES — 5 horizontal dashed lines across the chart ──── */
  const numGrid = 5;
  const perGrid = Math.floor(gridLinesN / numGrid);
  for (let g = 0; g < numGrid; g++) {
    const y = chartFloorY + ((g + 1) / numGrid) * 3.0 * S;
    const count =
      g === numGrid - 1 ? yAxisN + xAxisN + ticksN + gridLinesN - idx : perGrid;
    /* Dashed effect: only emit particles where (x along line) is in
       certain ranges, skipping every other segment */
    const dashes = 18;
    const dashLen = (chartRight - chartLeft) / dashes;
    for (let k = 0; k < count; k++) {
      const di = Math.floor(Math.random() * dashes);
      /* Only odd-indexed dashes get particles → visible dash pattern */
      if (di % 2 === 0) continue;
      const segStart = chartLeft + di * dashLen;
      const x = segStart + Math.random() * dashLen * 0.7;
      p[idx * 3] = x + gaussRand() * 0.02 * S;
      p[idx * 3 + 1] = y + gaussRand() * 0.02 * S;
      p[idx * 3 + 2] = gaussRand() * 0.02 * S;
      idx++;
    }
  }

  /* ─── BARS — edges (60%) + sparse interior fill (40%) ────────────
     Edge-emphasized so each bar reads as a defined volume. */
  const perBarEdges = Math.floor((barsN * 0.6) / numBars);
  const perBarFill = Math.floor((barsN * 0.4) / numBars);
  for (let bi = 0; bi < numBars; bi++) {
    const b = bars[bi];
    /* 4 vertical edges (corners) */
    const corners = [
      [b.xMin, b.zMin],
      [b.xMax, b.zMin],
      [b.xMax, b.zMax],
      [b.xMin, b.zMax],
    ];
    const perEdge = Math.floor(perBarEdges / 4);
    for (let e = 0; e < 4; e++) {
      idx = fillLine(
        p,
        idx,
        perEdge,
        [corners[e][0], b.yMin, corners[e][1]],
        [corners[e][0], b.yMax, corners[e][1]],
        0.025
      );
    }
    /* Top perimeter (4 horizontal segments at yMax) */
    const topPerimeter = perBarEdges - perEdge * 4;
    const perTopEdge = Math.floor(topPerimeter / 4);
    for (let e = 0; e < 4; e++) {
      const c1 = corners[e];
      const c2 = corners[(e + 1) % 4];
      idx = fillLine(
        p,
        idx,
        perTopEdge,
        [c1[0], b.yMax, c1[1]],
        [c2[0], b.yMax, c2[1]],
        0.025
      );
    }
    /* Sparse interior fill */
    const isLast = bi === numBars - 1;
    const fillCount = isLast
      ? yAxisN + xAxisN + ticksN + gridLinesN + barsN - idx
      : perBarFill;
    idx = fillBox(
      p,
      idx,
      fillCount,
      b.cx,
      (b.yMin + b.yMax) / 2,
      0,
      barW / 2,
      (b.yMax - b.yMin) / 2,
      barD / 2,
      0.018
    );
  }

  /* ─── DATA POINT MARKERS — tight clusters at each bar top ─────── */
  const perMarker = Math.floor(markersN / numBars);
  for (let bi = 0; bi < numBars; bi++) {
    const b = bars[bi];
    const isLast = bi === numBars - 1;
    const count = isLast
      ? yAxisN + xAxisN + ticksN + gridLinesN + barsN + markersN - idx
      : perMarker;
    for (let k = 0; k < count; k++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.4) * 0.11 * S;
      const theta = Math.acos(2 * Math.random() - 1);
      p[idx * 3] = b.cx + r * Math.sin(theta) * Math.cos(a);
      p[idx * 3 + 1] = b.yTop + r * Math.cos(theta);
      p[idx * 3 + 2] = r * Math.sin(theta) * Math.sin(a);
      idx++;
    }
  }

  /* ─── TREND LINE — smooth curve interpolating bar tops ──────────
     Uses Catmull-Rom-ish interpolation between consecutive bar tops
     to give a real curve rather than straight segments. */
  const trendSegments = numBars - 1;
  const perTrendSeg = Math.floor(trendN / trendSegments);
  for (let s = 0; s < trendSegments; s++) {
    const i0 = Math.max(0, s - 1);
    const i1 = s;
    const i2 = s + 1;
    const i3idx = Math.min(numBars - 1, s + 2);
    const isLastSeg = s === trendSegments - 1;
    const count = isLastSeg
      ? yAxisN + xAxisN + ticksN + gridLinesN + barsN + markersN + trendN - idx
      : perTrendSeg;
    for (let k = 0; k < count; k++) {
      const t = Math.random();
      /* Catmull-Rom blend */
      const t2 = t * t;
      const t3 = t2 * t;
      const c0 = -0.5 * t3 + t2 - 0.5 * t;
      const c1 = 1.5 * t3 - 2.5 * t2 + 1;
      const c2 = -1.5 * t3 + 2 * t2 + 0.5 * t;
      const c3 = 0.5 * t3 - 0.5 * t2;
      const x =
        c0 * bars[i0].cx +
        c1 * bars[i1].cx +
        c2 * bars[i2].cx +
        c3 * bars[i3idx].cx;
      const y =
        c0 * bars[i0].yTop +
        c1 * bars[i1].yTop +
        c2 * bars[i2].yTop +
        c3 * bars[i3idx].yTop +
        0.22 * S;
      p[idx * 3] = x + gaussRand() * 0.03 * S;
      p[idx * 3 + 1] = y + gaussRand() * 0.03 * S;
      p[idx * 3 + 2] = gaussRand() * 0.04 * S;
      idx++;
    }
  }

  /* ─── FORECAST ARROW — extends past the last bar with an arrowhead ─
     Starts above the last bar top, projects up-right to a point past
     the right edge, with a clear arrowhead at the end. Signals
     "predictive" without subtlety. */
  const lastBar = bars[numBars - 1];
  const arrowStartX = lastBar.cx;
  const arrowStartY = lastBar.yTop + 0.22 * S;
  const arrowEndX = chartRight + 0.6 * S;
  const arrowEndY = arrowStartY + 1.2 * S;
  /* Shaft: 70% of forecast budget */
  const shaftCount = Math.floor(forecastN * 0.7);
  idx = fillLine(
    p,
    idx,
    shaftCount,
    [arrowStartX, arrowStartY, 0],
    [arrowEndX, arrowEndY, 0],
    0.035
  );
  /* Arrowhead: two short lines forming the arrowhead */
  const headLen = 0.45 * S;
  const arrowAngle = Math.atan2(
    arrowEndY - arrowStartY,
    arrowEndX - arrowStartX
  );
  const headAngle1 = arrowAngle + Math.PI - 0.5;
  const headAngle2 = arrowAngle + Math.PI + 0.5;
  const headEnd1X = arrowEndX + Math.cos(headAngle1) * headLen;
  const headEnd1Y = arrowEndY + Math.sin(headAngle1) * headLen;
  const headEnd2X = arrowEndX + Math.cos(headAngle2) * headLen;
  const headEnd2Y = arrowEndY + Math.sin(headAngle2) * headLen;
  const headPerSide = Math.floor((forecastN - shaftCount) / 2);
  idx = fillLine(
    p,
    idx,
    headPerSide,
    [arrowEndX, arrowEndY, 0],
    [headEnd1X, headEnd1Y, 0],
    0.025
  );
  const headRemaining =
    yAxisN +
    xAxisN +
    ticksN +
    gridLinesN +
    barsN +
    markersN +
    trendN +
    forecastN -
    idx;
  idx = fillLine(
    p,
    idx,
    headRemaining,
    [arrowEndX, arrowEndY, 0],
    [headEnd2X, headEnd2Y, 0],
    0.025
  );

  /* ─── Y-AXIS LABEL DOTS — small accents near the y-axis ──────────
     Suggests "100", "200", "300" labels without rendering text — just
     tight clusters next to each tick mark. */
  const perLabel = Math.floor(ylabelsN / numTicks);
  for (let t = 0; t < numTicks; t++) {
    const y = chartFloorY + ((t + 1) / numTicks) * 3.0 * S;
    const labelX = chartLeft - 0.35 * S;
    const isLast = t === numTicks - 1;
    const count = isLast
      ? yAxisN +
        xAxisN +
        ticksN +
        gridLinesN +
        barsN +
        markersN +
        trendN +
        forecastN +
        ylabelsN -
        idx
      : perLabel;
    for (let k = 0; k < count; k++) {
      p[idx * 3] = labelX + (Math.random() - 0.5) * 0.16 * S;
      p[idx * 3 + 1] = y + (Math.random() - 0.5) * 0.06 * S;
      p[idx * 3 + 2] = gaussRand() * 0.03 * S;
      idx++;
    }
  }

  /* ─── AMBIENT — diffuse haze biased above and around the chart ─── */
  for (let i = idx; i < n; i++) {
    p[i * 3] = gaussRand() * totalW * 0.7;
    p[i * 3 + 1] = gaussRand() * 1.8 * S + 0.6 * S;
    p[i * 3 + 2] = gaussRand() * barD * 2.0;
  }

  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ═══════════════════════════════════════════════════════════════════════
   UTILITY: offset / iso helpers used by AISection
   ═══════════════════════════════════════════════════════════════════════ */

export function offsetShape(source, xOffset) {
  const p = new Float32Array(source.length);
  for (let i = 0; i < source.length / 3; i++) {
    p[i * 3] = source[i * 3] + xOffset;
    p[i * 3 + 1] = source[i * 3 + 1];
    p[i * 3 + 2] = source[i * 3 + 2];
  }
  return p;
}

export function offsetShapeY(source, yOffset) {
  const p = new Float32Array(source.length);
  for (let i = 0; i < source.length / 3; i++) {
    p[i * 3] = source[i * 3];
    p[i * 3 + 1] = source[i * 3 + 1] + yOffset;
    p[i * 3 + 2] = source[i * 3 + 2];
  }
  return p;
}

export function isoShape(positions, rotXDeg, rotYDeg, rotZDeg) {
  return isoTransform(positions, rotXDeg, rotYDeg, rotZDeg);
}
