"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useAnimationPaused } from "@/lib/AnimationContext";
import { PREFS_EVENT, applyConsent, clearConsent } from "@/lib/consent";
import Logo from "@/components/shared/Logo";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import NotifyForm from "./NotifyForm";
import styles from "./Footer.module.css";

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
      { text: "Floor plan review", href: "/floor-plan" },
    ],
  },
  {
    title: "Resources",
    links: [
      { text: "Ask Nautilus", href: "/ask" },
      { text: "Blog", href: "/blog" },
      { text: "Help Center", href: "/help" },
    ],
  },
  {
    title: "Company",
    links: [
      { text: "Contact", href: "/contact" },
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

/* The analytics cookie banner only exists when GA is configured, so the
   "Cookie preferences" control is only offered then. Inlined at build. */
const HAS_ANALYTICS = !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/* Forget the stored consent (analytics back to denied) and ask the
   banner to re-open so the visitor can choose again. */
function reopenCookiePrefs() {
  clearConsent();
  applyConsent("denied");
  window.dispatchEvent(new CustomEvent(PREFS_EVENT));
}

/* 1500 particles read the same as the old 4500 at this band height and
   cost a third of the per-frame math. */
const HELIX_COUNT = 1500;
/* Particle alpha is quantised into this many buckets so each frame is
   ALPHA_STEPS fills (one Path2D per bucket) instead of one fill per dot. */
const ALPHA_STEPS = 6;
const GOLD = "231, 192, 116"; // #e7c074

export default function Footer() {
  const { paused } = useAnimationPaused();
  const pausedRef = useRef(paused);
  const helixControls = useRef(null);
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
      /* clamp() — the footer is always at the very bottom, so an
         unclamped start can sit below max-scroll and never fire. */
      scrollTrigger: { trigger: footer, start: "clamp(top 92%)" },
      defaults: { ease: "power3.out" },
    });
    tl.to(brandRef.current, { opacity: 1, y: 0, duration: 0.4 });
    colRefs.current.forEach((col) => {
      if (!col) return;
      tl.to(col, { opacity: 1, y: 0, duration: 0.32 }, `-=${0.24}`);
    });
    tl.to(bottomRef.current, { opacity: 1, duration: 0.32 }, "-=0.16");
    /* Kill ONLY this timeline's trigger — killing getAll() nuked every
       other component's reveal triggers whenever the footer unmounted
       mid page-transition, leaving sections stuck at opacity 0. */
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  /* The in-app pause toggle: stop the loop (last frame stays on the
     canvas) and restart it on resume. */
  useEffect(() => {
    pausedRef.current = paused;
    const c = helixControls.current;
    if (!c) return;
    if (paused) c.stop();
    else c.start();
  }, [paused]);

  useEffect(() => {
    const canvas = helixRef.current;
    const wrap = helixWrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    let frameId = 0;
    let running = false;
    const reduced = prefersReducedMotion();

    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      const w = wrap.clientWidth,
        h = wrap.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* Static modes keep nothing in flight, so repaint on resize. */
      if (reduced || pausedRef.current) draw(0);
    };

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
    /* One frame. Particles are bucketed by alpha into ALPHA_STEPS Path2D
       objects and each bucket is filled once: 1500 arcs, 6 fills. */
    function draw(time) {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cy = h / 2;
      const f = helixFormation.current;
      // Smooth the formation
      const smoothF = f * f * (3 - 2 * f); // smoothstep

      ctx.clearRect(0, 0, w, h);
      const paths = [];
      for (let b = 0; b < ALPHA_STEPS; b++) paths.push(new Path2D());

      for (let i = 0; i < HELIX_COUNT; i++) {
        const p = particles[i];

        // Helix position
        const hx = p.t * (w + 200) - 100;
        // Coil frequency: p.t * Math.PI * N controls how many twists pack
        // across the band's width. Lower N = longer, more stretched-out
        // coils. Was 6 (3 full rotations) — read as a tight, squished
        // braid; 3.5 (~1.75 rotations) opens it into a long, lazy helix.
        const wave = time * 0.2 + p.t * Math.PI * 3.5 + p.phase;
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
        const r = Math.max(0.4, finalSize);
        const bucket = Math.min(
          ALPHA_STEPS - 1,
          Math.max(0, Math.floor(finalAlpha * ALPHA_STEPS))
        );
        paths[bucket].moveTo(x + r, y);
        paths[bucket].arc(x, y, r, 0, Math.PI * 2);
      }

      for (let b = 0; b < ALPHA_STEPS; b++) {
        ctx.fillStyle = `rgba(${GOLD}, ${(b + 0.5) / ALPHA_STEPS})`;
        ctx.fill(paths[b]);
      }
    }

    function loop() {
      frameId = requestAnimationFrame(loop);
      draw(performance.now() * 0.001);
    }
    const start = () => {
      if (running || reduced || pausedRef.current) return;
      running = true;
      frameId = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frameId);
      frameId = 0;
    };
    helixControls.current = { start, stop };

    resize();
    window.addEventListener("resize", resize);

    /* Reduced motion: the settled helix, drawn once. No scroll listener,
       no rAF loop. */
    if (reduced) {
      helixFormation.current = 1;
      draw(0);
      return () => {
        helixControls.current = null;
        window.removeEventListener("resize", resize);
      };
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* The loop only runs while the band is near the viewport. Off-screen
       it is stopped outright rather than ticking an empty frame. */
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) start();
        else stop();
      },
      { rootMargin: "200px" }
    );
    obs.observe(wrap);

    return () => {
      stop();
      helixControls.current = null;
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
                <div className={styles.brandName}>Nautilus</div>
                <div className={styles.brandSub} aria-hidden="true">
                  {"INVENTORY".split("").map((c, i) => (
                    <span key={i}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
            <p className={styles.brandDesc}>
              AI-powered warehouse intelligence for modern operations teams.
            </p>
            {/* Coming-soon state — the mobile app isn't listed yet. These
                are plain <span>s, not links or buttons: there is nowhere to
                navigate, and a control that does nothing when clicked is
                worse than no control. They previously pointed at
                apps.apple.com / play.google.com — the stores' own
                homepages — which read as a broken link.
                When the apps ship: swap each span for a ghost
                <CornerButton href="…" target="_blank" rel="noopener
                noreferrer" className={styles.badge}> (re-add the import),
                drop .badgeNote, and remove the dashed-border/dim rules
                from .badge in Footer.module.css. */}
            <div className={styles.badges}>
              <span className={styles.badgeNote}>Mobile apps — coming soon</span>
              <div className={styles.badgeRow}>
                <span className={styles.badge}>App Store</span>
                <span className={styles.badge}>Google Play</span>
              </div>
              <NotifyForm />
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
            &copy; 2026 Nautilus WMS. All rights reserved.
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
            {HAS_ANALYTICS && (
              <button
                type="button"
                className={`${styles.legalLink} ${styles.legalButton}`}
                onClick={reopenCookiePrefs}
              >
                Cookie preferences
              </button>
            )}
          </div>
        </div>
      </footer>

      <div ref={helixWrapRef} className={styles.helixWrap}>
        <canvas ref={helixRef} />
      </div>
    </>
  );
}
