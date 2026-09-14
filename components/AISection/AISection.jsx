"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./AISection.module.css";
import { useAnimationPaused } from "@/lib/AnimationContext";
import { track } from "@/lib/analytics";

/* ═══════════════════════════════════════════════════════════════════════
   AISection — "SOUNDINGS"

   The intelligence engine rendered as living bathymetry: one continuous
   ocean-floor terrain, drawn as a nautical contour chart, that RESHAPES
   itself for each capability as you scroll. No particles, no icons —
   the same seafloor becomes:

     01 SCAN      interfering ripple fields (three sources) — a scan's
                  update spreading out, breathing slowly
     02 SPATIAL   a rectilinear rack-city of plateaus — the warehouse
                  as terrain
     03 SEARCH    a single seamount spiking out of a calm floor, with
                  a sonar ring travelling out from it
     04 FORECAST  a swell building toward the horizon — near water is
                  today, the far ridge is next week

   Rendering: ONE indexed plane mesh, one custom ShaderMaterial. The
   vertex shader blends two procedural heightfields (uSceneA→uSceneB by
   uBlend, driven by scroll); the fragment shader draws bathymetric
   iso-lines (minor/major contours via fwidth-AA), a faint graticule,
   and a horizon fog fade. Gold is reserved for contour crests.

   The DOM chrome is chart furniture: a HUD strip, a caption stack that
   crossfades per beat, and a depth-gauge progress rail on the right
   (buttons — keyboard jumpable).

   Perf contract: rAF PARKS entirely when the section is off-screen and
   is resumed by the IntersectionObserver; the animation-paused context
   (which also covers prefers-reduced-motion) freezes ambient time but
   still honours scroll scrubbing (direct manipulation, not autoplay).
   ═══════════════════════════════════════════════════════════════════════ */

/* Each beat carries its own visual signature so the four capabilities
   read as four distinct instruments, not one terrain with four names:
   - accent: the crest/chrome ink (hex + CSS string, blended on scroll)
   - contour: iso-line density (tight = architectural, sparse = calm)
   - cam / look: camera framing preset (blended with the terrain morph)
   All three interpolate through the same uBlend window as the
   heightfield, so shape, color, line-weight and viewpoint move as one. */
/* Copy describes only what the app actually does. Beat 01 used to be "Voice
   commands", and Nautilus has no voice feature — it's scanning now, which
   the ripple field reads just as well (one scan's update spreading out).

   `readout` is a worked example shown in the HUD strip; its numbers are
   illustrative data, like the Chart Room's bay counts, not claims. `marks`
   pin labels to the terrain: a point in the plane coordinates the shaders
   take (p = position.xy) plus its text — see surfaceHeight() for the surface. */
const BEATS = [
  {
    key: "scan",
    num: "01",
    label: "SCAN",
    hud: "SCAN FEED · LIVE",
    title: "Scan once, done",
    desc: "One scan updates the item's count, its location, and the audit log together.",
    readout: ["RECEIVE · SKU 2210 · +24", "BAY B-2 · ON HAND 33 · LOGGED"],
    marks: [{ x: 2, y: -10, text: "SCAN · BAY B-2" }],
    accent: 0x7fc9e4, // sonar ice-blue — a scan's update rippling out
    contour: 0.9,
    cam: { x: 0, y: 30, z: 98 }, // wide, level — watching ripples arrive
    look: { x: 0, y: 2, z: -6 },
  },
  {
    key: "spatial",
    num: "02",
    label: "SPATIAL",
    hud: "RACK TOPOGRAPHY · LIVE",
    title: "Your floor, modeled",
    desc: "Draw your layout — or import it from a floor plan image — and see every section, bay, and level in 2D or 3D.",
    readout: ["FLOOR PLAN IMPORTED · 6 SECTIONS", "ZONE C · AISLE 04 · 3 LEVELS"],
    marks: [{ x: 18, y: 1, h: 13, text: "ZONE C" }],
    accent: 0xd4a853, // brand gold — the warehouse beat
    contour: 1.35,
    cam: { x: -10, y: 54, z: 72 }, // high survey angle over the rack city
    look: { x: 0, y: 0, z: -16 },
  },
  {
    key: "search",
    num: "03",
    label: "SEARCH",
    hud: "SOUNDING · ONE RESULT",
    title: "Ask in plain English",
    desc: "Type it the way you'd say it and get the products, locations, or scans that match.",
    readout: [
      "Q: “PRODUCTS LOW ON STOCK IN AISLE 3”",
      "4 PRODUCTS · AT OR BELOW REORDER POINT",
    ],
    marks: [{ x: 24, y: -6, text: "RESULT" }],
    accent: 0x8fe3b0, // sonar green
    contour: 0.65,
    cam: { x: 12, y: 22, z: 86 }, // low drift toward the lone seamount
    look: { x: 18, y: 5, z: 2 },
  },
  {
    key: "forecast",
    num: "04",
    label: "FORECAST",
    hud: "SWELL MODEL · DEMAND FORECAST",
    title: "See demand coming",
    desc: "Forecasts that account for trend and seasonality, reorder points with safety stock, and purchase orders drafted for your review.",
    readout: ["SKU 0087 · REORDER POINT IN ~5 DAYS", "PURCHASE ORDER DRAFTED · READY FOR REVIEW"],
    marks: [
      { x: 0, y: -40, text: "TODAY" },
      { x: 0, y: 55, text: "AHEAD" },
    ],
    accent: 0xe09a5f, // storm-warning amber
    contour: 1.1,
    cam: { x: 0, y: 13, z: 106 }, // down at the waterline, facing the swell
    look: { x: 0, y: 9, z: -44 },
  },
];

