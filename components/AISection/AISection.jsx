"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  generateScattered,
  generateSoundRings,
  generateCube,
  generateMagnifier,
  generateBarChart,
  offsetShape,
  offsetShapeY,
  isoShape,
} from "@/lib/shapes";
import { vertexShader, fragmentShader } from "@/lib/shaders";
import styles from "./AISection.module.css";

gsap.registerPlugin(ScrollTrigger);

const PARTICLE_COUNT = 35000;
const OFFSET = 5.5;

const SECTIONS = [
  {
    key: "voice",
    label: "Voice",
    title: "Voice commands",
    badge: "Hands-free",
    descLines: [
      '"Relocate this to Section B, Bay 4,',
      'Level 2." Nimbus processes natural speech',
      "and executes warehouse actions hands-free.",
    ],
    details: [
      "Works with gloves, ladders, forklifts",
      "Processes relocate, pick, count, adjust",
      "Learns your team's speech patterns",
    ],
    stats: [
      { val: "8", label: "Voice actions" },
      { val: "<1s", label: "Response" },
    ],
  },
  {
    key: "spatial",
    label: "Spatial",
    title: "Spatial intelligence",
    badge: "Real-time",
    descLines: [
      "Nimbus builds a living model of your",
      "warehouse. Every section, bay, and level",
      "mapped in real time.",
    ],
    details: [
      "Color-coded section mapping",
      "AI congestion detection",
      "Optimal placement suggestions",
    ],
    stats: [
      { val: "3D", label: "Floor map" },
      { val: "Live", label: "Updates" },
    ],
  },
  {
    key: "search",
    label: "Search",
    title: "Intelligent search",
    badge: "AI-powered",
    descLines: [
      "\"Where's the oak planking from last",
      'Tuesday?" Ask anything in plain language.',
    ],
    details: [
      "Searches products, locations, history",
      "Natural language processing",
      "Learns your most common queries",
    ],
    stats: [
      { val: "<200ms", label: "Results" },
      { val: "97%", label: "Accuracy" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    title: "Predictive analytics",
    badge: "Forecasting",
    descLines: [
      "Nimbus doesn't just report what happened",
      "— it forecasts what's next.",
    ],
    details: [
      "Stock depletion predictions",
      "Reorder quantity recommendations",
      "Anomaly detection alerts",
    ],
    stats: [
      { val: "3 days", label: "Advance warning" },
      { val: "70%", label: "Time saved" },
    ],
  },
];

const INTRO_H2_LINES = [
  [
    { text: "From", accent: false },
    { text: "noise", accent: false },
  ],
  [
    { text: "to", accent: false },
    { text: "clarity.", accent: true },
  ],
];
const INTRO_DESC_LINES = [
  "Scattered data, missing pallets, guesswork.",
  "Nimbus brings structure to the disorder —",
  "turning every scan into signal.",
];

/* ── smoothstep helper ── */
function smoothstep(x) {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

export default function AISection() {
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const introRef = useRef(null);
  const cardRefs = useRef([]);
  const blockRefs = useRef([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [progress, setProgress] = useState(0);
  const sectionVisibleRef = useRef(false);

  /* ── Scroll-driven particle state ── */
  const particleState = useRef({
    formation: 0,
    weights: [0, 0, 0, 0],
    globalAlpha: 0.12,
  });

  /* ── Text burst state ── */
  const burstCanvasRef = useRef(null);
  const introExitRef = useRef(0);
  const letterOriginsRef = useRef(null); // captured once

  /* ── First useEffect: scroll logic + GSAP text animations ── */
  useEffect(() => {
    const section = sectionRef.current;
    const intro = introRef.current;
    const blocks = blockRefs.current.filter(Boolean);
    const cards = cardRefs.current.filter(Boolean);
    if (!section || !intro) return;

    const vh = window.innerHeight;
    const vcenter = vh / 2;

    const sectionObs = new IntersectionObserver(
      ([e]) => {
        sectionVisibleRef.current = e.isIntersecting;
      },
      { threshold: 0.01, rootMargin: "400px" }
    );
    sectionObs.observe(section);

    /* ── Scroll handler: ALL particle values derived from scroll position ── */
    const onScroll = () => {
      const sRect = section.getBoundingClientRect();
      const total = section.offsetHeight - vh - vh;
      const p = Math.max(0, Math.min(1, -sRect.top / total));
      setProgress(p);

      // Alpha: ramp up as intro scrolls past center
      const iRect = intro.getBoundingClientRect();
      const introCenter = iRect.top + iRect.height / 2;
      const introNorm = (introCenter - vcenter) / vh; // positive = below center
      const alpha =
        introNorm > 0 ? 0.12 + smoothstep(1 - introNorm / 0.6) * 0.73 : 0.85;

      // Intro exit → early particle stirring toward shape 0
      // introNorm goes from positive (below center) → 0 (centered) → negative (above center)
      // Start particles moving once intro passes center and begins exiting
      const introExit =
        introNorm < 0 ? smoothstep(Math.min(1, Math.abs(introNorm) / 0.5)) : 0;
      const introFormation = introExit * 0.35; // up to 35% formation from intro alone

      // Per-block weight: cosine falloff from viewport center
      const weights = [0, 0, 0, 0];
      let maxWeight = 0;
      let maxIdx = 0;

      blocks.forEach((block, i) => {
        const r = block.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const dist = Math.abs(center - vcenter) / vh;
        if (dist < 0.9) {
          const w = Math.pow(Math.cos((dist / 0.9) * Math.PI * 0.5), 2);
          weights[i] = w;
          if (w > maxWeight) {
            maxWeight = w;
            maxIdx = i;
          }
        }
      });

      // Formation: max of intro-driven and block-driven
      const blockFormation = smoothstep(Math.min(1, maxWeight * 1.4));
      const formation = Math.max(introFormation, blockFormation);

      // Blend intro formation toward shape 0, block formation toward active shape
      const wSum = weights[0] + weights[1] + weights[2] + weights[3];
      if (wSum > 0.001) {
        for (let i = 0; i < 4; i++) weights[i] /= wSum;
      } else if (introFormation > 0.01) {
        // No blocks visible yet, but intro is exiting → drift toward shape 0
        weights[0] = 1;
      }

      particleState.current.formation = formation;
      particleState.current.weights = weights;
      particleState.current.globalAlpha = Math.max(0.1, Math.min(0.85, alpha));

      // Intro exit progress for burst effect (0 = fully visible, 1 = fully gone)
      // Starts when intro top is at 15% of viewport, ends when top is at -35%
      const introTop = iRect.top / vh;
      const exitP = Math.max(0, Math.min(1, (0.15 - introTop) / 0.5));
      introExitRef.current = exitP;

      // Set intro opacity directly (text fades as particles take over)
      if (intro) intro.style.opacity = String(Math.max(0, 1 - exitP * 2.5));

      // Capture letter positions once at the start of exit
      if (exitP > 0.01 && !letterOriginsRef.current) {
        const origins = [];
        const allLetters = intro.querySelectorAll(
          `.${styles.introLetter}, .${styles.introDescLetter}`
        );
        allLetters.forEach((el) => {
          const r = el.getBoundingClientRect();
          origins.push({
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
            size: Math.max(r.width, r.height),
            burstX: (Math.random() - 0.5) * 400,
            burstY: (Math.random() - 0.5) * 300 - 100,
          });
        });
        letterOriginsRef.current = origins;
      }

      if (formation > 0.3) setActiveIdx(maxIdx);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initial call

    /* ── Intro text entrance ── */
    const hLetters = intro.querySelectorAll(`.${styles.introLetter}`);
    const dLetters = intro.querySelectorAll(`.${styles.introDescLetter}`);

    gsap.to(hLetters, {
      opacity: 1,
      y: "0%",
      rotateX: 0,
      duration: 0.45,
      stagger: 0.014,
      ease: "power4.out",
      scrollTrigger: { trigger: intro, start: "top 55%" },
    });
    gsap.to(dLetters, {
      opacity: 1,
      y: "0%",
      duration: 0.3,
      stagger: 0.005,
      ease: "power3.out",
      scrollTrigger: { trigger: intro, start: "top 40%" },
    });

    /* ── Per-card text choreography (unchanged) ── */
    cards.forEach((card) => {
      if (!card) return;
      const header = card.querySelector(`.${styles.cardHeader}`);
      const titleLetters = card.querySelectorAll(`.${styles.cardTitleLetter}`);
      const descLetters2 = card.querySelectorAll(`.${styles.cardDescLetter}`);
      const details = card.querySelector(`.${styles.cardDetails}`);
      const stats = card.querySelector(`.${styles.cardStats}`);

      const tl = gsap.timeline({
        scrollTrigger: { trigger: card, start: "top 65%" },
        defaults: { ease: "power4.out" },
      });
      tl.to(header, { opacity: 1, y: 0, duration: 0.3 });
      tl.to(
        titleLetters,
        { opacity: 1, y: "0%", rotateX: 0, duration: 0.4, stagger: 0.012 },
        "-=0.15"
      );
      tl.to(
        descLetters2,
        {
          opacity: 1,
          y: "0%",
          duration: 0.3,
          stagger: 0.004,
          ease: "power3.out",
        },
        "-=0.2"
      );
      if (details)
        tl.to(details, { opacity: 1, y: 0, duration: 0.3 }, "-=0.15");
      if (stats) tl.to(stats, { opacity: 1, y: 0, duration: 0.3 }, "-=0.2");

      gsap.to(card, {
        y: -40,
        ease: "none",
        scrollTrigger: {
          trigger: card,
          start: "top 50%",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    });

    return () => {
      sectionObs.disconnect();
      window.removeEventListener("scroll", onScroll);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  /* ── Second useEffect: Three.js particles ── */
  useEffect(() => {
    let frameId;
    const init = async () => {
      const THREE = await import("three");
      const canvas = canvasRef.current;
      if (!canvas) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      camera.position.z = window.innerWidth < 768 ? 22 : 16;
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      const resize = () => {
        const w = canvas.parentElement.clientWidth,
          h = canvas.parentElement.clientHeight;
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

      /* ── Generate positions ── */
      const isMobile = window.innerWidth < 768;
      const scattered = generateScattered(PARTICLE_COUNT, isMobile);

      const baseShapes = [
        generateSoundRings(PARTICLE_COUNT),
        generateCube(PARTICLE_COUNT),
        generateMagnifier(PARTICLE_COUNT),
        generateBarChart(PARTICLE_COUNT),
      ];
      const off = isMobile ? 3 : OFFSET;
      const shapes = isMobile
        ? baseShapes.map((s, i) => {
            const base = i === 1 ? isoShape(s) : s;
            const scaled = new Float32Array(base.length);
            for (let j = 0; j < base.length; j++) scaled[j] = base[j] * 0.75;
            return offsetShapeY(scaled, -3.5);
          })
        : baseShapes.map((s, i) =>
            offsetShape(i === 1 ? isoShape(s) : s, i % 2 === 0 ? off : -off)
          );

      const currentPos = new Float32Array(PARTICLE_COUNT * 3);
      currentPos.set(scattered);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(currentPos, 3)
      );

      const baseSizes = new Float32Array(PARTICLE_COUNT);
      const sizeScale = isMobile ? 1.5 : 1.15;
      for (let i = 0; i < PARTICLE_COUNT; i++)
        baseSizes[i] = (0.6 + Math.random() * 1.1) * sizeScale;
      geometry.setAttribute("aSize", new THREE.BufferAttribute(baseSizes, 1));

      /* Per-particle stagger: small random offset so particles don't all move in lockstep */
      const stagger = new Float32Array(PARTICLE_COUNT);
      for (let i = 0; i < PARTICLE_COUNT; i++)
        stagger[i] = Math.random() * 0.18;

      /* Per-particle deterministic random seeds for organic motion */
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
          uGlobalAlpha: { value: 0.12 },
          uSheen: { value: 0 },
        },
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      /* ── Smooth followers (one-pole filters on scroll-derived values) ──
         These add just enough smoothing to eliminate scroll-event jitter
         while staying < 3 frames behind. NOT the old 0.09 laggy lerp. */
      let sFormation = 0;
      let sWeights = [0, 0, 0, 0];
      let sAlpha = 0.12;
      let sColorMix = 0;
      const SMOOTH = 0.35; // catches up to 95% in ~6 frames

      function animate() {
        frameId = requestAnimationFrame(animate);
        if (!sectionVisibleRef.current) return;

        const t = performance.now() * 0.001;
        const ps = particleState.current;

        /* ── Tight smoothing pass ── */
        sFormation += (ps.formation - sFormation) * SMOOTH;
        sAlpha += (ps.globalAlpha - sAlpha) * SMOOTH;
        for (let w = 0; w < 4; w++) {
          sWeights[w] += (ps.weights[w] - sWeights[w]) * SMOOTH;
        }
        const colorTarget = sFormation;
        sColorMix += (colorTarget - sColorMix) * SMOOTH;

        const f = sFormation; // formation 0-1

        /* ── Compute blended shape target for each particle ── */
        // Organic motion amplitude: strong when scattered, very subtle when formed
        const jitterAmp = 0.025 * (1 - f * 0.92);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;

          // Per-particle staggered formation (subtle, max 0.18 delay)
          const rawF = Math.max(
            0,
            Math.min(1, (f - stagger[i]) / (1 - stagger[i]))
          );
          const pf = rawF * rawF * (3 - 2 * rawF); // smoothstep

          // Blend shape target from all 4 shapes using scroll-derived weights
          let sx = 0,
            sy = 0,
            sz = 0;
          for (let s = 0; s < 4; s++) {
            if (sWeights[s] > 0.001) {
              sx += shapes[s][i3] * sWeights[s];
              sy += shapes[s][i3 + 1] * sWeights[s];
              sz += shapes[s][i3 + 2] * sWeights[s];
            }
          }

          // Lerp: scattered → blended shape
          currentPos[i3] = scattered[i3] * (1 - pf) + sx * pf;
          currentPos[i3 + 1] = scattered[i3 + 1] * (1 - pf) + sy * pf;
          currentPos[i3 + 2] = scattered[i3 + 2] * (1 - pf) + sz * pf;

          // Subtle organic motion (deterministic per-particle, time-based only for life)
          const s1 = seeds[i3],
            s2 = seeds[i3 + 1],
            s3 = seeds[i3 + 2];
          const freq = 0.2 + s1 * 0.2;
          const phase = s3 * 6.28;
          currentPos[i3] +=
            Math.sin(t * freq + phase) * jitterAmp * (0.7 + s2 * 0.6);
          currentPos[i3 + 1] +=
            Math.sin(t * freq * 0.9 + phase + 2.1) * jitterAmp * 0.6;
          currentPos[i3 + 2] +=
            Math.cos(t * freq * 0.8 + phase + 4.2) * jitterAmp * 0.5;
        }
        geometry.attributes.position.needsUpdate = true;

        /* ── Uniforms ── */
        material.uniforms.uColorMix.value = sColorMix;
        material.uniforms.uGlobalAlpha.value = sAlpha;
        // Sheen: gentle pulse at high formation
        const sheenTarget = f > 0.85 ? ((f - 0.85) / 0.15) * 0.3 : 0;
        material.uniforms.uSheen.value +=
          (sheenTarget - material.uniforms.uSheen.value) * 0.1;

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

  /* ── Third useEffect: 2D burst canvas (text → particles → corner shape) ── */
  useEffect(() => {
    const canvas = burstCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let burstFrameId;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth,
        h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Target: small AI-sparkle shape in top-right
    function getTargets(count) {
      const cx = window.innerWidth - 120;
      const cy = 110;
      const targets = [];
      const arms = 6;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const arm = i % arms;
        const along = (Math.floor(i / arms) + 1) / Math.ceil(count / arms);
        const r = along * 28 + Math.random() * 8;
        targets.push({
          x: cx + Math.cos(angle + arm * 0.3) * r,
          y: cy + Math.sin(angle + arm * 0.3) * r,
        });
      }
      return targets;
    }

    let targets = null;
    let smoothExit = 0;

    function animateBurst() {
      burstFrameId = requestAnimationFrame(animateBurst);
      const origins = letterOriginsRef.current;
      const exitP = introExitRef.current;

      // Tight smoothing for buttery motion
      smoothExit += (exitP - smoothExit) * 0.18;

      if (!origins || smoothExit < 0.005) {
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        return;
      }

      if (!targets) targets = getTargets(origins.length);

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      const p = smoothExit;

      for (let i = 0; i < origins.length; i++) {
        const o = origins[i];
        const t = targets[i];

        // 3-phase interpolation
        let x, y, alpha, size;

        if (p < 0.3) {
          // Phase 1: appear at letter position, start drifting
          const pp = p / 0.3;
          const ease = pp * pp;
          x = o.x + o.burstX * ease * 0.3;
          y = o.y + o.burstY * ease * 0.3;
          alpha = pp * 0.8;
          size = 1.5 + pp * 1;
        } else if (p < 0.65) {
          // Phase 2: burst outward
          const pp = (p - 0.3) / 0.35;
          const ease = pp * pp * (3 - 2 * pp);
          const bx = o.x + o.burstX;
          const by = o.y + o.burstY;
          x = (o.x + o.burstX * 0.3) * (1 - ease) + bx * ease;
          y = (o.y + o.burstY * 0.3) * (1 - ease) + by * ease;
          alpha = 0.8 - pp * 0.1;
          size = 2.5 - pp * 0.5;
        } else {
          // Phase 3: converge to corner
          const pp = (p - 0.65) / 0.35;
          const ease = pp * pp * (3 - 2 * pp);
          const bx = o.x + o.burstX;
          const by = o.y + o.burstY;
          x = bx * (1 - ease) + t.x * ease;
          y = by * (1 - ease) + t.y * ease;
          alpha = 0.7 * (1 - pp * 0.3);
          size = 2 - pp * 0.8;
        }

        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.5, size), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 168, 83, ${alpha})`;
        ctx.fill();
      }

      // Glow at the corner target when converging
      if (p > 0.7) {
        const gp = (p - 0.7) / 0.3;
        const cx = window.innerWidth - 120;
        const cy = 110;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 * gp);
        grad.addColorStop(0, `rgba(212, 168, 83, ${gp * 0.15})`);
        grad.addColorStop(1, "rgba(212, 168, 83, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(cx - 50, cy - 50, 100, 100);
      }
    }
    animateBurst();

    return () => {
      cancelAnimationFrame(burstFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* ── JSX ── */
  return (
    <section ref={sectionRef} id="ai-engine" className={styles.section}>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} />
        <canvas ref={burstCanvasRef} className={styles.burstCanvas} />
      </div>

      <div className={styles.textWrap}>
        <div ref={introRef} className={styles.intro}>
          <div className={styles.introInner}>
            <h2 className="heading-lg">
              {INTRO_H2_LINES.map((line, li) => (
                <span key={li} className={styles.introLine}>
                  {line.map((word, wi) => (
                    <span key={wi}>
                      <span className="word">
                        {word.text.split("").map((char, ci) => (
                          <span
                            key={`${wi}-${ci}`}
                            className={`${styles.introLetter} ${
                              word.accent ? styles.introLetterAccent : ""
                            }`}
                          >
                            {char}
                          </span>
                        ))}
                      </span>
                      {wi < line.length - 1 && (
                        <span className={styles.introSpace} />
                      )}
                    </span>
                  ))}
                </span>
              ))}
            </h2>
            <div className={styles.introDesc}>
              {INTRO_DESC_LINES.map((text, li) => (
                <span key={li} className={styles.introDescLine}>
                  {text.split(" ").map((word, wi, arr) => (
                    <span key={wi}>
                      <span className="word">
                        {word.split("").map((c, ci) => (
                          <span key={ci} className={styles.introDescLetter}>
                            {c}
                          </span>
                        ))}
                      </span>
                      {wi < arr.length - 1 && (
                        <span className={styles.introDescSpace} />
                      )}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>

        {SECTIONS.map((sec, i) => (
          <div
            key={sec.key}
            ref={(el) => (blockRefs.current[i] = el)}
            className={`${styles.block} ${
              i % 2 === 0 ? styles.blockLeft : styles.blockRight
            }`}
          >
            <div
              ref={(el) => (cardRefs.current[i] = el)}
              className={styles.textCard}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardNumber}>0{i + 1}</span>
                <span className={styles.cardBadge}>{sec.badge}</span>
              </div>
              <h3 className={styles.cardTitle}>
                {sec.title.split(" ").map((word, wi, arr) => (
                  <span key={wi}>
                    <span className="word">
                      {word.split("").map((c, ci) => (
                        <span key={ci} className={styles.cardTitleLetter}>
                          {c}
                        </span>
                      ))}
                    </span>
                    {wi < arr.length - 1 && (
                      <span className={styles.cardTitleSpace} />
                    )}
                  </span>
                ))}
              </h3>
              <div className={styles.cardDesc}>
                {sec.descLines.map((line, li) => (
                  <span key={li} className={styles.cardDescLine}>
                    {line.split(" ").map((word, wi, arr) => (
                      <span key={wi}>
                        <span className="word">
                          {word.split("").map((c, ci) => (
                            <span key={ci} className={styles.cardDescLetter}>
                              {c}
                            </span>
                          ))}
                        </span>
                        {wi < arr.length - 1 && (
                          <span className={styles.cardDescSpace} />
                        )}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
              <div className={styles.cardDetails}>
                {sec.details.map((d, di) => (
                  <div key={di} className={styles.detailItem}>
                    <div className={styles.detailDot} />
                    <span className={styles.detailText}>{d}</span>
                  </div>
                ))}
              </div>
              <div className={styles.cardStats}>
                {sec.stats.map((s, si) => (
                  <div key={si}>
                    <div className={styles.statVal}>{s.val}</div>
                    <div className={styles.statLabel}>{s.label}</div>
                  </div>
                ))}
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
                {s.label}
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
