/* Shape scale. Bump higher for bigger shapes; lower for smaller. */
const S = 2.2;

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
   feature. Without this, particles 0–8333 all converge to ring 0,
   creating visible streams. */
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

export function generateScattered(n, mobile = false) {
  const p = new Float32Array(n * 3);
  const rx = mobile ? 24 : 30;
  const ry = mobile ? 14 : 18;
  const rz = mobile ? 32 : 38;
  for (let i = 0; i < n; i++) {
    p[i * 3] = (Math.random() - 0.5) * rx;
    p[i * 3 + 1] = (Math.random() - 0.5) * ry;
    p[i * 3 + 2] = (Math.random() - 0.5) * rz;
  }
  return p;
}

function gaussRand() {
  const u = 1 - Math.random(),
    v = Math.random();
  return Math.max(
    -3,
    Math.min(3, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))
  );
}

/* ── Voice: concentric sound rings ── */
export function generateSoundRings(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);
  const ambient = Math.floor(n * 0.08);
  const shaped = n - ambient;
  const rings = 6;
  const perRing = Math.floor(shaped / rings);

  for (let r = 0; r < rings; r++) {
    const radius = (1.2 + r * 0.85) * S;
    const thickness = (0.22 + r * 0.04) * S;
    for (let i = 0; i < perRing && r * perRing + i < shaped; i++) {
      const idx = r * perRing + i;
      const a = Math.random() * Math.PI * 2;
      const rr = radius + gaussRand() * thickness * 0.3;
      p[idx * 3] = Math.cos(a) * rr;
      p[idx * 3 + 1] = Math.sin(a) * rr;
      p[idx * 3 + 2] = gaussRand() * 0.4 + r * 0.1;
    }
  }
  for (let i = rings * perRing; i < shaped; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.5) * 1.2 * S;
    p[i * 3] = Math.cos(a) * r;
    p[i * 3 + 1] = Math.sin(a) * r;
    p[i * 3 + 2] = gaussRand() * 0.3;
  }
  for (let i = shaped; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (Math.random() * 2 + 0.5) * rings * 0.85 * S * 0.5;
    p[i * 3] = Math.cos(a) * r + gaussRand() * 0.8;
    p[i * 3 + 1] = Math.sin(a) * r + gaussRand() * 0.8;
    p[i * 3 + 2] = gaussRand() * 1.2;
  }
  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ── Search: magnifier ── */
export function generateMagnifier(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);
  const ambient = Math.floor(n * 0.08);
  const ring = Math.floor((n - ambient) * 0.48);
  const handle = Math.floor((n - ambient) * 0.14);
  const inner = n - ambient - ring - handle;
  let idx = 0;

  /* Crisper ring — tighter noise band */
  for (let i = 0; i < ring; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (3.0 + gaussRand() * 0.32) * S;
    p[idx * 3] = Math.cos(a) * r;
    p[idx * 3 + 1] = Math.sin(a) * r * 0.95 + 0.3 * S;
    p[idx * 3 + 2] = gaussRand() * 0.35;
    idx++;
  }
  /* Handle */
  for (let i = 0; i < handle; i++) {
    const t = Math.random();
    p[idx * 3] = (2.0 + t * 2.4) * S + gaussRand() * 0.14 * S;
    p[idx * 3 + 1] = (-2.0 - t * 2.4) * S + gaussRand() * 0.14 * S;
    p[idx * 3 + 2] = gaussRand() * 0.22;
    idx++;
  }
  /* Inner fill — sparse so the ring stays prominent */
  for (let i = 0; i < inner; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.55) * 2.2 * S;
    p[idx * 3] = Math.cos(a) * r;
    p[idx * 3 + 1] = Math.sin(a) * r * 0.95 + 0.3 * S;
    p[idx * 3 + 2] = gaussRand() * 0.4;
    idx++;
  }
  /* Halo */
  for (let i = idx; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (Math.random() * 2.5 + 0.5) * S;
    p[i * 3] = Math.cos(a) * r + gaussRand() * 1.0;
    p[i * 3 + 1] = Math.sin(a) * r * 0.95 + 0.3 * S + gaussRand() * 1.0;
    p[i * 3 + 2] = gaussRand() * 1.5;
  }
  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}
