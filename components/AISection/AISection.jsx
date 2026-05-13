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

const MATRIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789▓▒░<>/\\";

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
    badge: "Forecasting",
    title: "Predictive analytics",
    desc: "Nimbus doesn't just report what happened — it forecasts what's next.",
  },
];

/* FIXED: was `offsetX: s.offsetsetX` (typo) — that made every particle's
   defaultX collapse to NaN and the entire cloud disappear into garbage
   positions. Now sources the value from the canonical SECTIONS field. */
const DEFAULT_PARAMS = SECTIONS.map((s) => ({
  rotX: s.rotX,
  rotY: s.rotY,
  rotZ: s.rotZ,
  scale: s.scale,
  offsetX: s.offsetX,
  offsetY: s.offsetY,
}));

const DEBUG_STORAGE_KEY = "aiSectionDebugParams_v1";

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
   SCRAMBLE TEXT RENDERER
   
   The matrix-scramble effect needs each letter wrapped in its own
   span so the RAF loop can individually drive its textContent +
   opacity + color. The original implementation spread the entire
   string into per-character spans with no word grouping, so every
   space-position character was an inline-block too. Result: the
   browser was free to line-break BETWEEN any two characters,
   including in the middle of a word — exactly the "letter breaks
   in words" the user is seeing.
   
   Fix: split on whitespace, wrap each real word in a .word span
   (`white-space: nowrap` from globals.css), and leave the spaces
   between words as plain text nodes — so the browser CAN break the
   line at spaces but CAN'T break inside a word.

   The scramble RAF loop still finds every .scrambleChar via
   querySelectorAll, in DOM order = reading order, so the staggered
   reveal still works correctly.
   ───────────────────────────────────────────────────────────────────── */
