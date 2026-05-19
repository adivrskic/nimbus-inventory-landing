/* ──────────────────────────────────────────────────────────────────────────
   lib/shapes.js
   ──────────────────────────────────────────────────────────────────────────
   Particle-position generators for the AI section. Each generator returns
   a Float32Array of length n*3 (xyz interleaved) describing one shape.
   The AISection animate loop lerps between the "scattered" cloud (below)
   and the active shape based on scroll progress.

   All shapes share the S scale, gaussRand helper, and shufflePositions
   (which destroys index↔feature correlation so particles don't stream
   into ring 0 first, ring 1 second, etc).
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

/* ── generateScattered ──
   Bounding box for the unformed particle cloud. Particles drift through
   this volume when sFormation is low (transitions between shapes, or
   the very start/end of a section's scroll block).

   Ranges tightened from the previous (30 × 18 × 38) — the wider field
   meant particles flung outward visibly during the brief moments when
   sFormation dipped to 0 between consecutive shapes, which read as
   "exploding" rather than "drifting". The current values keep the cloud
   close enough to the shape's world position that transitions feel like
   the particles are reorganizing in place, not scattering across the
   screen. Mobile gets a proportionally smaller box so the cloud still
   fits inside the narrower viewport without crowding the text cards. */
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

function gaussRand() {
  const u = 1 - Math.random(),
    v = Math.random();
  return Math.max(
    -3,
    Math.min(3, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))
  );
}

/* ── Voice: 3D dome of sound rings ──
   Concentric rings bowed into a satellite-dish curve — outer rings sit
   further back in z, so the form reads as a real 3D dome rather than
   a flat 2D sticker. Radial spokes converge from the outer rings to a
   bright "source" cluster at the center.
*/
export function generateSoundRings(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  const ringN = Math.floor(n * 0.5);
  const spokeN = Math.floor(n * 0.18);
  const sourceN = Math.floor(n * 0.08);
  /* ambient = ~24% remainder */

  const numRings = 6;
  const ringPad = Math.floor(ringN / numRings);
  const numSpokes = 14;
  const outerR = (1.0 + (numRings - 1) * 0.85) * S;
  const domeDepth = 1.7 * S;

  let idx = 0;

  /* ─── DOME RINGS ─────────────────────────────────────────────── */
  for (let r = 0; r < numRings; r++) {
    const radius = (1.0 + r * 0.85) * S;
    const thickness = (0.16 + r * 0.025) * S;
    const t = r / (numRings - 1);
    const zBase = -Math.pow(t, 1.4) * domeDepth;
    const limit = r === numRings - 1 ? ringN : (r + 1) * ringPad;
    while (idx < limit) {
      const a = Math.random() * Math.PI * 2;
      const rr = radius + gaussRand() * thickness * 0.4;
      p[idx * 3] = Math.cos(a) * rr;
      p[idx * 3 + 1] = Math.sin(a) * rr;
      p[idx * 3 + 2] = zBase + gaussRand() * 0.1 * S;
      idx++;
    }
  }

  /* ─── RADIAL SPOKES — center → outer rim, hugging the dome ──── */
  const perSpoke = Math.floor(spokeN / numSpokes);
  for (let s = 0; s < numSpokes; s++) {
    const angle = (s / numSpokes) * Math.PI * 2;
    const cs = Math.cos(angle);
    const sn = Math.sin(angle);
    const limit =
      s === numSpokes - 1 ? ringN + spokeN : ringN + (s + 1) * perSpoke;
    while (idx < limit) {
      const u = Math.pow(Math.random(), 0.7);
      const r = u * outerR;
      const t = r / outerR;
      const zBase = -Math.pow(t, 1.4) * domeDepth;
      p[idx * 3] = cs * r + gaussRand() * 0.05 * S;
      p[idx * 3 + 1] = sn * r + gaussRand() * 0.05 * S;
      p[idx * 3 + 2] = zBase + gaussRand() * 0.07 * S;
      idx++;
    }
  }

  /* ─── SOURCE — bright cluster at the dome's apex ──────────────── */
  for (let i = 0; i < sourceN; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.35) * 0.45 * S;
    p[idx * 3] = Math.cos(a) * r + gaussRand() * 0.04 * S;
    p[idx * 3 + 1] = Math.sin(a) * r + gaussRand() * 0.04 * S;
    p[idx * 3 + 2] = 0.3 * S + gaussRand() * 0.1 * S;
    idx++;
  }

  /* ─── AMBIENT HALO ────────────────────────────────────────────── */
  for (let i = idx; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (Math.random() * 2 + 0.5) * outerR * 0.5;
    p[i * 3] = Math.cos(a) * r + gaussRand() * 0.8;
    p[i * 3 + 1] = Math.sin(a) * r + gaussRand() * 0.8;
    p[i * 3 + 2] = gaussRand() * 1.2;
  }

  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ── Search: 3D magnifier ──
   A real volumetric magnifying glass — the lens has thickness (front
   rim, back rim, cylindrical edge), and the handle is a cylinder
   rather than a flat line.
