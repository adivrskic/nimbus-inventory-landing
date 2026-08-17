"use client";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import useGlowCards from "@/lib/useGlowCards";
import SplitText from "@/components/shared/SplitText";
import {
  gsap,
  ScrollTrigger,
  useGsap,
  DURATION,
  EASE,
  STAGGER,
  DISTANCE,
  TRIGGER,
} from "@/lib/gsap";
import styles from "./Integrations.module.css";

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
    desc: "Generate shipping labels, sync tracking, and optimize carrier selection without leaving Nautilus.",
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
    { t: "you", a: true },
    { t: "use", a: true },
  ],
];

const DESC_LINES = [
  "Nautilus integrates with your existing tools —",
  "accounting, e-commerce, shipping, hardware.",
  "No rip-and-replace. Just plug in.",
];

/* `as` sets the heading level — h2 as one section of the home page, h1 at
   /integration where the section is the whole page. Without it that route
   shipped with no <h1>. */
export default function Integrations({ as: Heading = "h2" }) {
  const glowRef = useGlowCards();

  /* All animation for this section lives in one scoped context. useGsap gives
     us a scoped selector (q), the reduced-motion flag, and automatic cleanup
     via ctx.revert() — so the old `ScrollTrigger.getAll().forEach(t=>t.kill())`
     (which nuked sibling components' triggers) is gone. Motion values come
     from the shared tokens, so this section stays uniform with the rest of
     the site while keeping its bespoke highlight behavior. */
  const sectionRef = useGsap(({ reduced, q }) => {
    /* ── Title: standardized per-letter headline timing. Animates TO the
          resting state; the hidden start (opacity 0 + transform) is defined
          in .headLetter's CSS, so the entrance SHAPE is preserved. ── */
    gsap.to(q(`.${styles.headLetter}`), {
      opacity: 1,
      y: "0%",
      rotateX: 0,
      duration: reduced ? 0 : DURATION.fast,
      stagger: reduced ? 0 : STAGGER.tight,
      ease: EASE.out,
      scrollTrigger: {
        trigger: q(`.${styles.header}`)[0],
        start: TRIGGER.reveal,
      },
    });

    /* ── Description: a deliberate fast micro-wash (very tight stagger), not
          a standard reveal — kept by design. Lives here in the bespoke zone
          rather than going through useHeadlineReveal so its character is
          preserved. ── */
    gsap.to(q(`.${styles.headerDescLetter}`), {
      opacity: 1,
      y: "0%",
      duration: reduced ? 0 : 0.3,
      stagger: reduced ? 0 : 0.005,
      ease: EASE.out,
      scrollTrigger: {
        trigger: q(`.${styles.headerDesc}`)[0],
        start: TRIGGER.reveal,
      },
    });

    /* ── Card entrances. Each cell fades up as it enters (independent
          triggers, matching the original). Top grid uses the section start,
          the platform row the slightly later reveal start. ── */
    q(`.${styles.cell}`).forEach((cell) => {
      gsap.to(cell, {
        opacity: 1,
        y: 0,
        duration: reduced ? 0 : DURATION.base,
        ease: EASE.out,
        scrollTrigger: { trigger: cell, start: TRIGGER.section },
      });
    });
    q(`.${styles.bottomCell}`).forEach((cell) => {
      gsap.to(cell, {
        opacity: 1,
        y: 0,
        duration: reduced ? 0 : DURATION.base,
        ease: EASE.out,
        scrollTrigger: { trigger: cell, start: TRIGGER.reveal },
      });
    });

    /* ── Mutually-exclusive highlight: top grid active ⇄ bottom grid active.
          Behavioral (toggles a class), not motion — so it runs regardless of
          reduced-motion. Created inside the context, so it's reverted on
          unmount with everything else. ── */
    const topCells = Array.from(q(`.${styles.cell}`));
    const botCells = Array.from(q(`.${styles.bottomCell}`));
    const deactivateAll = (cells) =>
      cells.forEach((c) => c.classList.remove(styles.cellActive));

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

    /* ── Per-item accent — highlights individual integration links in view. ── */
    q(`.${styles.item}`).forEach((item) => {
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
  });

  return (
    <section ref={sectionRef} id="integrations" className={styles.section}>
      <div className={styles.header}>
        <Heading className="heading-lg">
          <SplitText
            tokens={H_LINES}
            classNames={{
              line: styles.headLine,
              letter: styles.headLetter,
              accent: styles.headLetterAccent,
              space: styles.headSpace,
            }}
          />
        </Heading>
        <div className={styles.headerDesc}>
          <SplitText
            lines={DESC_LINES}
            classNames={{
              line: styles.headerDescLine,
              letter: styles.headerDescLetter,
              space: styles.headerDescSpace,
            }}
          />
        </div>
      </div>

      <div ref={glowRef} className={`${styles.gridOuter} glow-cards`}>
        <div className={styles.grid}>
          {CATEGORIES.map((cat) => (
            <div key={cat.tag} className={`${styles.cell} glow-card`}>
              <div className="glow-card-border" />
              <div className={`${styles.cellContent} glow-card-content`}>
                <div className={styles.cellTag}>{cat.tag}</div>
                <h3 className={styles.cellTitle}>{cat.title}</h3>
                <p className={styles.cellDesc}>{cat.desc}</p>
                <div className={styles.items}>
                  {cat.items.map((item) => (
                    <TransitionLink
                      key={item}
                      href={`/integration/${item
                        .toLowerCase()
                        .replace(/ /g, "-")}`}
                      className={styles.item}
                      style={{ textDecoration: "none" }}
                    >
                      <span>{item}</span>
                    </TransitionLink>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.bottomRow}>
          {PLATFORMS.map((p) => (
            <div key={p.title} className={`${styles.bottomCell} glow-card`}>
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
