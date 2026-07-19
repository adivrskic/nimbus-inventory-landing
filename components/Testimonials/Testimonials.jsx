"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useGlowCards from "@/lib/useGlowCards";
import styles from "./Testimonials.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────
   PLACEHOLDER TESTIMONIALS
   
   Swap with real customer quotes when permissions are in hand.
   First entry is the featured pull-quote (rendered large). Remaining
   6 entries fill a 3-col × 2-row grid below.
   
   Each entry:
   - tag: industry label (gold mono caps)
   - quote: the testimonial text
   - name: author name
   - role: author role
   - company: author company
───────────────────────────────────────────────────── */

const FEATURED = {
  tag: "3PL & Distribution",
  quote:
    "Before Nautilus, we ran a 200,000 sq ft warehouse on spreadsheets and prayer. Six months in, we've cut receiving errors by 80% and our team actually believes our inventory numbers. The AI route optimization alone saves us three hours a day on picking.",
  name: "Marcus Rivera",
  role: "Operations Manager",
  company: "BuildRight Supply",
};

const TESTIMONIALS = [
  {
    tag: "Manufacturing",
    quote:
      "The integration story is what won us over. Nautilus syncs cleanly with our SAP environment and the team built us a custom connector for our legacy MRP in two weeks. Most vendors quoted six months.",
    name: "Jessica Kim",
    role: "IT Director",
    company: "Pacific Materials",
  },
  {
    tag: "Building Materials",
    quote:
      "Tracking 12 different unit types across hardwood, tile, and adhesive used to be a nightmare. Nautilus handles linear feet, pallets, and partial rolls without us having to think about it. Sales finally trusts the numbers.",
    name: "David Hernandez",
    role: "Warehouse Manager",
    company: "Continental Floors",
  },
  {
    tag: "Food & Beverage",
    quote:
      "Lot tracking and FEFO are non-negotiable for us. Nautilus shipped both better than systems costing four times as much. Audit prep that used to take a week now takes an afternoon.",
    name: "Sarah Chen",
    role: "COO",
    company: "GreenField Foods",
  },
  {
    tag: "Automotive",
    quote:
      "Our pickers stopped having to memorize bin locations. The AI suggests routes based on order patterns and they're consistently 30% shorter than what we used to do. Nobody asks for the old system back.",
    name: "Tom Walsh",
    role: "VP Operations",
    company: "Apex Parts Distribution",
  },
  {
    tag: "E-commerce & 3PL",
    quote:
      "We onboarded 12 clients onto Nautilus in our first quarter. The multi-tenant isolation is rock solid, and the white-label dashboards have closed deals for us. Pricing per warehouse means margins improve as we scale.",
    name: "Priya Patel",
    role: "Logistics Lead",
    company: "Cascade Distribution",
  },
  {
    tag: "Pharmaceuticals",
    quote:
      "Audit trails, electronic signatures, lot genealogy — Nautilus has every box checked for FDA inspections. Our compliance reviews went from monthly fire drills to a thirty-minute review.",
    name: "Michael Torres",
    role: "Compliance Officer",
    company: "Apex Pharma",
  },
];

export default function Testimonials() {
  const rootRef = useRef(null);
  /* useGlowCards walks the container's descendants for .glow-card nodes and
     wires up the mouse-follow gradient + 3D tilt. Both the featured card
     and the 6 grid cards live inside the same `.glow-cards` container so
     they share one hover context — hovering anywhere in the container
     activates the gold border glow on every card, mouse position drives
     where the gradient is brightest per card. Same behavior as Integrations. */
  const glowRef = useGlowCards();

  useEffect(() => {
    if (!rootRef.current) return;

    const triggers = [];

    /* Header (eyebrow + title) */
    const headerEls = rootRef.current.querySelectorAll(
      `.${styles.eyebrow}, .${styles.title}`
    );
    if (headerEls.length > 0) {
      const t = gsap.fromTo(
        headerEls,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "clamp(top 90%)" },
        }
      );
      if (t.scrollTrigger) triggers.push(t.scrollTrigger);
    }

    /* Featured pull-quote */
    const featured = rootRef.current.querySelector(`.${styles.featured}`);
    if (featured) {
      const t = gsap.fromTo(
        featured,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power3.out",
          scrollTrigger: { trigger: featured, start: "clamp(top 90%)" },
        }
      );
      if (t.scrollTrigger) triggers.push(t.scrollTrigger);
    }

    /* Card grid stagger */
    const cards = rootRef.current.querySelectorAll(`.${styles.card}`);
    if (cards.length > 0) {
      const t = gsap.fromTo(
        cards,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: { trigger: cards[0], start: "clamp(top 90%)" },
        }
      );
      if (t.scrollTrigger) triggers.push(t.scrollTrigger);
    }

    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <section ref={rootRef} className={styles.section}>
      <div className={styles.shell}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.eyebrow}>Testimonials</div>
          <h2 className={styles.title}>
            What customers <span className={styles.titleAccent}>actually</span>{" "}
            say.
          </h2>
        </div>

        {/* ── Glow-cards context wraps both featured + grid ── */}
        <div ref={glowRef} className={`${styles.glowWrap} glow-cards`}>
          {/* Featured pull-quote */}
          <article className={`${styles.featured} glow-card`}>
            <div className="glow-card-border" />
            <div className={`${styles.featuredInner} glow-card-content`}>
              <span className={styles.featuredOpenQuote} aria-hidden="true">
                &ldquo;
              </span>
              <div className={styles.featuredContent}>
                <div className={styles.featuredTag}>{FEATURED.tag}</div>
                <p className={styles.featuredQuote}>{FEATURED.quote}</p>
                <div className={styles.featuredRule} />
                <div className={styles.featuredAttr}>
                  <span className={styles.featuredName}>{FEATURED.name}</span>
                  <span className={styles.featuredRole}>
                    {FEATURED.role}, {FEATURED.company}
                  </span>
                </div>
              </div>
            </div>
          </article>

          {/* 6-card grid */}
          <div className={styles.grid}>
            {TESTIMONIALS.map((t, i) => (
              <article key={i} className={`${styles.card} glow-card`}>
                <div className="glow-card-border" />
                <div className={`${styles.cardInner} glow-card-content`}>
                  <div className={styles.cardTag}>{t.tag}</div>
                  <p className={styles.cardQuote}>{t.quote}</p>
                  <div className={styles.cardAttr}>
                    <span className={styles.cardName}>{t.name}</span>
                    <span className={styles.cardRole}>
                      {t.role}, {t.company}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
