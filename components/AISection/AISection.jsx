"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAnimationPaused } from "@/lib/AnimationContext";
import {
  generateScattered,
  generateSoundRings,
  generateCube,
  generateMagnifier,
  generateStockArrow,
  offsetShape,
  offsetShapeY,
} from "@/lib/shapes";
import { vertexShader, fragmentShader } from "@/lib/shaders";
import styles from "./AISection.module.css";

const PARTICLE_COUNT = 50000;
const OFFSET = 5.5;
const TO_RAD = Math.PI / 180;

const SHAPE_GENERATORS = {
  rings: generateSoundRings,
  cube: generateCube,
  magnifier: generateMagnifier,
  arrow: generateStockArrow,
};

const MATRIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789▓▒░<>/\\";

/* ─────────────────────────────────────────────────────────────────────
   SECTIONS
   Each section has START and END poses. The shape interpolates from
   its start rotation+offset to its end rotation+offset as you scroll
   through that shape's display window.

   Both `desktop` and `mobile` keys carry: rotX/Y/Z, offsetX/Y for the
   START pose, scale (single value, not animated), and rotXEnd/Y/Z,
   offsetXEnd/Y for the END pose.
   ───────────────────────────────────────────────────────────────────── */
const SECTIONS = [
  {
    key: "voice",
    shortName: "Voice",
    side: "left",
    gen: "rings",
    desktop: {
      rotX: -51,
      rotY: -36,
      rotZ: 57,
      offsetX: 0,
      offsetY: 0,
      scale: 0.6,
      rotXEnd: -47,
      rotYEnd: -36,
      rotZEnd: 57,
      offsetXEnd: 2.75,
      offsetYEnd: 0,
    },
    mobile: {
      rotX: -33,
      rotY: -52,
      rotZ: 67,
      offsetX: 0,
      offsetY: 0,
      scale: 0.55,
      rotXEnd: -33,
      rotYEnd: -22,
      rotZEnd: 67,
      offsetXEnd: 0,
      offsetYEnd: 0,
    },
    badge: "Hands-free",
    title: "Voice commands",
    desc: "Nimbus processes natural speech and executes warehouse actions hands-free.",
  },
  {
    key: "spatial",
    shortName: "Spatial",
    side: "right",
    gen: "cube",
    desktop: {
      rotX: 67,
      rotY: 40,
      rotZ: 0,
      offsetX: 0,
      offsetY: 0,
      scale: 0.8,
      rotXEnd: 2,
      rotYEnd: 88,
      rotZEnd: 0,
      offsetXEnd: 0,
      offsetYEnd: 0,
    },
    mobile: {
      rotX: -57,
      rotY: -19,
      rotZ: 0,
      offsetX: 0,
      offsetY: 0,
      scale: 0.65,
      rotXEnd: -57,
      rotYEnd: 11,
      rotZEnd: 0,
      offsetXEnd: 0,
      offsetYEnd: 0,
    },
    badge: "Real-time",
    title: "Spatial intelligence",
    desc: "A living model of your warehouse. Every section, bay, and level mapped in real time.",
  },
  {
    key: "search",
    shortName: "Search",
    side: "left",
    gen: "magnifier",
    desktop: {
      rotX: -12,
      rotY: -34,
      rotZ: -9,
      offsetX: -1.25,
      offsetY: 1,
      scale: 0.6,
      rotXEnd: -12,
      rotYEnd: -4,
      rotZEnd: -9,
      offsetXEnd: -1.25,
      offsetYEnd: 1,
    },
    mobile: {
      rotX: -12,
      rotY: -34,
      rotZ: -9,
      offsetX: 0,
      offsetY: 0,
      scale: 0.55,
      rotXEnd: -12,
      rotYEnd: -4,
      rotZEnd: -9,
      offsetXEnd: 0,
      offsetYEnd: 0,
    },
    badge: "AI-powered",
    title: "Intelligent search",
    desc: "Ask anything in plain language. Searches products, locations, and history.",
  },
  {
    key: "analytics",
    shortName: "Analytics",
    side: "right",
    gen: "arrow",
    desktop: {
      rotX: -2,
      rotY: 25,
      rotZ: 6,
      offsetX: 0.25,
      offsetY: 0,
      scale: 0.55,
      rotXEnd: -8,
      rotYEnd: 44,
      rotZEnd: 0,
      offsetXEnd: 1,
      offsetYEnd: 0,
    },
    mobile: {
      rotX: -8,
      rotY: 14,
      rotZ: 0,
      offsetX: 0,
      offsetY: 0,
      scale: 0.55,
      rotXEnd: -8,
      rotYEnd: 44,
      rotZEnd: 0,
      offsetXEnd: 0,
      offsetYEnd: 0,
    },
    badge: "Forecasting",
    title: "Predictive analytics",
    desc: "Nimbus doesn't just report what happened — it forecasts what's next.",
  },
];

