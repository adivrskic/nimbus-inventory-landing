"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAnimationPaused } from "@/lib/AnimationContext";
import {
  generateScattered,
  generateSoundRings,
  generateCube,
  generateMagnifier,
  generateBarChart,
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
  bars: generateBarChart,
};

/* Glyph pool for the matrix-scramble reveal. Mix of A–Z, digits and a
   handful of block glyphs for an industrial flavor. Single uppercase
   pool — the scramble idiom reads the same regardless of the real
   char's case, which is the look we want. */
const MATRIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789▓▒░<>/\\";

/* ── Per-section configuration ──
   rotX / rotY / rotZ in DEGREES, applied to each shape at generation.
   scale is a multiplier applied AFTER rotation, before X/Y offset.
   Use the debug panel (?debug) to live-tune these and copy the JSON
   back here when you're happy. */
/* Values below are baked from a debug-panel tuning pass — adjust via
   ?debug=1 then "Copy config" to update. offsetX/offsetY are layered on
   top of the default L/R or mobile-Y position offsets. */
const SECTIONS = [
  {
    key: "voice",
    shortName: "Voice",
    side: "left",
    gen: "rings",
    rotX: -33,
    rotY: -52,
    rotZ: 67,
    scale: 0.6,
    offsetX: -1,
    offsetY: 0,
    num: "01",
    badge: "Hands-free",
    title: "Voice commands",
    desc: "Nimbus processes natural speech and executes warehouse actions hands-free.",
  },
  {
    key: "spatial",
    shortName: "Spatial",
    side: "right",
    gen: "cube",
    rotX: -57,
    rotY: -19,
    rotZ: 0,
    scale: 0.8,
    offsetX: 0,
    offsetY: 0,
    num: "02",
    badge: "Real-time",
    title: "Spatial intelligence",
    desc: "A living model of your warehouse. Every section, bay, and level mapped in real time.",
  },
  {
    key: "search",
    shortName: "Search",
    side: "left",
    gen: "magnifier",
    rotX: -12,
    rotY: -34,
    rotZ: -9,
    scale: 0.6,
    offsetX: -1.25,
    offsetY: 1,
    num: "03",
    badge: "AI-powered",
    title: "Intelligent search",
    desc: "Ask anything in plain language. Searches products, locations, and history.",
  },
  {
    key: "analytics",
    shortName: "Analytics",
    side: "right",
    gen: "bars",
    rotX: 0,
    rotY: 42,
    rotZ: 1,
    scale: 0.65,
    offsetX: 2,
    offsetY: 0,
    num: "04",
    badge: "Forecasting",
    title: "Predictive analytics",
    desc: "Nimbus doesn't just report what happened — it forecasts what's next.",
  },
];

const DEFAULT_PARAMS = SECTIONS.map((s) => ({
  rotX: s.rotX,
  rotY: s.rotY,
  rotZ: s.rotZ,
  scale: s.scale ?? 0.85,
  offsetX: s.offsetX ?? 0,
  offsetY: s.offsetY ?? 0,
}));

const DEBUG_STORAGE_KEY = "aiSectionDebugParams_v1";

