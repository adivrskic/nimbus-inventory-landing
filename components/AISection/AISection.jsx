"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./AISection.module.css";
import { useAnimationPaused } from "@/lib/AnimationContext";

/* ═══════════════════════════════════════════════════════════════════════
   AISection — "SOUNDINGS"

   The intelligence engine rendered as living bathymetry: one continuous
   ocean-floor terrain, drawn as a nautical contour chart, that RESHAPES
   itself for each capability as you scroll. No particles, no icons —
   the same seafloor becomes:

     01 VOICE     interfering acoustic ripple fields (three sources,
                  breathing with a speech envelope)
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

const BEATS = [
  {
    key: "voice",
    num: "01",
    label: "VOICE",
    hud: "ACOUSTIC FIELD · LISTENING",
    title: "Voice commands",
    desc: "Nautilus processes natural speech and executes warehouse actions hands-free.",
  },
  {
    key: "spatial",
    num: "02",
    label: "SPATIAL",
    hud: "RACK TOPOGRAPHY · LIVE",
    title: "Spatial intelligence",
    desc: "A living model of your warehouse. Every section, bay, and level mapped in real time.",
  },
  {
    key: "search",
    num: "03",
    label: "SEARCH",
    hud: "SOUNDING · ONE RESULT",
    title: "Intelligent search",
    desc: "Ask anything in plain language. Searches products, locations, and history.",
  },
  {
    key: "forecast",
    num: "04",
    label: "FORECAST",
    hud: "SWELL MODEL · 14-DAY HORIZON",
    title: "Predictive analytics",
    desc: "Nautilus doesn't just report what happened — it forecasts what's next.",
  },
];

const N = BEATS.length;

/* Palette (kept in one place so the shader and CSS agree). Deep-ocean
   navy ground, pale chart ink, brand gold only at contour crests. */
const COL = {
  bg: 0x04101f,
  inkLow: 0x24425e,
  inkHigh: 0xb9d0e2,
  gold: 0xd4a853,
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

  /* 01 — acoustic interference: three ring-wave sources along a rough
     line, each damped with radius, the whole field breathing slowly
     like a speech envelope. */
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
  uniform vec3  uGold;
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

    // Contour ink: pale in the deeps, igniting to gold at the crests.
    vec3 crest = mix(uInkHigh, uGold, smoothstep(0.52, 0.92, hn));
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
  const hostRef = useRef(null);
  const gaugeFillRef = useRef(null);
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

  /* WebGL terrain. */
  useEffect(() => {
    let cleanup;
    let cancelled = false;

    (async () => {
      const THREE = await import("three");
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
      const CAM = { x: 0, y: 30, z: 98 };
      camera.position.set(CAM.x, CAM.y, CAM.z);
      camera.lookAt(0, 2, -6);

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
        uContour: { value: 0.9 },
        uBg: { value: new THREE.Color(COL.bg) },
        uInkLow: { value: new THREE.Color(COL.inkLow) },
        uInkHigh: { value: new THREE.Color(COL.inkHigh) },
        uGold: { value: new THREE.Color(COL.gold) },
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

        const f = Math.min(p * N, N - 0.0001);
        const idx = Math.floor(f);
        const local = f - idx;
        uniforms.uSceneA.value = idx;
        uniforms.uSceneB.value = Math.min(idx + 1, N - 1);
        /* Hold each floor, then morph in the last quarter of the beat. */
        const b = clamp01((local - 0.72) / 0.26);
        uniforms.uBlend.value = b * b * (3 - 2 * b);
        uniforms.uTime.value = t;
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

        /* Camera drift: pointer parallax + a slow breathing bob. */
        const px = frozen ? 0 : pointer.x;
        const py = frozen ? 0 : pointer.y;
        camera.position.x += (CAM.x + px * 6 - camera.position.x) * 0.04;
        camera.position.y +=
          (CAM.y - py * 3 + (frozen ? 0 : Math.sin(t * 0.3) * 0.8) -
            camera.position.y) *
          0.04;
        camera.lookAt(0, 2, -6);

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
    })();

    return () => {
      cancelled = true;
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
        <div className={styles.stage}>
          <div ref={hostRef} className={styles.canvasHost} aria-hidden="true" />
          <div className={styles.vignette} aria-hidden="true" />

          {/* HUD strip — chart-instrument header */}
          <div className={styles.hud}>
            <span className={styles.hudLive}>
              <span className={styles.hudDot} />
              THE INTELLIGENCE ENGINE
            </span>
            <span className={styles.hudReadout} key={beat.key}>
              {beat.hud}
            </span>
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
