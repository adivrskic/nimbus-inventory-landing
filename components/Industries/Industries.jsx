"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { INDUSTRIES as INDUSTRY_DATA } from "@/components/IndustryPage/industryData";
import styles from "./Industries.module.css";

gsap.registerPlugin(ScrollTrigger);

const INDUSTRIES = INDUSTRY_DATA.map((i) => ({
  title: i.title,
  desc: i.heroDesc,
  slug: i.slug,
}));

const H_LINES = [
  [
    { t: "Built", a: false },
    { t: "for", a: false },
  ],
  [
    { t: "your", a: false },
    { t: "industry.", a: true },
  ],
];

export default function Industries() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef([]);
  const [active, setActive] = useState(null);
  const isMobileRef = useRef(false);
  const router = useRouter();

  function handleEnter(idx) {
    if (isMobileRef.current) return;
    setActive(idx);
  }

  function handleLeave() {
    if (isMobileRef.current) return;
    setActive(null);
  }

  // Check mobile
  useEffect(() => {
    const check = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // GSAP header
  useEffect(() => {
    const header = headerRef.current;
    const hLetters = header.querySelectorAll(`.${styles.headLetter}`);
    gsap.to(hLetters, {
      opacity: 1,
      y: "0%",
      rotateX: 0,
      duration: 0.4,
      stagger: 0.014,
      ease: "power4.out",
      scrollTrigger: { trigger: header, start: "top 65%" },
    });

    // Stagger items in
    const items = itemRefs.current.filter(Boolean);
    gsap.set(items, { opacity: 0, y: 30 });
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.06,
      ease: "power3.out",
      scrollTrigger: { trigger: listRef.current, start: "top 75%" },
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <section ref={sectionRef} id="industries" className={styles.section}>
      <div ref={headerRef} className={styles.header}>
        <h2 className="heading-lg">
          {H_LINES.map((line, li) => (
            <span key={li} className={styles.headLine}>
              {line.map((w, wi) => (
                <span key={wi}>
                  <span className="word">
                    {w.t.split("").map((c, ci) => (
                      <span
                        key={`${wi}-${ci}`}
                        className={`${styles.headLetter} ${
                          w.a ? styles.headLetterAccent : ""
                        }`}
                      >
                        {c}
                      </span>
                    ))}
                  </span>
                  {wi < line.length - 1 && (
                    <span className={styles.headSpace} />
                  )}
                </span>
              ))}
            </span>
          ))}
        </h2>
      </div>

      <div className={styles.listWrap}>
        <div ref={listRef} className={styles.list}>
          {INDUSTRIES.map((ind, i) => (
            <div
              key={i}
              ref={(el) => (itemRefs.current[i] = el)}
              className={`${styles.item} ${active === i ? styles.active : ""}`}
              onMouseEnter={() => handleEnter(i)}
              onMouseLeave={handleLeave}
              onClick={(e) => {
                if ("ontouchstart" in window) {
                  if (active !== i) {
                    e.preventDefault();
                    handleEnter(i);
                    return;
                  }
                }
                router.push(`/industry/${ind.slug}`);
              }}
              style={{ cursor: "pointer" }}
            >
              <div className={styles.titleWrap}>
                <div className={styles.title}>{ind.title}</div>
                <div className={styles.titleGhost}>{ind.title}</div>
              </div>
              <div className={styles.descWrap}>
                <p className={styles.desc}>{ind.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
