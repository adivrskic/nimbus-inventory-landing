"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useGlowCards from "@/lib/useGlowCards";
import styles from "./Integrations.module.css";

gsap.registerPlugin(ScrollTrigger);

const CATEGORIES = [
  {
    tag: "Accounting & ERP",
    title: "Financial systems",
    desc: "Sync inventory valuations, cost of goods, and purchase orders directly with your accounting stack.",
    items: [
      "QuickBooks",
      "Xero",
      "FreshBooks",
      "SAP Business One",
      "NetSuite",
      "Sage",
    ],
  },
  {
    tag: "E-commerce & POS",
    title: "Sales channels",
    desc: "Real-time inventory sync across every channel. Every sale decrements stock instantly — no overselling.",
    items: [
      "Shopify",
      "WooCommerce",
      "Amazon",
      "Square",
      "BigCommerce",
      "Lightspeed",
    ],
  },
  {
    tag: "Shipping & Logistics",
    title: "Fulfillment layer",
    desc: "Generate shipping labels, sync tracking, and optimize carrier selection without leaving Nimbus.",
    items: ["ShipStation", "Shippo", "EasyPost", "FedEx", "UPS", "DHL"],
  },
];

const PLATFORMS = [
  {
    label: "Mobile",
    title: "iOS & Android",
    desc: "Native barcode scanning, offline mode, and real-time sync across unlimited devices.",
  },
  {
    label: "Hardware",
    title: "Barcode & RFID",
    desc: "Compatible with Zebra, Honeywell, and Socket Mobile scanners out of the box.",
  },
  {
    label: "API",
    title: "Developer tools",
    desc: "RESTful API with webhooks, SDKs for Node and Python, and Zapier integration.",
  },
];

const H_LINES = [
  [
    { t: "Connects", a: false },
    { t: "to", a: false },
  ],
  [
    { t: "everything", a: true },
    { t: "you", a: false },
    { t: "use.", a: false },
  ],
];

const DESC_LINES = [
  "Nimbus integrates with your existing tools —",
  "accounting, e-commerce, shipping, hardware.",
  "No rip-and-replace. Just plug in.",
];

export default function Integrations() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cellRefs = useRef([]);
  const bottomRefs = useRef([]);
  const glowRef = useGlowCards();

  useEffect(() => {
    const header = headerRef.current;
    const hLetters = header.querySelectorAll(`.${styles.headLetter}`);
    const dLetters = header.querySelectorAll(`.${styles.headerDescLetter}`);

    gsap.to(hLetters, {
      opacity: 1,
      y: "0%",
      rotateX: 0,
      duration: 0.4,
      stagger: 0.014,
      ease: "power4.out",
      scrollTrigger: { trigger: header, start: "top 65%" },
    });
    gsap.to(dLetters, {
      opacity: 1,
      y: "0%",
      duration: 0.3,
      stagger: 0.005,
      ease: "power3.out",
      scrollTrigger: { trigger: header, start: "top 55%" },
    });

    // Cell entrance animations
    cellRefs.current.forEach((cell) => {
      if (!cell) return;
      gsap.to(cell, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: cell, start: "top 80%" },
      });
    });
    bottomRefs.current.forEach((cell) => {
      if (!cell) return;
      gsap.to(cell, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: cell, start: "top 85%" },
      });
    });

    // Mutually exclusive highlighting: top grid active → bottom loses it, and vice versa
    const topCells = cellRefs.current.filter(Boolean);
    const botCells = bottomRefs.current.filter(Boolean);

    function deactivateAll(cells) {
      cells.forEach((c) => c.classList.remove(styles.cellActive));
    }

    topCells.forEach((cell) => {
      ScrollTrigger.create({
        trigger: cell,
        start: "top 75%",
        end: "bottom 25%",
        onEnter: () => {
          deactivateAll(botCells);
          cell.classList.add(styles.cellActive);
        },
        onLeave: () => cell.classList.remove(styles.cellActive),
        onEnterBack: () => {
          deactivateAll(botCells);
          cell.classList.add(styles.cellActive);
        },
        onLeaveBack: () => cell.classList.remove(styles.cellActive),
      });
    });

    botCells.forEach((cell) => {
      ScrollTrigger.create({
        trigger: cell,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => {
          deactivateAll(topCells);
          cell.classList.add(styles.cellActive);
        },
        onLeave: () => cell.classList.remove(styles.cellActive),
        onEnterBack: () => {
          deactivateAll(topCells);
          cell.classList.add(styles.cellActive);
        },
        onLeaveBack: () => cell.classList.remove(styles.cellActive),
      });
    });

    // Per-item accent
    const allItems = sectionRef.current.querySelectorAll(`.${styles.item}`);
    allItems.forEach((item) => {
      ScrollTrigger.create({
        trigger: item,
        start: "top 80%",
        end: "bottom 30%",
        onEnter: () => item.classList.add(styles.itemActive),
        onLeave: () => item.classList.remove(styles.itemActive),
        onEnterBack: () => item.classList.add(styles.itemActive),
        onLeaveBack: () => item.classList.remove(styles.itemActive),
      });
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <section ref={sectionRef} id="integrations" className={styles.section}>
      <div ref={headerRef} className={styles.header}>
        <h2 className="heading-lg">
          {H_LINES.map((line, li) => (
            <span key={li} className={styles.headLine}>
              {line.map((w, wi) => (
                <span key={wi}>
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
                  {wi < line.length - 1 && (
                    <span className={styles.headSpace} />
                  )}
                </span>
              ))}
            </span>
          ))}
        </h2>
        <div className={styles.headerDesc}>
          {DESC_LINES.map((line, li) => (
            <span key={li} className={styles.headerDescLine}>
              {line.split("").map((c, ci) => {
                if (c === " ")
                  return <span key={ci} className={styles.headerDescSpace} />;
                return (
                  <span key={ci} className={styles.headerDescLetter}>
                    {c}
                  </span>
                );
              })}
            </span>
          ))}
        </div>
      </div>

      <div ref={glowRef} className={`${styles.gridOuter} glow-cards`}>
        <div className={styles.grid}>
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.tag}
              ref={(el) => (cellRefs.current[i] = el)}
              className={`${styles.cell} glow-card`}
            >
              <div className="glow-card-border" />
              <div className={`${styles.cellContent} glow-card-content`}>
                <div className={styles.cellTag}>{cat.tag}</div>
                <h3 className={styles.cellTitle}>{cat.title}</h3>
                <p className={styles.cellDesc}>{cat.desc}</p>
                <div className={styles.items}>
                  {cat.items.map((item) => (
                    <Link
                      key={item}
                      href={`/integration/${item
                        .toLowerCase()
                        .replace(/ /g, "-")}`}
                      className={styles.item}
                      style={{ textDecoration: "none" }}
                    >
                      <span>{item}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.bottomRow}>
          {PLATFORMS.map((p, i) => (
            <div
              key={p.title}
              ref={(el) => (bottomRefs.current[i] = el)}
              className={`${styles.bottomCell} glow-card`}
            >
              <div className="glow-card-border" />
              <div className={`${styles.bottomCellContent} glow-card-content`}>
                <div className={styles.bottomLabel}>{p.label}</div>
                <div className={styles.bottomTitle}>{p.title}</div>
                <div className={styles.bottomDesc}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
