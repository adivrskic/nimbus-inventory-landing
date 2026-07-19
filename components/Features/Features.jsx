"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ScannerSVG,
  FloorPlanSVG,
  AnalyticsSVG,
  InventorySVG,
  CycleCountSVG,
  LabelSVG,
} from "./visuals";
import styles from "./Features.module.css";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    num: "01",
    title: "Instant barcode scanning",
    desc: "AI-enhanced recognition on iOS and Android, identifying products in under 200ms — even damaged or partial barcodes. Register new items or locate existing inventory without typing a character.",
    stats: [
      { val: "<200ms", label: "Recognition" },
      { val: "99.7%", label: "Accuracy" },
    ],
    Visual: ScannerSVG,
  },
  {
    num: "02",
    title: "Interactive floor plans",
    desc: "Your warehouse as a living visual map. Color-coded sections, bays, and levels. AI highlights high-traffic zones and suggests optimal placement.",
    stats: [
      { val: "3D", label: "Floor model" },
      { val: "Live", label: "Updates" },
    ],
    Visual: FloorPlanSVG,
  },
  {
    num: "03",
    title: "AI analytics & alerts",
    desc: "Dashboards that recommend, not just report. AI flags anomalies instantly. Low stock alerts fire days before you run out.",
    stats: [
      { val: "3 days", label: "Early warning" },
      { val: "24/7", label: "Monitoring" },
    ],
    Visual: AnalyticsSVG,
  },
  {
    num: "04",
    title: "Inventory & team management",
    desc: "Full product catalog with search, filter, sort, and CSV export. Role-based access, activity logging, and eight scan actions from pick to cycle count.",
    stats: [
      { val: "8", label: "Scan actions" },
      { val: "100%", label: "Audit trail" },
    ],
    Visual: InventorySVG,
  },
  {
    num: "05",
    title: "Smart cycle counting",
    desc: "AI prioritizes which sections to count based on discrepancy risk. Scan at your pace — Nautilus handles reconciliation.",
    stats: [
      { val: "70%", label: "Faster counts" },
      { val: "AI", label: "Prioritized" },
    ],
    Visual: CycleCountSVG,
  },
  {
    num: "06",
    title: "Label printing & custom fields",
    desc: "Generate barcode labels directly from the app. Track lot numbers, expiration dates, supplier codes — whatever your operation needs.",
    stats: [
      { val: "Custom", label: "Fields" },
      { val: "Direct", label: "Print" },
    ],
    Visual: LabelSVG,
  },
];

