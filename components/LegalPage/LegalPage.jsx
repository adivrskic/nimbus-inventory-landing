"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from "@/components/Footer/Footer";
import { LEGAL_PAGES } from "./legalData";
import styles from "./LegalPage.module.css";

gsap.registerPlugin(ScrollTrigger);

/* Nav removed — it lives in app/layout.js now. Nav auto-applies the
   `dark` variant via usePathname() for /legal/* paths, so this
   component renders the document chrome only and lets the global
   Nav handle navigation. */

/* ─────────────────────────────────────────────────────
   ROMAN NUMERAL helper — used for the § markers in the
   left gutter (§ I, § II, § III…). Capped at 3,999 which
   is more than we'll ever need for a legal doc.
───────────────────────────────────────────────────── */
function toRoman(n) {
  const map = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let v = n;
  for (const [val, ch] of map) {
    while (v >= val) {
      out += ch;
      v -= val;
    }
  }
  return out;
}

/* ─────────────────────────────────────────────────────
   PER-LETTER TITLE — wraps each word in `.word` (global
   white-space: nowrap, so titles can't break inside a
   word) and each character in a `.headLetter` span so
   GSAP can rise + un-rotate them individually.
───────────────────────────────────────────────────── */
function renderTitle(text) {
  const parts = text.split(/(\s+)/);
  return parts.map((part, pi) => {
    if (part === "") return null;
    if (/^\s+$/.test(part)) {
      return (
        <span key={`s${pi}`} className={styles.headSpace} aria-hidden="true" />
      );
    }
    return (
      <span key={`w${pi}`} className="word">
        {[...part].map((c, ci) => (
          <span key={ci} className={styles.headLetter}>
            {c}
          </span>
        ))}
      </span>
    );
  });
}