const N = BEATS.length;

/* Every terrain label, flattened and tagged with the beat it belongs to. */
const MARKS = BEATS.flatMap((b, beat) =>
  (b.marks || []).map((m) => ({ ...m, beat }))
);

/* JS twins of the vertex shader's heightfields (below), used only to
   stand the terrain labels on the surface. The spatial scene's plateau
   heights come from a per-cell hash that GPU and JS floats don't agree
   on, so marks on that beat carry an explicit `h` instead, and this
   returns only its shared basin. */
function surfaceHeight(scene, x, y, t) {
  if (scene === 0) {
    const d0 = Math.hypot(x + 34, y - 6);
    const d1 = Math.hypot(x - 2, y + 10);
    const d2 = Math.hypot(x - 40, y - 12);
    let h =
      Math.sin(d0 * 0.4 - t * 1.5) * Math.exp(-d0 * 0.03) * 7 +
      Math.sin(d1 * 0.46 - t * 1.9 + 1.7) * Math.exp(-d1 * 0.026) * 7.5 +
      Math.sin(d2 * 0.36 - t * 1.3 + 3.1) * Math.exp(-d2 * 0.032) * 6;
    h *= 0.72 + 0.28 * Math.sin(t * 0.6);
    return h + 1.5;
  }
  if (scene === 1) {
    return 0.6 * Math.sin(x * 0.05) * Math.sin(y * 0.06);
  }
  if (scene === 2) {
    const d = Math.hypot(x - 24, y + 6);
    const spike = Math.exp(-d * d * 0.01) * 16;
    const ring = Math.sin(d * 0.5 - t * 2) * Math.exp(-d * 0.045) * 1.8;
    const calm = Math.sin(x * 0.09 + t * 0.2) * Math.cos(y * 0.08) * 0.7;
    return calm + spike + ring;
  }
  const z01 = Math.min(1, Math.max(0, (y + 80) / 160));
  const amp = 0.6 + 9.4 * z01 * z01;
  let h = Math.sin(x * 0.1 + y * 0.05 + t * 0.45) * amp * 0.7;
  h += Math.sin(x * 0.21 - y * 0.11 - t * 0.3 + 1.3) * amp * 0.3;
  return h + z01 * 5 - 1;
}

/* Palette (kept in one place so the shader and CSS agree). Deep-ocean
   navy ground, pale chart ink; the crest color is per-beat (see BEATS,
   surfaced to CSS as --beat-accent on the stage). */