function animateVisual(rowEl, index) {
  const svg = rowEl.querySelector(".feat-svg");
  if (!svg) return;
  const tl = gsap.timeline();
  switch (index) {
    case 0: {
      tl.to(svg.querySelector(".feat-beam"), { opacity: 1, duration: 0.1 })
        .to(
          svg.querySelector(".feat-glow"),
          { opacity: 0.2, duration: 0.1 },
          "<"
        )
        .fromTo(
          svg.querySelector(".feat-beam"),
          { attr: { y1: 70, y2: 70 } },
          { attr: { y1: 130, y2: 130 }, duration: 0.5, ease: "power1.inOut" }
        )
        .fromTo(
          svg.querySelector(".feat-glow"),
          { attr: { y: 68 } },
          { attr: { y: 128 }, duration: 0.5, ease: "power1.inOut" },
          "<"
        )
        .to(
          [svg.querySelector(".feat-beam"), svg.querySelector(".feat-glow")],
          { opacity: 0, duration: 0.2 }
        )
        .to(svg.querySelector(".feat-result"), { opacity: 1, duration: 0.2 })
        .to(
          svg.querySelectorAll(
            ".feat-result-line1,.feat-result-line2,.feat-result-line3"
          ),
          { opacity: 1, stagger: 0.05, duration: 0.12 }
        )
        .to(svg.querySelector(".feat-result-check"), {
          opacity: 1,
          duration: 0.12,
        })
        .to(
          svg.querySelector(".feat-result-tick"),
          { opacity: 1, duration: 0.12 },
          "-=0.05"
        )
        .to(svg.querySelector(".feat-conf-bg"), { opacity: 1, duration: 0.1 })
        .to(svg.querySelector(".feat-conf"), {
          opacity: 1,
          attr: { width: 57 },
          duration: 0.35,
          ease: "power2.out",
        });
      break;
    }
    case 1: {
      tl.to(svg.querySelectorAll(".feat-zone"), {
        fill: "rgba(212,168,83,0.1)",
        stroke: "rgba(212,168,83,0.2)",
        stagger: 0.05,
        duration: 0.25,
      })
        .to(
          svg.querySelectorAll(".feat-zlabel"),
          { fill: "rgba(212,168,83,0.5)", stagger: 0.04, duration: 0.2 },
          "-=0.2"
        )
        .to(svg.querySelectorAll(".feat-heat"), {
          opacity: 1,
          fill: "rgba(212,168,83,0.06)",
          duration: 0.4,
        })
        .to(svg.querySelector(".feat-cursor"), { opacity: 1, duration: 0.1 })
        .to(svg.querySelector(".feat-cursor"), {
          attr: { cx: 280, cy: 70 },
          duration: 0.8,
          ease: "power1.inOut",
        })
        .to(
          svg.querySelector(".feat-ping"),
          { opacity: 0.6, attr: { r: 18 }, duration: 0.4 },
          "-=0.3"
        )
        .to(svg.querySelector(".feat-ping"), {
          opacity: 0,
          attr: { r: 24 },
          duration: 0.3,
        });
      break;
    }
    case 2: {
      const h = [30, 52, 42, 72, 48, 64, 36, 80, 56, 68];
      svg.querySelectorAll(".feat-bar").forEach((b, i) =>
        tl.to(
          b,
          {
            attr: { height: h[i], y: 180 - h[i] },
            duration: 0.3,
            ease: "back.out(1.2)",
          },
          i * 0.03
        )
      );
      svg
        .querySelectorAll(".feat-bar-accent")
        .forEach((b, i) =>
          tl.to(
            b,
            { attr: { height: 3, y: 180 - h[i] }, duration: 0.2 },
            0.15 + i * 0.03
          )
        );
      tl.to(
        svg.querySelector(".feat-trend-accent"),
        { opacity: 0.6, strokeDashoffset: 0, duration: 0.6 },
        0.3
      )
        .to(
          svg.querySelector(".feat-peak"),
          { opacity: 1, duration: 0.15 },
          "-=0.2"
        )
        .to(svg.querySelector(".feat-peak-ring"), {
          opacity: 0.5,
          attr: { r: 12 },
          duration: 0.35,
        })
        .to(svg.querySelector(".feat-peak-ring"), { opacity: 0, duration: 0.2 })
        .to(
          svg.querySelector(".feat-alert"),
          { opacity: 1, duration: 0.15 },
          "-=0.3"
        )
        .to(svg.querySelector(".feat-alert-text"), {
          opacity: 1,
          duration: 0.12,
        });
      break;
    }
    case 3: {
      tl.to(svg.querySelector(".feat-sweep"), {
        opacity: 1,
        attr: { width: 340 },
        duration: 0.5,
        ease: "power1.inOut",
      }).to(svg.querySelector(".feat-sweep"), { opacity: 0, duration: 0.2 });
      svg.querySelectorAll(".feat-row-hl").forEach((hl, i) => {
        tl.to(hl, { opacity: 1, duration: 0.15 }, 0.4 + i * 0.12).to(
          hl,
          { opacity: 0, duration: 0.2 },
          0.6 + i * 0.12
        );
      });
      tl.to(svg.querySelector(".feat-select"), {
        opacity: 1,
        duration: 0.2,
      }).to(
        svg.querySelector(".feat-row-hl"),
        { opacity: 1, duration: 0.15 },
        "<"
      );
      break;
    }
    case 4: {
      const secs = svg.querySelectorAll(".feat-sec"),
        w = [76, 50, 76, 30, 60];
      secs.forEach((s, i) => {
        const d = i * 0.2;
        tl.to(
          s.querySelector(".feat-sprog"),
          { attr: { width: w[i] }, duration: 0.3 },
          d
        );
        if (i < 3)
          tl.to(
            s.querySelector(".feat-stick"),
            { opacity: 1, duration: 0.12 },
            d + 0.25
          );
      });
      tl.to(
        svg.querySelector(".feat-oprog"),
        { attr: { width: 192 }, duration: 0.8 },
        0.2
      ).to(
        svg.querySelector(".feat-opct"),
        { opacity: 1, duration: 0.15 },
        0.4
      );
      break;
    }
    case 5: {
      const lg = svg.querySelector(".feat-label-group");
      gsap.set(lg, { y: -110 });
      tl.to(svg.querySelector(".feat-printer-light"), {
        fill: "#D4A853",
        duration: 0.15,
      })
        .to(lg, { y: 0, duration: 0.7, ease: "power2.out" })
        .to(
          svg.querySelector(".feat-verify-beam"),
          { opacity: 0.5, duration: 0.08 },
          "-=0.1"
        )
        .fromTo(
          svg.querySelector(".feat-verify-beam"),
          { attr: { y: 36 } },
          { attr: { y: 140 }, duration: 0.4, ease: "power1.inOut" }
        )
        .to(svg.querySelector(".feat-verify-beam"), {
          opacity: 0,
          duration: 0.15,
        })
        .to(
          svg.querySelector(".feat-printer-light"),
          { fill: "#5a9a4a", duration: 0.15 },
          "-=0.2"
        )
        .to(svg.querySelectorAll(".feat-conn"), {
          opacity: 1,
          stagger: 0.06,
          duration: 0.2,
        })
        .to(svg.querySelectorAll(".feat-tag"), {
          opacity: 1,
          stagger: 0.08,
          duration: 0.2,
        })
        .fromTo(
          svg.querySelectorAll(".feat-tag"),
          { y: 8, scale: 0.92 },
          { y: 0, scale: 1, stagger: 0.08, duration: 0.3, ease: "back.out(2)" },
          "<"
        )
        .to(
          svg.querySelectorAll(".feat-tag-t"),
          { opacity: 1, stagger: 0.08, duration: 0.12 },
          "-=0.2"
        );
      break;
    }
  }
  return tl;
}

