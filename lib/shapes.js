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

/* ── Spatial: 3D wireframe cube ──
   Heavy on edges with tight noise, reinforced corners, sparse face dust
   for depth. Reads as architecture, not a fuzzy box.

   Allocation (out of n - ambient):
     edges     70%   the 12 edges of the cube, low noise
     corners   18%   8 vertex clusters
     faces      8%   thin face dust for depth
     ambient    4%   sparse halo around the cube */
export function generateCube(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);
  const size = 3.2 * S;
  const h = size / 2;

  const ambient = Math.floor(n * 0.04);
  const edgeN = Math.floor((n - ambient) * 0.7);
  const cornerN = Math.floor((n - ambient) * 0.18);
  const faceN = n - ambient - edgeN - cornerN;

  /* Build the 12 edges as endpoint pairs */
  const edges = [];
  for (const y of [-1, 1])
    for (const z of [-1, 1])
      edges.push([
        [-1, y, z],
        [1, y, z],
      ]);
  for (const x of [-1, 1])
    for (const z of [-1, 1])
      edges.push([
        [x, -1, z],
        [x, 1, z],
      ]);
  for (const x of [-1, 1])
    for (const y of [-1, 1])
      edges.push([
        [x, y, -1],
        [x, y, 1],
      ]);

  const edgeNoise = 0.05 * S;
  const perEdge = Math.floor(edgeN / 12);
  let idx = 0;

  for (const [a, b] of edges) {
    for (let i = 0; i < perEdge && idx < edgeN; i++) {
      const t = Math.random();
      p[idx * 3] = (a[0] + (b[0] - a[0]) * t) * h + gaussRand() * edgeNoise;
      p[idx * 3 + 1] = (a[1] + (b[1] - a[1]) * t) * h + gaussRand() * edgeNoise;
      p[idx * 3 + 2] = (a[2] + (b[2] - a[2]) * t) * h + gaussRand() * edgeNoise;
      idx++;
    }
  }

  /* 8 corners — tight clusters that look like reinforced vertices */
  const corners = [];
  for (const x of [-1, 1])
    for (const y of [-1, 1]) for (const z of [-1, 1]) corners.push([x, y, z]);

  const cornerNoise = 0.11 * S;
  const perCorner = Math.floor(cornerN / 8);
  for (const c of corners) {
    for (let i = 0; i < perCorner && idx < edgeN + cornerN; i++) {
      p[idx * 3] = c[0] * h + gaussRand() * cornerNoise;
      p[idx * 3 + 1] = c[1] * h + gaussRand() * cornerNoise;
      p[idx * 3 + 2] = c[2] * h + gaussRand() * cornerNoise;
      idx++;
    }
  }

  /* Sparse face dust so the cube reads as solid from face-on angles
     without softening the wireframe. */
  const faceNoise = 0.08 * S;
  for (let i = 0; i < faceN && idx < n - ambient; i++) {
    const face = Math.floor(Math.random() * 6);
    const u = (Math.random() - 0.5) * 1.85;
    const v = (Math.random() - 0.5) * 1.85;
    switch (face) {
      case 0:
        p[idx * 3] = h + gaussRand() * faceNoise;
        p[idx * 3 + 1] = u * h;
        p[idx * 3 + 2] = v * h;
        break;
      case 1:
        p[idx * 3] = -h + gaussRand() * faceNoise;
        p[idx * 3 + 1] = u * h;
        p[idx * 3 + 2] = v * h;
        break;
      case 2:
        p[idx * 3] = u * h;
        p[idx * 3 + 1] = h + gaussRand() * faceNoise;
        p[idx * 3 + 2] = v * h;
        break;
      case 3:
        p[idx * 3] = u * h;
        p[idx * 3 + 1] = -h + gaussRand() * faceNoise;
        p[idx * 3 + 2] = v * h;
        break;
      case 4:
        p[idx * 3] = u * h;
        p[idx * 3 + 1] = v * h;
        p[idx * 3 + 2] = h + gaussRand() * faceNoise;
        break;
      case 5:
        p[idx * 3] = u * h;
        p[idx * 3 + 1] = v * h;
        p[idx * 3 + 2] = -h + gaussRand() * faceNoise;
        break;
    }
    idx++;
  }

  /* Sparse halo around the cube */
  for (let i = idx; i < n; i++) {
    p[i * 3] = gaussRand() * h * 1.3;
    p[i * 3 + 1] = gaussRand() * h * 1.3;
    p[i * 3 + 2] = gaussRand() * h * 1.3;
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

/* ── Analytics: stock-chart arrow ──
   A 9-segment line ascending left-to-right with several dips, capped
   with an arrowhead that points along the final segment's direction.
   Reads as a forecast / trend signal — much clearer than a bar chart
   for "predictive analytics."

   Allocation (out of n - ambient):
     line     78%   the trend line, distributed by segment length
     arrow    22%   two arms forming the arrowhead at the tip */
export function generateStockArrow(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  /* Control points for the line. Overall trend up-and-right with
     four dips along the way. Last point is the arrow tip. */
  const line = [
    [-3.6, -2.4],
    [-2.9, -0.8],
    [-2.3, -1.6], // dip 1
    [-1.5, 0.2],
    [-0.9, -0.6], // dip 2
    [-0.2, 1.0],
    [0.4, 0.1], // dip 3
    [1.2, 1.6],
    [1.7, 0.9], // dip 4
    [3.0, 2.8], // tip
  ];

  /* Segment lengths so we can distribute particles proportionally —
     long segments get more particles so density stays even. */
  const segLens = [];
  let total = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const dx = line[i + 1][0] - line[i][0];
    const dy = line[i + 1][1] - line[i][1];
    const l = Math.sqrt(dx * dx + dy * dy);
    segLens.push(l);
    total += l;
  }

  const ambient = Math.floor(n * 0.1);
  const arrowN = Math.floor((n - ambient) * 0.22);
  const lineN = n - ambient - arrowN;

  const lineNoise = 0.06;
  let idx = 0;

  for (let i = 0; i < line.length - 1; i++) {
    const segCount = Math.floor((segLens[i] / total) * lineN);
    const [x1, y1] = line[i];
    const [x2, y2] = line[i + 1];
    for (let j = 0; j < segCount && idx < lineN; j++) {
      const t = Math.random();
      p[idx * 3] = (x1 + (x2 - x1) * t) * S + gaussRand() * lineNoise * S;
      p[idx * 3 + 1] = (y1 + (y2 - y1) * t) * S + gaussRand() * lineNoise * S;
      p[idx * 3 + 2] = gaussRand() * 0.22;
      idx++;
    }
  }
  /* Fill any rounding-loss particles along the last segment */
  while (idx < lineN) {
    const t = Math.random();
    const [x1, y1] = line[line.length - 2];
    const [x2, y2] = line[line.length - 1];
    p[idx * 3] = (x1 + (x2 - x1) * t) * S + gaussRand() * lineNoise * S;
    p[idx * 3 + 1] = (y1 + (y2 - y1) * t) * S + gaussRand() * lineNoise * S;
    p[idx * 3 + 2] = gaussRand() * 0.22;
    idx++;
  }

  /* Arrowhead — two arms back from the tip, rotated ±30° from the
     reverse of the last segment's direction. */
  const tip = line[line.length - 1];
  const prev = line[line.length - 2];
  const dx = tip[0] - prev[0];
  const dy = tip[1] - prev[1];
  const dlen = Math.sqrt(dx * dx + dy * dy);
  const dirX = dx / dlen;
  const dirY = dy / dlen;

  const armLen = 0.95;
  const armAngle = Math.PI / 6; // 30°
  const cA = Math.cos(armAngle);
  const sA = Math.sin(armAngle);

  /* Rotate (-dirX, -dirY) by ±armAngle to get the two arm directions */
  const arm1Dx = -dirX * cA - -dirY * sA; //  +30°
  const arm1Dy = -dirX * sA + -dirY * cA;
  const arm2Dx = -dirX * cA + -dirY * sA; //  -30°
  const arm2Dy = dirX * sA + -dirY * cA;

  const perArm = Math.floor(arrowN / 2);
  for (let j = 0; j < perArm && idx < n - ambient; j++) {
    const t = Math.random();
    p[idx * 3] =
      (tip[0] + arm1Dx * armLen * t) * S + gaussRand() * lineNoise * S;
    p[idx * 3 + 1] =
      (tip[1] + arm1Dy * armLen * t) * S + gaussRand() * lineNoise * S;
    p[idx * 3 + 2] = gaussRand() * 0.22;
    idx++;
  }
  for (let j = 0; j < perArm && idx < n - ambient; j++) {
    const t = Math.random();
    p[idx * 3] =
      (tip[0] + arm2Dx * armLen * t) * S + gaussRand() * lineNoise * S;
    p[idx * 3 + 1] =
      (tip[1] + arm2Dy * armLen * t) * S + gaussRand() * lineNoise * S;
    p[idx * 3 + 2] = gaussRand() * 0.22;
    idx++;
  }

  /* Ambient halo */
  for (let i = idx; i < n; i++) {
    p[i * 3] = (Math.random() - 0.5) * 8 * S;
    p[i * 3 + 1] = (Math.random() - 0.5) * 5 * S;
    p[i * 3 + 2] = gaussRand() * 1.2;
  }

  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ── Helpers ── */

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
