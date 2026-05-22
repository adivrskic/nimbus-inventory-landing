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
   SPATIAL SCENE — wireframe cube with diagonal scan pulse
   ───────────────────────────────────────────────────────────────────────
   A clean wireframe cube: 12 edges as thick particle bands, sparse
   internal volume so the scan plane has matter to highlight as it
   sweeps through, soft ambient halo for morph slack. Returns
   { positions, phases } where phase encodes each particle's normalized
   position along the cube's (1,1,1) space diagonal — the shader sweeps
   a scan plane along that axis from one corner to the opposite and
   back. See lib/shaders.js / computeSpatialPulse.
   ═══════════════════════════════════════════════════════════════════════ */
export function generateSpatialScene(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);
  const phases = new Float32Array(n);

  const h = 1.75 * S; /* half-side */
  const lineThick = 0.04 * S; /* edge band perpendicular thickness */

  /* 8 cube vertices indexed by 3-bit pattern (bit 0 = x sign,
       bit 1 = y sign, bit 2 = z sign). */
  const V = new Array(8);
  for (let i = 0; i < 8; i++) {
    V[i] = [i & 1 ? h : -h, i & 2 ? h : -h, i & 4 ? h : -h];
  }

  /* 12 edges as vertex-index pairs. Grouped by bottom face, top face,
       verticals — purely for readability, order doesn't affect output. */
  const edges = [
    [0, 1],
    [1, 5],
    [5, 4],
    [4, 0] /* bottom face */,
    [2, 3],
    [3, 7],
    [7, 6],
    [6, 2] /* top face */,
    [0, 2],
    [1, 3],
    [5, 7],
    [4, 6] /* verticals */,
  ];

  const edgesN = Math.floor(n * 0.7);
  const internalN = Math.floor(n * 0.18);
  /* ambient ≈ 12% remainder */

  const perEdge = Math.floor(edgesN / 12);

  /* Phase encoding: normalized position along the (1,1,1) space
       diagonal. Particle at V_000 (corner -h,-h,-h) → 0.0. Particle at
       V_111 (corner h,h,h) → 1.0. Center of cube → 0.5. The scan plane
       in the shader sweeps this 0..1 range and brightens particles whose
       phase matches its current position. */
  const phaseFromPos = (x, y, z) => (x + y + z + 3 * h) / (6 * h);

  let idx = 0;

  /* ─── EDGES — 12 thick bands tracing the wireframe ───────────────
       Each edge gets perEdge particles distributed uniformly along its
       line segment, with perpendicular gaussian jitter giving the edge
       a visible thickness. */
  for (let e = 0; e < 12; e++) {
    const [a, b] = edges[e];
    const vA = V[a];
    const vB = V[b];
    for (let i = 0; i < perEdge; i++) {
      const t = Math.random();
      const cx = vA[0] + (vB[0] - vA[0]) * t;
      const cy = vA[1] + (vB[1] - vA[1]) * t;
      const cz = vA[2] + (vB[2] - vA[2]) * t;
      const px = cx + gaussRand() * lineThick;
      const py = cy + gaussRand() * lineThick;
      const pz = cz + gaussRand() * lineThick;
      p[idx * 3] = px;
      p[idx * 3 + 1] = py;
      p[idx * 3 + 2] = pz;
      phases[idx] = phaseFromPos(px, py, pz);
      idx++;
    }
  }

  /* ─── INTERNAL — sparse points inside the cube ───────────────────
       Slightly inset from faces so they don't visually fuse into the
       edge bands. These participate in the scan glow alongside edges,
       so the scan plane reads as sweeping through 3D matter rather than
       just lighting up the wireframe. */
  const inset = 0.92;
  for (let i = 0; i < internalN; i++) {
    const x = (Math.random() - 0.5) * 2 * h * inset;
    const y = (Math.random() - 0.5) * 2 * h * inset;
    const z = (Math.random() - 0.5) * 2 * h * inset;
    p[idx * 3] = x;
    p[idx * 3 + 1] = y;
    p[idx * 3 + 2] = z;
    phases[idx] = phaseFromPos(x, y, z);
    idx++;
  }

  /* ─── AMBIENT — soft halo around the cube for morph slack ────────
       No phase (== no glow). Gives particles somewhere natural to be
       during morph transitions to/from neighboring scenes. */
  for (let i = idx; i < n; i++) {
    const x = (Math.random() - 0.5) * 2 * h * 1.4;
    const y = (Math.random() - 0.5) * 2 * h * 1.4;
    const z = (Math.random() - 0.5) * 2 * h * 1.4;
    p[i * 3] = x;
    p[i * 3 + 1] = y;
    p[i * 3 + 2] = z;
    phases[i] = -1;
  }

  shufflePositionsAndAttribute(p, phases);

  return {
    positions: isoTransform(p, rotXDeg, rotYDeg, rotZDeg),
    phases,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   SEARCH SCENE — magnifier over a data grid, with sonar scan
   ───────────────────────────────────────────────────────────────────────
   Simplified from the earlier six-part version (which had separate
   front/back/side lens rims, magnified in-lens content, a result
   cluster, and a beam). Now four clean parts: one volumetric lens ring,
   the handle, a uniform data grid behind it, and ambient.

   Returns { positions, phases } where phase encodes each particle's
   distance from the lens center, normalized 0..1. The shader sweeps a
   sonar ripple outward along this axis — a ring of light expanding from
   the lens center across the grid, passing through the lens rim on its
   way out. See lib/shaders.js / computeSearchPulse.

   The handle and ambient get phase -1 (no glow) — the handle is the
   tool, not part of the searchable field.
   ═══════════════════════════════════════════════════════════════════════ */
export function generateSearchScene(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);
  const phases = new Float32Array(n);

  const lensCx = 0;
  const lensCy = 0.6 * S;
  const lensR = 2.4 * S;
  const lensThickness = 0.32 * S; /* z-depth of the rim */
  const lensRadialThick = 0.14 * S; /* in/out thickness of the rim band */

  /* Normalization radius for the ripple phase — covers the lens plus
       the full grid, so the ripple front travels from center (0) out
       past the grid edge (≈0.95). */
  const maxR = 5.0 * S;
  const phaseFromCenter = (x, y) => {
    const dx = x - lensCx;
    const dy = y - lensCy;
    return Math.sqrt(dx * dx + dy * dy) / maxR;
  };

  const lensN = Math.floor(n * 0.26);
  const handleN = Math.floor(n * 0.11);
  const gridN = Math.floor(n * 0.48);
  /* ambient ≈ 15% remainder */

  let idx = 0;

  /* ─── LENS RING — one thick volumetric circular band ─────────────
       Replaces the old front-rim / back-rim / side-ring trio with a
       single ring that has both radial and z thickness. */
  for (let i = 0; i < lensN; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = lensR + gaussRand() * lensRadialThick;
    const x = lensCx + Math.cos(a) * r;
    const y = lensCy + Math.sin(a) * r;
    p[idx * 3] = x;
    p[idx * 3 + 1] = y;
    p[idx * 3 + 2] = gaussRand() * lensThickness;
    phases[idx] = phaseFromCenter(x, y);
    idx++;
  }

  /* ─── HANDLE — cylinder down-right at -45° from lens edge ───────── */
  const handleAngle = -Math.PI / 4;
  const hdx = Math.cos(handleAngle);
  const hdy = Math.sin(handleAngle);
  const handleStartX = lensCx + hdx * lensR;
  const handleStartY = lensCy + hdy * lensR;
  const handleLen = 2.2 * S;
  const handleRad = 0.15 * S;
  const perpX = -hdy;
  const perpY = hdx;
  for (let i = 0; i < handleN; i++) {
    const t = Math.random();
    const a = Math.random() * Math.PI * 2;
    const baseX = handleStartX + hdx * t * handleLen;
    const baseY = handleStartY + hdy * t * handleLen;
    const offRadial = Math.cos(a) * handleRad;
    const offZ = Math.sin(a) * handleRad;
    p[idx * 3] = baseX + perpX * offRadial + gaussRand() * 0.02 * S;
    p[idx * 3 + 1] = baseY + perpY * offRadial + gaussRand() * 0.02 * S;
    p[idx * 3 + 2] = offZ + gaussRand() * 0.02 * S;
    phases[idx] = -1.0;
    idx++;
  }

  /* ─── DATA GRID — clean rows × cols of points behind the lens ────
       One uniform grid (no separate magnified-content pass). A small
       center disk is left clear so the ripple's origin reads cleanly
       and the reset doesn't pop. */
  const gridCols = 22;
  const gridRows = 14;
  const gridW = 7.5 * S;
  const gridH = 4.5 * S;
  const gridStartX = lensCx - gridW / 2;
  const gridStartY = lensCy - gridH / 2;
  const cellW = gridW / (gridCols - 1);
  const cellH = gridH / (gridRows - 1);
  const gridZ = -lensThickness * 1.5;
  const centerClear = 0.5 * S;
  const perCell = Math.max(1, Math.floor(gridN / (gridCols * gridRows)));
  const gridEnd = idx + gridN;

  for (let row = 0; row < gridRows && idx < gridEnd; row++) {
    for (let col = 0; col < gridCols && idx < gridEnd; col++) {
      const gx = gridStartX + col * cellW;
      const gy = gridStartY + row * cellH;
      const dx = gx - lensCx;
      const dy = gy - lensCy;
      if (dx * dx + dy * dy < centerClear * centerClear) continue;
      for (let k = 0; k < perCell && idx < gridEnd; k++) {
        const x = gx + gaussRand() * 0.05 * S;
        const y = gy + gaussRand() * 0.05 * S;
        p[idx * 3] = x;
        p[idx * 3 + 1] = y;
        p[idx * 3 + 2] = gridZ + gaussRand() * 0.05 * S;
        phases[idx] = phaseFromCenter(x, y);
        idx++;
      }
    }
  }
  /* Fill any remainder (from center-clear skips) with sparse ring
       points so the particle budget is fully used. */
  while (idx < gridEnd) {
    const a = Math.random() * Math.PI * 2;
    const r = centerClear + Math.random() * (gridW / 2 - centerClear);
    const x = lensCx + Math.cos(a) * r;
    const y = lensCy + Math.sin(a) * r;
    p[idx * 3] = x;
    p[idx * 3 + 1] = y;
    p[idx * 3 + 2] = gridZ + gaussRand() * 0.05 * S;
    phases[idx] = phaseFromCenter(x, y);
    idx++;
  }

  /* ─── AMBIENT — sparse halo around the scene ─────────────────────── */
  for (let i = idx; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (Math.random() * 2.0 + 4.5) * S;
    p[i * 3] = lensCx + Math.cos(a) * r + gaussRand() * 0.5;
    p[i * 3 + 1] = lensCy + Math.sin(a) * r * 0.7 + gaussRand() * 0.5;
    p[i * 3 + 2] = gaussRand() * 0.9;
    phases[i] = -1.0;
  }

  shufflePositionsAndAttribute(p, phases);

  return {
    positions: isoTransform(p, rotXDeg, rotYDeg, rotZDeg),
    phases,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   CHART SCENE — bars + trend + forecast, with left→right reveal sweep
   ───────────────────────────────────────────────────────────────────────
   Simplified from the earlier ten-part version (axes, ticks, grid lines,
   bars, markers, trend, forecast, y-labels, ambient). Now five clean
   parts: the two axes (static frame), the bars, a trend line through the
   bar tops, and the forecast arrow — plus ambient.

   Returns { positions, phases } where phase encodes each glowing
   particle's normalized x position across the chart (left axis → forecast
   tip, 0..1). The shader sweeps a vertical pulse line along this axis
   left to right, so bars light up in sequence, then the trend, then the
   forecast arrow last. Axes and ambient get phase -1 (no glow) so the
   frame holds steady while the data animates. See computeChartPulse.
   ═══════════════════════════════════════════════════════════════════════ */
export function generateChartScene(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);
  const phases = new Float32Array(n);

  const yAxisN = Math.floor(n * 0.05);
  const xAxisN = Math.floor(n * 0.06);
  const barsN = Math.floor(n * 0.44);
  const trendN = Math.floor(n * 0.14);
  const forecastN = Math.floor(n * 0.15);
  /* ambient ≈ 16% remainder */

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

  /* Forecast arrow geometry computed up front so the sweep's x range
       can include the arrow tip. */
  const lastH = heights[numBars - 1] * S;
  const arrowStartX = barStartX + (numBars - 1) * (barW + barGap);
  const arrowStartY = chartFloorY + lastH + 0.22 * S;
  const arrowEndX = chartRight + 0.6 * S;
  const arrowEndY = arrowStartY + 1.2 * S;

  /* Phase = normalized x across the whole chart, left axis (0) to
       forecast tip (1). Clamped so jittered positions stay in range. */
  const xMin = chartLeft;
  const xMax = arrowEndX;
  const phaseFromX = (x) =>
    Math.max(0, Math.min(1, (x - xMin) / (xMax - xMin)));

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
  /* fillLine / fillBox write only positions; these helpers stamp phases
       onto the particles a fill just produced. setPhasesFromX makes them
       glow by x; setConst marks a range static (-1). */
  const setPhasesFromX = (from, to) => {
    for (let j = from; j < to; j++) phases[j] = phaseFromX(p[j * 3]);
  };
  const setConst = (from, to, val) => {
    for (let j = from; j < to; j++) phases[j] = val;
  };

  /* ─── Y-AXIS — static frame ──────────────────────────────────── */
  let from = idx;
  idx = fillLine(
    p,
    idx,
    yAxisN,
    [chartLeft, chartFloorY, 0],
    [chartLeft, chartTop, 0],
    0.025
  );
  setConst(from, idx, -1);

  /* ─── X-AXIS — static frame ──────────────────────────────────── */
  from = idx;
  idx = fillLine(
    p,
    idx,
    xAxisN,
    [chartLeft, chartFloorY, 0],
    [chartRight + 0.3 * S, chartFloorY, 0],
    0.025
  );
  setConst(from, idx, -1);

  /* ─── BARS — vertical edges + top perimeter + sparse fill ────────
       Each bar glows by its x position, so the sweep lights up bars in
       left-to-right sequence. */
  const perBarEdges = Math.floor((barsN * 0.6) / numBars);
  const perBarFill = Math.floor((barsN * 0.4) / numBars);
  for (let bi = 0; bi < numBars; bi++) {
    const b = bars[bi];
    const corners = [
      [b.xMin, b.zMin],
      [b.xMax, b.zMin],
      [b.xMax, b.zMax],
      [b.xMin, b.zMax],
    ];
    const perEdge = Math.floor(perBarEdges / 4);
    for (let e = 0; e < 4; e++) {
      from = idx;
      idx = fillLine(
        p,
        idx,
        perEdge,
        [corners[e][0], b.yMin, corners[e][1]],
        [corners[e][0], b.yMax, corners[e][1]],
        0.025
      );
      setPhasesFromX(from, idx);
    }
    const topPerimeter = perBarEdges - perEdge * 4;
    const perTopEdge = Math.floor(topPerimeter / 4);
    for (let e = 0; e < 4; e++) {
      const c1 = corners[e];
      const c2 = corners[(e + 1) % 4];
      from = idx;
      idx = fillLine(
        p,
        idx,
        perTopEdge,
        [c1[0], b.yMax, c1[1]],
        [c2[0], b.yMax, c2[1]],
        0.025
      );
      setPhasesFromX(from, idx);
    }
    const isLast = bi === numBars - 1;
    const fillCount = isLast ? yAxisN + xAxisN + barsN - idx : perBarFill;
    from = idx;
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
    setPhasesFromX(from, idx);
  }

  /* ─── TREND LINE — Catmull-Rom through bar tops, glow by x ─────── */
  const trendSegments = numBars - 1;
  const perTrendSeg = Math.floor(trendN / trendSegments);
  for (let sg = 0; sg < trendSegments; sg++) {
    const i0 = Math.max(0, sg - 1);
    const i1 = sg;
    const i2 = sg + 1;
    const i3i = Math.min(numBars - 1, sg + 2);
    const isLastSeg = sg === trendSegments - 1;
    const count = isLastSeg
      ? yAxisN + xAxisN + barsN + trendN - idx
      : perTrendSeg;
    from = idx;
    for (let k = 0; k < count; k++) {
      const t = Math.random();
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
        c3 * bars[i3i].cx;
      const y =
        c0 * bars[i0].yTop +
        c1 * bars[i1].yTop +
        c2 * bars[i2].yTop +
        c3 * bars[i3i].yTop +
        0.22 * S;
      p[idx * 3] = x + gaussRand() * 0.03 * S;
      p[idx * 3 + 1] = y + gaussRand() * 0.03 * S;
      p[idx * 3 + 2] = gaussRand() * 0.04 * S;
      idx++;
    }
    setPhasesFromX(from, idx);
  }

  /* ─── FORECAST ARROW — shaft + arrowhead, glows last (highest x) ─ */
  const shaftCount = Math.floor(forecastN * 0.7);
  from = idx;
  idx = fillLine(
    p,
    idx,
    shaftCount,
    [arrowStartX, arrowStartY, 0],
    [arrowEndX, arrowEndY, 0],
    0.035
  );
  setPhasesFromX(from, idx);

  const headLen = 0.45 * S;
  const arrowAngle = Math.atan2(
    arrowEndY - arrowStartY,
    arrowEndX - arrowStartX
  );
  const headA1 = arrowAngle + Math.PI - 0.5;
  const headA2 = arrowAngle + Math.PI + 0.5;
  const h1x = arrowEndX + Math.cos(headA1) * headLen;
  const h1y = arrowEndY + Math.sin(headA1) * headLen;
  const h2x = arrowEndX + Math.cos(headA2) * headLen;
  const h2y = arrowEndY + Math.sin(headA2) * headLen;
  const headPerSide = Math.floor((forecastN - shaftCount) / 2);
  from = idx;
  idx = fillLine(
    p,
    idx,
    headPerSide,
    [arrowEndX, arrowEndY, 0],
    [h1x, h1y, 0],
    0.025
  );
  setPhasesFromX(from, idx);
  const headRemaining = yAxisN + xAxisN + barsN + trendN + forecastN - idx;
  from = idx;
  idx = fillLine(
    p,
    idx,
    headRemaining,
    [arrowEndX, arrowEndY, 0],
    [h2x, h2y, 0],
    0.025
  );
  setPhasesFromX(from, idx);

  /* ─── AMBIENT — diffuse haze, static ─────────────────────────── */
  for (let i = idx; i < n; i++) {
    p[i * 3] = gaussRand() * totalW * 0.7;
    p[i * 3 + 1] = gaussRand() * 1.8 * S + 0.6 * S;
    p[i * 3 + 2] = gaussRand() * barD * 2.0;
    phases[i] = -1;
  }

  shufflePositionsAndAttribute(p, phases);

  return {
    positions: isoTransform(p, rotXDeg, rotYDeg, rotZDeg),
    phases,
  };
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