*/
export function generateMagnifier(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  const lensFrontN = Math.floor(n * 0.2);
  const lensBackN = Math.floor(n * 0.16);
  const lensSideN = Math.floor(n * 0.08);
  const handleN = Math.floor(n * 0.22);
  const innerGridN = Math.floor(n * 0.1);
  const innerFillN = Math.floor(n * 0.12);
  /* ambient = ~12% remainder */

  const lensR = 3.0 * S;
  const lensThickness = 0.42 * S;
  const lensCenterY = 0.3 * S;
  const lensCenterX = 0;

  let idx = 0;

  /* ─── LENS FRONT RIM ─────────────────────────────────────────── */
  for (let i = 0; i < lensFrontN; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = lensR + gaussRand() * 0.22 * S;
    p[idx * 3] = lensCenterX + Math.cos(a) * r;
    p[idx * 3 + 1] = lensCenterY + Math.sin(a) * r * 0.95;
    p[idx * 3 + 2] = lensThickness / 2 + gaussRand() * 0.08 * S;
    idx++;
  }

  /* ─── LENS BACK RIM ───────────────────────────────────────────── */
  for (let i = 0; i < lensBackN; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = lensR + gaussRand() * 0.22 * S;
    p[idx * 3] = lensCenterX + Math.cos(a) * r;
    p[idx * 3 + 1] = lensCenterY + Math.sin(a) * r * 0.95;
    p[idx * 3 + 2] = -lensThickness / 2 + gaussRand() * 0.08 * S;
    idx++;
  }

  /* ─── LENS SIDE ──────────────────────────────────────────────── */
  for (let i = 0; i < lensSideN; i++) {
    const a = Math.random() * Math.PI * 2;
    const z = (Math.random() - 0.5) * lensThickness;
    p[idx * 3] = lensCenterX + Math.cos(a) * lensR;
    p[idx * 3 + 1] = lensCenterY + Math.sin(a) * lensR * 0.95;
    p[idx * 3 + 2] = z + gaussRand() * 0.04 * S;
    idx++;
  }

  /* ─── HANDLE — 3D cylinder ──────────────────────────────────── */
  const handleAngle = -Math.PI / 4;
  const handleDirX = Math.cos(handleAngle);
  const handleDirY = Math.sin(handleAngle);
  const handleStartX = lensCenterX + handleDirX * lensR;
  const handleStartY = lensCenterY + handleDirY * lensR;
  const handleLen = 2.6 * S;
  const handleR = 0.18 * S;
  const perpX = -handleDirY;
  const perpY = handleDirX;
  for (let i = 0; i < handleN; i++) {
    const t = Math.random();
    const a = Math.random() * Math.PI * 2;
    const baseX = handleStartX + handleDirX * t * handleLen;
    const baseY = handleStartY + handleDirY * t * handleLen;
    const offRadial = Math.cos(a) * handleR;
    const offZ = Math.sin(a) * handleR;
    p[idx * 3] = baseX + perpX * offRadial + gaussRand() * 0.03 * S;
    p[idx * 3 + 1] = baseY + perpY * offRadial + gaussRand() * 0.03 * S;
    p[idx * 3 + 2] = offZ + gaussRand() * 0.03 * S;
    idx++;
  }

  /* ─── INNER GRID — crosshair inside the lens ─────────────────── */
  const innerGridLen = lensR * 0.85;
  for (let i = 0; i < innerGridN; i++) {
    const isHorz = i % 2 === 0;
    const t = (Math.random() - 0.5) * 2 * innerGridLen;
    if (isHorz) {
      p[idx * 3] = lensCenterX + t + gaussRand() * 0.04 * S;
      p[idx * 3 + 1] = lensCenterY + gaussRand() * 0.04 * S;
    } else {
      p[idx * 3] = lensCenterX + gaussRand() * 0.04 * S;
      p[idx * 3 + 1] = lensCenterY + t + gaussRand() * 0.04 * S;
    }
    p[idx * 3 + 2] = gaussRand() * 0.06 * S;
    idx++;
  }

  /* ─── INNER FILL — sparse glass surface ──────────────────────── */
  for (let i = 0; i < innerFillN; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.55) * lensR * 0.9;
    p[idx * 3] = lensCenterX + Math.cos(a) * r;
    p[idx * 3 + 1] = lensCenterY + Math.sin(a) * r * 0.95;
    p[idx * 3 + 2] = gaussRand() * 0.12 * S;
    idx++;
  }

  /* ─── AMBIENT HALO ───────────────────────────────────────────── */
  for (let i = idx; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (Math.random() * 2.5 + 0.5) * S;
    p[i * 3] = lensCenterX + Math.cos(a) * r + gaussRand() * 1.0;
    p[i * 3 + 1] = lensCenterY + Math.sin(a) * r * 0.95 + gaussRand() * 1.0;
    p[i * 3 + 2] = gaussRand() * 1.2;
  }

  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ── Spatial: clean six-faced cube ──
   12 edges form the wireframe silhouette, sparse particle fill across
   the 6 faces gives the form some volume. Corners are just where edges
   meet — no extra vertex clusters (those created the bulgy "weird"
   corner blobs in the previous version).

   Allocation:
     edges   60%   12 edges of the cube (the dominant silhouette)
     faces   32%   sparse particle fill across the 6 faces
     ambient  8%   sparse halo
