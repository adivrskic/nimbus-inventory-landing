/* ═══════════════════════════════════════════════════════════════════════
   PARTICLE SHADERS
   ───────────────────────────────────────────────────────────────────────
   Per-particle vertex/fragment pair used by the AISection canvas.

   Per-scene pulse effects: each scene that wants a dynamic glow gets
   its own per-particle phase attribute plus a 0..1 gate uniform. The
   shader computes that scene's pulse from its attribute, multiplies by
   the gate, and sums into a single per-particle pulse boost. Scenes
   that aren't currently rendering contribute zero because their gate
   is zero. Adding a new pulsing scene means: add a phase attribute,
   a gate uniform, a compute function, and one term in the sum.

   All four scenes wired:
     - aPhase        + uVoicePulse    — voice ring pulse (5 rings outward)
     - aSpatialPhase + uSpatialPulse  — spatial cube diagonal scan plane
     - aSearchPhase  + uSearchPulse   — search sonar ripple from lens center
     - aChartPhase   + uChartPulse    — chart left→right reveal sweep
   ═══════════════════════════════════════════════════════════════════════ */

export const vertexShader = `
   attribute float aSize;
   attribute float aPhase;           // voice ring index (0..4), -1 otherwise
   attribute float aSpatialPhase;    // spatial diagonal position (0..1), -1 otherwise
   attribute float aSearchPhase;     // search radial distance from lens center (0..1), -1 otherwise
   attribute float aChartPhase;      // chart normalized x position (0..1), -1 otherwise
 
   uniform vec2  uDepthRange;        // x = focusNear, y = focusFar (view-space distance from camera)
   uniform float uDepthAlphaMin;     // alpha floor for fully-out-of-focus particles
   uniform float uPerspectiveScale;  // base 1/d perspective multiplier
   uniform float uBlurExpand;        // far particles grow this much (fake bokeh, 0..1)
   uniform float uTime;              // shared shader clock, seconds since startup
   uniform float uVoicePulse;        // 0..1 gate for the voice ring pulse
   uniform float uSpatialPulse;      // 0..1 gate for the spatial cube scan pulse
   uniform float uSearchPulse;       // 0..1 gate for the search sonar ripple
   uniform float uChartPulse;        // 0..1 gate for the chart reveal sweep
 
   varying float vDepth;             // 1 = sharp/near, 0 = blurred/far
   varying float vAlpha;
   varying float vPulse;             // combined per-particle pulse intensity, read by fragment shader
 
   /* Voice ring pulse — a traveling gaussian peak moves through ring
      indices 0 → 1 → 2 → 3 → 4 → (1-unit pause) → loop. 2-second cycle. */
   float computeVoicePulse(float phase) {
     if (phase < 0.0) return 0.0;
     float pulsePos = mod(uTime * 3.0, 6.0);
     float dist = abs(pulsePos - phase);
     return exp(-dist * dist * 5.0);
   }
 
   /* Spatial cube scan — a plane sweeps along the cube's (1,1,1) space
      diagonal and reverses. Triangle wave, continuous, ~3-second cycle.
      Sharp falloff (30) so it reads as a defined slice of light. */
   float computeSpatialPulse(float phase) {
     if (phase < 0.0) return 0.0;
     float cyclePos = mod(uTime * 0.7, 2.0);
     float pulsePos = cyclePos < 1.0 ? cyclePos : 2.0 - cyclePos;
     float dist = abs(pulsePos - phase);
     return exp(-dist * dist * 30.0);
   }
 
   /* Search sonar ripple — a ring of light expands outward from the lens
      center (phase 0) across the data grid (phase →1), passing through
      the lens rim on the way out. Sawtooth with a pause beyond 1.0 then
      reset. ~2.6-second cycle. Moderate falloff (22) — a soft expanding
      band. */
   float computeSearchPulse(float phase) {
     if (phase < 0.0) return 0.0;
     float ripplePos = mod(uTime * 0.5, 1.3);
     float dist = abs(ripplePos - phase);
     return exp(-dist * dist * 22.0);
   }
 
   /* Chart reveal sweep — a vertical pulse line travels left → right
      across normalized x. Bars light up in sequence, then the trend,
      then the forecast arrow last — "history fills in, forecast
      projects." Sawtooth with a pause beyond 1.0 before reset, so it's
      always a left-to-right reveal rather than a bounce. ~3.3-second
      cycle. Moderate-tight falloff (16) so the reveal front is a
      readable vertical band. */
   float computeChartPulse(float phase) {
     if (phase < 0.0) return 0.0;
     float sweepPos = mod(uTime * 0.45, 1.5);
     float dist = abs(sweepPos - phase);
     return exp(-dist * dist * 16.0);
   }
 
   void main() {
     vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
     float depth = -mvPos.z;
 
     // 1.0 when closer than focusNear, 0.0 past focusFar, smoothstep between.
     float depthNorm = 1.0 - smoothstep(uDepthRange.x, uDepthRange.y, depth);
     vDepth = depthNorm;
 
     // Standard perspective foreshortening, clamped to avoid extremes.
     float persp = clamp(uPerspectiveScale / max(depth, 1.0), 0.25, 3.0);
 
     // Bokeh expansion: out-of-focus particles grow slightly so their soft
     // edges have room to spread instead of collapsing to a single pixel.
     float bokeh = 1.0 + (1.0 - depthNorm) * uBlurExpand;
 
     /* Sum each scene's pulse, gated by its own uniform. Scenes that
        aren't active contribute zero. During transitions multiple gates
        can be non-zero, giving a clean cross-fade between scene glows. */
     float voiceBoost = computeVoicePulse(aPhase) * uVoicePulse;
     float spatialBoost = computeSpatialPulse(aSpatialPhase) * uSpatialPulse;
     float searchBoost = computeSearchPulse(aSearchPhase) * uSearchPulse;
     float chartBoost = computeChartPulse(aChartPhase) * uChartPulse;
     float pulseBoost = voiceBoost + spatialBoost + searchBoost + chartBoost;
     vPulse = pulseBoost;
 
     // Pulse boosts particle size up to ~2x at peak. Combined with the
     // fragment-shader color/alpha boost, this reads as a glow without
     // blowing out the rest of the scene.
     gl_PointSize = aSize * persp * bokeh * (1.0 + pulseBoost * 1.0);
 
     // Bright in focus, dim at the back — atmospheric perspective.
     // uDepthAlphaMin keeps far particles as soft atmosphere rather than 0.
     vAlpha = mix(uDepthAlphaMin, 1.0, depthNorm);
 
     gl_Position = projectionMatrix * mvPos;
   }
 `;