const COL = {
  bg: 0x04101f,
  inkLow: 0x24425e,
  inkHigh: 0xb9d0e2,
};

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSceneA;
  uniform float uSceneB;
  uniform float uBlend;
  uniform float uReveal;

  varying float vH;
  varying vec3  vPos;
  varying float vDist;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  /* 01 — scan ripples: three ring-wave sources along a rough
     line, each damped with radius, the whole field breathing slowly
     like a slow pulse. */
  float hVoice(vec2 p, float t) {
    float h = 0.0;
    float d0 = length(p - vec2(-34.0, 6.0));
    float d1 = length(p - vec2(2.0, -10.0));
    float d2 = length(p - vec2(40.0, 12.0));
    h += sin(d0 * 0.40 - t * 1.5)        * exp(-d0 * 0.030) * 7.0;
    h += sin(d1 * 0.46 - t * 1.9 + 1.7)  * exp(-d1 * 0.026) * 7.5;
    h += sin(d2 * 0.36 - t * 1.3 + 3.1)  * exp(-d2 * 0.032) * 6.0;
    h *= 0.72 + 0.28 * sin(t * 0.6);
    return h + 1.5;
  }

  /* 02 — rack city: a staggered grid of flat-topped plateaus separated
     by aisle channels; heights vary per block, with a barely-there
     per-block breathing so it reads alive, not frozen. */
  float hSpatial(vec2 p, float t) {
    vec2 q = p + vec2(9.0, 12.0);
    vec2 cell = vec2(18.0, 26.0);
    vec2 g = floor(q / cell);
    vec2 f = fract(q / cell) - 0.5;
    float rx = smoothstep(0.40, 0.26, abs(f.x));
    float rz = smoothstep(0.34, 0.22, abs(f.y));
    float hgt = 4.0 + 7.0 * hash21(g);
    float pulse = 1.0 + 0.05 * sin(t * 0.9 + hash21(g.yx) * 6.283);
    float basin = 0.6 * sin(p.x * 0.05) * sin(p.y * 0.06);
    return rx * rz * hgt * pulse + basin;
  }

  /* 03 — the answer: a calm abyssal floor with ONE seamount, and a
     sonar ring travelling outward from it. */
  float hSearch(vec2 p, float t) {
    vec2 tgt = vec2(24.0, -6.0);
    float d = length(p - tgt);
    float spike = exp(-d * d * 0.010) * 16.0;
    float ring  = sin(d * 0.5 - t * 2.0) * exp(-d * 0.045) * 1.8;
    float calm  = sin(p.x * 0.09 + t * 0.2) * cos(p.y * 0.08) * 0.7;
    return calm + spike + ring;
  }

  /* 04 — forecast swell: amplitude grows with distance toward the
     horizon (p.y maps to -z, i.e. far away). Near water is settled
     history; the far ridgeline is the projected future. */
  float hForecast(vec2 p, float t) {
    float z01 = clamp((p.y + 80.0) / 160.0, 0.0, 1.0);
    float amp = mix(0.6, 10.0, z01 * z01);
    float h = sin(p.x * 0.10 + p.y * 0.05 + t * 0.45) * amp * 0.7;
    h += sin(p.x * 0.21 - p.y * 0.11 - t * 0.3 + 1.3) * amp * 0.3;
    return h + z01 * 5.0 - 1.0;
  }

  float sceneH(vec2 p, float s, float t) {
    if (s < 0.5) return hVoice(p, t);
    if (s < 1.5) return hSpatial(p, t);
    if (s < 2.5) return hSearch(p, t);
    return hForecast(p, t);
  }

  void main() {
    vec2 p = position.xy;
    float h = mix(sceneH(p, uSceneA, uTime), sceneH(p, uSceneB, uTime), uBlend);
    h *= uReveal;

    /* Geometry is an unrotated XY plane; map it onto the ground here
       (y-up, far edge at -z) so no mesh rotation bookkeeping exists. */
    vec3 world = vec3(p.x, h, -p.y);
    vH = h;
    vPos = world;

    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    vDist = length(mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3  uBg;
  uniform vec3  uInkLow;
  uniform vec3  uInkHigh;
  uniform vec3  uAccent;    // per-beat crest ink, blended JS-side on scroll
  uniform float uReveal;
  uniform float uContour;   // iso-line density (lines per height unit)

  varying float vH;
  varying vec3  vPos;
  varying float vDist;

  /* Distance to the nearest integer of v, resolved to a crisp AA line
     via a width derived from screen-space derivatives. */
  float isoLine(float v, float boost) {
    float f = fract(v);
    float d = min(f, 1.0 - f);
    float w = fwidth(v) * boost + 0.012;
    return 1.0 - smoothstep(0.0, w, d);
  }

  void main() {
    float hn = clamp((vH + 9.0) / 26.0, 0.0, 1.0);

    // Bathymetric contours: minor lines every unit, majors every 5th.
    float minor = isoLine(vH * uContour, 1.4);
    float major = isoLine(vH * uContour * 0.2, 1.6);

    // Faint chart graticule on the ground plane.
    float gx = isoLine(vPos.x * 0.045, 1.5);
    float gz = isoLine(vPos.z * 0.045, 1.5);
    float grat = max(gx, gz);

    // Depth-tinted fill, barely lighter than the page ground.
    vec3 col = mix(uBg * 1.25, uInkLow * 0.55, hn * 0.55);
    col = mix(col, uInkLow, grat * 0.22);

    // Contour ink: pale in the deeps, igniting to the beat accent at
    // the crests — ice for scan, gold for spatial, sonar green for
    // search, storm amber for forecast.
    vec3 crest = mix(uInkHigh, uAccent, smoothstep(0.52, 0.92, hn));
    col = mix(col, mix(uInkLow, crest, 0.55), minor * 0.65);
    col = mix(col, crest, major * 0.9);

    // Horizon fog — dissolve into the section ground so the terrain
    // has no visible far edge.
    float fogF = smoothstep(85.0, 230.0, vDist);
    col = mix(col, uBg, fogF);
    float alpha = (1.0 - fogF) * uReveal;

    gl_FragColor = vec4(col, alpha);
  }
`;

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export default function AISection() {
  const sectionRef = useRef(null);
  const spaceRef = useRef(null);
  const stageRef = useRef(null);
  const hostRef = useRef(null);
  const gaugeFillRef = useRef(null);
  const markRefs = useRef([]);
  const { paused } = useAnimationPaused();
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const visibleRef = useRef(false);
  const resumeRef = useRef(null);

  /* Jump the page so beat i sits at the start of its hold window. */
  const jumpTo = useCallback((i) => {
    const space = spaceRef.current;
    if (!space) return;
    const top = space.getBoundingClientRect().top + window.scrollY;
    const range = space.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + ((i + 0.04) / N) * range,
      behavior: "smooth",
    });
  }, []);

  /* Skip past this long pinned ride to Features. Through Lenis when it's
     running — a native smooth scroll fights Lenis's own position. */
  const skipPast = useCallback(() => {
    const target = document.getElementById("features");
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY;
    track("section_skip", { section: "ai_engine" });
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  /* Off-screen parking: flip the visibility flag and wake the render
     loop on re-entry. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) resumeRef.current?.();
      },
      { rootMargin: "160px 0px" }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  /* WebGL terrain — loaded on the first scroll, not on mount.
     three.js is ~730 KB of script. Importing it on mount made every home
     visit download, parse and run it during the initial load (with this
     component's setup, ~0.9 s of main-thread time in Lighthouse's throttled
     mobile run) even for visitors who never scroll past the hero. This
     section sits directly under the hero, so starting on the first scroll
     still lands it before the stage is on screen; uReveal fades the terrain
     in whenever it arrives, and the navy ground + DOM chrome stand on their
     own until then. webpackExports trims the chunk to the classes used
     below instead of the whole library. */
  useEffect(() => {
    let cleanup;
    let cancelled = false;

    const init = async () => {
      const THREE = await import(
        /* webpackExports: ["Color", "Mesh", "PerspectiveCamera", "PlaneGeometry", "Scene", "ShaderMaterial", "Vector3", "WebGLRenderer"] */
        "three"
      );
      if (cancelled || !hostRef.current) return;

      const host = hostRef.current;
      const isMobile = window.innerWidth < 768;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
      } catch {
        return; // no WebGL — the CSS ground + DOM chrome stand alone
      }
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 600);
      camera.position.set(BEATS[0].cam.x, BEATS[0].cam.y, BEATS[0].cam.z);
      const look = new THREE.Vector3(
        BEATS[0].look.x,
        BEATS[0].look.y,
        BEATS[0].look.z
      );
      camera.lookAt(look);

      /* Per-beat blend sources, built once. */
      const ACCENTS = BEATS.map((b) => new THREE.Color(b.accent));
      const lookT = new THREE.Vector3();
      const markVec = new THREE.Vector3();
      let lastAccent = "";

      const geo = new THREE.PlaneGeometry(
        260,
        160,
        isMobile ? 150 : 256,
        isMobile ? 92 : 160
      );
      const uniforms = {
        uTime: { value: 0 },
        uSceneA: { value: 0 },
        uSceneB: { value: 1 },
        uBlend: { value: 0 },
        uReveal: { value: 0 },
        uContour: { value: BEATS[0].contour },
        uBg: { value: new THREE.Color(COL.bg) },
        uInkLow: { value: new THREE.Color(COL.inkLow) },
        uInkHigh: { value: new THREE.Color(COL.inkHigh) },
        uAccent: { value: new THREE.Color(BEATS[0].accent) },
      };
      const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      const resize = () => {
        const w = host.clientWidth || 1;
        const h = host.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);

      /* Pointer parallax — small camera drift toward the cursor. */
      const pointer = { x: 0, y: 0 };
      const onPointer = (e) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      let rafId = 0;
      let running = false;
      let t = 0;
      let last = performance.now();
      let lastProgress = -1;

      /* Edge blending. The navy ground and the vignette both fade out
         across the first/last EDGE_FADE of the ride, so at the section
         boundaries the page's own ocean gradient shows through and the
         seam disappears. Deliberately narrow — the section still reads
         as solid navy for ~88% of the scroll, which is what we want;
         only the hand-off is soft. (Fading to a hardcoded black was the
         earlier mistake: the neighbouring sections aren't black, they
         sit on a document-wide gradient, so any fixed colour is wrong
         at one end or the other.) */
      const EDGE_FADE = 0.06;
      let lastStageOpacity = -1;

      const frame = (now) => {
        if (!visibleRef.current) {
          running = false; // park — IntersectionObserver resumes us
          return;
        }
        rafId = requestAnimationFrame(frame);

        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        /* Scroll → beat state. Read layout once per frame (cheap: one
           getBoundingClientRect on the scroll space). */
        const space = spaceRef.current;
        if (!space) return;
        const rect = space.getBoundingClientRect();
        const range = space.offsetHeight - window.innerHeight;
        const p = clamp01(range > 0 ? -rect.top / range : 0);

        const frozen = pausedRef.current;
        if (!frozen) t += dt;
        else if (Math.abs(p - lastProgress) < 0.0004 && lastProgress >= 0)
          return; // paused + no scroll movement → skip the redraw
        lastProgress = p;

        /* Stage opacity ramp — 0 at both extremes, 1 across the body of the
           ride, smoothstepped so there's no visible knee. */
        const eK = clamp01(Math.min(p / EDGE_FADE, (1 - p) / EDGE_FADE));
        const stageOpacity = eK * eK * (3 - 2 * eK);
        if (Math.abs(stageOpacity - lastStageOpacity) > 0.002) {
          lastStageOpacity = stageOpacity;
          if (stageRef.current)
            stageRef.current.style.opacity = stageOpacity.toFixed(3);
        }

        const f = Math.min(p * N, N - 0.0001);
        const idx = Math.floor(f);
        const local = f - idx;
        const nidx = Math.min(idx + 1, N - 1);
        uniforms.uSceneA.value = idx;
        uniforms.uSceneB.value = nidx;
        /* Hold each floor, then morph in the last quarter of the beat. */
        const b = clamp01((local - 0.72) / 0.26);
        const eb = b * b * (3 - 2 * b);
        uniforms.uBlend.value = eb;
        uniforms.uTime.value = t;

        /* Beat signature: accent ink + contour density ride the same
           morph window as the terrain, so color and line-weight arrive
           WITH the new floor, not before or after it. */
        const beatA = BEATS[idx];
        const beatB = BEATS[nidx];
        uniforms.uAccent.value.copy(ACCENTS[idx]).lerp(ACCENTS[nidx], eb);
        uniforms.uContour.value =
          beatA.contour + (beatB.contour - beatA.contour) * eb;
        const aCss = `#${uniforms.uAccent.value.getHexString()}`;
        if (aCss !== lastAccent && stageRef.current) {
          stageRef.current.style.setProperty("--beat-accent", aCss);
          lastAccent = aCss;
        }
        uniforms.uReveal.value = Math.min(
          1,
          uniforms.uReveal.value + dt * 0.8
        );

        /* DOM sync: active caption + depth-gauge fill. */
        const domIdx = Math.min(N - 1, local > 0.86 ? idx + 1 : idx);
        if (domIdx !== activeRef.current) {
          activeRef.current = domIdx;
          setActive(domIdx);
        }
        if (gaugeFillRef.current)
          gaugeFillRef.current.style.height = `${p * 100}%`;

        /* Camera: per-beat framing preset (blended through the morph)
           + pointer parallax + a slow breathing bob. The same 0.04
           damping that used to smooth the parallax now also carries the
           beat-to-beat reframing, so viewpoint changes feel piloted. */
        const px = frozen ? 0 : pointer.x;
        const py = frozen ? 0 : pointer.y;
        const cx = beatA.cam.x + (beatB.cam.x - beatA.cam.x) * eb;
        const cy = beatA.cam.y + (beatB.cam.y - beatA.cam.y) * eb;
        const cz = beatA.cam.z + (beatB.cam.z - beatA.cam.z) * eb;
        camera.position.x += (cx + px * 6 - camera.position.x) * 0.04;
        camera.position.y +=
          (cy - py * 3 + (frozen ? 0 : Math.sin(t * 0.3) * 0.8) -
            camera.position.y) *
          0.04;
        camera.position.z += (cz - camera.position.z) * 0.04;
        lookT.set(
          beatA.look.x + (beatB.look.x - beatA.look.x) * eb,
          beatA.look.y + (beatB.look.y - beatA.look.y) * eb,
          beatA.look.z + (beatB.look.z - beatA.look.z) * eb
        );
        look.lerp(lookT, 0.04);
        camera.lookAt(look);

        /* Terrain labels: stand each mark on the blended surface, project
           it to the screen, and fade it with its beat. */
        camera.updateMatrixWorld();
        const hostW = host.clientWidth;
        const hostH = host.clientHeight;
        const reveal = uniforms.uReveal.value;
        MARKS.forEach((m, i) => {
          const el = markRefs.current[i];
          if (!el) return;
          const weight =
            m.beat === idx && m.beat === nidx
              ? 1
              : m.beat === idx
                ? 1 - eb
                : m.beat === nidx
                  ? eb
                  : 0;
          let alpha = 0;
          if (weight > 0.001) {
            const hOf = (s) =>
              s === m.beat && m.h !== undefined
                ? m.h
                : surfaceHeight(s, m.x, m.y, t);
            const h = (hOf(idx) + (hOf(nidx) - hOf(idx)) * eb) * reveal;
            markVec.set(m.x, h, -m.y).project(camera);
            if (
              markVec.z < 1 &&
              Math.abs(markVec.x) < 1.05 &&
              Math.abs(markVec.y) < 1.05
            ) {
              alpha = weight * reveal;
              const sx = (markVec.x * 0.5 + 0.5) * hostW;
              const sy = (-markVec.y * 0.5 + 0.5) * hostH;
              el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
            }
          }
          el.style.opacity = alpha.toFixed(3);
        });

        renderer.render(scene, camera);
      };

      const start = () => {
        if (running) return;
        running = true;
        last = performance.now();
        rafId = requestAnimationFrame(frame);
      };
      resumeRef.current = start;
      start();

      cleanup = () => {
        cancelAnimationFrame(rafId);
        resumeRef.current = null;
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointer);
        geo.dispose();
        mat.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === host)
          host.removeChild(renderer.domElement);
      };
    };

    let started = false;
    const onScroll = () => {
      if (window.scrollY > 0) go();
    };
    const go = () => {
      if (started) return;
      started = true;
      window.removeEventListener("scroll", onScroll);
      init();
    };
    /* A restored or hash-linked load can arrive already scrolled, with no
       scroll event still to come — start straight away. */
    if (window.scrollY > 0) go();
    else window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      cleanup?.();
    };
  }, []);

  const beat = BEATS[active];

  return (
    <section
      ref={sectionRef}
      id="ai-engine"
      className={styles.section}
      aria-label="The Nautilus intelligence engine"
    >
      <div ref={spaceRef} className={styles.space}>
        {/* data-reveal-exempt: this stage is *meant* to sit at opacity 0
            at the section's edges (see EDGE_FADE) — RevealGuarantee must
            not "rescue" it. */}
        <div ref={stageRef} className={styles.stage} data-reveal-exempt>
          <div ref={hostRef} className={styles.canvasHost} aria-hidden="true" />
          <div className={styles.vignette} aria-hidden="true" />

          {/* Terrain labels — positioned every frame by the render loop. */}
          <div className={styles.marks} aria-hidden="true">
            {MARKS.map((m, i) => (
              <span
                key={`${m.beat}-${m.text}`}
                ref={(el) => (markRefs.current[i] = el)}
                className={styles.mark}
              >
                <span className={styles.markText}>{m.text}</span>
              </span>
            ))}
          </div>

          {/* HUD strip — chart-instrument header. The live label is the
              section's h2; without one, the beat titles below were h3s
              sitting straight under the hero's h1. */}
          <div className={styles.hud}>
            <h2 className={styles.hudLive}>
              <span className={styles.hudDot} />
              The intelligence engine
            </h2>
            <span className={styles.hudRight}>
              <span className={styles.hudReadout} key={beat.key}>
                {beat.hud}
              </span>
              <button
                type="button"
                className={styles.skip}
                onClick={skipPast}
              >
                Skip <span aria-hidden="true">↓</span>
              </button>
            </span>
          </div>

          {/* A worked example for the active beat. Its numbers are
              illustrative, like the Chart Room's bay counts; decorative,
              because the caption below says the same thing in words. */}
          <div
            className={styles.readout}
            key={`readout-${beat.key}`}
            aria-hidden="true"
          >
            {beat.readout.map((line, i) => (
              <span
                key={line}
                className={styles.readoutLine}
                style={{ animationDelay: `${0.1 + i * 0.4}s` }}
              >
                {line}
              </span>
            ))}
          </div>

          {/* Caption stack — one layer per beat, crossfaded */}
          <div className={styles.caption}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowIndex}>
                {beat.num} <em>/ 0{N}</em>
              </span>
              <span className={styles.eyebrowRule} aria-hidden="true" />
              <span className={styles.eyebrowLabel}>{beat.label}</span>
            </div>
            <div className={styles.titles}>
              {BEATS.map((b, i) => (
                <div
                  key={b.key}
                  className={`${styles.titleLayer} ${
                    i === active
                      ? styles.titleActive
                      : i < active
                        ? styles.titleAbove
                        : styles.titleBelow
                  }`}
                  aria-hidden={i !== active}
                >
                  <h3 className={styles.title}>{b.title}</h3>
                  <p className={styles.desc}>{b.desc}</p>
                </div>
              ))}
            </div>

            {/* End of the ride — hand off to the assistant. Always laid out
                (invisible until the last beat) so the caption never jumps. */}
            <button
              type="button"
              className={`${styles.cta} ${active === N - 1 ? styles.ctaOn : ""}`}
              tabIndex={active === N - 1 ? 0 : -1}
              aria-hidden={active === N - 1 ? undefined : "true"}
              onClick={() => {
                track("chat_open_cta", { cta_source: "ai_engine" });
                window.dispatchEvent(new Event("open-chat"));
              }}
            >
              Ask Nautilus anything <span aria-hidden="true">→</span>
            </button>
          </div>

          {/* Depth gauge — progress + beat jump */}
          <div className={styles.gauge} aria-label="Capabilities">
            <div className={styles.gaugeTrack} aria-hidden="true">
              <div ref={gaugeFillRef} className={styles.gaugeFill} />
            </div>
            <div className={styles.gaugeStops}>
              {BEATS.map((b, i) => (
                <button
                  key={b.key}
                  type="button"
                  className={`${styles.gaugeStop} ${
                    i === active ? styles.gaugeStopActive : ""
                  }`}
                  aria-label={`${b.title} (${b.num} of 0${N})`}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => jumpTo(i)}
                >
                  <span className={styles.gaugeNum}>{b.num}</span>
                  <span className={styles.gaugeTick} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