function smoothstep(x) {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

function formationCurve(p) {
  if (p <= 0.15 || p >= 0.85) return 0;
  if (p < 0.4) return smoothstep((p - 0.15) / 0.25);
  if (p <= 0.6) return 1;
  return 1 - smoothstep((p - 0.6) / 0.25);
}

/* Maps the block's viewport progress (0=just entering, 1=just left)
   to an animation progress (0=at start pose, 1=at end pose). Shape is
   visible roughly between p=0.15 and p=0.85, so we map that window. */
function animProgress(p) {
  return Math.max(0, Math.min(1, (p - 0.15) / 0.7));
}

/* ─────────────────────────────────────────────────────────────────────
   SCRAMBLE TEXT RENDERER
   ───────────────────────────────────────────────────────────────────── */
function renderScramble(text, keyPrefix = "") {
  const parts = text.split(/(\s+)/);
  return parts.map((part, pi) => {
    if (part === "") return null;
    if (/^\s+$/.test(part)) {
      return <span key={`${keyPrefix}-s${pi}`}> </span>;
    }
    return (
      <span key={`${keyPrefix}-w${pi}`} className="word">
        {[...part].map((c, ci) => (
          <span key={ci} data-char={c} className={styles.scrambleChar}>
            {"\u00A0"}
          </span>
        ))}
      </span>
    );
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   DEBUG PANEL — depth + motion + parallax
   Lives behind ?debug. Mutates shader uniforms and the motion ref
   directly so changes are instant — no re-render, the next animate
   frame just picks up the new values.
   ═══════════════════════════════════════════════════════════════════════ */
const DEPTH_DEFAULTS = {
  near: 11,
  far: 32,
  alphaMin: 0.18,
  perspective: 22,
  blurExpand: 0.5,
  blurSoftness: 0.45,
};

const MOTION_DEFAULTS = {
  stiffness: 0.055,
  damping: 0.78,
  jitterAmp: 0.06,
  jitterFreq: 0.4,
  /* Parallax — small per-frame rotation applied to the scattered field
     based on the active shape's animation progress. Yaw and pitch are
     in radians, scaled by parallaxT ∈ [-1..1]. Defaults give ~3° max
     yaw and ~2° max pitch at the extremes — subtle but visible. */
  parallaxYaw: 0.05,
  parallaxPitch: 0.035,
};

function DebugPanel({ uniformsRef, motionRef }) {
  const [open, setOpen] = useState(true);
  const [d, setD] = useState(DEPTH_DEFAULTS);
  const [m, setM] = useState(MOTION_DEFAULTS);

  const applyDepth = (key, val) => {
    setD((prev) => ({ ...prev, [key]: val }));
    const u = uniformsRef.current;
    if (!u) return;
    switch (key) {
      case "near":
        u.uDepthRange.value.x = val;
        break;
      case "far":
        u.uDepthRange.value.y = val;
        break;
      case "alphaMin":
        u.uDepthAlphaMin.value = val;
        break;
      case "perspective":
        u.uPerspectiveScale.value = val;
        break;
      case "blurExpand":
        u.uBlurExpand.value = val;
        break;
      case "blurSoftness":
        u.uBlurSoftness.value = val;
        break;
    }
  };

  const applyMotion = (key, val) => {
    setM((prev) => ({ ...prev, [key]: val }));
    if (motionRef.current) motionRef.current[key] = val;
  };

  const reset = () => {
    Object.entries(DEPTH_DEFAULTS).forEach(([k, v]) => applyDepth(k, v));
    Object.entries(MOTION_DEFAULTS).forEach(([k, v]) => applyMotion(k, v));
  };

  const copyConfig = async () => {
    const cfg =
      `// ── Shader uniforms ──\n` +
      `uDepthRange:       { value: new THREE.Vector2(${d.near.toFixed(
        2
      )}, ${d.far.toFixed(2)}) },\n` +
      `uDepthAlphaMin:    { value: ${d.alphaMin.toFixed(3)} },\n` +
      `uPerspectiveScale: { value: ${d.perspective.toFixed(2)} },\n` +
      `uBlurExpand:       { value: ${d.blurExpand.toFixed(3)} },\n` +
      `uBlurSoftness:     { value: ${d.blurSoftness.toFixed(3)} },\n\n` +
      `// ── Motion defaults (motionRef) ──\n` +
      `stiffness:     ${m.stiffness.toFixed(4)},\n` +
      `damping:       ${m.damping.toFixed(3)},\n` +
      `jitterAmp:     ${m.jitterAmp.toFixed(4)},\n` +
      `jitterFreq:    ${m.jitterFreq.toFixed(3)},\n` +
      `parallaxYaw:   ${m.parallaxYaw.toFixed(4)},\n` +
      `parallaxPitch: ${m.parallaxPitch.toFixed(4)},`;
    try {
      await navigator.clipboard.writeText(cfg);
    } catch {
      console.log(cfg);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.dbgToggle}
      >
        DEBUG
      </button>
    );
  }

  /* Each row: [label, key, min, max, step, formatter] */
  const depthSliders = [
    ["Focus near", "near", 0, 30, 0.5, (n) => n.toFixed(1)],
    ["Focus far", "far", 5, 60, 0.5, (n) => n.toFixed(1)],
    ["Alpha floor", "alphaMin", 0, 1, 0.01, (n) => n.toFixed(2)],
    ["Perspective", "perspective", 5, 40, 0.5, (n) => n.toFixed(1)],
    ["Bokeh expand", "blurExpand", 0, 2, 0.01, (n) => n.toFixed(2)],
    ["Edge softness", "blurSoftness", 0, 0.5, 0.01, (n) => n.toFixed(2)],
  ];

  const motionSliders = [
    ["Stiffness", "stiffness", 0.01, 0.2, 0.001, (n) => n.toFixed(3)],
    ["Damping", "damping", 0, 0.95, 0.01, (n) => n.toFixed(2)],
    ["Jitter amp", "jitterAmp", 0, 0.2, 0.001, (n) => n.toFixed(3)],
    ["Jitter freq", "jitterFreq", 0.05, 1.5, 0.01, (n) => n.toFixed(2)],
  ];

  const parallaxSliders = [
    ["Parallax yaw", "parallaxYaw", 0, 0.15, 0.001, (n) => n.toFixed(3)],
    ["Parallax pitch", "parallaxPitch", 0, 0.1, 0.001, (n) => n.toFixed(3)],
  ];

  return (
    <div className={styles.dbgPanel}>
      <div className={styles.dbgHead}>
        <span className={styles.dbgTitle}>DEBUG</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={styles.dbgClose}
          aria-label="Close debug panel"
        >
          ×
        </button>
      </div>

      <div className={styles.dbgSectionHead}>Depth — focus band</div>
      {depthSliders.slice(0, 2).map(([label, key, min, max, step, fmt]) => (
        <Slider
          key={key}
          label={label}
          value={d[key]}
          onChange={(v) => applyDepth(key, v)}
          min={min}
          max={max}
          step={step}
          format={fmt}
        />
      ))}

      <div className={styles.dbgSectionHead}>Atmosphere</div>
      {depthSliders.slice(2, 3).map(([label, key, min, max, step, fmt]) => (
        <Slider
          key={key}
          label={label}
          value={d[key]}
          onChange={(v) => applyDepth(key, v)}
          min={min}
          max={max}
          step={step}
          format={fmt}
        />
      ))}

      <div className={styles.dbgSectionHead}>Perspective & blur</div>
      {depthSliders.slice(3).map(([label, key, min, max, step, fmt]) => (
        <Slider
          key={key}
          label={label}
          value={d[key]}
          onChange={(v) => applyDepth(key, v)}
          min={min}
          max={max}
          step={step}
          format={fmt}
        />
      ))}

      <div className={styles.dbgSectionHead}>Motion</div>
      {motionSliders.map(([label, key, min, max, step, fmt]) => (
        <Slider
          key={key}
          label={label}
          value={m[key]}
          onChange={(v) => applyMotion(key, v)}
          min={min}
          max={max}
          step={step}
          format={fmt}
        />
      ))}

      <div className={styles.dbgSectionHead}>Parallax</div>
      {parallaxSliders.map(([label, key, min, max, step, fmt]) => (
        <Slider
          key={key}
          label={label}
          value={m[key]}
          onChange={(v) => applyMotion(key, v)}
          min={min}
          max={max}
          step={step}
          format={fmt}
        />
      ))}

      <div className={styles.dbgActions}>
        <button type="button" onClick={reset} className={styles.dbgBtn}>
          Reset
        </button>
        <button
          type="button"
          onClick={copyConfig}
          className={`${styles.dbgBtn} ${styles.dbgBtnPrimary}`}
        >
          Copy config
        </button>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step, format }) {
  return (
    <div className={styles.dbgSlider}>
      <div className={styles.dbgSliderHead}>
        <span className={styles.dbgSliderLabel}>{label}</span>
        <span className={styles.dbgSliderValue}>{format(value)}</span>
      </div>
      <input
        type="range"
        className={styles.dbgRange}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export default function AISection() {
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);
  const blockRefs = useRef([]);
  const formationsRef = useRef([]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const sectionVisibleRef = useRef(false);

  const { paused } = useAnimationPaused();
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  /* Hook the THREE.js init useEffect lets it ask "rebuild shapes" when
     the viewport crosses the desktop/mobile breakpoint on resize. */
  const rebuildShapesRef = useRef(null);

  /* Live-tunable refs exposed to the debug panel. Both are mutated
     directly so the next animate() frame picks up changes — no
     re-creating the THREE scene. */
  const uniformsRef = useRef(null);
  const motionRef = useRef({ ...MOTION_DEFAULTS });

  const [debug, setDebug] = useState(false);
  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).has("debug"));
  }, []);

  /* Section visibility observer */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        sectionVisibleRef.current = entry.isIntersecting;
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const scrollToBlock = useCallback((i) => {
    blockRefs.current[i]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  const CFG = {
    smoothFormation: 0.18,
    camZ: 16,
    camZMobile: 22,
  };

  const stateRef = useRef({
    activeShape: 0,
    formation: 0,
    globalAlpha: 0,
    shapeProgresses: [0, 0, 0, 0],
    fadeOut: 0,
  });

  /* Scroll-driven formation + shape progress + fade-out */
  useEffect(() => {
    const section = sectionRef.current;
    const blocks = blockRefs.current.filter(Boolean);
    if (!section) return;

    const vh = window.innerHeight;
    const center = vh / 2;

    const onScroll = () => {
      const formations = [];
      const shapeProgresses = [];

      if (blocks.length > 1) {
        const fTop =
          blocks[0].getBoundingClientRect().top + blocks[0].offsetHeight * 0.5;
        const lTop = blocks[blocks.length - 1].getBoundingClientRect().top;
        setProgress(Math.max(0, Math.min(1, (center - fTop) / (lTop - fTop))));
      }

      for (let i = 0; i < blocks.length; i++) {
        const r = blocks[i].getBoundingClientRect();
        const total = vh + r.height;
        const p = Math.max(0, Math.min(1, (vh - r.top) / total));
        formations.push(formationCurve(p));
        shapeProgresses.push(p);
      }

      let maxF = 0;
      let dom = 0;
      for (let i = 0; i < formations.length; i++) {
        if (formations[i] > maxF) {
          maxF = formations[i];
          dom = i;
        }
      }

      stateRef.current.formation = maxF;
      stateRef.current.activeShape = dom;
      stateRef.current.shapeProgresses = shapeProgresses;
      formationsRef.current = formations;

      /* Fade-out — as the last block exits the top of the viewport,
         fade the canvas so particles aren't visible when the next
         section (Features) is overlapping. Fully faded by the time
         the last block bottom is at viewport.top. */
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock) {
        const r = lastBlock.getBoundingClientRect();
        if (r.bottom < vh * 0.6) {
          stateRef.current.fadeOut = Math.max(
            0,
            Math.min(1, 1 - r.bottom / (vh * 0.6))
          );
        } else {
          stateRef.current.fadeOut = 0;
        }
      }

      if (maxF > 0.5) setActiveIdx(dom);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Text scramble RAF loop */
  useEffect(() => {
    let raf;
    const REVEAL_END = 0.7;
    const SCRAMBLE_WINDOW = 0.12;
    const FRAME_DIVIDER = 4;
    const MIN_OPACITY = 0.45;
    let frame = 0;

    const tick = () => {
      frame++;
      const reroll = frame % FRAME_DIVIDER === 0;
      const cards = cardRefs.current;

      for (let ci = 0; ci < cards.length; ci++) {
        const card = cards[ci];
        if (!card) continue;

        const f = formationsRef.current[ci] ?? 0;
        const sideBar = card.querySelector(`.${styles.sideBar}`);
        if (sideBar) {
          sideBar.style.opacity = String(f);
          sideBar.style.pointerEvents = f > 0.5 ? "auto" : "none";
        }

        const chars = card.querySelectorAll(`.${styles.scrambleChar}`);
        if (f <= 0) {
          chars.forEach((ch) => {
            ch.textContent = "\u00A0";
            ch.style.opacity = "0";
          });
          continue;
        }

        /* Allow revealProgress to overshoot 1 so the wave can fully
           pass the last character. With the old Math.min(1, …) cap,
           the last char's localProgress maxed at 0.5 and never
           resolved — text stayed half-scrambled. The plateau of
           formationCurve (f → 1.0) provides enough headroom for the
           wave to clear every char. The per-character clamp below
           still bounds c to [0,1]. */
        const revealProgress = f / REVEAL_END;
        const totalChars = chars.length;

        for (let i = 0; i < totalChars; i++) {
          const ch = chars[i];
          const charProgress = i / Math.max(1, totalChars - 1);
          const localProgress =
            (revealProgress - charProgress) / SCRAMBLE_WINDOW + 0.5;
          const c = Math.max(0, Math.min(1, localProgress));

          if (c >= 1) {
            ch.textContent = ch.dataset.char || "";
            ch.style.opacity = "1";
          } else if (c <= 0) {
            ch.textContent = "\u00A0";
            ch.style.opacity = "0";
          } else {
            if (reroll) {
              ch.textContent =
                MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
            }
            ch.style.opacity = String(MIN_OPACITY + (1 - MIN_OPACITY) * c);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── THREE.JS init + animate loop ─────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cleanup = () => {};
    let frameId;

    const init = async () => {
      const THREE = await import("three");

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      scene.background = null;

      const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      camera.position.set(0, 0, CFG.camZ);

      /* Track which mode the shapes were built for so we can rebuild
         only when the viewport crosses the breakpoint. */
      let builtMode = window.innerWidth < 768 ? "mobile" : "desktop";

      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        const mobile = w < 768;
        camera.position.z = mobile ? CFG.camZMobile : CFG.camZ;
        camera.updateProjectionMatrix();

        /* Rebuild shapes if we crossed the mobile/desktop breakpoint */
        const nextMode = mobile ? "mobile" : "desktop";
        if (nextMode !== builtMode) {
          builtMode = nextMode;
          rebuildShapesRef.current?.();
        }
      };
      resize();
      window.addEventListener("resize", resize);

      const scattered = generateScattered(PARTICLE_COUNT);
      const shapes = [null, null, null, null];

      /* buildShape — generate WITHOUT rotation. Rotation is applied
         per-frame in the animate loop so we can interpolate between
         start and end poses. Scale is baked here (single value). */
      const buildShape = (i, mode) => {
        const sec = SECTIONS[i];
        const params = sec[mode];
        const fn = SHAPE_GENERATORS[sec.gen];

        let pts = fn(PARTICLE_COUNT, 0, 0, 0);

        const mobile = mode === "mobile";
        const mobileFactor = mobile ? 0.85 : 1;
        const scale = params.scale * mobileFactor;

        if (scale !== 1) {
          const out = new Float32Array(pts.length);
          for (let j = 0; j < pts.length; j++) out[j] = pts[j] * scale;
          pts = out;
        }

        return pts;
      };

      const rebuildShapes = () => {
        const mode = window.innerWidth < 768 ? "mobile" : "desktop";
        for (let i = 0; i < SECTIONS.length; i++)
          shapes[i] = buildShape(i, mode);
      };
      rebuildShapes();
      rebuildShapesRef.current = rebuildShapes;

      const physicsPos = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) physicsPos[i] = scattered[i];
      const currentPos = new Float32Array(PARTICLE_COUNT * 3);

      /* Per-particle velocity buffer. The spring-damper integrator
         needs persistent velocity so particles carry momentum frame
         to frame — that's what gives them weight on settle. */
      const physicsVel = new Float32Array(PARTICLE_COUNT * 3);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(currentPos, 3)
      );

      const baseSizes = new Float32Array(PARTICLE_COUNT);
      const mobileInit = window.innerWidth < 768;
      const sizeScale = mobileInit ? 1.6 : 1.25;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        baseSizes[i] = (0.7 + Math.random() * 1.2) * sizeScale;
      }
      geometry.setAttribute("aSize", new THREE.BufferAttribute(baseSizes, 1));

      const seeds = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) seeds[i] = Math.random();

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uColorMix: { value: 0 },
          /* Footer-matched gold — #e7c074, same warm tone as the helix
             particles in the footer. Was #d4a853 (slightly more amber). */
          uAccentColor: { value: new THREE.Color(0xe7c074) },
          uGlobalAlpha: { value: 0 },

          /* Depth / DoF / atmospheric perspective.
             uDepthRange — view-space distances [near, far]. Inside this
               band, particles are sharp and bright; outside, they fade
               and soften. Camera sits at z=16 desktop / z=22 mobile, so
               11..32 covers shape body → atmospheric falloff.
             uDepthAlphaMin — alpha floor for far particles.
             uPerspectiveScale — base 1/d size attenuation strength.
             uBlurExpand — how much far particles grow to fake bokeh.
             uBlurSoftness — width of the soft-edge falloff at far end. */
          uDepthRange: { value: new THREE.Vector2(11.0, 32.0) },
          uDepthAlphaMin: { value: 0.18 },
          uPerspectiveScale: { value: 22.0 },
          uBlurExpand: { value: 0.5 },
          uBlurSoftness: { value: 0.45 },
        },
      });

      /* Expose uniforms to the debug panel for live tweaking. */
      uniformsRef.current = material.uniforms;

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      let sFormation = 0;
      let sAlpha = 0;
      let sColorMix = 0;

      const TAU = Math.PI * 2;

      const animate = () => {
        frameId = requestAnimationFrame(animate);

        if (pausedRef.current || !sectionVisibleRef.current) return;

        const t = performance.now() * 0.001;
        const s = stateRef.current;

        sFormation += (s.formation - sFormation) * CFG.smoothFormation;
        sColorMix += (sFormation - sColorMix) * CFG.smoothFormation;

        /* Alpha — base + formation lift, multiplied by (1 - fadeOut)
           so the canvas fades out as we scroll past the last block. */
        const fadeOut = s.fadeOut || 0;
        const baseAlpha = 0.4;
        const targetAlpha =
          (baseAlpha + (1 - baseAlpha) * sFormation) * (1 - fadeOut);
        sAlpha += (targetAlpha - sAlpha) * CFG.smoothFormation;

        const activeShape = shapes[s.activeShape];
        if (!activeShape) return;

        /* ── Compute interpolated pose for the active shape ── */
        const scrollP = s.shapeProgresses[s.activeShape] ?? 0.5;
        const animP = animProgress(scrollP);

        const mode = window.innerWidth < 768 ? "mobile" : "desktop";
        const sec = SECTIONS[s.activeShape];
        const params = sec[mode];

        /* Lerp start→end rotation (degrees) and offset */
        const rotXDeg = params.rotX + (params.rotXEnd - params.rotX) * animP;
        const rotYDeg = params.rotY + (params.rotYEnd - params.rotY) * animP;
        const rotZDeg = params.rotZ + (params.rotZEnd - params.rotZ) * animP;
        const rotX = rotXDeg * TO_RAD;
        const rotY = rotYDeg * TO_RAD;
        const rotZ = rotZDeg * TO_RAD;

        const cX = Math.cos(rotX),
          sX = Math.sin(rotX);
        const cY = Math.cos(rotY),
          sY = Math.sin(rotY);
        const cZ = Math.cos(rotZ),
          sZ = Math.sin(rotZ);

        const mobile = mode === "mobile";
        const defaultX = mobile ? 0 : sec.side === "left" ? OFFSET : -OFFSET;
        const defaultY = mobile ? -3.5 : 0;
        const offX =
          defaultX +
          params.offsetX +
          (params.offsetXEnd - params.offsetX) * animP;
        const offY =
          defaultY +
          params.offsetY +
          (params.offsetYEnd - params.offsetY) * animP;

        /* Motion params live in a ref so the debug panel can tune them
           live without re-creating the THREE scene. */
        const mot = motionRef.current;
        const k = mot.stiffness;
        const damp = mot.damping;
        const jb = mot.jitterAmp;
        const jf = mot.jitterFreq;

        /* ── Parallax: small-angle rotation of the scattered field ──
           As you scroll through a shape's window, the scattered cloud
           subtly counter-rotates — closer particles shift more than
           far ones, which is the classic camera-pan parallax cue. The
           formed shape is unaffected (it has its own rotation), so the
           effect only shows where particles aren't fully formed. */
        const parallaxT = (animP - 0.5) * 2; // [-1..1]
        const pYaw = parallaxT * mot.parallaxYaw;
        const pPitch = parallaxT * mot.parallaxPitch;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;

          /* Active shape position with per-frame rotation applied */
          let px = activeShape[i3];
          let py = activeShape[i3 + 1];
          let pz = activeShape[i3 + 2];

          /* Rotate X */
          const py1 = py * cX - pz * sX;
          const pz1 = py * sX + pz * cX;
          py = py1;
          pz = pz1;

          /* Rotate Y */
          const px1 = px * cY + pz * sY;
          const pz2 = -px * sY + pz * cY;
          px = px1;
          pz = pz2;

          /* Rotate Z */
          const px2 = px * cZ - py * sZ;
          const py2 = px * sZ + py * cZ;
          px = px2;
          py = py2;

          const formedX = px + offX;
          const formedY = py + offY;
          const formedZ = pz;

          /* ── Apply parallax to the scattered position ──
             Standard small-angle camera rotation: a point at depth z
             appears shifted by -z*yaw horizontally and +z*pitch
             vertically. We also fix up z by the corresponding amount
             so the rotation stays a proper rotation rather than a
             pure shear. */
          const sxRaw = scattered[i3];
          const syRaw = scattered[i3 + 1];
          const szRaw = scattered[i3 + 2];
          const sx = sxRaw - szRaw * pYaw;
          const sy = syRaw + szRaw * pPitch;
          const sz = szRaw + sxRaw * pYaw - syRaw * pPitch;

          const targetX = sx * (1 - sFormation) + formedX * sFormation;
          const targetY = sy * (1 - sFormation) + formedY * sFormation;
          const targetZ = sz * (1 - sFormation) + formedZ * sFormation;

          /* ── Spring-damper convergence ──
             Velocity persists frame-to-frame (scaled by `damp`) and
             accelerates toward the target (scaled by `k`). Slightly
             underdamped — particles arrive with a barely-perceptible
             settle, giving them weight rather than asymptotic ease. */
          const dx = targetX - physicsPos[i3];
          const dy = targetY - physicsPos[i3 + 1];
          const dz = targetZ - physicsPos[i3 + 2];

          physicsVel[i3] = physicsVel[i3] * damp + dx * k;
          physicsVel[i3 + 1] = physicsVel[i3 + 1] * damp + dy * k;
          physicsVel[i3 + 2] = physicsVel[i3 + 2] * damp + dz * k;

          physicsPos[i3] += physicsVel[i3];
          physicsPos[i3 + 1] += physicsVel[i3 + 1];
          physicsPos[i3 + 2] += physicsVel[i3 + 2];

          /* ── Pseudo-curl ambient drift ──
             Each axis is driven by sin of a *different* phase, with
             golden-ratio frequency offsets. This decorrelates X/Y/Z
             so particles trace small wandering loops rather than
             synchronized oscillations. Per-particle frequency
             variation (via seed s3) further breaks up group rhythm. */
          const s1 = seeds[i3];
          const s2 = seeds[i3 + 1];
          const s3 = seeds[i3 + 2];

          const fScale = jf * (0.7 + s3 * 0.6);
          const tA = t * fScale + s1 * TAU;
          const tB = t * fScale * 1.618 + s2 * TAU + 1.7;
          const tC = t * fScale * 0.611 + s3 * TAU + 3.1;

          /* Amplitude breathes harder while particles are unformed.
             The 0.55 floor keeps formed shapes alive — not frozen. */
          const ampScale = 0.55 + (1 - sFormation) * 0.75;
          const amp = jb * (0.5 + s3 * 0.9) * ampScale;

          const jx = Math.sin(tB) - Math.cos(tC) * 0.6;
          const jy = Math.sin(tC) - Math.cos(tA) * 0.6;
          const jz = Math.sin(tA) - Math.cos(tB) * 0.4;

          currentPos[i3] = physicsPos[i3] + jx * amp;
          currentPos[i3 + 1] = physicsPos[i3 + 1] + jy * amp;
          currentPos[i3 + 2] = physicsPos[i3 + 2] + jz * amp * 0.7;
        }

        geometry.attributes.position.needsUpdate = true;
        material.uniforms.uColorMix.value = sColorMix;
        material.uniforms.uGlobalAlpha.value = sAlpha;

        renderer.render(scene, camera);
      };

      animate();

      cleanup = () => {
        window.removeEventListener("resize", resize);
        rebuildShapesRef.current = null;
        uniformsRef.current = null;
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    };

    init();
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      cleanup();
    };
  }, []);

  return (
    <section ref={sectionRef} id="ai-engine" className={styles.section}>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} />
      </div>

      <div className={styles.textWrap}>
        <div className={styles.cardLayer}>
          <div className={styles.cardLayerInner}>
            {SECTIONS.map((sec, i) => (
              <div
                key={sec.key}
                ref={(el) => (cardRefs.current[i] = el)}
                className={`${styles.cardEditorial} ${
                  sec.side === "right" ? styles.cardEditorialRight : ""
                }`}
              >
                <div className={styles.sideBar}>
                  <div className={styles.sideTrack} />
                  <div
                    className={styles.sideFill}
                    style={{ height: `${progress * 100}%` }}
                  />
                  {SECTIONS.map((s, idx) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => scrollToBlock(idx)}
                      className={`${styles.sideTick} ${
                        idx / (SECTIONS.length - 1) <= progress + 0.001
                          ? styles.sideTickFilled
                          : ""
                      } ${activeIdx === idx ? styles.sideTickCurrent : ""}`}
                      style={{ top: `${(idx / (SECTIONS.length - 1)) * 100}%` }}
                      aria-label={`Jump to ${s.shortName}`}
                    />
                  ))}
                </div>

                <div className={styles.cardEyebrow}>
                  {renderScramble(sec.badge, `${sec.key}-eyebrow`)}
                </div>
                <h3 className={styles.cardTitle}>
                  {renderScramble(sec.title, `${sec.key}-title`)}
                </h3>
                <p className={styles.cardDesc}>
                  {renderScramble(sec.desc, `${sec.key}-desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {SECTIONS.map((sec, i) => (
          <div
            key={sec.key}
            ref={(el) => (blockRefs.current[i] = el)}
            className={styles.block}
          />
        ))}

        <div className={styles.trailingSpacer} />
      </div>

      {debug && <DebugPanel uniformsRef={uniformsRef} motionRef={motionRef} />}
    </section>
  );
}
