"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from "@/components/Footer/Footer";
import { LEGAL_PAGES } from "./legalData";
import styles from "./LegalPage.module.css";

gsap.registerPlugin(ScrollTrigger);

/* Nav removed — lives in app/layout.js now. The `dark` Nav variant is
   auto-applied by Nav itself via usePathname() for /legal/* paths,
   so we no longer need to pass `dark` here either. */
export default function LegalPage({ slug }) {
  const page = LEGAL_PAGES[slug];
  const heroRef = useRef(null);
  const sectionRefs = useRef([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!page) return;

    const hero = heroRef.current;
    const title = hero.querySelector(`.${styles.title}`);
    const updated = hero.querySelector(`.${styles.updated}`);

    gsap.to(title, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      delay: 0.2,
    });
    gsap.to(updated, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      delay: 0.35,
    });

    sectionRefs.current.forEach((sec) => {
      if (!sec) return;
      gsap.to(sec, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: sec, start: "top 80%" },
      });
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [slug, page]);

  if (!page) {
    return (
      <div className={styles.page}>
        <div style={{ padding: "200px 48px", textAlign: "center" }}>
          <h1
            style={{
              color: "var(--dark)",
              fontFamily: "var(--display)",
              fontSize: 32,
            }}
          >
            Page not found
          </h1>
          <Link href="/" className={styles.backLink}>
            Back to home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div ref={heroRef} className={styles.hero}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span style={{ color: "rgba(0,0,0,0.5)" }}>{page.title}</span>
        </div>
        <h1 className={styles.title}>{page.title}</h1>
        <div className={styles.updated}>Last updated {page.updated}</div>
      </div>

      <div className={styles.content}>
        {page.sections.map((sec, i) => (
          <div
            key={i}
            ref={(el) => (sectionRefs.current[i] = el)}
            className={styles.section}
          >
            <div className={styles.sectionNum}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <h2 className={styles.sectionHeading}>{sec.heading}</h2>
            <p className={styles.sectionBody}>{sec.content}</p>
          </div>
        ))}
      </div>

      <div className={styles.ctaBanner}>
        <p className={styles.ctaText}>
          Questions about our {page.title.toLowerCase()}? Reach out anytime.
        </p>
        <a href="mailto:legal@nimbuswms.com" className={styles.ctaLink}>
          legal@nimbuswms.com
        </a>
        <br />
        <Link href="/" className={styles.backLink}>
          Back to home
        </Link>
      </div>

      <Footer />
    </div>
  );
}
