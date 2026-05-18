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

/* ── Voice: 3D dome of sound rings ──
   Concentric rings bowed into a satellite-dish curve — outer rings sit
   further back in z, so the form reads as a real 3D dome rather than
   a flat 2D sticker. Radial spokes converge from the outer rings to a
   bright "source" cluster at the center.

   Allocation:
     dome rings    50%  six concentric rings, curvature increases with radius
     radial spokes 18%  14 lines from center to outer rings, hugging dome
     source         8%  bright cluster at the dome's apex (the voice source)
     ambient       24%  sparse halo
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
  /* Maximum dome depth — outer ring sits this far back in z.
     Deeper = more pronounced bowl; flatter = closer to original. */
  const domeDepth = 1.7 * S;

  let idx = 0;

  /* ─── DOME RINGS ─────────────────────────────────────────────── */
  for (let r = 0; r < numRings; r++) {
    const radius = (1.0 + r * 0.85) * S;
    const thickness = (0.16 + r * 0.025) * S;
    /* Quadratic-ish falloff so inner rings stay forward and outer
       rings sweep back hard — classic dish profile. */
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
      /* Match dome curvature so spokes lie on the dish surface. */
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
    /* Sits slightly forward of z=0 so it pops out from the dome. */
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
   rather than a flat line. As the form rotates you see the glass
   thickness and the handle's round cross-section.

   Allocation:
     lensFront   20%   front rim of the lens (z = +thickness/2)
     lensBack    16%   back rim of the lens (z = -thickness/2)
     lensSide     8%   cylindrical edge connecting front to back
     handle      22%   cylinder, lateral surface
     innerGrid   10%   crosshair inside the lens — "scanning" feel
     innerFill   12%   sparse glass surface
     ambient     12%   halo
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

  /* ─── LENS BACK RIM — slightly behind, marginally less dense ── */
  for (let i = 0; i < lensBackN; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = lensR + gaussRand() * 0.22 * S;
    p[idx * 3] = lensCenterX + Math.cos(a) * r;
    p[idx * 3 + 1] = lensCenterY + Math.sin(a) * r * 0.95;
    p[idx * 3 + 2] = -lensThickness / 2 + gaussRand() * 0.08 * S;
    idx++;
  }

  /* ─── LENS SIDE — cylindrical rim connecting front to back ────
     What sells the 3D-ness — as the magnifier rotates you see the
     visible glass thickness between the two rims. */
  for (let i = 0; i < lensSideN; i++) {
    const a = Math.random() * Math.PI * 2;
    const z = (Math.random() - 0.5) * lensThickness;
    p[idx * 3] = lensCenterX + Math.cos(a) * lensR;
    p[idx * 3 + 1] = lensCenterY + Math.sin(a) * lensR * 0.95;
    p[idx * 3 + 2] = z + gaussRand() * 0.04 * S;
    idx++;
  }

  /* ─── HANDLE — 3D cylinder ────────────────────────────────────
     Extends from the lower-right of the lens at -45°. We populate
     just the lateral surface (no fill) so it reads as a tube rather
     than a wedge. */
  const handleAngle = -Math.PI / 4;
  const handleDirX = Math.cos(handleAngle);
  const handleDirY = Math.sin(handleAngle);
  const handleStartX = lensCenterX + handleDirX * lensR;
  const handleStartY = lensCenterY + handleDirY * lensR;
  const handleLen = 2.6 * S;
  const handleR = 0.18 * S;
  /* Perpendicular to the handle axis in the screen plane — used to
     offset points around the cylinder. */
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

  /* ─── INNER GRID — crosshair inside the lens ──────────────────
     Two thin perpendicular lines crossing at the lens center.
     Reads as "scanning" or "targeting" without adding clutter. */
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

  /* ─── INNER FILL — sparse "glass surface" on the front face ── */
  for (let i = 0; i < innerFillN; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.55) * lensR * 0.9;
    p[idx * 3] = lensCenterX + Math.cos(a) * r;
    p[idx * 3 + 1] = lensCenterY + Math.sin(a) * r * 0.95;
    p[idx * 3 + 2] = gaussRand() * 0.12 * S;
    idx++;
  }

  /* ─── AMBIENT HALO ────────────────────────────────────────────── */
  for (let i = idx; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (Math.random() * 2.5 + 0.5) * S;
    p[i * 3] = lensCenterX + Math.cos(a) * r + gaussRand() * 1.0;
    p[i * 3 + 1] = lensCenterY + Math.sin(a) * r * 0.95 + gaussRand() * 1.0;
    p[i * 3 + 2] = gaussRand() * 1.2;
  }

  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ── Spatial: hex prism + 3D contents ──
   The hexagonal column from before, now containing 12 small interior
   "data point" clusters scattered through its volume AND a 3-axis
   coordinate gizmo through its center. As the prism rotates, the
   interior content parallaxes against the wireframe — that's what
   sells the "this is a real 3D space" read.

   Allocation:
     topRing     18%   top hexagon perimeter
     botRing     18%   bottom hexagon perimeter
     vertEdges   16%   six vertical edges (the column silhouette)
     vertices    10%   12 small focal clusters at the corners
     sideFaces   16%   sparse fill on the six side faces
     interior    12%   12 data-point clusters inside the volume
     axisGizmo    6%   three perpendicular axis lines through center
     ambient      4%   sparse halo