/* ═══════════════════════════════════════════════════════════════════════
   AISection — refined shape generators (v2)
   ───────────────────────────────────────────────────────────────────────
   Drop-in replacements for two functions in lib/shapes.js:

     1. generateCube       → industrial pallet rack with cross-bracing
     2. generateStockArrow → stock-chart-style ascending arrow with
                             characteristic dips, 3D thickness, chunky
                             arrowhead, NO ambient halo.

   Keep the existing function NAMES (so SHAPE_GENERATORS in AISection.jsx
   doesn't change). Find `export function generateCube(...)` and
   `export function generateStockArrow(...)` in lib/shapes.js and
   replace each function's body with the version below.

   Existing helpers used: S (= 2.2), gaussRand(), isoTransform(),
   shufflePositions(). These already exist at the top of lib/shapes.js
   and are unchanged.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Spatial: industrial pallet rack ──
   Real pallet racking. Tall + deep, not wide. Uneven shelf spacing
   (bottom levels taller for stacked pallets; upper levels tighter for
   case picks). Diagonal cross-bracing on the side panels — the X-pattern
   you'd see on real steel uprights. Four palletized loads distributed
   across the lower three levels.

   Allocation (of n total):
     posts          22%   six vertical uprights (3 columns × front/back)
     braces         15%   16 diagonal cross-braces (X-pattern on sides)
     shelves        38%   five horizontal beams, edges emphasized
     loads          22%   four pallets/cases on the lower three shelves
     ambient         3%   sparse halo to avoid clinical sterility
*/
export function generateCube(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  /* ── Rack dimensions ──
     Industrial proportions: total ~2.4S wide × 4.0S tall × 1.6S deep.
     Half-extents for math. */
  const W = 1.2 * S;
  const H = 2.0 * S;
  const D = 0.8 * S;

  const postXs = [-W, 0, W]; // 3 columns of posts
  const postZs = [-D, D]; // front and back

  /* ── Shelf Y positions — UNEVEN spacing ──
     Bottom gaps wider (for tall stacked pallets); upper gaps tighter
     (for case picks and display loads). Real warehouses load this way. */
  const shelfYs = [
    -H, // floor
    -H + 1.2 * S, // gap 1.20S — tall stacked pallets
    -H + 2.2 * S, // gap 1.00S — standard pallets
    -H + 3.0 * S, // gap 0.80S — case pick level
    -H + 4.0 * S, // top — gap 1.00S
  ];

  /* ── Allocations ── */
  const ambient = Math.floor(n * 0.03);
  const loadsN = Math.floor((n - ambient) * 0.22);
  const bracesN = Math.floor((n - ambient) * 0.15);
  const shelvesN = Math.floor((n - ambient) * 0.38);
  const postsN = n - ambient - loadsN - bracesN - shelvesN;

  let idx = 0;

  /* ═══════════════════════════════════════════════════════════════════
     POSTS — 6 vertical uprights
     ═══════════════════════════════════════════════════════════════════ */
  const postNoise = 0.04 * S;
  const perPost = Math.floor(postsN / 6);
  for (const px of postXs) {
    for (const pz of postZs) {
      for (let i = 0; i < perPost && idx < postsN; i++) {
        const t = Math.random();
        p[idx * 3] = px + gaussRand() * postNoise;
        p[idx * 3 + 1] = -H + t * (H * 2) + gaussRand() * postNoise * 0.3;
        p[idx * 3 + 2] = pz + gaussRand() * postNoise;
        idx++;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     CROSS-BRACING — diagonal X-pattern on the two SHORT sides
     ───────────────────────────────────────────────────────────────────
     For each shelf-to-shelf gap, on each short side (x=-W and x=W),
     draw two diagonal bars forming an X — one from (z=-D, y_bottom) to
     (z=+D, y_top), the other from (z=+D, y_bottom) to (z=-D, y_top).
     This is the bracing that gives industrial pallet racks their
     characteristic look from the side.
     ═══════════════════════════════════════════════════════════════════ */
  const braceNoise = 0.035 * S;
  const sideXs = [-W, W]; // left and right faces
  const gapCount = shelfYs.length - 1;
  const bracesTotal = sideXs.length * gapCount * 2; // 2 diagonals per gap
  const perBrace = Math.floor(bracesN / bracesTotal);

  for (const sx of sideXs) {
    for (let g = 0; g < gapCount; g++) {
      const yLo = shelfYs[g];
      const yHi = shelfYs[g + 1];

      /* Two diagonals: one from front-bottom to back-top, one from
         back-bottom to front-top. */
      const diagonals = [
        { z0: -D, z1: D },
        { z0: D, z1: -D },
      ];
      for (const diag of diagonals) {
        for (let i = 0; i < perBrace && idx < postsN + bracesN; i++) {
          const t = Math.random();
          p[idx * 3] = sx + gaussRand() * braceNoise;
          p[idx * 3 + 1] =
            yLo + t * (yHi - yLo) + gaussRand() * braceNoise * 0.4;
          p[idx * 3 + 2] =
            diag.z0 + t * (diag.z1 - diag.z0) + gaussRand() * braceNoise * 0.4;
          idx++;
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     SHELVES — 5 horizontal beams, edges emphasized
     ───────────────────────────────────────────────────────────────────
     Most particles on the front/back long edges so the shelves read as
     beams (lines), not slabs. Some surface fill for depth.
     ═══════════════════════════════════════════════════════════════════ */
  const shelfNoise = 0.035 * S;
  const perShelf = Math.floor(shelvesN / shelfYs.length);
  for (const sy of shelfYs) {
    const allocStart = idx;
    for (let i = 0; i < perShelf && idx < postsN + bracesN + shelvesN; i++) {
      const r = Math.random();
      let x, z;
      if (r < 0.55) {
        /* Front or back long edge — heaviest weight */
        x = -W + Math.random() * (W * 2);
        z = (Math.random() < 0.5 ? -D : D) + gaussRand() * 0.03 * S;
      } else if (r < 0.85) {
        /* Left or right short edge */
        x = (Math.random() < 0.5 ? -W : W) + gaussRand() * 0.03 * S;
        z = -D + Math.random() * (D * 2);
      } else {
        /* Sparse surface fill */
        x = -W + Math.random() * (W * 2);
        z = -D + Math.random() * (D * 2);
      }
      p[idx * 3] = x + gaussRand() * shelfNoise;
      p[idx * 3 + 1] = sy + gaussRand() * 0.02 * S;
      p[idx * 3 + 2] = z + gaussRand() * shelfNoise;
      idx++;
    }
    /* Avoid stray particles if integer division underfills the last shelf */
    if (sy === shelfYs[shelfYs.length - 1]) {
      while (idx < postsN + bracesN + shelvesN) {
        p[idx * 3] = -W + Math.random() * (W * 2);
        p[idx * 3 + 1] = sy + gaussRand() * 0.02 * S;
        p[idx * 3 + 2] = -D + Math.random() * (D * 2);
        idx++;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     LOADS — 4 palletized boxes on lower three shelves
     ───────────────────────────────────────────────────────────────────
     Each load is a clear rectangular box volume (NOT a fuzzy cluster).
     Particles distributed on box faces (edge-emphasized) so the load
     reads as a distinct object on the shelf, not a smear.
     ═══════════════════════════════════════════════════════════════════ */
  const loads = [
    /* Bottom shelf (largest gap) — two big stacked pallets */
    { cx: -W * 0.55, cy: shelfYs[0], cz: 0, w: 0.85, h: 1.05, d: D * 1.4 },
    { cx: W * 0.55, cy: shelfYs[0], cz: 0, w: 0.85, h: 1.05, d: D * 1.4 },
    /* Middle shelf — one centered pallet */
    { cx: 0, cy: shelfYs[1], cz: 0, w: 1.1, h: 0.85, d: D * 1.5 },
    /* Upper-middle shelf — one offset case load */
    { cx: -W * 0.45, cy: shelfYs[2], cz: 0, w: 0.7, h: 0.65, d: D * 1.2 },
  ];

  const loadEdgeWeight = 0.55; // 55% of load particles on edges, rest in volume
  const loadNoise = 0.025 * S;
  const perLoad = Math.floor(loadsN / loads.length);

  for (let l = 0; l < loads.length; l++) {
    const ld = loads[l];
    /* Shift Y so load SITS ON the shelf (cy is shelf surface) */
    const yBase = ld.cy + 0.04 * S;
    const yTop = yBase + ld.h;
    const xMin = ld.cx - ld.w * 0.5;
    const xMax = ld.cx + ld.w * 0.5;
    const zMin = ld.cz - ld.d * 0.5;
    const zMax = ld.cz + ld.d * 0.5;

    const lastLoad = l === loads.length - 1;
    const limit = lastLoad
      ? postsN + bracesN + shelvesN + loadsN
      : Math.min(postsN + bracesN + shelvesN + loadsN, idx + perLoad);

    while (idx < limit) {
      const onEdge = Math.random() < loadEdgeWeight;
      let x, y, z;
      if (onEdge) {
        /* Pick an edge of the box */
        const face = Math.floor(Math.random() * 4);
        if (face === 0) {
          x = xMin + Math.random() * ld.w;
          y = yBase + Math.random() * ld.h;
          z = Math.random() < 0.5 ? zMin : zMax;
        } else if (face === 1) {
          x = Math.random() < 0.5 ? xMin : xMax;
          y = yBase + Math.random() * ld.h;
          z = zMin + Math.random() * ld.d;
        } else if (face === 2) {
          x = xMin + Math.random() * ld.w;
          y = Math.random() < 0.5 ? yBase : yTop;
          z = zMin + Math.random() * ld.d;
        } else {
          /* corner-ish: pick a random vertical edge */
          x = Math.random() < 0.5 ? xMin : xMax;
          y = yBase + Math.random() * ld.h;
          z = Math.random() < 0.5 ? zMin : zMax;
        }
      } else {
        x = xMin + Math.random() * ld.w;
        y = yBase + Math.random() * ld.h;
        z = zMin + Math.random() * ld.d;
      }
      p[idx * 3] = x + gaussRand() * loadNoise;
      p[idx * 3 + 1] = y + gaussRand() * loadNoise;
      p[idx * 3 + 2] = z + gaussRand() * loadNoise;
      idx++;
    }
  }

  /* ─── AMBIENT — very sparse halo ─────────────────────────────────── */
  for (let i = idx; i < n; i++) {
    p[i * 3] = gaussRand() * W * 1.4;
    p[i * 3 + 1] = gaussRand() * H * 1.3;
    p[i * 3 + 2] = gaussRand() * D * 1.6;
  }

  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ── Analytics: stock-chart-style ascending arrow ──
   Multi-segment line that climbs to the upper-right with two
   characteristic pullbacks — the shape of a "stock chart with the
   arrow at the end" rather than a generic 3D arrow. Each segment is
   a 3D tube with circular cross-section. A chunky arrowhead caps the
   final segment.

   NO ambient halo. Every particle is on the chart line, on the head,
   or in the small joint clusters where segments meet.

   Five segments forming a stock chart shape:
     P0 → P1   start to first peak (rising)
     P1 → P2   small pullback
     P2 → P3   bigger rally
     P3 → P4   small pullback
     P4 → P5   final breakout to the tip (where the arrowhead sits)

   Allocation:
     segments  60%   distributed by segment length
     head      32%   two barbs + triangular fill at the tip
     joints     8%   small focal clusters at each elbow
*/
export function generateStockArrow(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  /* Chart line vertices, pre-S coords. Designed to read as a stock
     chart: generally up + to the right, two small pullbacks between
     the rallies. The final segment ends at the tip where the
     arrowhead extends from. */
  const pts = [
    [-3.0, -2.2], // P0  start
    [-1.5, -0.8], // P1  first peak
    [-0.7, -1.3], // P2  pullback ~0.5 below P1
    [0.5, 0.8], // P3  big rally
    [1.3, 0.4], // P4  pullback ~0.4 below P3
    [2.3, 2.0], // P5  tip — arrowhead extends from here
  ];

  /* Compute segment lengths so particles distribute proportionally
     (each segment gets a share of segment-budget equal to its share
     of total chart length). */
  const segLens = [];
  let totalLen = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    const len = Math.sqrt(dx * dx + dy * dy);
    segLens.push(len);
    totalLen += len;
  }

  /* Final segment direction → arrowhead orientation */
  const lastIdx = pts.length - 2;
  const finalDx = pts[lastIdx + 1][0] - pts[lastIdx][0];
  const finalDy = pts[lastIdx + 1][1] - pts[lastIdx][1];
  const finalLen = segLens[lastIdx];
  const fNdx = finalDx / finalLen;
  const fNdy = finalDy / finalLen;

  /* Tip is the last point. Arrowhead barbs flare BACK from the tip
     at ±headAngle off the final segment's direction. */
  const tipX = pts[pts.length - 1][0];
  const tipY = pts[pts.length - 1][1];
  const headAngle = Math.PI / 6; // 30° each side
  const headLen = 1.45;

  /* Compute barb direction vectors by rotating (-fNdx, -fNdy) by
     ±headAngle. */
  const cosHA = Math.cos(headAngle);
  const sinHA = Math.sin(headAngle);
  const lDx = -fNdx * cosHA - -fNdy * sinHA;
  const lDy = -fNdx * sinHA + -fNdy * cosHA;
  const rDx = -fNdx * cosHA + -fNdy * sinHA;
  const rDy = fNdx * sinHA + -fNdy * cosHA;

  /* Tube radii — slightly chunky for chart presence */
  const shaftR = 0.13;
  const depthR = 0.13;

  /* Allocations */
  const segmentsN = Math.floor(n * 0.6);
  const headN = Math.floor(n * 0.32);
  const jointsN = n - segmentsN - headN;

  let idx = 0;

  /* ═══════════════════════════════════════════════════════════════════
     SEGMENTS — distribute proportional to length
     ═══════════════════════════════════════════════════════════════════ */
  const segNoise = 0.018 * S;
  for (let s = 0; s < segLens.length; s++) {
    const segShare = Math.floor((segLens[s] / totalLen) * segmentsN);
    const [x0, y0] = pts[s];
    const [x1, y1] = pts[s + 1];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = segLens[s];
    const ndx = dx / len;
    const ndy = dy / len;
    /* perpendicular in 2D plane */
    const ppx = -ndy;
    const ppy = ndx;

    const limit = Math.min(idx + segShare, segmentsN);
    while (idx < limit) {
      const t = Math.random();
      const baseX = x0 + dx * t;
      const baseY = y0 + dy * t;

      /* 3D tube: random angle around segment axis + radial distance */
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.5);
      const cIn = Math.cos(a) * r * shaftR;
      const cOut = Math.sin(a) * r * depthR;

      p[idx * 3] = (baseX + ppx * cIn) * S + gaussRand() * segNoise;
      p[idx * 3 + 1] = (baseY + ppy * cIn) * S + gaussRand() * segNoise;
      p[idx * 3 + 2] = cOut * S + gaussRand() * segNoise;
      idx++;
    }
  }

  /* Fill any remainder in the last segment (avoid orphan particles
     when integer division leaves a few). */
  while (idx < segmentsN) {
    const [x0, y0] = pts[pts.length - 2];
    const [x1, y1] = pts[pts.length - 1];
    const t = Math.random();
    p[idx * 3] = (x0 + (x1 - x0) * t) * S + gaussRand() * segNoise;
    p[idx * 3 + 1] = (y0 + (y1 - y0) * t) * S + gaussRand() * segNoise;
    p[idx * 3 + 2] = gaussRand() * depthR * S;
    idx++;
  }

  /* ═══════════════════════════════════════════════════════════════════
     HEAD — two 3D-thick barbs + small triangular fill between them
     ═══════════════════════════════════════════════════════════════════ */
  const barbNoise = 0.02 * S;
  const headPerBarb = Math.floor(headN * 0.4);
  const headFill = headN - headPerBarb * 2;

  /* Two barbs (tubes) */
  const barbs = [
    { dx: lDx, dy: lDy },
    { dx: rDx, dy: rDy },
  ];
  for (const b of barbs) {
    const bPpx = -b.dy;
    const bPpy = b.dx;
    for (let i = 0; i < headPerBarb && idx < segmentsN + headN; i++) {
      /* Sqrt-distributed t → denser near the tip (where the head reads
         as solid), tapering toward the barb end. */
      const t = Math.sqrt(Math.random());
      const baseX = tipX + b.dx * headLen * t;
      const baseY = tipY + b.dy * headLen * t;
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.55) * (1 - t * 0.5);
      const cIn = Math.cos(a) * r * shaftR * 0.95;
      const cOut = Math.sin(a) * r * depthR * 0.95;
      p[idx * 3] = (baseX + bPpx * cIn) * S + gaussRand() * barbNoise;
      p[idx * 3 + 1] = (baseY + bPpy * cIn) * S + gaussRand() * barbNoise;
      p[idx * 3 + 2] = cOut * S + gaussRand() * barbNoise;
      idx++;
    }
  }

  /* Triangular fill between the two barbs — gives the head SOLIDITY
     so it reads as a chunky head, not just two thin lines.
     Points: barycentric-ish triangle (tip + halfway down each barb). */
  const fillBarbT = 0.7; // how far back from tip the triangle base reaches
  const lEnd = [
    tipX + lDx * headLen * fillBarbT,
    tipY + lDy * headLen * fillBarbT,
  ];
  const rEnd = [
    tipX + rDx * headLen * fillBarbT,
    tipY + rDy * headLen * fillBarbT,
  ];

  for (let i = 0; i < headFill && idx < segmentsN + headN; i++) {
    /* Random barycentric coords for a point inside the triangle */
    let u = Math.random();
    let v = Math.random();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    const w = 1 - u - v;
    const x = u * tipX + v * lEnd[0] + w * rEnd[0];
    const y = u * tipY + v * lEnd[1] + w * rEnd[1];
    const z = gaussRand() * depthR * S * 0.9;
    p[idx * 3] = x * S + gaussRand() * barbNoise * 0.6;
    p[idx * 3 + 1] = y * S + gaussRand() * barbNoise * 0.6;
    p[idx * 3 + 2] = z;
    idx++;
  }

  /* ═══════════════════════════════════════════════════════════════════
     JOINT CLUSTERS — small focal dots at each elbow
     ───────────────────────────────────────────────────────────────────
     One small particle cluster at each interior vertex (where two
     segments meet) so the elbows read as "points" not just creases.
     ═══════════════════════════════════════════════════════════════════ */
  const interiorJoints = pts.length - 2; // exclude start and tip
  const perJoint = Math.floor(jointsN / interiorJoints);
  const jointNoise = 0.06 * S;
  for (let j = 1; j < pts.length - 1; j++) {
    const [jx, jy] = pts[j];
    const lastJoint = j === pts.length - 2;
    const limit = lastJoint ? n : Math.min(n, idx + perJoint);
    while (idx < limit) {
      p[idx * 3] = jx * S + gaussRand() * jointNoise;
      p[idx * 3 + 1] = jy * S + gaussRand() * jointNoise;
      p[idx * 3 + 2] = gaussRand() * depthR * S * 0.8;
      idx++;
    }
  }

  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}
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
