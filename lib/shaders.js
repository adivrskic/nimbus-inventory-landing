export const vertexShader = `
  attribute float aSize;
  varying float vAlpha;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    float depth = -mvPos.z;
    float depthScale = clamp(22.0 / depth, 0.3, 2.5);
    gl_PointSize = aSize * depthScale * 1.8;
    vAlpha = clamp(1.6 - depth * 0.025, 0.03, 0.50);
    gl_Position = projectionMatrix * mvPos;
  }
`;

export const fragmentShader = `
  uniform float uColorMix;
  uniform vec3 uAccentColor;
  uniform float uGlobalAlpha;
  uniform float uSheen;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.15, d);
    vec3 darkColor = vec3(0.18, 0.18, 0.18);
    vec3 color = mix(darkColor, uAccentColor, uColorMix);
    // Sheen: brief brightness + glow boost when shape forms
    float sheenBoost = uSheen * 0.6;
    color = mix(color, uAccentColor, uSheen * 0.5);
    float alpha = soft * vAlpha * uGlobalAlpha + sheenBoost * soft;
    gl_FragColor = vec4(color, min(alpha, 1.0));
  }
`;
