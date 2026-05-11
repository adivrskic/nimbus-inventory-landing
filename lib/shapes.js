/* Shape scale. Bump higher for bigger shapes; lower for smaller. */
const S = 2.2;

/* ── isoTransform ──
   Applies 3D rotation to a particle position buffer.
   All angles in DEGREES.
     rotXDeg  ─  pitch around X axis. Negative tilts the top edge of the
                 shape toward the camera (the classic isometric pose).
     rotYDeg  ─  yaw around Y axis. Positive rotates the right side away
                 from the camera.
     rotZDeg  ─  roll around Z axis. In-plane spin — rotates the whole
                 shape clockwise (positive) or counter-clockwise.
   Rotations are applied Z → Y → X. */
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

    /* Z (in-plane) */
    const x1 = x * cz - y * sz;
    const y1 = x * sz + y * cz;
    /* Y */
    const x2 = x1 * cy + z * sy;
    const z2 = -x1 * sy + z * cy;
    /* X */
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

/* Uniform random distribution. The central exclusion zone that used to
   open up a tunnel for centered text is gone — without the intro text,
   there's nothing to dodge. */
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
  const ambient = Math.floor(n * 0.1);
  const shaped = n - ambient;
  const rings = 6;
  const perRing = Math.floor(shaped / rings);

  for (let r = 0; r < rings; r++) {
    const radius = (1.2 + r * 0.85) * S;
    const thickness = (0.28 + r * 0.05) * S;
    for (let i = 0; i < perRing && r * perRing + i < shaped; i++) {
      const idx = r * perRing + i;
      const a = Math.random() * Math.PI * 2;
      const rr = radius + gaussRand() * thickness * 0.35;
      p[idx * 3] = Math.cos(a) * rr;
      p[idx * 3 + 1] = Math.sin(a) * rr;
      p[idx * 3 + 2] = gaussRand() * 0.5 + r * 0.12;
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

/* ── Spatial: 3D cube ── */
export function generateCube(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);
  const size = 3.5 * S;
  const h = size / 2;
  const ambient = Math.floor(n * 0.1);
  const edgeN = Math.floor((n - ambient) * 0.4);
  const cornerN = Math.floor((n - ambient) * 0.05);
  const faceN = n - ambient - edgeN - cornerN;

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

  const noise = 0.2 * S;
  const perEdge = Math.floor(edgeN / 12);
  let idx = 0;
  for (const [a, b] of edges) {
    for (let i = 0; i < perEdge && idx < edgeN; i++) {
      const t = Math.random();
      p[idx * 3] = (a[0] + (b[0] - a[0]) * t) * h + gaussRand() * noise;
      p[idx * 3 + 1] = (a[1] + (b[1] - a[1]) * t) * h + gaussRand() * noise;
      p[idx * 3 + 2] = (a[2] + (b[2] - a[2]) * t) * h + gaussRand() * noise;
      idx++;
    }
  }

  const corners = [];
  for (const x of [-1, 1])
    for (const y of [-1, 1]) for (const z of [-1, 1]) corners.push([x, y, z]);
  const perCorner = Math.floor(cornerN / 8);
  for (const c of corners) {
    for (let i = 0; i < perCorner && idx < edgeN + cornerN; i++) {
      p[idx * 3] = c[0] * h + gaussRand() * 0.28 * S;
      p[idx * 3 + 1] = c[1] * h + gaussRand() * 0.28 * S;
      p[idx * 3 + 2] = c[2] * h + gaussRand() * 0.28 * S;
      idx++;
    }
  }

  for (let i = 0; i < faceN && idx < n - ambient; i++) {
    const face = Math.floor(Math.random() * 6);
    const u = (Math.random() - 0.5) * 2,
      v = (Math.random() - 0.5) * 2;
    const fNoise = gaussRand() * 0.15 * S;
    switch (face) {
      case 0:
        p[idx * 3] = h + fNoise;
        p[idx * 3 + 1] = u * h;
        p[idx * 3 + 2] = v * h;
        break;
      case 1:
        p[idx * 3] = -h + fNoise;
        p[idx * 3 + 1] = u * h;
        p[idx * 3 + 2] = v * h;
        break;
      case 2:
        p[idx * 3] = u * h;
        p[idx * 3 + 1] = h + fNoise;
        p[idx * 3 + 2] = v * h;
        break;
      case 3:
        p[idx * 3] = u * h;
        p[idx * 3 + 1] = -h + fNoise;
        p[idx * 3 + 2] = v * h;
        break;
      case 4:
        p[idx * 3] = u * h;
        p[idx * 3 + 1] = v * h;
        p[idx * 3 + 2] = h + fNoise;
        break;
      case 5:
        p[idx * 3] = u * h;
        p[idx * 3 + 1] = v * h;
        p[idx * 3 + 2] = -h + fNoise;
        break;
    }
    idx++;
  }

  for (let i = idx; i < n; i++) {
    p[i * 3] = gaussRand() * h * 0.7;
    p[i * 3 + 1] = gaussRand() * h * 0.7;
    p[i * 3 + 2] = gaussRand() * h * 0.7;
  }
  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ── Search: magnifier ── */
export function generateMagnifier(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);
  const ambient = Math.floor(n * 0.1);
  const ring = Math.floor((n - ambient) * 0.45);
  const handle = Math.floor((n - ambient) * 0.12);
  const inner = n - ambient - ring - handle;
  let idx = 0;

  for (let i = 0; i < ring; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (3.0 + gaussRand() * 0.45) * S;
    p[idx * 3] = Math.cos(a) * r;
    p[idx * 3 + 1] = Math.sin(a) * r * 0.95 + 0.3 * S;
    p[idx * 3 + 2] = gaussRand() * 0.4;
    idx++;
  }
  for (let i = 0; i < handle; i++) {
    const t = Math.random();
    p[idx * 3] = (2.0 + t * 2.4) * S + gaussRand() * 0.16 * S;
    p[idx * 3 + 1] = (-2.0 - t * 2.4) * S + gaussRand() * 0.16 * S;
    p[idx * 3 + 2] = gaussRand() * 0.25;
    idx++;
  }
  for (let i = 0; i < inner; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.5) * 2.2 * S;
    p[idx * 3] = Math.cos(a) * r;
    p[idx * 3 + 1] = Math.sin(a) * r * 0.95 + 0.3 * S;
    p[idx * 3 + 2] = gaussRand() * 0.45;
    idx++;
  }
  for (let i = idx; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (Math.random() * 2.5 + 0.5) * S;
    p[i * 3] = Math.cos(a) * r + gaussRand() * 1.0;
    p[i * 3 + 1] = Math.sin(a) * r * 0.95 + 0.3 * S + gaussRand() * 1.0;
    p[i * 3 + 2] = gaussRand() * 1.5;
  }
  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ── Analytics: bar chart ── */
export function generateBarChart(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);
  const heights = [0.45, 0.75, 0.4, 1, 0.65, 0.85, 0.5, 0.9, 0.6, 0.7];
  const bars = heights.length;
  const ambient = Math.floor(n * 0.1);
  const perBar = Math.floor(((n - ambient) * 0.9) / bars);
  const base = n - ambient - perBar * bars;
  let idx = 0;

  for (let b = 0; b < bars; b++) {
    const bx = (b - bars / 2 + 0.5) * 0.95 * S;
    const bh = heights[b] * 5.2 * S;
    const barWidth = 0.55 * S;
    for (let i = 0; i < perBar; i++) {
      p[idx * 3] = bx + gaussRand() * barWidth * 0.35;
      p[idx * 3 + 1] = Math.random() * bh - 2.6 * S;
      p[idx * 3 + 2] = gaussRand() * 0.35;
      idx++;
    }
  }
  for (let i = 0; i < base && idx < n - ambient; i++) {
    p[idx * 3] = (Math.random() - 0.5) * 9 * S;
    p[idx * 3 + 1] = -2.6 * S + gaussRand() * 0.12;
    p[idx * 3 + 2] = gaussRand() * 0.15;
    idx++;
  }
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