*/
export function generateCube(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  /* Half-extent — cube spans ±half on every axis. */
  const half = 1.5 * S;

  /* Eight cube vertices. Order: bottom four (CCW from origin corner),
     then top four (same order). */
  const verts = [
    [-half, -half, -half], // 0
    [+half, -half, -half], // 1
    [+half, -half, +half], // 2
    [-half, -half, +half], // 3
    [-half, +half, -half], // 4
    [+half, +half, -half], // 5
    [+half, +half, +half], // 6
    [-half, +half, +half], // 7
  ];

  /* Twelve edges as vertex index pairs. */
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0], // bottom rim
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4], // top rim
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7], // vertical pillars
  ];

  /* Six faces — each locks one axis at ±half and samples the other
     two uniformly. */
  const faces = [
    { axis: 1, sign: -1 }, // bottom (y = -half)
    { axis: 1, sign: +1 }, // top (y = +half)
    { axis: 2, sign: -1 }, // front (z = -half)
    { axis: 2, sign: +1 }, // back (z = +half)
    { axis: 0, sign: -1 }, // left (x = -half)
    { axis: 0, sign: +1 }, // right (x = +half)
  ];

  const edgesN = Math.floor(n * 0.6);
  const facesN = Math.floor(n * 0.32);
  /* ambient = ~8% remainder */

  let idx = 0;

  /* ─── EDGES ──────────────────────────────────────────────────── */
  const perEdge = Math.floor(edgesN / 12);
  for (let e = 0; e < 12; e++) {
    const v1 = verts[edges[e][0]];
    const v2 = verts[edges[e][1]];
    const limit = e === 11 ? edgesN : (e + 1) * perEdge;
    while (idx < limit) {
      const t = Math.random();
      p[idx * 3] = v1[0] + (v2[0] - v1[0]) * t + gaussRand() * 0.03 * S;
      p[idx * 3 + 1] = v1[1] + (v2[1] - v1[1]) * t + gaussRand() * 0.03 * S;
      p[idx * 3 + 2] = v1[2] + (v2[2] - v1[2]) * t + gaussRand() * 0.03 * S;
      idx++;
    }
  }

  /* ─── FACES — sparse fill on each of the 6 faces ─────────────
     Each face is an axis-aligned square. Lock one coordinate to ±half
     and sample the other two uniformly across [-half, +half]. Small
     gaussian noise on the locked axis gives the face surface a hint
     of thickness rather than being mathematically flat. */
  const faceBase = edgesN;
  const perFace = Math.floor(facesN / 6);
  for (let f = 0; f < 6; f++) {
    const face = faces[f];
    const lockedVal = face.sign * half;
    const limit = f === 5 ? faceBase + facesN : faceBase + (f + 1) * perFace;
    while (idx < limit) {
      const u = (Math.random() - 0.5) * 2 * half;
      const v = (Math.random() - 0.5) * 2 * half;
      let x, y, z;
      if (face.axis === 0) {
        x = lockedVal;
        y = u;
        z = v;
      } else if (face.axis === 1) {
        y = lockedVal;
        x = u;
        z = v;
      } else {
        z = lockedVal;
        x = u;
        y = v;
      }
      p[idx * 3] = x + gaussRand() * 0.04 * S;
      p[idx * 3 + 1] = y + gaussRand() * 0.04 * S;
      p[idx * 3 + 2] = z + gaussRand() * 0.04 * S;
      idx++;
    }
  }

  /* ─── AMBIENT HALO ───────────────────────────────────────────── */
  for (let i = idx; i < n; i++) {
    p[i * 3] = gaussRand() * half * 1.5;
    p[i * 3 + 1] = gaussRand() * half * 1.5;
    p[i * 3 + 2] = gaussRand() * half * 1.5;
  }

  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ── Analytics: 3D bars + trend line + ground rails ──
   Eight ascending bars with a mid-series pullback, augmented with a
   smooth trend line curving across the bar tops and a faint pair of
   ground rails below.
