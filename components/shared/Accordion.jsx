"use client";

import { useId, useState } from "react";
import styles from "./Accordion.module.css";

/* ═══════════════════════════════════════════════════════════════════════
   Accordion — the canonical disclosure / FAQ component.
   ───────────────────────────────────────────────────────────────────────
   Consolidates the three FAQ treatments that used to live per-page:
     - /pricing            (classed accordion — the basis for this)
     - /integration/[slug] (flat always-open list)
     - /industry/[slug]    (flat always-open list, inline-styled)

   API:
     items           [{ q, a }]      — question / answer pairs
     onOpen          (i, item) => {} — fired ONLY when an item opens
                                       (not on close), for analytics
     allowMultiple   boolean         — default false (single-open, like Pricing)
     defaultOpen     number | null   — index open on mount (uncontrolled)
     initiallyHidden boolean         — start items at opacity:0 so a host
                                       page's scroll-reveal can fade them in
                                       without a first-paint flash. The host
                                       targets `[data-accordion-item]`.
     className       string          — extra class on the list wrapper
                                       (e.g. a page's top-margin)

   Each item carries a stable `data-accordion-item` attribute (not a hashed
   module class) so a consuming page's gated reveal can query the items
   without importing this module's CSS.
   ═══════════════════════════════════════════════════════════════════════ */

const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M7 1V13M1 7H13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default function Accordion({
  items = [],
  onOpen,
  allowMultiple = false,
  defaultOpen = null,
  initiallyHidden = false,
  className = "",
}) {
  const uid = useId();

  const [open, setOpen] = useState(() =>
    allowMultiple
      ? new Set(defaultOpen != null ? [defaultOpen] : [])
      : defaultOpen
  );

  const isOpen = (i) => (allowMultiple ? open.has(i) : open === i);

  const toggle = (i, item) => {
    const wasOpen = isOpen(i);
    if (allowMultiple) {
      setOpen((prev) => {
        const next = new Set(prev);
        next.has(i) ? next.delete(i) : next.add(i);
        return next;
      });
    } else {
      setOpen(wasOpen ? null : i);
    }
    /* Fire the hook only on OPEN — matches the original pricing_faq_expand
       behavior (no event on collapse). */
    if (!wasOpen) onOpen?.(i, item);
  };

  if (!items.length) return null;

  return (
    <div className={`${styles.list} ${className}`}>
      {items.map((item, i) => {
        const openNow = isOpen(i);
        const headerId = `${uid}-h-${i}`;
        const panelId = `${uid}-p-${i}`;
        return (
          <div
            key={i}
            data-accordion-item
            className={`${styles.item} ${initiallyHidden ? styles.hidden : ""}`}
          >
            <button
              id={headerId}
              type="button"
              className={styles.header}
              aria-expanded={openNow}
              aria-controls={panelId}
              onClick={() => toggle(i, item)}
            >
              <span className={styles.question}>{item.q}</span>
              <span
                className={`${styles.icon} ${openNow ? styles.iconOpen : ""}`}
                aria-hidden="true"
              >
                <PlusIcon />
              </span>
            </button>

            {/* Kept in the DOM when collapsed (animated via grid-rows) so the
                answers stay crawlable — important for FAQ rich results. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              className={`${styles.body} ${openNow ? styles.bodyOpen : ""}`}
            >
              <div className={styles.bodyInner}>
                <p className={styles.answer}>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