function resetVisual(rowEl) {
  const svg = rowEl.querySelector(".feat-svg");
  if (!svg) return;
  gsap.killTweensOf(svg.querySelectorAll("*"));
  /* Each feature row's SVG only contains its own subset of the .feat-*
     classes, so most selectors below miss on any given row. Skip empty
     matches — gsap.set on an empty NodeList logs a "target not found"
     warning (hundreds per mount across six rows). */
  const set = (sel, vars) => {
    const nodes = svg.querySelectorAll(sel);
    if (nodes.length) gsap.set(nodes, vars);
  };
  set(
    ".feat-beam,.feat-glow,.feat-result,.feat-result-line1,.feat-result-line2,.feat-result-line3,.feat-result-check,.feat-result-tick,.feat-conf-bg,.feat-conf",
    { opacity: 0 }
  );
  set(".feat-conf", { attr: { width: 0 } });
  set(".feat-heat,.feat-cursor,.feat-ping", { opacity: 0 });
  set(".feat-cursor", { attr: { cx: 60, cy: 50 } });
  set(".feat-ping", { attr: { r: 4 } });
  set(".feat-zone", { clearProps: "fill,stroke" });
  set(".feat-zlabel", { clearProps: "fill" });
  const h = [30, 52, 42, 72, 48, 64, 36, 80, 56, 68];
  svg.querySelectorAll(".feat-bar").forEach((b, i) => {
    const hh = h[i] * 0.4;
    gsap.set(b, { attr: { height: hh, y: 180 - hh } });
  });
  set(".feat-bar-accent", { attr: { height: 0 } });
  set(".feat-trend-accent", { strokeDashoffset: 400, opacity: 0 });
  set(".feat-peak,.feat-peak-ring,.feat-alert,.feat-alert-text", {
    opacity: 0,
  });
  set(".feat-peak-ring", { attr: { r: 4 } });
  set(".feat-sweep", { attr: { width: 0 }, opacity: 0 });
  set(".feat-select,.feat-row-hl", { opacity: 0 });
  set(".feat-sprog,.feat-oprog", { attr: { width: 0 } });
  set(".feat-stick,.feat-opct", { opacity: 0 });
  set(".feat-tag,.feat-tag-t", { opacity: 0, y: 0, scale: 1 });
  set(".feat-conn,.feat-verify-beam", { opacity: 0 });
  set(".feat-label-group", { y: 0 });
  set(".feat-printer-light", { fill: "rgba(0,0,0,0.06)" });
}

