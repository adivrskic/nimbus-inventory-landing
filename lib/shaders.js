export const vertexShader = `
  attribute float aSize;

  uniform vec2  uDepthRange;       // x = focusNear, y = focusFar (view-space distance from camera)
  uniform float uDepthAlphaMin;    // alpha floor for fully-out-of-focus particles
  uniform float uPerspectiveScale; // base 1/d perspective multiplier
  uniform float uBlurExpand;       // far particles grow this much (fake bokeh, 0..1)

  varying float vDepth;            // 1 = sharp/near, 0 = blurred/far
  varying float vAlpha;

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

    gl_PointSize = aSize * persp * bokeh;

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

    float alpha = soft * vAlpha * uGlobalAlpha;
    gl_FragColor = vec4(color, min(alpha, 1.0));
  }
`;