export default function LegalPage({ slug }) {
  const page = LEGAL_PAGES[slug];
  const shellRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!page || !headerRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    /* Seal — decorative ring in the top-right of the header. CSS
       starts it at opacity: 0; fade in to ~0.3 (it's just texture). */
    tl.to(`.${styles.seal}`, { opacity: 0.3, duration: 0.5 }, 0);

    /* Doc-meta block (Document / Last updated / Effective / Jurisdiction). */
    tl.to(`.${styles.docMeta}`, { opacity: 1, duration: 0.5 }, 0.05);

    /* Per-letter title rise. CSS sets each letter to translateY(100%)
       rotateX(35deg) opacity 0; we tween to y:0, rotateX:0, opacity:1.
       y:"0%" is a percentage tween so GSAP composes with the existing
       transform unit cleanly. */
    const letters = headerRef.current.querySelectorAll(`.${styles.headLetter}`);
    if (letters.length) {
      tl.to(
        letters,
        {
          opacity: 1,
          y: "0%",
          rotateX: 0,
          duration: 0.7,
          stagger: 0.022,
        },
        0.2
      );
    }

    /* Recital — italic preamble below the title. */
    tl.to(`.${styles.recital}`, { opacity: 1, duration: 0.5 }, 0.6);

    /* Gold rule under the header — scales in from the left.
       CSS leaves it at opacity: 0.6 for the no-JS state, so we
       fromTo from (scaleX:0, opacity:0) into (scaleX:1, opacity:0.6). */
    tl.fromTo(
      `.${styles.rule}`,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 0.6, duration: 0.6 },
      0.75
    );

    /* Section reveals on scroll — each section's parts (gutter
       § marker, heading, body prose, marginalia summary) stagger in
       as the section enters the viewport. */
    if (shellRef.current) {
      const sections = shellRef.current.querySelectorAll(`.${styles.section}`);
      sections.forEach((sec) => {
        const els = sec.querySelectorAll(
          `.${styles.sectionGutter}, .${styles.sectionHeading}, .${styles.sectionBody}, .${styles.marginalia}`
        );
        if (els.length) {
          gsap.fromTo(
            els,
            { opacity: 0, y: 14 },
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              stagger: 0.06,
              ease: "power3.out",
              scrollTrigger: { trigger: sec, start: "top 82%" },
            }
          );
        }
      });

      /* Signature block at the end. */
      gsap.fromTo(
        `.${styles.signature}`,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: `.${styles.signature}`,
            start: "top 85%",
          },
        }
      );
    }

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [slug, page]);

  /* ─── 404 STATE ─── matches the .notFound / .notFoundInner /
     .eyebrow / .notFoundTitle / .backLink CSS classes. */
  if (!page) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <div className={styles.notFoundInner}>
            <div className={styles.eyebrow}>Document not found</div>
            <h1 className={styles.notFoundTitle}>404</h1>
            <Link href="/" className={styles.backLink}>
              ← Back to home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* Per-page recital. Optional `page.recital` overrides the default;
     otherwise we synthesize a generic line that fits any legal doc. */
  const recital =
    page.recital ||
    `What follows is the ${page.title.toLowerCase()} governing your relationship with Nimbus WMS, Inc. Plain-English summaries appear in the right margin throughout — they're for reference; the body text on the left is what's legally binding.`;

  return (
    <div className={styles.page}>
      <div ref={shellRef} className={styles.shell}>
        {/* ── DOC HEADER ───────────────────────────────────────────── */}
        <header ref={headerRef} className={styles.docHeader}>
          {/* Title block — per-letter rise + italic recital */}
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>
              <span className={styles.headLine}>{renderTitle(page.title)}</span>
            </h1>
            <p className={styles.recital}>{recital}</p>
          </div>

          {/* Animated gold rule */}
          <div className={styles.rule} aria-hidden="true" />
        </header>

        {/* ── DOC BODY ─────────────────────────────────────────────
            Three-column sections per the CSS:
              [80px §-marker] [640px prose] [240px marginalia]
            Each section's children are independently animated by
            the useEffect via querySelectorAll, so adding/removing
            sections at the data layer doesn't need code changes here. */}
        <main className={styles.docBody}>
          {page.sections.map((sec, i) => (
            <section key={i} id={`section-${i + 1}`} className={styles.section}>
              <aside className={styles.sectionGutter}>
                <span className={styles.sectionRoman}>§ {toRoman(i + 1)}</span>
              </aside>

              <div className={styles.sectionMain}>
                <h2 className={styles.sectionHeading}>{sec.heading}</h2>
                <p className={styles.sectionBody}>{sec.content}</p>
              </div>

              {/* Marginalia is rendered only when the section actually
                  has a plain-English summary. If a section's data
                  doesn't include `summary`, the third grid column
                  stays empty — CSS handles that gracefully. */}
              {sec.summary && (
                <aside className={styles.marginalia}>
                  <div className={styles.marginaliaLabel}>In plain English</div>
                  <p className={styles.marginaliaText}>{sec.summary}</p>
                </aside>
              )}
            </section>
          ))}
        </main>

        {/* ── SIGNATURE BLOCK ──────────────────────────────────────
            CSS uses an explicit 3-column grid (80 / 1fr / 1fr) and
            puts .signatureBlock at column 2 and .signatureContact at
            column 3, so the first column reads as the gutter to
            visually align with the section grid above. */}
        <footer className={styles.signature}>
          <div className={styles.signatureRule} aria-hidden="true" />
          <div className={styles.signatureGrid}>
            <div className={styles.signatureBlock}>
              <div className={styles.signatureLabel}>Signed</div>
              <div className={styles.signatureName}>Nimbus WMS, Inc.</div>
              <div className={styles.signatureLine} aria-hidden="true" />
              <div className={styles.signatureMeta}>
                Effective {page.updated}
              </div>
            </div>
            <div className={styles.signatureContact}>
              <div className={styles.signatureLabel}>Questions</div>
              <a
                href="mailto:legal@nimbuswms.com"
                className={styles.signatureEmail}
              >
                legal@nimbuswms.com
              </a>
              <Link href="/" className={styles.signatureBack}>
                ← Back to home
              </Link>
            </div>
          </div>
        </footer>
      </div>

      <Footer />
    </div>
  );
}