export const fragmentShader = `
   uniform float uColorMix;
   uniform vec3  uAccentColor;
   uniform float uGlobalAlpha;
   uniform float uBlurSoftness;     // 0..0.5 — width of the soft-edge zone for far particles
 
   varying float vDepth;
   varying float vAlpha;
   varying float vPulse;            // 0..1 combined pulse intensity for this particle
 
   void main() {
     float d = length(gl_PointCoord - 0.5);
     if (d > 0.5) discard;
 
     // Where the disk starts going transparent.
     //   Near particles (vDepth=1): edgeStart = 0.42 → narrow gradient = sharp dot
     //   Far  particles (vDepth=0): edgeStart = 0.5 - uBlurSoftness → wide gradient = blurry blob
     float edgeStart = mix(0.5 - uBlurSoftness, 0.42, vDepth);
     float soft = smoothstep(0.5, edgeStart, d);
 
     // Base color is a dimmed version of the accent — every particle reads
     // as gold, with formation controlling brightness within the gold range
     // rather than transitioning from gray to gold. Matches the footer's
     // "always gold" particle look.
     vec3 baseColor = uAccentColor * 0.5;
     vec3 color = mix(baseColor, uAccentColor, uColorMix);
 
     // Pulse adds a hot brightness on top of base color so peak particles
     // read as gold-on-the-edge-of-white rather than just larger. The
     // alpha boost gives additional luminance without losing the soft-disc
     // falloff. Same fragment formula serves every scene's pulse — they all
     // feed into vPulse the same way.
     color += uAccentColor * vPulse * 0.45;
     float alpha = soft * vAlpha * uGlobalAlpha * (1.0 + vPulse * 0.3);
 
     gl_FragColor = vec4(color, min(alpha, 1.0));
   }
 `;
