"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Logo from "@/components/shared/Logo";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import styles from "./Footer.module.css";

gsap.registerPlugin(ScrollTrigger);

const COLUMNS = [
  {
    title: "Product",
    links: [
      { text: "AI Engine", href: "/#ai-engine" },
      { text: "Features", href: "/#features" },
      { text: "Warehouse", href: "/#warehouse" },
      { text: "Integrations", href: "/#integrations" },
      { text: "Industries", href: "/#industries" },
    ],
  },
  {
    title: "Plans",
    links: [
      { text: "Pricing", href: "/pricing" },
      { text: "ROI Calculator", href: "/calculator" },
      { text: "Compare", href: "/compare" },
    ],
  },
  {
    title: "Resources",
    links: [
      { text: "Ask Nimbus", href: "/ask" },
      { text: "Blog", href: "/blog" },
      { text: "Help Center", href: "/help" },
      // { text: "API Docs", href: "/api-docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { text: "Contact", href: "/contact" },
      // { text: "Trust", href: "/trust" },
      // { text: "Status", href: "/status" },
    ],
  },
];

/* Legal links live in the bottom bar alongside the copyright — they're
   important but visually secondary, and the footer CSS already has
   .legalLinks / .legalLink classes designed for this layout. */
const LEGAL_LINKS = [
  { text: "Privacy", href: "/legal/privacy" },
  { text: "Terms", href: "/legal/terms" },
  { text: "Security", href: "/legal/security" },
];

const HELIX_COUNT = 4500;

export default function Footer() {
  const footerRef = useRef(null);
  const brandRef = useRef(null);
  const colRefs = useRef([]);
  const bottomRef = useRef(null);
  const helixRef = useRef(null);
  const helixWrapRef = useRef(null);
  const helixFormation = useRef(0);

  useEffect(() => {
    const footer = footerRef.current;
    const tl = gsap.timeline({
      scrollTrigger: { trigger: footer, start: "top 80%" },
      defaults: { ease: "power3.out" },
    });
    tl.to(brandRef.current, { opacity: 1, y: 0, duration: 0.5 });
    colRefs.current.forEach((col) => {
      if (!col) return;
      tl.to(col, { opacity: 1, y: 0, duration: 0.4 }, `-=${0.3}`);
    });
    tl.to(bottomRef.current, { opacity: 1, duration: 0.4 }, "-=0.2");
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  useEffect(() => {
    const canvas = helixRef.current;
    const wrap = helixWrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    let frameId;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      const w = wrap.clientWidth,
        h = wrap.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Pre-compute scattered + helix target positions
    const particles = [];
    for (let i = 0; i < HELIX_COUNT; i++) {
      const t = i / HELIX_COUNT;
      const strand = i % 2 === 0 ? 1 : -1;
      particles.push({
        sx: Math.random(),
        sy: Math.random(),
        t,
        strand,
        radius: 30 + Math.random() * 50,
        phase: Math.random() * 0.9,
        size: 0.6 + Math.random() * 0.9, // particles a touch larger
        alpha: 0.35 + Math.random() * 0.55, // alpha 0.35–0.90 instead of 0.15–0.59
      });
    }

    // Scroll tracking — simple: how close are we to the bottom of the page?
    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight;
      const vh = window.innerHeight;
      // 0 when helix first enters viewport, 1 at page bottom
      const maxScroll = docHeight - vh;
      const distFromBottom = maxScroll - scrollTop;
      // helix wrap height worth of scroll to go from 0→1
      const f = Math.max(
        0,
        Math.min(1, 1 - distFromBottom / (wrap.clientHeight * 3))
      );
      helixFormation.current = f;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Only animate when near viewport
    const visibleRef = { current: false };
    const obs = new IntersectionObserver(
      ([e]) => {
        visibleRef.current = e.isIntersecting;
      },
      { rootMargin: "200px" }
    );
    obs.observe(wrap);

    function animate() {
      frameId = requestAnimationFrame(animate);
      if (!visibleRef.current) return;
      const time = performance.now() * 0.001;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cy = h / 2;
      const f = helixFormation.current;
      // Smooth the formation
      const smoothF = f * f * (3 - 2 * f); // smoothstep

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < HELIX_COUNT; i++) {
        const p = particles[i];

        // Helix position
        const hx = p.t * (w + 200) - 100;
        const wave = time * 0.2 + p.t * Math.PI * 6 + p.phase;
        const hy = cy + Math.sin(wave) * p.radius * p.strand;

        // Scattered position
        const scatX = p.sx * w;
        const scatY = p.sy * h;

        // Lerp between scattered and helix
        const x = scatX + (hx - scatX) * smoothF;
        const y = scatY + (hy - scatY) * smoothF;

        const depth = Math.cos(wave);
        const depthFactor = 0.4 + depth * 0.3 + 0.3; // brighter baseline
        const finalAlpha = p.alpha * (0.35 + smoothF * depthFactor * 0.75);
        const finalSize = p.size * (0.5 + smoothF * depthFactor * 0.7);

        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.4, finalSize), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(231, 192, 116, ${finalAlpha})`; // brighter gold (#e7c074)
        ctx.fill();
      }
    }
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      obs.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <footer ref={footerRef} className={styles.footer}>
        <div className={styles.inner}>
          <div ref={brandRef} className={styles.brand}>
            <div className={styles.brandRow}>
              <Logo size={22} />
              <div>
                <div className={styles.brandName}>Nimbus</div>
                <div className={styles.brandSub}>
                  Inventory Management Systems
                </div>
              </div>
            </div>
            <p className={styles.brandDesc}>
              AI-powered warehouse intelligence for modern operations teams.
            </p>
            <div className={styles.badges}>
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.badge}
              >
                App Store
              </a>
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.badge}
              >
                Google Play
              </a>
            </div>
          </div>
          {COLUMNS.map((col, i) => (
            <div
              key={col.title}
              ref={(el) => (colRefs.current[i] = el)}
              className={styles.col}
            >
              <div className={styles.colTitle}>{col.title}</div>
              <div className={styles.colLinks}>
                {col.links.map((link) =>
                  link.href.startsWith("http") ? (
                    <a
                      key={link.text}
                      href={link.href}
                      className={styles.colLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.text}
                    </a>
                  ) : (
                    <TransitionLink
                      key={link.text}
                      href={link.href}
                      className={styles.colLink}
                    >
                      {link.text}
                    </TransitionLink>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} className={styles.bottom}>
          <div className={styles.copy}>
            &copy; 2026 Nimbus WMS. All rights reserved.
          </div>
          <div className={styles.legalLinks}>
            {LEGAL_LINKS.map((link) => (
              <TransitionLink
                key={link.href}
                href={link.href}
                className={styles.legalLink}
              >
                {link.text}
              </TransitionLink>
            ))}
          </div>
        </div>
      </footer>

      <div ref={helixWrapRef} className={styles.helixWrap}>
        <canvas ref={helixRef} />
      </div>
    </>
  );
}
