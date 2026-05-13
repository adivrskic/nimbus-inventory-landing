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

const SHAPE_GENERATORS = {
  rings: generateSoundRings,
  cube: generateCube,
  magnifier: generateMagnifier,
  arrow: generateStockArrow,
};

const MATRIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789▓▒░<>/\\";

/* ─────────────────────────────────────────────────────────────────────
   SECTIONS
   Each section now carries TWO shape configs — `desktop` and `mobile`.
   The debug panel edits these separately and the renderer selects the
   right one based on viewport width (with optional override from the
   debug panel's preview mode toggle).
   ───────────────────────────────────────────────────────────────────── */
const SECTIONS = [
  {
    key: "voice",
    shortName: "Voice",
    side: "left",
    gen: "rings",
    desktop: {
      rotX: -33,
      rotY: -52,
      rotZ: 67,
      scale: 0.6,
      offsetX: -1,
      offsetY: 0,
    },
    mobile: {
      rotX: -33,
      rotY: -52,
      rotZ: 67,
      scale: 0.55,
      offsetX: 0,
      offsetY: 0,
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
      rotX: -57,
      rotY: -19,
      rotZ: 0,
      scale: 0.8,
      offsetX: 0,
      offsetY: 0,
    },
    mobile: {
      rotX: -57,
      rotY: -19,
      rotZ: 0,
      scale: 0.65,
      offsetX: 0,
      offsetY: 0,
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
      scale: 0.6,
      offsetX: -1.25,
      offsetY: 1,
    },
    mobile: {
      rotX: -12,
      rotY: -34,
      rotZ: -9,
      scale: 0.55,
      offsetX: 0,
      offsetY: 0,
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
      rotX: -8,
      rotY: 14,
      rotZ: 0,
      scale: 0.55,
      offsetX: 1,
      offsetY: 0,
    },
    mobile: {
      rotX: -8,
      rotY: 14,
      rotZ: 0,
      scale: 0.55,
      offsetX: 0,
      offsetY: 0,
    },
    badge: "Forecasting",
    title: "Predictive analytics",
    desc: "Nimbus doesn't just report what happened — it forecasts what's next.",
  },
];

const extractParams = (mode) => SECTIONS.map((s) => ({ ...s[mode] }));
const DEFAULT_PARAMS = {
  desktop: extractParams("desktop"),
  mobile: extractParams("mobile"),
};

/* Bumped storage key version because the data shape changed
   (object with desktop/mobile, not a flat array). Old saved tunings
   from v1 are ignored, which is the correct behavior. */
const DEBUG_STORAGE_KEY = "aiSectionDebugParams_v2";

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

/* ─────────────────────────────────────────────────────────────────────
   SCRAMBLE TEXT RENDERER (unchanged — already correct)
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

function Slider({ label, value, min, max, step, unit, onChange }) {
  return (
    <div className={styles.dbgSlider}>
      <div className={styles.dbgSliderHead}>
        <span className={styles.dbgSliderLabel}>{label}</span>
        <span className={styles.dbgSliderValue}>
          {step < 1 ? value.toFixed(2) : Math.round(value)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={styles.dbgRange}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   DEBUG PANEL
   - Mode toggle at top (Desktop / Mobile) — flips both the editing
     target AND the rendered preview so you can tune mobile shapes
     without resizing your browser.
   - Section tabs (01/02/03/04).
   - Six sliders (rotX/Y/Z, scale, offsetX/Y).
   - Reset (resets current mode only).
   - Copy Config (writes a paste-ready SECTIONS literal to clipboard).
   ───────────────────────────────────────────────────────────────────── */
