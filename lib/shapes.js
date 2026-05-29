const S = 1.95;

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

function gaussRand() {
  const u = 1 - Math.random(),
    v = Math.random();
  return Math.max(
    -3,
    Math.min(3, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))
  );
}

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

function fillLine(p, startIdx, count, a, b, jitter = 0.04) {
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    p[(startIdx + i) * 3] = a[0] + (b[0] - a[0]) * t + gaussRand() * jitter;
    p[(startIdx + i) * 3 + 1] = a[1] + (b[1] - a[1]) * t + gaussRand() * jitter;
    p[(startIdx + i) * 3 + 2] = a[2] + (b[2] - a[2]) * t + gaussRand() * jitter;
  }
  return startIdx + count;
}

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

  const rings = [
    { r: 1.15 * S, dr: 0.085 * S, dz: 0.09 * S, frac: 0.16, idx: 0 },
    { r: 1.95 * S, dr: 0.11 * S, dz: 0.13 * S, frac: 0.14, idx: 1 },
    { r: 2.85 * S, dr: 0.15 * S, dz: 0.18 * S, frac: 0.12, idx: 2 },
    { r: 3.8 * S, dr: 0.22 * S, dz: 0.24 * S, frac: 0.09, idx: 3 },
    { r: 4.75 * S, dr: 0.32 * S, dz: 0.32 * S, frac: 0.06, idx: 4 },
  ];

  const srcN = Math.floor(n * 0.16);
  const fillN = Math.floor(n * 0.15);

  let idx = 0;

  const srcSigma = 0.22 * S;
  const srcSigmaZ = 0.12 * S;
  for (let i = 0; i < srcN; i++) {
    p[idx * 3] = gaussRand() * srcSigma;
    p[idx * 3 + 1] = gaussRand() * srcSigma;
    p[idx * 3 + 2] = gaussRand() * srcSigmaZ;
    phases[idx] = -1.0;
    idx++;
  }

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

  for (let i = idx; i < n; i++) {
    const theta = Math.random() * TWO_PI;
    const r = 4.5 * S + Math.random() * 1.3 * S;
    p[i * 3] = r * Math.cos(theta);
    p[i * 3 + 1] = r * Math.sin(theta);
    p[i * 3 + 2] = gaussRand() * 0.5 * S;
    phases[i] = -1.0;
  }

  shufflePositionsAndAttribute(p, phases);

  return {
    positions: isoTransform(p, rotXDeg, rotYDeg, rotZDeg),
    phases,
  };
}

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

  const h = 1.75 * S;
  const lineThick = 0.04 * S;

  const V = new Array(8);
  for (let i = 0; i < 8; i++) {
    V[i] = [i & 1 ? h : -h, i & 2 ? h : -h, i & 4 ? h : -h];
  }

  const edges = [
    [0, 1],
    [1, 5],
    [5, 4],
    [4, 0],
    [2, 3],
    [3, 7],
    [7, 6],
    [6, 2],
    [0, 2],
    [1, 3],
    [5, 7],
    [4, 6],
  ];

  const edgesN = Math.floor(n * 0.7);
  const internalN = Math.floor(n * 0.18);

  const perEdge = Math.floor(edgesN / 12);

  const phaseFromPos = (x, y, z) => (x + y + z + 3 * h) / (6 * h);

  let idx = 0;

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
  const lensThickness = 0.32 * S;
  const lensRadialThick = 0.14 * S;

  const maxR = 5.0 * S;
  const phaseFromCenter = (x, y) => {
    const dx = x - lensCx;
    const dy = y - lensCy;
    return Math.sqrt(dx * dx + dy * dy) / maxR;
  };

  const lensN = Math.floor(n * 0.26);
  const handleN = Math.floor(n * 0.11);
  const gridN = Math.floor(n * 0.48);

  let idx = 0;

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

  const lastH = heights[numBars - 1] * S;
  const arrowStartX = barStartX + (numBars - 1) * (barW + barGap);
  const arrowStartY = chartFloorY + lastH + 0.22 * S;
  const arrowEndX = chartRight + 0.6 * S;
  const arrowEndY = arrowStartY + 1.2 * S;

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
  const setPhasesFromX = (from, to) => {
    for (let j = from; j < to; j++) phases[j] = phaseFromX(p[j * 3]);
  };
  const setConst = (from, to, val) => {
    for (let j = from; j < to; j++) phases[j] = val;
  };

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