*/
export function generateCube(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  /* Hex dimensions — slightly taller than wide for a column feel. */
  const R = 1.5 * S;
  const H = 2.2 * S;
  const yTop = H / 2;
  const yBot = -H / 2;

  /* Six hex vertices in the XZ plane, flat-top orientation. */
  const verts = [];
  for (let i = 0; i < 6; i++) {
    const a = ((i * 60 + 30) * Math.PI) / 180;
    verts.push([R * Math.cos(a), R * Math.sin(a)]);
  }

  const topRingN = Math.floor(n * 0.18);
  const botRingN = Math.floor(n * 0.18);
  const vertEdgesN = Math.floor(n * 0.16);
  const verticesN = Math.floor(n * 0.1);
  const sideFacesN = Math.floor(n * 0.16);
  const interiorN = Math.floor(n * 0.12);
  const axisN = Math.floor(n * 0.06);
  /* ambient = ~4% remainder */

  let idx = 0;

  /* ─── TOP HEX PERIMETER ───────────────────────────────────────── */
  const perTopEdge = Math.floor(topRingN / 6);
  for (let e = 0; e < 6; e++) {
    const v1 = verts[e];
    const v2 = verts[(e + 1) % 6];
    const limit = e === 5 ? topRingN : (e + 1) * perTopEdge;
    while (idx < limit) {
      const t = Math.random();
      p[idx * 3] = v1[0] + (v2[0] - v1[0]) * t + gaussRand() * 0.03 * S;
      p[idx * 3 + 1] = yTop + gaussRand() * 0.03 * S;
      p[idx * 3 + 2] = v1[1] + (v2[1] - v1[1]) * t + gaussRand() * 0.03 * S;
      idx++;
    }
  }

  /* ─── BOTTOM HEX PERIMETER ────────────────────────────────────── */
  const perBotEdge = Math.floor(botRingN / 6);
  const botBase = topRingN;
  for (let e = 0; e < 6; e++) {
    const v1 = verts[e];
    const v2 = verts[(e + 1) % 6];
    const limit = e === 5 ? botBase + botRingN : botBase + (e + 1) * perBotEdge;
    while (idx < limit) {
      const t = Math.random();
      p[idx * 3] = v1[0] + (v2[0] - v1[0]) * t + gaussRand() * 0.03 * S;
      p[idx * 3 + 1] = yBot + gaussRand() * 0.03 * S;
      p[idx * 3 + 2] = v1[1] + (v2[1] - v1[1]) * t + gaussRand() * 0.03 * S;
      idx++;
    }
  }

  /* ─── VERTICAL EDGES ─────────────────────────────────────────── */
  const perVertEdge = Math.floor(vertEdgesN / 6);
  const vBase = botBase + botRingN;
  for (let v = 0; v < 6; v++) {
    const vert = verts[v];
    const limit = v === 5 ? vBase + vertEdgesN : vBase + (v + 1) * perVertEdge;
    while (idx < limit) {
      const t = Math.random();
      p[idx * 3] = vert[0] + gaussRand() * 0.03 * S;
      p[idx * 3 + 1] = yBot + (yTop - yBot) * t + gaussRand() * 0.03 * S;
      p[idx * 3 + 2] = vert[1] + gaussRand() * 0.03 * S;
      idx++;
    }
  }

  /* ─── VERTEX CLUSTERS ─────────────────────────────────────────── */
  const perVertex = Math.floor(verticesN / 12);
  const vxBase = vBase + vertEdgesN;
  for (let v = 0; v < 6; v++) {
    const vert = verts[v];
    let limit = vxBase + (v * 2 + 1) * perVertex;
    while (idx < limit) {
      p[idx * 3] = vert[0] + gaussRand() * 0.1 * S;
      p[idx * 3 + 1] = yTop + gaussRand() * 0.1 * S;
      p[idx * 3 + 2] = vert[1] + gaussRand() * 0.1 * S;
      idx++;
    }
    limit = v === 5 ? vxBase + verticesN : vxBase + (v * 2 + 2) * perVertex;
    while (idx < limit) {
      p[idx * 3] = vert[0] + gaussRand() * 0.1 * S;
      p[idx * 3 + 1] = yBot + gaussRand() * 0.1 * S;
      p[idx * 3 + 2] = vert[1] + gaussRand() * 0.1 * S;
      idx++;
    }
  }

  /* ─── SIDE FACES ──────────────────────────────────────────────── */
  const perSide = Math.floor(sideFacesN / 6);
  const sBase = vxBase + verticesN;
  for (let f = 0; f < 6; f++) {
    const v1 = verts[f];
    const v2 = verts[(f + 1) % 6];
    const limit = f === 5 ? sBase + sideFacesN : sBase + (f + 1) * perSide;
    while (idx < limit) {
      const tx = Math.random();
      const ty = Math.random();
      p[idx * 3] = v1[0] + (v2[0] - v1[0]) * tx + gaussRand() * 0.04 * S;
      p[idx * 3 + 1] = yBot + (yTop - yBot) * ty + gaussRand() * 0.04 * S;
      p[idx * 3 + 2] = v1[1] + (v2[1] - v1[1]) * tx + gaussRand() * 0.04 * S;
      idx++;
    }
  }

  /* ─── INTERIOR DATA POINTS ────────────────────────────────────
     12 small clusters scattered through the prism's volume — "objects
     mapped in 3D space," the literal pitch for spatial intelligence.
     They sit inside the form so as it rotates you see them parallax
     through the wireframe edges. */
  const interiorBase = sBase + sideFacesN;
  const numClusters = 12;
  const perCluster = Math.floor(interiorN / numClusters);
  for (let c = 0; c < numClusters; c++) {
    /* Rejection-sample a cluster center inside the hex footprint
       (tighter than the bounding circle so clusters don't drift
       outside the form). */
    let cx, cz;
    do {
      cx = (Math.random() - 0.5) * R * 1.7;
      cz = (Math.random() - 0.5) * R * 1.7;
    } while (cx * cx + cz * cz > R * R * 0.7);
    const cy = (Math.random() - 0.5) * H * 0.75;
    const limit =
      c === numClusters - 1
        ? interiorBase + interiorN
        : interiorBase + (c + 1) * perCluster;
    while (idx < limit) {
      p[idx * 3] = cx + gaussRand() * 0.08 * S;
      p[idx * 3 + 1] = cy + gaussRand() * 0.08 * S;
      p[idx * 3 + 2] = cz + gaussRand() * 0.08 * S;
      idx++;
    }
  }

  /* ─── COORDINATE AXIS GIZMO ───────────────────────────────────
     Three perpendicular line segments through the center — the
     universal symbol for "spatial." Y axis is scaled to match the
     prism height ratio so it doesn't poke out the top. */
  const axisBase = interiorBase + interiorN;
  const perAxis = Math.floor(axisN / 3);
  const axisLen = R * 0.9;
  for (let ax = 0; ax < 3; ax++) {
    const limit = ax === 2 ? axisBase + axisN : axisBase + (ax + 1) * perAxis;
    while (idx < limit) {
      const t = (Math.random() - 0.5) * 2;
      let x = 0,
        y = 0,
        z = 0;
      if (ax === 0) x = t * axisLen;
      else if (ax === 1) y = t * (H / 2) * 0.85;
      else z = t * axisLen;
      p[idx * 3] = x + gaussRand() * 0.035 * S;
      p[idx * 3 + 1] = y + gaussRand() * 0.035 * S;
      p[idx * 3 + 2] = z + gaussRand() * 0.035 * S;
      idx++;
    }
  }

  /* ─── AMBIENT HALO ────────────────────────────────────────────── */
  for (let i = idx; i < n; i++) {
    p[i * 3] = gaussRand() * R * 1.5;
    p[i * 3 + 1] = gaussRand() * H * 0.8;
    p[i * 3 + 2] = gaussRand() * R * 1.5;
  }

  return isoTransform(shufflePositions(p), rotXDeg, rotYDeg, rotZDeg);
}