function DebugPanel({
  params,
  previewMode,
  onPreviewModeChange,
  onParamChange,
  onReset,
  onCopy,
  onClose,
  copiedFlash,
}) {
  const [active, setActive] = useState(0);

  /* The mode being EDITED is the same as the preview mode, but we
     also accept 'auto' from outside — in that case we fall back to
     whatever the current viewport is. */
  const [viewport, setViewport] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  useEffect(() => {
    const onR = () => setViewport(window.innerWidth);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const actualMode = viewport < 768 ? "mobile" : "desktop";
  const editMode = previewMode === "auto" ? actualMode : previewMode;

  const p = params[editMode][active];
  const update = (field, value) =>
    onParamChange(editMode, active, field, value);

  return (
    <div className={styles.dbgPanel}>
      <div className={styles.dbgHead}>
        <span className={styles.dbgTitle}>SHAPE DEBUG</span>
        <button
          type="button"
          onClick={onClose}
          className={styles.dbgClose}
          aria-label="close debug panel"
        >
          ✕
        </button>
      </div>

      {/* Mode toggle — forces preview to selected mode */}
      <div className={styles.dbgModeToggle}>
        <button
          type="button"
          onClick={() => onPreviewModeChange("desktop")}
          className={`${styles.dbgModeBtn} ${
            editMode === "desktop" ? styles.dbgModeBtnActive : ""
          }`}
        >
          Desktop
        </button>
        <button
          type="button"
          onClick={() => onPreviewModeChange("mobile")}
          className={`${styles.dbgModeBtn} ${
            editMode === "mobile" ? styles.dbgModeBtnActive : ""
          }`}
        >
          Mobile
        </button>
      </div>

      <div className={styles.dbgViewport}>
        viewport {viewport}px · {actualMode}
        {editMode !== actualMode && (
          <span className={styles.dbgViewportWarn}>
            {" "}
            · preview forced to {editMode}
          </span>
        )}
      </div>

      <div className={styles.dbgTabs}>
        {SECTIONS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(i)}
            className={`${styles.dbgTab} ${
              active === i ? styles.dbgTabActive : ""
            }`}
          >
            {String(i + 1).padStart(2, "0")}
          </button>
        ))}
      </div>

      <div className={styles.dbgSectionName}>{SECTIONS[active].title}</div>

      <Slider
        label="Rotation X"
        value={p.rotX}
        min={-180}
        max={180}
        step={1}
        unit="°"
        onChange={(v) => update("rotX", v)}
      />
      <Slider
        label="Rotation Y"
        value={p.rotY}
        min={-180}
        max={180}
        step={1}
        unit="°"
        onChange={(v) => update("rotY", v)}
      />
      <Slider
        label="Rotation Z"
        value={p.rotZ}
        min={-180}
        max={180}
        step={1}
        unit="°"
        onChange={(v) => update("rotZ", v)}
      />
      <Slider
        label="Scale"
        value={p.scale}
        min={0.3}
        max={1.5}
        step={0.05}
        unit="×"
        onChange={(v) => update("scale", v)}
      />
      <Slider
        label="Offset X"
        value={p.offsetX}
        min={-10}
        max={10}
        step={0.25}
        unit=""
        onChange={(v) => update("offsetX", v)}
      />
      <Slider
        label="Offset Y"
        value={p.offsetY}
        min={-10}
        max={10}
        step={0.25}
        unit=""
        onChange={(v) => update("offsetY", v)}
      />

      <div className={styles.dbgActions}>
        <button
          type="button"
          onClick={() => onReset(editMode)}
          className={styles.dbgBtn}
        >
          Reset {editMode}
        </button>
        <button
          type="button"
          onClick={onCopy}
          className={`${styles.dbgBtn} ${styles.dbgBtnPrimary}`}
        >
          {copiedFlash ? "Copied" : "Copy Config"}
        </button>
      </div>
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

  /* Debug state */
  const [debugAvailable, setDebugAvailable] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugParams, setDebugParams] = useState(DEFAULT_PARAMS);
  const [debugPreviewMode, setDebugPreviewMode] = useState("auto");
  const [copiedFlash, setCopiedFlash] = useState(false);

  const debugParamsRef = useRef(debugParams);
  const debugPreviewModeRef = useRef(debugPreviewMode);
  useEffect(() => {
    debugParamsRef.current = debugParams;
  }, [debugParams]);
  useEffect(() => {
    debugPreviewModeRef.current = debugPreviewMode;
  }, [debugPreviewMode]);

  const rebuildShapesRef = useRef(null);

  const handleParamChange = useCallback((mode, idx, field, value) => {
    setDebugParams((prev) => ({
      ...prev,
      [mode]: prev[mode].map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      ),
    }));
  }, []);

  const handleReset = useCallback((mode) => {
    setDebugParams((prev) => ({
      ...prev,
      [mode]: DEFAULT_PARAMS[mode].map((p) => ({ ...p })),
    }));
  }, []);

  /* Copy-config: emit a paste-ready SECTIONS literal so the user can
     replace the SECTIONS array at the top of this file once they're
     done tuning. */
  const handleCopyConfig = useCallback(async () => {
    const fmtStr = (v) => `"${String(v).replace(/"/g, '\\"')}"`;
    const fmtNum = (n) => {
      if (Number.isInteger(n)) return String(n);
      return Number(n.toFixed(2)).toString();
    };
    const fmtCfg = (c) =>
      `{ rotX: ${fmtNum(c.rotX)}, rotY: ${fmtNum(c.rotY)}, rotZ: ${fmtNum(
        c.rotZ
      )}, scale: ${fmtNum(c.scale)}, offsetX: ${fmtNum(
        c.offsetX
      )}, offsetY: ${fmtNum(c.offsetY)} }`;

    const params = debugParamsRef.current;
    const body = SECTIONS.map(
      (s, i) =>
        `  {
    key: ${fmtStr(s.key)},
    shortName: ${fmtStr(s.shortName)},
    side: ${fmtStr(s.side)},
    gen: ${fmtStr(s.gen)},
    desktop: ${fmtCfg(params.desktop[i])},
    mobile:  ${fmtCfg(params.mobile[i])},
    badge: ${fmtStr(s.badge)},
    title: ${fmtStr(s.title)},
    desc: ${fmtStr(s.desc)},
  },`
    ).join("\n");
    const output = `const SECTIONS = [\n${body}\n];`;

    try {
      await navigator.clipboard.writeText(output);
      setCopiedFlash(true);
      setTimeout(() => setCopiedFlash(false), 1400);
    } catch (e) {
      console.error("[AISection] clipboard write failed:", e);
    }
  }, []);

  /* Unlock the debug panel when ?debug is in the URL. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("debug")) {
      setDebugAvailable(true);
    }
  }, []);

  /* Persist debug tuning across reloads */
  const debugMountedRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!debugMountedRef.current) {
      debugMountedRef.current = true;
      try {
        const saved = window.localStorage.getItem(DEBUG_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (
            parsed &&
            Array.isArray(parsed.desktop) &&
            parsed.desktop.length === SECTIONS.length &&
            Array.isArray(parsed.mobile) &&
            parsed.mobile.length === SECTIONS.length
          ) {
            setDebugParams(parsed);
          }
        }
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      window.localStorage.setItem(
        DEBUG_STORAGE_KEY,
        JSON.stringify(debugParams)
      );
    } catch {
      /* ignore */
    }
  }, [debugParams]);

  /* Trigger shape rebuilds when params or preview-mode change */
  useEffect(() => {
    rebuildShapesRef.current?.();
  }, [debugParams, debugPreviewMode]);

  /* Reset preview override when the debug panel closes, so production
     behavior resumes (mode follows viewport). */
  const handleCloseDebug = useCallback(() => {
    setDebugOpen(false);
    setDebugPreviewMode("auto");
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

  /* CFG — Tuned for smooth, no-bounce motion with visible ambient jitter.
     The old `physicsStiff` + `physicsDamping` spring system has been
     removed (it caused the bounce). Replaced with `smoothPosition`,
     a single critical-damping coefficient that approaches the target
     monotonically. */
  const CFG = {
    smoothFormation: 0.18,
    smoothPosition: 0.085, // exponential smoothing toward target — no overshoot
    jitterBase: 0.045, // up from 0.018 — visible breath when formed
    jitterFreqBase: 0.55, // up from 0.18 — feels more "alive"
    camZ: 16,
    camZMobile: 22,
  };

  const stateRef = useRef({
    activeShape: 0,
    formation: 0,
    globalAlpha: 0,
  });

  /* Scroll-driven formation values */
  useEffect(() => {
    const section = sectionRef.current;
    const blocks = blockRefs.current.filter(Boolean);
    if (!section) return;

    const vh = window.innerHeight;
    const center = vh / 2;

    const onScroll = () => {
      const formations = [];

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

      formationsRef.current = formations;

      if (maxF > 0.5) {
        setActiveIdx(dom);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Text scramble RAF loop (unchanged) */
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

        const letters = card.querySelectorAll(`.${styles.scrambleChar}`);
        const total = letters.length;
        if (!total) continue;

        const denom = REVEAL_END - SCRAMBLE_WINDOW;

        for (let li = 0; li < total; li++) {
          const el = letters[li];
          const real = el.dataset.char;
          if (real === " ") continue;

          const startAt = (li / total) * denom;
          const lp = (f - startAt) / SCRAMBLE_WINDOW;

          if (lp <= 0) {
            if (el.dataset.state !== "hidden") {
              el.textContent = "\u00A0";
              el.style.opacity = "0";
              el.style.color = "";
              el.dataset.state = "hidden";
            }
          } else if (lp >= 1) {
            if (el.dataset.state !== "real") {
              el.textContent = real;
              el.style.opacity = "1";
              el.style.color = "";
              el.dataset.state = "real";
            }
          } else {
            if (reroll) {
              el.textContent =
                MATRIX_CHARS[(Math.random() * MATRIX_CHARS.length) | 0];
            }
            el.style.opacity = String(MIN_OPACITY + lp * (1 - MIN_OPACITY));
            el.style.color = "var(--accent)";
            el.dataset.state = "scrambling";
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* THREE init + animate.
     Key behavioral changes vs the previous version:
       1. Physics — replaced spring/velocity system with exponential
          smoothing toward the target. Particles approach monotonically,
          no overshoot, no bounce.
       2. Jitter — 3D, two-frequency noise per particle with per-particle
          amplitude variation. Visible even when the shape is fully formed
          so it never feels frozen.
       3. Build per mode — each rebuild reads the desktop or mobile
          sub-config based on the debug preview override (or, if not
          overridden, the live viewport width). */
  useEffect(() => {
    let frameId;
    let cleanup = () => {};

    const init = async () => {
      const THREE = await import("three");

      const canvas = canvasRef.current;
      if (!canvas) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      camera.position.z = window.innerWidth < 768 ? CFG.camZMobile : CFG.camZ;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      const resize = () => {
        const w = canvas.parentElement.clientWidth;
        const h = canvas.parentElement.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        /* If we crossed the breakpoint and we're in auto mode,
           rebuild shapes so the mobile/desktop config swap takes
           effect without a reload. */
        if (debugPreviewModeRef.current === "auto") {
          rebuildShapes();
        }
      };

      window.addEventListener("resize", resize);

      const isMobile = window.innerWidth < 768;
      const scattered = generateScattered(PARTICLE_COUNT, isMobile);
      const shapes = [null, null, null, null];

      /* Resolve which mode's params to use right now. The preview-mode
         ref wins if it's been forced via debug; otherwise we use the
         live viewport. */
      const resolveMode = () => {
        const o = debugPreviewModeRef.current;
        if (o === "desktop" || o === "mobile") return o;
        return window.innerWidth < 768 ? "mobile" : "desktop";
      };

      const buildShape = (i, mode) => {
        const sec = SECTIONS[i];
        const params = debugParamsRef.current[mode][i];
        const fn = SHAPE_GENERATORS[sec.gen];

        let pts = fn(PARTICLE_COUNT, params.rotX, params.rotY, params.rotZ);

        const mobile = mode === "mobile";
        const mobileFactor = mobile ? 0.85 : 1;
        const scale = params.scale * mobileFactor;

        if (scale !== 1) {
          const out = new Float32Array(pts.length);
          for (let j = 0; j < pts.length; j++) {
            out[j] = pts[j] * scale;
          }
          pts = out;
        }

        const defaultX = mobile ? 0 : sec.side === "left" ? OFFSET : -OFFSET;
        const defaultY = mobile ? -3.5 : 0;
        const finalX = defaultX + params.offsetX;
        const finalY = defaultY + params.offsetY;

        if (finalX !== 0) pts = offsetShape(pts, finalX);
        if (finalY !== 0) pts = offsetShapeY(pts, finalY);

        return pts;
      };

      const rebuildShapes = () => {
        const mode = resolveMode();
        for (let i = 0; i < SECTIONS.length; i++) {
          shapes[i] = buildShape(i, mode);
        }
      };

      rebuildShapes();
      rebuildShapesRef.current = rebuildShapes;

      /* Initial size/aspect now that rebuildShapes exists — resize()
         forward-references it, so we must NOT call it before this
         line or we hit a TDZ ReferenceError that silently rejects the
         async init and the scene never renders. */
      resize();

      const currentPos = new Float32Array(PARTICLE_COUNT * 3);
      currentPos.set(scattered);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(currentPos, 3)
      );

      /* physicsPos is the smoothed-to-target position. currentPos =
         physicsPos + jitter. No velocity buffer — we don't need one
         with exponential smoothing. */
      const physicsPos = new Float32Array(PARTICLE_COUNT * 3);
      physicsPos.set(scattered);

      const baseSizes = new Float32Array(PARTICLE_COUNT);
      const sizeScale = isMobile ? 1.6 : 1.25;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        baseSizes[i] = (0.7 + Math.random() * 1.2) * sizeScale;
      }
      geometry.setAttribute("aSize", new THREE.BufferAttribute(baseSizes, 1));

      /* Three seeds per particle drive frequency / phase / amplitude
         variation in the jitter. Constant for the particle's lifetime
         so each particle has a consistent personality. */
      const seeds = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
        seeds[i] = Math.random();
      }

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uColorMix: { value: 0 },
          uAccentColor: { value: new THREE.Color(0xd4a853) },
          uGlobalAlpha: { value: 0 },
        },
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      let sFormation = 0;
      let sAlpha = 0;
      let sColorMix = 0;

      const TAU = Math.PI * 2;

      const animate = () => {
        frameId = requestAnimationFrame(animate);

        if (pausedRef.current || !sectionVisibleRef.current) {
          return;
        }

        const t = performance.now() * 0.001;
        const s = stateRef.current;

        sFormation += (s.formation - sFormation) * CFG.smoothFormation;
        sColorMix += (sFormation - sColorMix) * CFG.smoothFormation;

        const baseAlpha = 0.4;
        const targetAlpha = baseAlpha + (1 - baseAlpha) * sFormation;
        sAlpha += (targetAlpha - sAlpha) * CFG.smoothFormation;

        const activeShape = shapes[s.activeShape];
        if (!activeShape) return;

        const k = CFG.smoothPosition;
        const jb = CFG.jitterBase;
        const jf = CFG.jitterFreqBase;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;

          const targetX =
            scattered[i3] * (1 - sFormation) + activeShape[i3] * sFormation;
          const targetY =
            scattered[i3 + 1] * (1 - sFormation) +
            activeShape[i3 + 1] * sFormation;
          const targetZ =
            scattered[i3 + 2] * (1 - sFormation) +
            activeShape[i3 + 2] * sFormation;

          /* Critical-damping approach to target. Monotonic, no overshoot.
             Replaces the old spring + velocity + damping triad that
             caused the bouncy settle. */
          physicsPos[i3] += (targetX - physicsPos[i3]) * k;
          physicsPos[i3 + 1] += (targetY - physicsPos[i3 + 1]) * k;
          physicsPos[i3 + 2] += (targetZ - physicsPos[i3 + 2]) * k;

          /* Ambient jitter — 3D, two-frequency noise with per-particle
             amplitude. Visible when formed (so the cloud breathes) but
             low enough not to soften the shape outlines. */
          const s1 = seeds[i3];
          const s2 = seeds[i3 + 1];
          const s3 = seeds[i3 + 2];
          const f1 = jf + s1 * 0.3;
          const f2 = jf * 2.4 + s2 * 0.4;
          const ph1 = t * f1 + s1 * TAU;
          const ph2 = t * f2 + s2 * TAU;
          const sinA = Math.sin(ph1);
          const cosA = Math.cos(ph1);
          const sinB = Math.sin(ph2);
          const amp = jb * (0.55 + s3 * 0.9);

          currentPos[i3] = physicsPos[i3] + (sinA * 0.65 + sinB * 0.35) * amp;
          currentPos[i3 + 1] =
            physicsPos[i3 + 1] + (cosA * 0.55 + Math.cos(ph2) * 0.45) * amp;
          currentPos[i3 + 2] = physicsPos[i3 + 2] + sinB * amp * 0.45;
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
                      style={{
                        top: `${(idx / (SECTIONS.length - 1)) * 100}%`,
                      }}
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

      {debugAvailable && !debugOpen && (
        <button
          type="button"
          onClick={() => setDebugOpen(true)}
          className={styles.dbgToggle}
        >
          DEBUG
        </button>
      )}

      {debugAvailable && debugOpen && (
        <DebugPanel
          params={debugParams}
          previewMode={debugPreviewMode}
          onPreviewModeChange={setDebugPreviewMode}
          onParamChange={handleParamChange}
          onReset={handleReset}
          onCopy={handleCopyConfig}
          onClose={handleCloseDebug}
          copiedFlash={copiedFlash}
        />
      )}
    </section>
  );
}
