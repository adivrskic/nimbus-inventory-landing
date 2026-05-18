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
/* ── Spatial: 3D hexagonal prism ──
   A hexagonal column. Six top vertices, six bottom vertices, six
   vertical edges connecting them, six rectangular side faces. The
   top + bottom rings carry the strongest emphasis (the silhouette
   read), with vertex clusters punching in at the 12 corners and a
   light fill across the side faces.

   Hex is flat-top oriented (angles offset by 30°) so the silhouette
   reads as two parallel horizontal edges top and bottom — a more
   architectural feel than pointy-top.

   Allocation (of n total):
     topRing     22%   top hexagon perimeter (six edges)
     botRing     22%   bottom hexagon perimeter (six edges)
     vertEdges   18%   six vertical edges — the column silhouette
     vertices    12%   small focal clusters at the 12 corners
     sideFaces   22%   sparse fill across the six side faces
     ambient      4%   very sparse halo
*/
export function generateCube(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  /* Hex dimensions — slightly taller than wide for a column feel. */
  const R = 1.5 * S; // hex radius (vertex distance from center)
  const H = 2.2 * S; // total height
  const yTop = H / 2;
  const yBot = -H / 2;

  /* Pre-compute the six hex vertices in the XZ plane. Flat-top
     orientation: angles offset by 30° so two edges sit flat at top
     and bottom of the hex. */
  const verts = [];
  for (let i = 0; i < 6; i++) {
    const a = ((i * 60 + 30) * Math.PI) / 180;
    verts.push([R * Math.cos(a), R * Math.sin(a)]);
  }

  const topRingN = Math.floor(n * 0.22);
  const botRingN = Math.floor(n * 0.22);
  const vertEdgesN = Math.floor(n * 0.18);
  const verticesN = Math.floor(n * 0.12);
  const sideFacesN = Math.floor(n * 0.22);
  /* ambient = remainder ≈ 4% */

  let idx = 0;

  /* ─── TOP HEXAGON PERIMETER ─────────────────────────────────── */
  const perTopEdge = Math.floor(topRingN / 6);
  for (let e = 0; e < 6; e++) {
    const v1 = verts[e];
    const v2 = verts[(e + 1) % 6];
    const limit = e === 5 ? topRingN : (e + 1) * perTopEdge;
    while (idx < limit) {
      const t = Math.random();
      p[idx * 3] = v1[0] + (v2[0] - v1[0]) * t + gaussRand() * 0.04 * S;
      p[idx * 3 + 1] = yTop + gaussRand() * 0.04 * S;
      p[idx * 3 + 2] = v1[1] + (v2[1] - v1[1]) * t + gaussRand() * 0.04 * S;
      idx++;
    }
  }

  /* ─── BOTTOM HEXAGON PERIMETER ──────────────────────────────── */
  const perBotEdge = Math.floor(botRingN / 6);
  const botBase = topRingN;
  for (let e = 0; e < 6; e++) {
    const v1 = verts[e];
    const v2 = verts[(e + 1) % 6];
    const limit = e === 5 ? botBase + botRingN : botBase + (e + 1) * perBotEdge;
    while (idx < limit) {
      const t = Math.random();
      p[idx * 3] = v1[0] + (v2[0] - v1[0]) * t + gaussRand() * 0.04 * S;
      p[idx * 3 + 1] = yBot + gaussRand() * 0.04 * S;
      p[idx * 3 + 2] = v1[1] + (v2[1] - v1[1]) * t + gaussRand() * 0.04 * S;
      idx++;
    }
  }

  /* ─── VERTICAL EDGES — six columns connecting top to bottom ─── */
  const perVertEdge = Math.floor(vertEdgesN / 6);
  const vBase = botBase + botRingN;
  for (let v = 0; v < 6; v++) {
    const vert = verts[v];
    const limit = v === 5 ? vBase + vertEdgesN : vBase + (v + 1) * perVertEdge;
    while (idx < limit) {
      const t = Math.random();
      p[idx * 3] = vert[0] + gaussRand() * 0.04 * S;
      p[idx * 3 + 1] = yBot + (yTop - yBot) * t + gaussRand() * 0.04 * S;
      p[idx * 3 + 2] = vert[1] + gaussRand() * 0.04 * S;
      idx++;
    }
  }

  /* ─── VERTEX CLUSTERS — 12 small focal blobs at the corners ─── */
  const perVertex = Math.floor(verticesN / 12);
  const vxBase = vBase + vertEdgesN;
  for (let v = 0; v < 6; v++) {
    const vert = verts[v];
    /* Top vertex */
    let limit = vxBase + (v * 2 + 1) * perVertex;
    while (idx < limit) {
      p[idx * 3] = vert[0] + gaussRand() * 0.12 * S;
      p[idx * 3 + 1] = yTop + gaussRand() * 0.12 * S;
      p[idx * 3 + 2] = vert[1] + gaussRand() * 0.12 * S;
      idx++;
    }
    /* Bottom vertex */
    limit = v === 5 ? vxBase + verticesN : vxBase + (v * 2 + 2) * perVertex;
    while (idx < limit) {
      p[idx * 3] = vert[0] + gaussRand() * 0.12 * S;
      p[idx * 3 + 1] = yBot + gaussRand() * 0.12 * S;
      p[idx * 3 + 2] = vert[1] + gaussRand() * 0.12 * S;
      idx++;
    }
  }

  /* ─── SIDE FACES — sparse fill on the six rectangular sides ─── */
  const perSide = Math.floor(sideFacesN / 6);
  const sBase = vxBase + verticesN;
  for (let f = 0; f < 6; f++) {
    const v1 = verts[f];
    const v2 = verts[(f + 1) % 6];
    const limit = f === 5 ? sBase + sideFacesN : sBase + (f + 1) * perSide;
    while (idx < limit) {
      const tx = Math.random();
      const ty = Math.random();
      p[idx * 3] = v1[0] + (v2[0] - v1[0]) * tx + gaussRand() * 0.05 * S;
      p[idx * 3 + 1] = yBot + (yTop - yBot) * ty + gaussRand() * 0.05 * S;
      p[idx * 3 + 2] = v1[1] + (v2[1] - v1[1]) * tx + gaussRand() * 0.05 * S;
      idx++;
    }
  }

  /* ─── AMBIENT — very sparse halo ──────────────────────────────── */
  for (let i = idx; i < n; i++) {
    p[i * 3] = gaussRand() * R * 1.5;
    p[i * 3 + 1] = gaussRand() * H * 0.8;
    p[i * 3 + 2] = gaussRand() * R * 1.5;
  }

  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ── Analytics: 3D bar chart ──
   Eight vertical bars at varying heights, arranged left-to-right with
   a generally rising trend (with stock-chart-style variation between
   the bars). Each bar is a 3D box outlined by its four vertical edges,
   top face perimeter + light fill, and lightly populated side faces.
   Reads as "data over time" — clean ascending bars.

   Allocation (of n total):
     edges      45%   four vertical edges per bar — the dominant silhouette
     tops       22%   top face perimeter + light fill (the bar "tips")
     bodies     25%   sparse fill across the four side faces
     ambient     8%   sparse halo
*/
export function generateStockArrow(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  /* Heights — generally rising with a stock-chart-style pullback in
     the middle. Final bar is tallest (the "we're up" payoff). */
  const heights = [0.6, 1.0, 1.4, 1.0, 1.6, 2.0, 1.6, 2.4];
  const numBars = heights.length;

  const barW = 0.34 * S; // bar width (x-axis)
  const barD = 0.34 * S; // bar depth (z-axis)
  const gap = 0.16 * S; // gap between bars
  const totalW = numBars * barW + (numBars - 1) * gap;
  const startX = -totalW / 2 + barW / 2;
  const yFloor = -1.5 * S;

  /* Pre-compute bar bounds. */
  const bars = [];
  for (let i = 0; i < numBars; i++) {
    const cx = startX + i * (barW + gap);
    const h = heights[i] * S;
    bars.push({
      xMin: cx - barW / 2,
      xMax: cx + barW / 2,
      zMin: -barD / 2,
      zMax: barD / 2,
      yMin: yFloor,
      yMax: yFloor + h,
    });
  }

  const edgesN = Math.floor(n * 0.45);
  const topsN = Math.floor(n * 0.22);
  const bodiesN = Math.floor(n * 0.25);
  /* ambient = remainder ≈ 8% */

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
      /* Last edge of last bar absorbs any remainder. */
      const isLast = bi === numBars - 1 && e === 3;
      const limit = isLast ? edgesN : Math.min(edgesN, idx + perEdge);
      while (idx < limit) {
        const t = Math.random();
        p[idx * 3] = corners[e][0] + gaussRand() * 0.04 * S;
        p[idx * 3 + 1] =
          b.yMin + t * (b.yMax - b.yMin) + gaussRand() * 0.04 * S;
        p[idx * 3 + 2] = corners[e][1] + gaussRand() * 0.04 * S;
        idx++;
      }
    }
  }

  /* ─── TOPS — top face perimeter (70%) + light fill (30%) ──── */
  const perBarTop = Math.floor(topsN / numBars);
  for (let bi = 0; bi < numBars; bi++) {
    const b = bars[bi];
    const limit =
      bi === numBars - 1 ? edgesN + topsN : edgesN + (bi + 1) * perBarTop;
    while (idx < limit) {
      if (Math.random() < 0.7) {
        /* Perimeter — pick one of four top edges */
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
        /* Sparse top-face fill */
        p[idx * 3] = b.xMin + Math.random() * barW;
        p[idx * 3 + 1] = b.yMax + gaussRand() * 0.06 * S;
        p[idx * 3 + 2] = b.zMin + Math.random() * barD;
      }
      idx++;
    }
  }

  /* ─── BODIES — sparse fill across the four side faces ──────── */
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

  /* ─── AMBIENT — sparse halo, biased slightly upward to suggest
         the growth trend continues past the last bar ─────────── */
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