/* ── Analytics: 3D bars + trend line + ground rails ──
   Eight ascending bars with a mid-series pullback, now augmented with
   a smooth trend line curving across the bar tops and a faint pair
   of ground rails below. The trend line tells the "going up" story;
   the rails plant the chart in space.

   Allocation:
     edges      36%   four vertical edges per bar (silhouette)
     tops       18%   top face perimeter + light fill
     bodies     20%   sparse fill across the four side faces
     trendLine  12%   smooth curve connecting bar tops
     groundGrid  8%   floor rails under the bars
     ambient     6%   sparse halo
*/
export function generateStockArrow(n, rotXDeg, rotYDeg, rotZDeg) {
  const p = new Float32Array(n * 3);

  /* Generally rising with a mid-series pullback. */
  const heights = [0.6, 1.0, 1.4, 1.0, 1.6, 2.0, 1.6, 2.4];
  const numBars = heights.length;

  const barW = 0.34 * S;
  const barD = 0.34 * S;
  const gap = 0.16 * S;
  const totalW = numBars * barW + (numBars - 1) * gap;
  const startX = -totalW / 2 + barW / 2;
  const yFloor = -1.5 * S;

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

  /* ─── TREND LINE — smooth curve across the bar tops ───────────
     Particles sample a continuous position along [0..numBars-1] and
     lerp bar-top heights with a smoothstep ease, producing a wavy
     line that floats just above the bars. Rides at z=0 (front face
     plane) and slightly above yTop so it reads as a separate element. */
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
    p[idx * 3 + 1] = y + 0.2 * S + gaussRand() * 0.04 * S;
    p[idx * 3 + 2] = gaussRand() * 0.04 * S;
    idx++;
  }

  /* ─── GROUND RAILS — front + back rails on the floor ──────────
     Two parallel rails just outside the bars in z, plus a handful
     of cross particles between them. Just enough structure to
     suggest a stage without competing with the bars. */
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
