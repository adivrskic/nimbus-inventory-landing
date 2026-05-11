"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./LogoWall.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────
   PLACEHOLDER LOGOS — Swap with real customers when ready.
   
   Each entry has:
   - name: company name (will be the alt text + visible wordmark)
   - mark: Unicode geometric character used as the brand "mark"
           (substitute for a real logo SVG)
   - emphasis: optional style — 'caps', 'italic', or undefined for default
   
   When real logos arrive, replace this array with:
     { name: 'Acme Co', logoSrc: '/logos/acme.svg' }
   and the component renders <Image> instead of the wordmark.
───────────────────────────────────────────────────── */
const LOGOS = [
  { name: "BuildRight Supply", mark: "▲", emphasis: "caps" },
  { name: "Pacific Materials", mark: "■", emphasis: "italic" },
  { name: "Continental Floors", mark: "●" },
  { name: "GreenField Foods", mark: "⬢", emphasis: "caps" },
  { name: "Apex Parts", mark: "◆", emphasis: "italic" },
  { name: "Cascade Distribution", mark: "✚" },
  { name: "Apex Pharma", mark: "✻", emphasis: "caps" },
  { name: "Northern Seed", mark: "★", emphasis: "italic" },
];

export default function LogoWall() {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const tween = gsap.fromTo(
      rootRef.current.querySelectorAll(`.${styles.logo}`),
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power3.out",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 85%",
        },
      }
    );

    const tween2 = gsap.fromTo(
      rootRef.current.querySelector(`.${styles.eyebrow}`),
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 88%",
        },
      }
    );

    return () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      if (tween2.scrollTrigger) tween2.scrollTrigger.kill();
    };
  }, []);

  return (
    <section ref={rootRef} className={styles.wall}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Trusted by warehouses processing 4M+ scans daily</span>
        </div>

        <div className={styles.grid}>
          {LOGOS.map((logo) => {
            const cls = [
              styles.logo,
              logo.emphasis === "caps" ? styles.logoCaps : "",
              logo.emphasis === "italic" ? styles.logoItalic : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div key={logo.name} className={cls}>
                <span className={styles.logoMark} aria-hidden="true">
                  {logo.mark}
                </span>
                <span className={styles.logoName}>{logo.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