function renderScramble(text, keyPrefix = "") {
  /* The capturing group in split() keeps the whitespace runs as their
     own array entries — we render those as plain text so the line is
     allowed to break at them. */
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

function DebugPanel({ params, onChange, onReset, onClose }) {
  const [active, setActive] = useState(0);
  const p = params[active];
  const update = (field, value) => onChange(active, field, value);

  return (
    <div className={styles.dbgPanel}>
      <div className={styles.dbgHead}>
        <span className={styles.dbgTitle}>SHAPE DEBUG</span>
        {/* FIXED: was "×times;" — looks like a half-decoded HTML entity. */}
        <button type="button" onClick={onClose} className={styles.dbgClose}>
          ✕
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
      </div>
    </div>
  );
}

export default function AISection() {
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);

  const cardRefs = useRef([]);
  const blockRefs = useRef([]);

  const formationsRef = useRef([]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  /* Visibility flag for the THREE animate loop. The animate loop
     short-circuits when this is false (cheap perf win when the section
     is off-screen). It's wired up via IntersectionObserver below; was
     missing entirely before, which is why the particle render call was
     never actually executing. */
  const sectionVisibleRef = useRef(false);

  const { paused } = useAnimationPaused();
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const [debugAvailable, setDebugAvailable] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugParams, setDebugParams] = useState(DEFAULT_PARAMS);

  const debugParamsRef = useRef(debugParams);
  useEffect(() => {
    debugParamsRef.current = debugParams;
  }, [debugParams]);

  const rebuildShapesRef = useRef(null);

  const handleDebugChange = useCallback((idx, field, value) => {
    setDebugParams((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }, []);

  /* Unlock the debug panel when ?debug is in the URL. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("debug")) {
      setDebugAvailable(true);
    }
  }, []);

  /* Persist debug tuning across reloads. The "first mount" ref ensures
     we LOAD before SAVE on the initial render — otherwise the save
     effect would fire on mount with the default state and overwrite
     any previously-saved tuning. */
  const debugMountedRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!debugMountedRef.current) {
      debugMountedRef.current = true;
      try {
        const saved = window.localStorage.getItem(DEBUG_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === SECTIONS.length) {
            setDebugParams(parsed);
          }
        }
      } catch {
        /* localStorage disabled / quota; nothing to recover. */
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

  /* Whenever tunings change, regenerate the shape buffers. The init
     useEffect parks the rebuild function on this ref once THREE has
     loaded; if a change comes in before that, the optional chaining
     no-ops and the next init pass picks up the latest params via
     debugParamsRef anyway. */
  useEffect(() => {
    rebuildShapesRef.current?.();
  }, [debugParams]);

  /* Section visibility observer. rootMargin lets us start the loop
     ~200px before the section actually enters the viewport, so the
     particle cloud is settled by the time the user scrolls into it. */
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
    physicsStiff: 0.055,
    physicsDamping: 0.78,
    jitterBase: 0.018,
    jitterFreqBase: 0.18,
    sectionAlpha: 0.55,
    camZ: 16,
    camZMobile: 22,
  };

  const stateRef = useRef({
    activeShape: 0,
    formation: 0,
    globalAlpha: 0,
  });

  /* Scroll-driven formation values. Computes a [0..1] formation curve
     for each block based on its viewport position, picks the dominant
     section as the active shape, and updates the progress bar. */
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

  /* Text scramble RAF loop.
     Tunables: REVEAL_END is how far into the formation curve all
     letters are fully revealed (0.7 = revealed by 70% of the
     formation, with the last 30% just holding the real text). 
     SCRAMBLE_WINDOW is the per-letter on-ramp width. MIN_OPACITY
     used to be 0.35 — bumped to 0.45 so the scrambling glyphs stay
     legible against the white page background. */
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

  /* THREE.js init + animate. The fixes that matter here:
     1. The shape buffers no longer get NaN positions (offsetX typo fixed
        at the top of the file).
     2. sectionVisibleRef.current is now updated by the IntersectionObserver
        above, so the animate body actually runs instead of bailing every
        frame.
     3. sAlpha is driven from formation so the particle cloud is
        actually visible — the old code never assigned globalAlpha
        anywhere, so the shader's uGlobalAlpha stayed at 0 and the
        whole system rendered fully transparent. */
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
      };

      resize();
      window.addEventListener("resize", resize);

      const isMobile = window.innerWidth < 768;
      const scattered = generateScattered(PARTICLE_COUNT, isMobile);
      const shapes = [null, null, null, null];

      const buildShape = (i) => {
        const sec = SECTIONS[i];
        const params = debugParamsRef.current[i];
        const fn = SHAPE_GENERATORS[sec.gen];

        let pts = fn(PARTICLE_COUNT, params.rotX, params.rotY, params.rotZ);

        const mobileFactor = isMobile ? 0.85 : 1;
        const scale = params.scale * mobileFactor;

        if (scale !== 1) {
          const out = new Float32Array(pts.length);
          for (let j = 0; j < pts.length; j++) {
            out[j] = pts[j] * scale;
          }
          pts = out;
        }

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
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        baseSizes[i] = (0.7 + Math.random() * 1.2) * sizeScale;
      }
      geometry.setAttribute("aSize", new THREE.BufferAttribute(baseSizes, 1));

      const stagger = new Float32Array(PARTICLE_COUNT);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        stagger[i] = Math.random() * 0.32;
      }

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

      const animate = () => {
        frameId = requestAnimationFrame(animate);

        if (pausedRef.current || !sectionVisibleRef.current) {
          return;
        }

        const t = performance.now() * 0.001;
        const s = stateRef.current;

        sFormation += (s.formation - sFormation) * CFG.smoothFormation;
        sColorMix += (sFormation - sColorMix) * CFG.smoothFormation;

        /* Drive globalAlpha from formation: a steady scattered visibility
           floor whenever the section is on-screen, ramping up to fully
           opaque while a shape is forming. The old code initialized
           globalAlpha to 0 and never touched it, which is why the
           particle cloud rendered as nothing — uGlobalAlpha stayed at 0. */
        const baseAlpha = 0.4;
        const targetAlpha = baseAlpha + (1 - baseAlpha) * sFormation;
        sAlpha += (targetAlpha - sAlpha) * CFG.smoothFormation;

        const activeShape = shapes[s.activeShape];
        if (!activeShape) return;

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

          velocity[i3] += (targetX - physicsPos[i3]) * CFG.physicsStiff;
          velocity[i3 + 1] += (targetY - physicsPos[i3 + 1]) * CFG.physicsStiff;
          velocity[i3 + 2] += (targetZ - physicsPos[i3 + 2]) * CFG.physicsStiff;

          velocity[i3] *= CFG.physicsDamping;
          velocity[i3 + 1] *= CFG.physicsDamping;
          velocity[i3 + 2] *= CFG.physicsDamping;

          physicsPos[i3] += velocity[i3];
          physicsPos[i3 + 1] += velocity[i3 + 1];
          physicsPos[i3 + 2] += velocity[i3 + 2];

          const s1 = seeds[i3];
          const s2 = seeds[i3 + 1];
          const freq = CFG.jitterFreqBase + s1 * 0.2;

          currentPos[i3] =
            physicsPos[i3] +
            Math.sin(t * freq) * CFG.jitterBase * (0.7 + s2 * 0.6);
          currentPos[i3 + 1] =
            physicsPos[i3 + 1] + Math.cos(t * freq) * CFG.jitterBase * 0.6;
          currentPos[i3 + 2] = physicsPos[i3 + 2];
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
                    >
                      <span className={styles.sideTickLabel}>{s.num}</span>
                    </button>
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
          onChange={handleDebugChange}
          onReset={() => setDebugParams(DEFAULT_PARAMS)}
          onClose={() => setDebugOpen(false)}
        />
      )}
    </section>
  );
}