*/
export function generateStockArrow(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  const heights = [0.8, 1.3, 1.8, 1.3, 2.1, 2.6, 2.1, 3.1];
  const numBars = heights.length;

  const barW = 0.42 * S;
  const barD = 0.42 * S;
  const gap = 0.18 * S;
  const totalW = numBars * barW + (numBars - 1) * gap;
  const startX = -totalW / 2 + barW / 2;
  const yFloor = -1.6 * S;

  const bars = [];
  for (let i = 0; i < numBars; i++) {
    const cx = startX + i * (barW + gap);
    const h = heights[i] * S;
    bars.push({
      cx,
      xMin: cx - barW / 2,
      xMax: cx + barW / 2,
      zMin: -barD / 2,
      zMax: barD / 2,
      yMin: yFloor,
      yMax: yFloor + h,
      yTop: yFloor + h,
    });
  }

  const edgesN = Math.floor(n * 0.36);
  const topsN = Math.floor(n * 0.18);
  const bodiesN = Math.floor(n * 0.2);
  const trendN = Math.floor(n * 0.12);
  const gridN = Math.floor(n * 0.08);
  /* ambient = ~6% remainder */

  let idx = 0;

  /* ─── EDGES — four vertical edges per bar ─────────────────────── */
  const perBarEdges = Math.floor(edgesN / numBars);
  const perEdge = Math.floor(perBarEdges / 4);
  for (let bi = 0; bi < numBars; bi++) {
    const b = bars[bi];
    const corners = [
      [b.xMin, b.zMin],
      [b.xMax, b.zMin],
      [b.xMax, b.zMax],
      [b.xMin, b.zMax],
    ];
    for (let e = 0; e < 4; e++) {
      const isLast = bi === numBars - 1 && e === 3;
      const limit = isLast ? edgesN : Math.min(edgesN, idx + perEdge);
      while (idx < limit) {
        const t = Math.random();
        p[idx * 3] = corners[e][0] + gaussRand() * 0.035 * S;
        p[idx * 3 + 1] =
          b.yMin + t * (b.yMax - b.yMin) + gaussRand() * 0.035 * S;
        p[idx * 3 + 2] = corners[e][1] + gaussRand() * 0.035 * S;
        idx++;
      }
    }
  }

  /* ─── TOPS — perimeter (70%) + sparse face fill (30%) ────────── */
  const perBarTop = Math.floor(topsN / numBars);
  for (let bi = 0; bi < numBars; bi++) {
    const b = bars[bi];
    const limit =
      bi === numBars - 1 ? edgesN + topsN : edgesN + (bi + 1) * perBarTop;
    while (idx < limit) {
      if (Math.random() < 0.7) {
        const edge = Math.floor(Math.random() * 4);
        let x, z;
        if (edge === 0) {
          x = b.xMin + Math.random() * barW;
          z = b.zMin;
        } else if (edge === 1) {
          x = b.xMax;
          z = b.zMin + Math.random() * barD;
        } else if (edge === 2) {
          x = b.xMin + Math.random() * barW;
          z = b.zMax;
        } else {
          x = b.xMin;
          z = b.zMin + Math.random() * barD;
        }
        p[idx * 3] = x + gaussRand() * 0.04 * S;
        p[idx * 3 + 1] = b.yMax + gaussRand() * 0.03 * S;
        p[idx * 3 + 2] = z + gaussRand() * 0.04 * S;
      } else {
        p[idx * 3] = b.xMin + Math.random() * barW;
        p[idx * 3 + 1] = b.yMax + gaussRand() * 0.05 * S;
        p[idx * 3 + 2] = b.zMin + Math.random() * barD;
      }
      idx++;
    }
  }

  /* ─── BODIES — sparse fill across the four side faces ────────── */
  const perBarBody = Math.floor(bodiesN / numBars);
  for (let bi = 0; bi < numBars; bi++) {
    const b = bars[bi];
    const limit =
      bi === numBars - 1
        ? edgesN + topsN + bodiesN
        : edgesN + topsN + (bi + 1) * perBarBody;
    while (idx < limit) {
      const face = Math.floor(Math.random() * 4);
      let x, z;
      const y = b.yMin + Math.random() * (b.yMax - b.yMin);
      if (face === 0) {
        x = b.xMin + Math.random() * barW;
        z = b.zMin;
      } else if (face === 1) {
        x = b.xMax;
        z = b.zMin + Math.random() * barD;
      } else if (face === 2) {
        x = b.xMin + Math.random() * barW;
        z = b.zMax;
      } else {
        x = b.xMin;
        z = b.zMin + Math.random() * barD;
      }
      p[idx * 3] = x + gaussRand() * 0.05 * S;
      p[idx * 3 + 1] = y + gaussRand() * 0.05 * S;
      p[idx * 3 + 2] = z + gaussRand() * 0.05 * S;
      idx++;
    }
  }

  /* ─── TREND LINE — smooth curve across the bar tops ─────────── */
  const trendEnd = idx + trendN;
  const lastBar = numBars - 1;
  while (idx < trendEnd) {
    const u = Math.random() * lastBar;
    const i0 = Math.floor(u);
    const i1 = Math.min(lastBar, i0 + 1);
    const f = u - i0;
    const fs = f * f * (3 - 2 * f);
    const x = bars[i0].cx + (bars[i1].cx - bars[i0].cx) * f;
    const y = bars[i0].yTop + (bars[i1].yTop - bars[i0].yTop) * fs;
    p[idx * 3] = x + gaussRand() * 0.035 * S;
    p[idx * 3 + 1] = y + 0.22 * S + gaussRand() * 0.04 * S;
    p[idx * 3 + 2] = gaussRand() * 0.04 * S;
    idx++;
  }

  /* ─── GROUND RAILS — front + back rails on the floor ────────── */
  const railZA = -barD / 2 - gap;
  const railZB = barD / 2 + gap;
  const railLen = totalW * 1.05;
  const gridEnd = idx + gridN;
  while (idx < gridEnd) {
    const r = Math.random();
    if (r < 0.4) {
      p[idx * 3] = (Math.random() - 0.5) * railLen + gaussRand() * 0.025 * S;
      p[idx * 3 + 1] = yFloor - 0.04 * S + gaussRand() * 0.025 * S;
      p[idx * 3 + 2] = railZB + gaussRand() * 0.03 * S;
    } else if (r < 0.8) {
      p[idx * 3] = (Math.random() - 0.5) * railLen + gaussRand() * 0.025 * S;
      p[idx * 3 + 1] = yFloor - 0.04 * S + gaussRand() * 0.025 * S;
      p[idx * 3 + 2] = railZA + gaussRand() * 0.03 * S;
    } else {
      p[idx * 3] = (Math.random() - 0.5) * railLen;
      p[idx * 3 + 1] = yFloor - 0.04 * S + gaussRand() * 0.03 * S;
      p[idx * 3 + 2] = railZA + Math.random() * (railZB - railZA);
    }
    idx++;
  }

  /* ─── AMBIENT — sparse halo, biased slightly upward ──────────── */
  for (let i = idx; i < n; i++) {
    p[i * 3] = gaussRand() * totalW * 0.6;
    p[i * 3 + 1] = gaussRand() * 1.5 * S + 0.3 * S;
    p[i * 3 + 2] = gaussRand() * barD * 1.5;
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
