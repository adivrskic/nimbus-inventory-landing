export const vertexShader = `
  attribute float aSize;
  attribute float aPhase;          // ring index (0..4) for voice ring particles, -1 otherwise

  uniform vec2  uDepthRange;       // x = focusNear, y = focusFar (view-space distance from camera)
  uniform float uDepthAlphaMin;    // alpha floor for fully-out-of-focus particles
  uniform float uPerspectiveScale; // base 1/d perspective multiplier
  uniform float uBlurExpand;       // far particles grow this much (fake bokeh, 0..1)
  uniform float uTime;             // seconds since startup, drives the voice ring pulse
  uniform float uVoicePulse;       // 0..1 gate — only apply pulse when voice scene is active

  varying float vDepth;            // 1 = sharp/near, 0 = blurred/far
  varying float vAlpha;
  varying float vPulse;            // pulse intensity for this particle, passed to fragment

  /* Pulse formula: a peak that travels through ring indices 0→4 with a
     brief pause before restarting (uses modulo 6 over 5 rings). Each ring
     brightens as the peak passes through it. */
  float computePulse(float phase) {
    if (phase < 0.0) return 0.0;
    float pulsePos = mod(uTime * 3.0, 6.0);      // ~2-second cycle: 5 rings + 1-unit pause
    float dist = abs(pulsePos - phase);
    return exp(-dist * dist * 5.0);              // gaussian peak, sharp enough to feel like a wave
  }

  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    float depth = -mvPos.z;

    float depthNorm = 1.0 - smoothstep(uDepthRange.x, uDepthRange.y, depth);
    vDepth = depthNorm;

    float persp = clamp(uPerspectiveScale / max(depth, 1.0), 0.25, 3.0);
    float bokeh = 1.0 + (1.0 - depthNorm) * uBlurExpand;

    float pulseBoost = computePulse(aPhase) * uVoicePulse;
    vPulse = pulseBoost;

    /* Pulse boosts particle size up to ~2x at peak. Combined with the
       fragment-shader color/alpha boost, this reads as a glow without
       blowing out the rest of the scene. */
    gl_PointSize = aSize * persp * bokeh * (1.0 + pulseBoost * 1.0);

    vAlpha = mix(uDepthAlphaMin, 1.0, depthNorm);

    gl_Position = projectionMatrix * mvPos;
  }
`;

export const fragmentShader = `
  uniform float uColorMix;
  uniform vec3  uAccentColor;
  uniform float uGlobalAlpha;
  uniform float uBlurSoftness;

  varying float vDepth;
  varying float vAlpha;
  varying float vPulse;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;

    float edgeStart = mix(0.5 - uBlurSoftness, 0.42, vDepth);
    float soft = smoothstep(0.5, edgeStart, d);

    vec3 baseColor = uAccentColor * 0.5;
    vec3 color = mix(baseColor, uAccentColor, uColorMix);

    /* Pulse adds a hot brightness on top of the base color, so peak
       particles read as gold-on-the-edge-of-white rather than just
       larger. Multiplicative on alpha for extra luminance. */
    color += uAccentColor * vPulse * 0.45;
    float alpha = soft * vAlpha * uGlobalAlpha * (1.0 + vPulse * 0.3);

    gl_FragColor = vec4(color, min(alpha, 1.0));
  }
`;