function smoothstep(x) {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

/* Formation curve — see AISection.module.css for phase mapping. */
function formationCurve(p) {
  if (p <= 0.15 || p >= 0.85) return 0;
  if (p < 0.4) return smoothstep((p - 0.15) / 0.25);
  if (p <= 0.6) return 1;
  return 1 - smoothstep((p - 0.6) / 0.25);
}

/* ═══════════════════════════════════════════════════════════════════════
   DEBUG PANEL — only mounted when ?debug is in the URL.
   Sliders directly mutate parent state; parent's effect rebuilds the
   relevant shape and the live render picks it up next frame.
   ═══════════════════════════════════════════════════════════════════════ */
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

function DebugPanel({ params, onChange, onReset, onClose }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const p = params[active];

  const update = (field, value) => onChange(active, field, value);

  const copyConfig = async () => {
    /* Output in the SECTIONS shape so it's a drop-in paste for the file. */
    const config = params.map((par, i) => ({
      key: SECTIONS[i].key,
      rotX: Math.round(par.rotX),
      rotY: Math.round(par.rotY),
      rotZ: Math.round(par.rotZ),
      scale: parseFloat(par.scale.toFixed(2)),
      offsetX: parseFloat(par.offsetX.toFixed(2)),
      offsetY: parseFloat(par.offsetY.toFixed(2)),
    }));
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.log(JSON.stringify(config, null, 2));
    }
  };

  return (
    <div className={styles.dbgPanel}>
      <div className={styles.dbgHead}>
        <span className={styles.dbgTitle}>SHAPE DEBUG</span>
        <button
          type="button"
          onClick={onClose}
          className={styles.dbgClose}
          aria-label="Close debug panel"
        >
          ×
        </button>
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
            {s.num}
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
        <button type="button" onClick={onReset} className={styles.dbgBtn}>
          Reset
        </button>
        <button type="button" onClick={copyConfig} className={styles.dbgBtn}>
          {copied ? "Copied ✓" : "Copy config"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   AI SECTION
   ═══════════════════════════════════════════════════════════════════════ */
export default function AISection() {
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);
  const blockRefs = useRef([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const sectionVisibleRef = useRef(false);
  /* Per-card formation values (0..1). Written by the scroll handler and
     read by the matrix-scramble RAF loop. Kept out of React state so
     letter updates don't trigger re-renders. */
  const formationsRef = useRef([]);
  const { paused } = useAnimationPaused();
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  /* Debug state. `debugAvailable` is read once from the URL — adding
     ?debug=1 anywhere in the query string turns on the panel toggle. */
  const [debugAvailable, setDebugAvailable] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugParams, setDebugParams] = useState(DEFAULT_PARAMS);
  /* Mirror to a ref so the shape-rebuild function can read latest values
     without being captured stale by the Three.js init closure. */
  const debugParamsRef = useRef(debugParams);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasDebug = new URLSearchParams(window.location.search).has("debug");
    setDebugAvailable(hasDebug);
    /* If debug is on, load any previously-tuned values from storage so
       tweaks survive page reloads. Validated by length to avoid stale data
       from an older version with a different SECTIONS count. */
    if (hasDebug) {
      try {
        const stored = localStorage.getItem(DEBUG_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length === SECTIONS.length) {
            setDebugParams(parsed);
          }
        }
      } catch (e) {
        /* ignore */
      }
    }
  }, []);

  /* Whenever debugParams changes: update ref, persist (if debug is on),
     and ask Three.js to rebuild the shape buffers. */
  const rebuildShapesRef = useRef(null);
  useEffect(() => {
    debugParamsRef.current = debugParams;
    if (debugAvailable) {
      try {
        localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(debugParams));
      } catch (e) {
        /* ignore */
      }
    }
    rebuildShapesRef.current?.();
  }, [debugParams, debugAvailable]);

  const handleDebugChange = useCallback((idx, field, value) => {
    setDebugParams((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }, []);

  const handleDebugReset = useCallback(() => {
    setDebugParams(DEFAULT_PARAMS);
    try {
      localStorage.removeItem(DEBUG_STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
  }, []);

  const CFG = {
    smoothFormation: 0.18,
    physicsStiff: 0.055,
    physicsDamping: 0.78,
    curlStrength: 0,
    stagger: 0.32,
    jitterBase: 0.018,
    jitterFreqBase: 0.18,
    sheenSmooth: 0.22,
    sheenMax: 0.36,
    sectionAlpha: 0.55,
    camZ: 16,
    camZMobile: 22,
  };

  const stateRef = useRef({
    activeShape: 0,
    formation: 0,
    globalAlpha: 0,
  });

  /* Click a side-bar tick → scroll the matching block into view.
     Scrolling to block-center lines up perfectly with the formation
     curve's peak (block-center == viewport-center == p == 0.5). */
  const scrollToBlock = useCallback((i) => {
    blockRefs.current[i]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  /* ── Scroll handler ──
     The visible cards no longer move — they live in a single sticky
     layer (.cardLayer) pinned for the entire section. The .block
     elements below are now invisible 140vh spacers whose only job is
     to drive the per-card formation curves as they scroll past.
     activeIdx + progress feed the side-bar UI. */
  useEffect(() => {
    const section = sectionRef.current;
    const blocks = blockRefs.current.filter(Boolean);
    if (!section) return;

    const vh = window.innerHeight;
    const vcenter = vh / 2;

    const sectionObs = new IntersectionObserver(
      ([e]) => {
        sectionVisibleRef.current = e.isIntersecting;
      },
      { threshold: 0.01, rootMargin: "400px" }
    );
    sectionObs.observe(section);

    const onScroll = () => {
      if (blocks.length > 1) {
        const fTop =
          blocks[0].getBoundingClientRect().top + blocks[0].offsetHeight * 0.5;
        const lTop = blocks[blocks.length - 1].getBoundingClientRect().top;
        setProgress(Math.max(0, Math.min(1, (vcenter - fTop) / (lTop - fTop))));
      }

      const sRect = section.getBoundingClientRect();
      const sectionInView = sRect.bottom > 0 && sRect.top < vh;

      const formations = [];
      for (let i = 0; i < blocks.length; i++) {
        const r = blocks[i].getBoundingClientRect();
        const total = vh + r.height;
        const p = Math.max(0, Math.min(1, (vh - r.top) / total));
        formations.push(formationCurve(p));
      }

      let maxF = 0;
      let dom = stateRef.current.activeShape;
      for (let i = 0; i < formations.length; i++) {
        if (formations[i] > maxF) {
          maxF = formations[i];
          dom = i;
        }
      }

      stateRef.current.formation = maxF;
      stateRef.current.activeShape = dom;
      stateRef.current.globalAlpha = sectionInView ? CFG.sectionAlpha : 0;

      if (maxF > 0.5) setActiveIdx(dom);

      /* Stash formations for the scramble RAF below. */
      for (let i = 0; i < formations.length; i++) {
        formationsRef.current[i] = formations[i];
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      sectionObs.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* ── Matrix scramble loop ──
     All 4 cards are stacked at the same viewport slot (left-side
     cards overlap; right-side cards overlap). This loop is also
     responsible for fading inactive cards out via the side bar's
     opacity, so only the active card's bar reads as prominent at
     any moment.

     Per-letter math:
       letter index li of total N → reveal threshold = (li/N) * (END - WIN)
       lp = (f - threshold) / WIN
         lp <= 0     → hidden (nbsp, opacity 0)
         0 < lp < 1  → random glyph from MATRIX_CHARS, gold tint
         lp >= 1     → real char, normal color

     Random glyphs only re-roll every FRAME_DIVIDER frames so the
     scramble reads at ~15fps instead of strobing at 60. A dataset
     state tag skips redundant DOM writes once a letter is settled. */
  useEffect(() => {
    let raf;
    let tickCounter = 0;
    const REVEAL_END = 0.7;
    const SCRAMBLE_WIN = 0.12;
    const FRAME_DIVIDER = 4;

    const tick = () => {
      tickCounter++;
      const rollGlyph = tickCounter % FRAME_DIVIDER === 0;

      const cards = cardRefs.current;
      for (let ci = 0; ci < cards.length; ci++) {
        const card = cards[ci];
        if (!card) continue;
        const f = formationsRef.current[ci] ?? 0;

        /* Side bar opacity tracks f. With multiple cards sharing the
           same viewport slot, this makes the active card's bar
           dominate while inactives recede. Pointer events gated so
           only the active bar is clickable. */
        const sideBar = card.querySelector(`.${styles.sideBar}`);
        if (sideBar) {
          const fKey = f.toFixed(3);
          if (sideBar.dataset.fk !== fKey) {
            sideBar.style.opacity = String(f);
            sideBar.style.pointerEvents = f > 0.5 ? "auto" : "none";
            sideBar.dataset.fk = fKey;
          }
        }

        const letters = card.querySelectorAll(`.${styles.scrambleChar}`);
        const total = letters.length;
        if (!total) continue;

        const denom = REVEAL_END - SCRAMBLE_WIN;

        for (let li = 0; li < total; li++) {
          const el = letters[li];
          const real = el.dataset.char;
          if (real === " ") continue;

          const startAt = (li / total) * denom;
          const lp = (f - startAt) / SCRAMBLE_WIN;

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
            if (rollGlyph) {
              el.textContent =
                MATRIX_CHARS[(Math.random() * MATRIX_CHARS.length) | 0];
            }
            el.style.opacity = String(0.35 + lp * 0.65);
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

  /* ── Three.js particles ── */
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
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);

      const isMobile = window.innerWidth < 768;
      const scattered = generateScattered(PARTICLE_COUNT, isMobile);

      /* ── Shape builder ──
         Builds every shape from the latest debug params. Exposed via
         rebuildShapesRef so the debug-params effect can call it live.
         The animation loop reads `shapes` via closure — we keep mutating
         the same `shapes` array (in place) so the loop's reference stays
         valid across rebuilds. */
      const shapes = [null, null, null, null];

      const buildShape = (i) => {
        const sec = SECTIONS[i];
        const params = debugParamsRef.current[i];
        const fn = SHAPE_GENERATORS[sec.gen];

        let pts = fn(PARTICLE_COUNT, params.rotX, params.rotY, params.rotZ);

        /* Scale — combine debug scale with a mobile shrink factor so the
           shapes fit the narrower portrait viewport. */
        const mobileFactor = isMobile ? 0.85 : 1.0;
        const scale = params.scale * mobileFactor;
        if (scale !== 1) {
          const out = new Float32Array(pts.length);
          for (let j = 0; j < pts.length; j++) out[j] = pts[j] * scale;
          pts = out;
        }

        /* Position — desktop alternates left/right with OFFSET, mobile
           centers and pulls up Y. Debug offsets layer on top. */
        const defaultX = isMobile ? 0 : sec.side === "left" ? OFFSET : -OFFSET;
        const defaultY = isMobile ? -3.5 : 0;
        const finalX = defaultX + params.offsetX;
        const finalY = defaultY + params.offsetY;

        if (finalX !== 0) pts = offsetShape(pts, finalX);
        if (finalY !== 0) pts = offsetShapeY(pts, finalY);

        return pts;
      };

      const rebuildShapes = () => {
        for (let i = 0; i < SECTIONS.length; i++) {
          shapes[i] = buildShape(i);
        }
      };
      rebuildShapes();
      rebuildShapesRef.current = rebuildShapes;

      const currentPos = new Float32Array(PARTICLE_COUNT * 3);
      currentPos.set(scattered);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(currentPos, 3)
      );

      const physicsPos = new Float32Array(PARTICLE_COUNT * 3);
      physicsPos.set(scattered);
      const velocity = new Float32Array(PARTICLE_COUNT * 3);

      const baseSizes = new Float32Array(PARTICLE_COUNT);
      const sizeScale = isMobile ? 1.6 : 1.25;
      for (let i = 0; i < PARTICLE_COUNT; i++)
        baseSizes[i] = (0.7 + Math.random() * 1.2) * sizeScale;
      geometry.setAttribute("aSize", new THREE.BufferAttribute(baseSizes, 1));

      const stagger = new Float32Array(PARTICLE_COUNT);
      for (let i = 0; i < PARTICLE_COUNT; i++)
        stagger[i] = Math.random() * CFG.stagger;

      const seeds = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) seeds[i] = Math.random();

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uColorMix: { value: 0 },
          uAccentColor: { value: new THREE.Color(0xd4a853) },
          uGlobalAlpha: { value: 0 },
          uSheen: { value: 0 },
        },
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      let sFormation = 0;
      let sAlpha = 0;
      let sColorMix = 0;

      function noise2(x, y) {
        return Math.sin(x * 1.7 + y * 2.3) * Math.cos(y * 1.3 - x * 0.9);
      }
      function curl2D(x, y, t) {
        const eps = 0.01;
        const n1 = noise2(x * 0.12 + t * 0.15, y * 0.12);
        const n2 = noise2(x * 0.12, y * 0.12 + eps + t * 0.15);
        const n3 = noise2(x * 0.12 + eps, y * 0.12 + t * 0.15);
        return { x: (n2 - n1) / eps, y: -((n3 - n1) / eps) };
      }

      function animate() {
        frameId = requestAnimationFrame(animate);
        if (!sectionVisibleRef.current || pausedRef.current) return;

        const t = performance.now() * 0.001;
        const s = stateRef.current;

        sFormation += (s.formation - sFormation) * CFG.smoothFormation;
        sAlpha += (s.globalAlpha - sAlpha) * CFG.smoothFormation;
        sColorMix += (sFormation - sColorMix) * CFG.smoothFormation;

        const activeShape = shapes[s.activeShape];
        if (!activeShape) return;

        const flowAmp =
          CFG.curlStrength > 0
            ? Math.sin(sFormation * Math.PI) * CFG.curlStrength
            : 0;

        const stiff = CFG.physicsStiff;
        const damping = CFG.physicsDamping;
        const jitterAmp = CFG.jitterBase * (1 - sFormation * 0.4);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;

          const stagDen = 1 - stagger[i] + 0.001;
          const rawF = Math.max(
            0,
            Math.min(1, (sFormation - stagger[i]) / stagDen)
          );
          const pf = rawF * rawF * (3 - 2 * rawF);

          const targetX = scattered[i3] * (1 - pf) + activeShape[i3] * pf;
          const targetY =
            scattered[i3 + 1] * (1 - pf) + activeShape[i3 + 1] * pf;
          const targetZ =
            scattered[i3 + 2] * (1 - pf) + activeShape[i3 + 2] * pf;

          velocity[i3] += (targetX - physicsPos[i3]) * stiff;
          velocity[i3 + 1] += (targetY - physicsPos[i3 + 1]) * stiff;
          velocity[i3 + 2] += (targetZ - physicsPos[i3 + 2]) * stiff;

          if (flowAmp > 0.001 && pf > 0.05 && pf < 0.95) {
            const c = curl2D(physicsPos[i3], physicsPos[i3 + 1], t);
            const mag = flowAmp * 0.08;
            velocity[i3] += c.x * mag;
            velocity[i3 + 1] += c.y * mag;
          }

          velocity[i3] *= damping;
          velocity[i3 + 1] *= damping;
          velocity[i3 + 2] *= damping;

          physicsPos[i3] += velocity[i3];
          physicsPos[i3 + 1] += velocity[i3 + 1];
          physicsPos[i3 + 2] += velocity[i3 + 2];

          const s1 = seeds[i3];
          const s2 = seeds[i3 + 1];
          const s3 = seeds[i3 + 2];
          const freq = CFG.jitterFreqBase + s1 * 0.2;
          const phase = s3 * 6.28;
          currentPos[i3] =
            physicsPos[i3] +
            Math.sin(t * freq + phase) * jitterAmp * (0.7 + s2 * 0.6);
          currentPos[i3 + 1] =
            physicsPos[i3 + 1] +
            Math.sin(t * freq * 0.9 + phase + 2.1) * jitterAmp * 0.6;
          currentPos[i3 + 2] =
            physicsPos[i3 + 2] +
            Math.cos(t * freq * 0.8 + phase + 4.2) * jitterAmp * 0.5;
        }
        geometry.attributes.position.needsUpdate = true;

        material.uniforms.uColorMix.value = sColorMix;
        material.uniforms.uGlobalAlpha.value = sAlpha;
        const sheenTarget =
          sFormation > 0.85 ? ((sFormation - 0.85) / 0.15) * CFG.sheenMax : 0;
        material.uniforms.uSheen.value +=
          (sheenTarget - material.uniforms.uSheen.value) * CFG.sheenSmooth;

        renderer.render(scene, camera);
      }
      animate();

      cleanup = () => {
        window.removeEventListener("resize", resize);
        rebuildShapesRef.current = null;
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
        {/* ── Single sticky card layer ──
            All 4 cards live here, stacked at the same viewport
            position (left-side cards overlap each other; same for
            right). The layer is pinned at top:0 for the entire
            section scroll, so the cards never slide with the page —
            only their content scrambles in/out. The negative
            margin-bottom keeps it from taking layout space, so the
            invisible spacer blocks below start right after the
            canvas, exactly where they used to. */}
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
                {/* ── Side progress bar ──
                    Vertical hairline that replaces the old static
                    border. Fill height = global section progress.
                    Each section has a click-to-jump tick; the
                    current one scales up and shows its number. */}
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
                      aria-label={`Jump to ${s.title}`}
                      className={`${styles.sideTick} ${
                        idx / (SECTIONS.length - 1) <= progress + 0.001
                          ? styles.sideTickFilled
                          : ""
                      } ${activeIdx === idx ? styles.sideTickCurrent : ""}`}
                      style={{
                        top: `${(idx / (SECTIONS.length - 1)) * 100}%`,
                      }}
                    >
                      <span className={styles.sideTickLabel}>{s.num}</span>
                    </button>
                  ))}
                </div>

                {/* ── Scramble-reveal text ──
                    Each char is its own span carrying its real value
                    in data-char. The RAF loop above walks them in
                    DOM order and drives per-letter state from this
                    card's f. Spaces are skipped by the loop. */}
                <div className={styles.cardEyebrow}>
                  {[...sec.badge.toUpperCase()].map((c, j) => (
                    <span
                      key={`eb-${j}`}
                      data-char={c}
                      className={styles.scrambleChar}
                    >
                      {"\u00A0"}
                    </span>
                  ))}
                </div>
                <h3 className={styles.cardTitle}>
                  {[...sec.title].map((c, j) => (
                    <span
                      key={`t-${j}`}
                      data-char={c}
                      className={styles.scrambleChar}
                    >
                      {"\u00A0"}
                    </span>
                  ))}
                </h3>
                <p className={styles.cardDesc}>
                  {[...sec.desc].map((c, j) => (
                    <span
                      key={`d-${j}`}
                      data-char={c}
                      className={styles.scrambleChar}
                    >
                      {"\u00A0"}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Invisible scroll spacers ──
            One per section. They render nothing but their scroll
            positions drive the formation curves (via
            getBoundingClientRect in the scroll handler) and the
            click-to-jump scrollIntoView. */}
        {SECTIONS.map((sec, i) => (
          <div
            key={sec.key}
            ref={(el) => (blockRefs.current[i] = el)}
            className={styles.block}
            aria-hidden="true"
          />
        ))}

        <div className={styles.trailingSpacer} />
      </div>

      {/* ── Debug UI (only when ?debug is set) ── */}
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
          onChange={handleDebugChange}
          onReset={handleDebugReset}
          onClose={() => setDebugOpen(false)}
        />
      )}
    </section>
  );
}