export default function Features() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const rowsRef = useRef(null);
  const rowRefs = useRef([]);
  const frameRef = useRef(null);
  const accentRef = useRef(null);
  const [activeRow, setActiveRow] = useState(-1);
  const prevActive = useRef(-1);

  useEffect(() => {
    // Scope all GSAP work to this section. gsap.context() records every
    // tween, timeline, and ScrollTrigger created inside the callback, so
    // ctx.revert() on unmount tears down ONLY this component's instances.
    // The previous cleanup — ScrollTrigger.getAll().forEach(t => t.kill())
    // — killed every ScrollTrigger on the page (Hero, AISection, etc.),
    // which breaks sibling scroll animations on client-side route changes
    // (TransitionLink) and under React strict-mode's double-mount. Matches
    // the scoped pattern Hero uses.
    const ctx = gsap.context(() => {
      gsap.to(headerRef.current.children, {
        y: 0,
        opacity: 1,
        duration: 0.55,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: { trigger: headerRef.current, start: "clamp(top 92%)" },
      });

      const rows = rowRefs.current.filter(Boolean);

      rows.forEach((row) => {
        gsap.to(row, {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power3.out",
          scrollTrigger: { trigger: row, start: "clamp(top 90%)" },
        });
      });

      rows.forEach((row, i) => {
        ScrollTrigger.create({
          trigger: row,
          start: "top 55%",
          end: "bottom 45%",
          onEnter: () => setActiveRow(i),
          onEnterBack: () => setActiveRow(i),
          onLeave: () => setActiveRow((prev) => (prev === i ? -1 : prev)),
          onLeaveBack: () => setActiveRow((prev) => (prev === i ? -1 : prev)),
        });
      });

      // Reset all visuals on mount
      rows.forEach((r) => resetVisual(r));

      const frameTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 20%",
          end: "bottom top",
          scrub: 1,
        },
      });
      frameTl.to(
        accentRef.current,
        { opacity: 1, duration: 0.3, ease: "power2.inOut" },
        0.7
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const rows = rowRefs.current.filter(Boolean);
    if (activeRow === prevActive.current) return;

    // Deactivate previous — only remove active class, SVG stays in completed state
    if (prevActive.current >= 0 && prevActive.current < rows.length) {
      rows[prevActive.current].classList.remove(styles.active);
    }

    // Activate current
    if (activeRow >= 0 && activeRow < rows.length) {
      rows[activeRow].classList.add(styles.active);
      animateVisual(rows[activeRow], activeRow);
    }

    prevActive.current = activeRow;
  }, [activeRow]);

  return (
    <section id="features" ref={sectionRef} className={styles.section}>
      <div ref={headerRef} className={styles.header}>
        <h2 className="heading-lg gsap-hidden">
          Engineered for the <br />
          <em className="accent-italic">warehouse floor</em>
        </h2>
      </div>

      <div ref={rowsRef} className={styles.rows}>
        {FEATURES.map((f, i) => (
          <div
            key={f.num}
            ref={(el) => (rowRefs.current[i] = el)}
            className={styles.row}
          >
            <div className={styles.textSide}>
              <div className={styles.rowNumber}>{f.num}</div>
              <h3 className={styles.rowTitle}>{f.title}</h3>
              <p className={styles.rowDesc}>{f.desc}</p>
              <div className={styles.rowStats}>
                {f.stats.map((s, si) => (
                  <div key={si}>
                    <div className={styles.rowStatVal}>{s.val}</div>
                    <div className={styles.rowStatLabel}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.visualSide}>
              <f.Visual />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.frameOverlay}>
        <div ref={frameRef} className={styles.frameSticky}>
          <div ref={accentRef} className={styles.accentFill} />
        </div>
      </div>
    </section>
  );
}
