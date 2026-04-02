"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useGlowCards from "@/lib/useGlowCards";
import styles from "./Testimonials.module.css";

gsap.registerPlugin(ScrollTrigger);

const DATA = [
  {
    quote:
      "The AI search alone saved us hours. I asked where we put the maple trim from two weeks ago and it found it instantly. We used to walk the floor for 30 minutes to find a single product.",
    name: "Marcus Rivera",
    title: "Operations Manager",
    company: "BuildRight Supply",
  },
  {
    quote:
      "Our team adopted Nimbus in a single day. The voice commands let floor workers stay hands-free while operating forklifts — that was the game changer. No other WMS we evaluated even had that.",
    name: "Jessica Kim",
    title: "Warehouse Director",
    company: "Pacific Materials",
  },
  {
    quote:
      "Nimbus predicted we'd run low on hardwood planks three days before anyone on the team noticed. That kind of intelligence pays for itself in the first month.",
    name: "David Hernandez",
    title: "VP Supply Chain",
    company: "Continental Floors",
  },
];

export default function Testimonials() {
  const headRef = useRef(null);
  const cardsRef = useRef(null);
  const glowRef = useGlowCards();

  useEffect(() => {
    gsap.to(headRef.current.children, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: headRef.current, start: "top 82%" },
    });
    gsap.to(cardsRef.current.querySelectorAll(`.${styles.card}`), {
      y: 0,
      opacity: 1,
      duration: 0.7,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: cardsRef.current, start: "top 80%" },
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div ref={headRef} className={styles.header}>
          <h2 className="heading-md gsap-hidden">
            Trusted on the <em className="accent-italic">warehouse floor.</em>
          </h2>
          <p className="body-text--display gsap-hidden-sm">
            Real teams. Real operations. Real results.
          </p>
        </div>
        <div
          ref={(el) => {
            cardsRef.current = el;
            glowRef.current = el;
          }}
          className={`${styles.grid} glow-cards`}
        >
          {DATA.map((t, i) => (
            <div key={i} className={`${styles.card} glow-card gsap-hidden`}>
              <div className="glow-card-border" />
              <div className={`${styles.cardContent} glow-card-content`}>
                <div>
                  <div className={styles.quote}>&ldquo;</div>
                  <p className={styles.quoteText}>{t.quote}</p>
                </div>
                <div>
                  <div className={styles.divider} />
                  <div className={styles.name}>{t.name}</div>
                  <div className={styles.role}>
                    {t.title}, {t.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
