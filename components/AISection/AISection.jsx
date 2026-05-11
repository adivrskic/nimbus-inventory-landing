"use client";

import { useEffect, useRef, useState } from "react";
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

/* Map of shape-key → generator. Edit a section's `gen` field to swap
   which shape it morphs into. */
const SHAPE_GENERATORS = {
  rings: generateSoundRings,
  cube: generateCube,
  magnifier: generateMagnifier,
  bars: generateBarChart,
};

/* ── Per-section configuration ──
   rotX / rotY / rotZ are in DEGREES, applied to each shape at generation:
     rotX  ─  pitch (negative tilts top edge toward viewer)
     rotY  ─  yaw (positive rotates right edge away)
     rotZ  ─  roll (in-plane spin)
   Defaults of (-17, 23, 0) approximate the previous isometric look.
   Tune per section to taste. */
const SECTIONS = [
  {
    key: "voice",
    side: "left",
    gen: "rings",
    rotX: -25,
    rotY: -45,
    rotZ: 0,
    num: "01",
    badge: "Hands-free",
    title: "Voice commands",
    desc: "Nimbus processes natural speech and executes warehouse actions hands-free.",
  },
  {
    key: "spatial",
    side: "right",
    gen: "cube",
    rotX: -25,
    rotY: -45,
    rotZ: 0,
    num: "02",
    badge: "Real-time",
    title: "Spatial intelligence",
    desc: "A living model of your warehouse. Every section, bay, and level mapped in real time.",
  },
  {
    key: "search",
    side: "left",
    gen: "magnifier",
    rotX: -25,
    rotY: -45,
    rotZ: 0,
    num: "03",
    badge: "AI-powered",
    title: "Intelligent search",
    desc: "Ask anything in plain language. Searches products, locations, and history.",
  },
  {
    key: "analytics",
    side: "right",
    gen: "bars",
    rotX: 15,
    rotY: 45,
    rotZ: 0,
    num: "04",
    badge: "Forecasting",
    title: "Predictive analytics",
    desc: "Nimbus doesn't just report what happened — it forecasts what's next.",
  },
];

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

export default function AISection() {
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);
  const blockRefs = useRef([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const sectionVisibleRef = useRef(false);
  const { paused } = useAnimationPaused();
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

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
    /* Particle alpha when the section is in viewport. The formation
       and sheen logic apply additional brightness on top. */
    sectionAlpha: 0.55,
    camZ: 16,
    camZMobile: 22,
  };

  const stateRef = useRef({
    activeShape: 0,
    formation: 0,
    globalAlpha: 0,
  });

  /* ── Scroll handler ── */
  useEffect(() => {
    const section = sectionRef.current;
    const blocks = blockRefs.current.filter(Boolean);
    const cards = cardRefs.current.filter(Boolean);
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
      /* Bottom progress bar */
      if (blocks.length > 1) {
        const fTop =
          blocks[0].getBoundingClientRect().top + blocks[0].offsetHeight * 0.5;
        const lTop = blocks[blocks.length - 1].getBoundingClientRect().top;
        setProgress(Math.max(0, Math.min(1, (vcenter - fTop) / (lTop - fTop))));
      }

      /* Section visibility → global particle alpha. Soft fade-in is
         provided by the sAlpha smoothing in the render loop. */
      const sRect = section.getBoundingClientRect();
      const sectionInView = sRect.bottom > 0 && sRect.top < vh;

      /* Per-block formation */
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

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (!card) continue;
        const f = formations[i];
        card.style.opacity = String(f);
        card.style.transform = `translateY(${(1 - f) * 16}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      sectionObs.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* ── Three.js particles ── */
  useEffect(() => {
    let frameId;
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

      /* Build each shape with its section's specific rotation. */
      const baseShapes = SECTIONS.map((sec) => {
        const fn = SHAPE_GENERATORS[sec.gen];
        return fn(PARTICLE_COUNT, sec.rotX, sec.rotY, sec.rotZ);
      });

      const shapes = isMobile
        ? baseShapes.map((s) => {
            const scaled = new Float32Array(s.length);
            for (let j = 0; j < s.length; j++) scaled[j] = s[j] * 0.75;
            return offsetShapeY(scaled, -3.5);
          })
        : baseShapes.map((s, i) =>
            offsetShape(s, SECTIONS[i].side === "left" ? OFFSET : -OFFSET)
          );

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
      return () => window.removeEventListener("resize", resize);
    };
    init();
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <section ref={sectionRef} id="ai-engine" className={styles.section}>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} />
      </div>

      <div className={styles.textWrap}>
        {SECTIONS.map((sec, i) => (
          <div
            key={sec.key}
            ref={(el) => (blockRefs.current[i] = el)}
            className={styles.block}
          >
            <div
              className={`${styles.blockSticky} ${
                sec.side === "left" ? styles.blockLeft : styles.blockRight
              }`}
            >
              <div
                ref={(el) => (cardRefs.current[i] = el)}
                className={`${styles.cardEditorial} ${
                  sec.side === "right" ? styles.cardEditorialRight : ""
                }`}
              >
                <div className={styles.cardEyebrow}>
                  {sec.num} &mdash; {sec.badge.toUpperCase()}
                </div>
                <h3 className={styles.cardTitle}>{sec.title}</h3>
                <p className={styles.cardDesc}>{sec.desc}</p>
              </div>
            </div>
          </div>
        ))}

        <div className={styles.trailingSpacer} />
      </div>

      <div className={styles.progressWrap}>
        <div className={styles.progressInner}>
          <div className={styles.progressLabels}>
            {SECTIONS.map((s, i) => (
              <span
                key={s.key}
                className={styles.progressLabel}
                onClick={() =>
                  blockRefs.current[i]?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  })
                }
                style={{
                  left: `${(i / (SECTIONS.length - 1)) * 100}%`,
                  color: activeIdx >= i ? "var(--primary)" : "var(--muted)",
                  cursor: "pointer",
                }}
              >
                {s.key.charAt(0).toUpperCase() + s.key.slice(1)}
              </span>
            ))}
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress * 100}%` }}
            />
            {SECTIONS.map((_, i) => (
              <div
                key={i}
                className={styles.progressDot}
                onClick={() =>
                  blockRefs.current[i]?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  })
                }
                style={{
                  left: `${(i / (SECTIONS.length - 1)) * 100}%`,
                  background:
                    progress >= i / (SECTIONS.length - 1)
                      ? "var(--primary)"
                      : "var(--divider)",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
