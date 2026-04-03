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
} from "@/lib/shapes";
import { vertexShader, fragmentShader } from "@/lib/shaders";
import styles from "./AISection.module.css";

gsap.registerPlugin(ScrollTrigger);

const PARTICLE_COUNT = 50000;
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
    { text: "to", accent: true },
    { text: "clarity", accent: true },
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

    /* ── Scroll handler ── */
    const onScroll = () => {
      // Progress: 0% when first block center at viewport center, 100% when last block top at viewport center
      if (blocks.length > 1) {
        const fTop =
          blocks[0].getBoundingClientRect().top + blocks[0].offsetHeight * 0.5;
        const lTop = blocks[blocks.length - 1].getBoundingClientRect().top;
        setProgress(Math.max(0, Math.min(1, (vcenter - fTop) / (lTop - fTop))));
      }

      const iRect = intro.getBoundingClientRect();
      const introCenter = iRect.top + iRect.height / 2;
      const introNorm = (introCenter - vcenter) / vh;
      const alpha =
        introNorm > 0 ? 0.12 + smoothstep(1 - introNorm / 0.6) * 0.73 : 0.85;

      const introExit =
        introNorm < 0 ? smoothstep(Math.min(1, Math.abs(introNorm) / 0.5)) : 0;
      const introFormation = introExit * 0.35;

      const weights = [0, 0, 0, 0];
      let maxWeight = 0;
      let maxIdx = 0;
      blocks.forEach((block, i) => {
        const r = block.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const dist = Math.abs(center - vcenter) / vh;
        if (dist < 0.6) {
          const w = Math.pow(Math.cos((dist / 0.6) * Math.PI * 0.5), 2);
          weights[i] = w;
          if (w > maxWeight) {
            maxWeight = w;
            maxIdx = i;
          }
        }
      });

      const blockFormation = smoothstep(Math.min(1, maxWeight * 1.6));
      const formation = Math.max(introFormation, blockFormation);
      const wSum = weights[0] + weights[1] + weights[2] + weights[3];
      if (wSum > 0.001) {
        for (let i = 0; i < 4; i++) weights[i] /= wSum;
      } else if (introFormation > 0.01) {
        weights[0] = 1;
      }

      particleState.current.formation = formation;
      particleState.current.weights = weights;
      particleState.current.globalAlpha = Math.max(0.1, Math.min(0.85, alpha));

      // Burst exit progress
      const introTop = iRect.top / vh;
      const exitP = Math.max(0, Math.min(1, (0.15 - introTop) / 0.5));
      introExitRef.current = exitP;
      if (intro) intro.style.opacity = String(Math.max(0, 1 - exitP * 2.5));

      // Capture: create MANY particles per letter for dense burst
      if (exitP > 0.01 && !letterOriginsRef.current) {
        const origins = [];
        const allLetters = intro.querySelectorAll(
          `.${styles.introLetter}, .${styles.introDescLetter}`
        );
        const perLetter = 8;
        allLetters.forEach((el) => {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          for (let j = 0; j < perLetter; j++) {
            origins.push({
              x: cx + (Math.random() - 0.5) * r.width * 1.4,
              y: cy + (Math.random() - 0.5) * r.height * 1.4,
              burstX: (Math.random() - 0.5) * 600,
              burstY: (Math.random() - 0.5) * 500 - 60,
              size: 0.6 + Math.random() * 1.6,
              delay: Math.random() * 0.12,
            });
          }
        });
        letterOriginsRef.current = origins;
      }

      if (formation > 0.5) setActiveIdx(maxIdx);
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
        scrollTrigger: { trigger: card, start: "top 50%" },
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
      const shapes = isMobile
        ? baseShapes.map((s) => {
            const scaled = new Float32Array(s.length);
            for (let j = 0; j < s.length; j++) scaled[j] = s[j] * 0.75;
            return offsetShapeY(scaled, -3.5);
          })
        : baseShapes.map((s, i) =>
            offsetShape(s, i % 2 === 0 ? OFFSET : -OFFSET)
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

      /* ── Smooth morphing: elastic easing, per-particle stagger, gentle rotation ── */
      let sFormation = 0;
      let sAlpha = 0.12;
      let sColorMix = 0;
      let sActiveShape = 0;
      let prevShapeIdx = 0;
      let morphProgress = 1;
      const SMOOTH = 0.15;

      // Elastic ease out (like GSAP Elastic.easeOut)
      function elasticOut(x) {
        if (x === 0 || x === 1) return x;
        return (
          Math.pow(2, -10 * x) * Math.sin(((x - 0.075) * (2 * Math.PI)) / 0.3) +
          1
        );
      }

      function animate() {
        frameId = requestAnimationFrame(animate);
        if (!sectionVisibleRef.current) return;

        const t = performance.now() * 0.001;
        const ps = particleState.current;

        sFormation += (ps.formation - sFormation) * SMOOTH;
        sAlpha += (ps.globalAlpha - sAlpha) * SMOOTH;
        sColorMix += (sFormation - sColorMix) * SMOOTH;

        /* ── Dominant shape detection + morph trigger ── */
        let maxW = 0,
          maxIdx = 0;
        for (let w = 0; w < 4; w++) {
          if (ps.weights[w] > maxW) {
            maxW = ps.weights[w];
            maxIdx = w;
          }
        }

        if (maxIdx !== sActiveShape && maxW > 0.3) {
          prevShapeIdx = sActiveShape;
          sActiveShape = maxIdx;
          morphProgress = 0;
        }

        // Morph advances ~60 frames (~1s)
        if (morphProgress < 1)
          morphProgress = Math.min(1, morphProgress + 0.018);

        const f = sFormation;
        const oldShape = shapes[prevShapeIdx];
        const newShape = shapes[sActiveShape];
        const morphBoost = morphProgress < 1 ? (1 - morphProgress) * 0.03 : 0;
        const jitterAmp = 0.02 * (1 - f * 0.9) + morphBoost;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;

          // Formation stagger
          const rawF = Math.max(
            0,
            Math.min(1, (f - stagger[i]) / (1 - stagger[i]))
          );
          const pf = rawF * rawF * (3 - 2 * rawF);

          // Per-particle morph with wave stagger + elastic overshoot
          const delay = seeds[i3] * 0.4;
          const rawM = Math.max(
            0,
            Math.min(1, (morphProgress - delay) / (1 - delay))
          );
          const mp = elasticOut(rawM);

          // Blend old → new shape target
          const tx = oldShape[i3] * (1 - mp) + newShape[i3] * mp;
          const ty = oldShape[i3 + 1] * (1 - mp) + newShape[i3 + 1] * mp;
          const tz = oldShape[i3 + 2] * (1 - mp) + newShape[i3 + 2] * mp;

          // Scattered → shape
          let px = scattered[i3] * (1 - pf) + tx * pf;
          let py = scattered[i3 + 1] * (1 - pf) + ty * pf;
          let pz = scattered[i3 + 2] * (1 - pf) + tz * pf;

          // Gentle tilt — subtle sine oscillation, never turns edge-on
          const tiltY = Math.sin(t * 0.15) * 0.08 * pf; // max ±0.08 rad (~4.5°)
          const tiltX = Math.sin(t * 0.1 + 1.5) * 0.04 * pf;
          if (pf > 0.1) {
            const cy = Math.cos(tiltY),
              sy = Math.sin(tiltY);
            const cx = Math.cos(tiltX),
              sx = Math.sin(tiltX);
            const rx = px * cy - pz * sy;
            const rz = px * sy + pz * cy;
            const ry = py * cx - rz * sx;
            const rz2 = py * sx + rz * cx;
            px = rx;
            py = ry;
            pz = rz2;
          }

          // Organic motion
          const s1 = seeds[i3],
            s2 = seeds[i3 + 1],
            s3 = seeds[i3 + 2];
          const freq = 0.2 + s1 * 0.2;
          const phase = s3 * 6.28;
          px += Math.sin(t * freq + phase) * jitterAmp * (0.7 + s2 * 0.6);
          py += Math.sin(t * freq * 0.9 + phase + 2.1) * jitterAmp * 0.6;
          pz += Math.cos(t * freq * 0.8 + phase + 4.2) * jitterAmp * 0.5;

          currentPos[i3] = px;
          currentPos[i3 + 1] = py;
          currentPos[i3 + 2] = pz;
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

  /* ── Third useEffect: 2D burst canvas (text → particles → nav orb) ── */
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

    // Target: tight orb next to the pause button in nav
    function getTargets(count) {
      const cx = window.innerWidth - 140;
      const cy = 36;
      const targets = [];
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.5) * 14;
        targets.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
      }
      return targets;
    }

    let targets = null;
    let smoothExit = 0;

    function animateBurst() {
      burstFrameId = requestAnimationFrame(animateBurst);
      const origins = letterOriginsRef.current;
      const exitP = introExitRef.current;

      smoothExit += (exitP - smoothExit) * 0.15;

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      if (!origins || smoothExit < 0.005) {
        ctx.clearRect(0, 0, w, h);
        return;
      }

      if (!targets) targets = getTargets(origins.length);

      ctx.clearRect(0, 0, w, h);
      const p = smoothExit;
      const t0 = performance.now() * 0.001;

      for (let i = 0; i < origins.length; i++) {
        const o = origins[i];
        const tgt = targets[i];
        // Per-particle delay for stagger
        const d = o.delay || 0;
        const pp = Math.max(0, Math.min(1, (p - d) / (1 - d)));

        let x, y, alpha, sz;

        if (pp < 0.25) {
          // Appear at letter pos, tiny drift
          const t = pp / 0.25;
          const e = t * t;
          x = o.x + o.burstX * e * 0.15;
          y = o.y + o.burstY * e * 0.15;
          alpha = t * 0.85;
          sz = o.size * 0.6 + t * 0.4;
        } else if (pp < 0.55) {
          // Burst outward
          const t = (pp - 0.25) / 0.3;
          const e = t * t * (3 - 2 * t);
          const startX = o.x + o.burstX * 0.15;
          const startY = o.y + o.burstY * 0.15;
          const fullX = o.x + o.burstX;
          const fullY = o.y + o.burstY;
          x = startX + (fullX - startX) * e;
          y = startY + (fullY - startY) * e;
          alpha = 0.85 - t * 0.15;
          sz = o.size;
        } else {
          // Converge to nav target
          const t = (pp - 0.55) / 0.45;
          const e = t * t * (3 - 2 * t);
          const fullX = o.x + o.burstX;
          const fullY = o.y + o.burstY;
          x = fullX + (tgt.x - fullX) * e;
          y = fullY + (tgt.y - fullY) * e;
          alpha = 0.7 * (1 - t * 0.5);
          sz = o.size * (1 - e * 0.6);
        }

        // Subtle organic wobble
        x += Math.sin(t0 * 2 + i * 0.7) * (1 - pp) * 0.8;
        y += Math.cos(t0 * 1.7 + i * 0.5) * (1 - pp) * 0.6;

        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.3, sz), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 168, 83, ${alpha})`;
        ctx.fill();
      }

      // Glow orb at target when particles converge
      if (p > 0.6) {
        const gp = (p - 0.6) / 0.4;
        const cx = window.innerWidth - 140;
        const cy = 36;
        const r = 20 + gp * 10;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(212, 168, 83, ${gp * 0.2})`);
        grad.addColorStop(0.5, `rgba(212, 168, 83, ${gp * 0.06})`);
        grad.addColorStop(1, "rgba(212, 168, 83, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
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
