"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from "@/components/Footer/Footer";
import SplitText from "@/components/shared/SplitText";
import { resetScroll } from "@/lib/resetScroll";

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

export default function LegalPage({ slug }) {
  const page = LEGAL_PAGES[slug];
  const shellRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    resetScroll();
    if (!page || !headerRef.current) return;

    /* Hoisted above the gsap.context — referenced by both the intro
       timeline's onComplete (inside) and the cleanup closure (outside). */
    let cancelled = false;

    /* Scope all GSAP work to a context. ctx.revert() on cleanup tears down
       ONLY the tweens/ScrollTriggers created here — the previous
       ScrollTrigger.getAll().forEach((t) => t.kill()) killed triggers owned
       by still-mounted siblings (e.g. the Footer) when this effect re-ran on
       a slug change — and restores elements to their CSS-declared initial
       state so the intro replays cleanly for the new document. */
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      /* Seal — decorative ring in the top-right of the header. CSS
         starts it at opacity: 0; fade in to ~0.3 (it's just texture). */
      tl.to(`.${styles.seal}`, { opacity: 0.3, duration: 0.4 }, 0);

      /* Doc-meta block (Document / Last updated / Effective / Jurisdiction). */
      tl.to(`.${styles.docMeta}`, { opacity: 1, duration: 0.4 }, 0.05);

      const letters = headerRef.current.querySelectorAll(
        `.${styles.headLetter}`
      );
      if (letters.length) {
        tl.to(
          letters,
          {
            opacity: 1,
            y: "0%",
            rotateX: 0,
            duration: 0.5,
            stagger: 0.022,
          },
          0.2
        );
      }

      /* From the title down, the header reads strictly top-to-bottom: title
         letters → recital → gold rule, each anchored to the END of the step
         above it (">" with a small negative offset for a gentle overlap) so
         the recital never settles before the per-letter title finishes. The
         seal + docMeta above keep their original timing. */

      /* Recital — italic preamble below the title. */
      tl.to(`.${styles.recital}`, { opacity: 1, duration: 0.4 }, ">-0.15");

      /* Gold rule under the header — scales in from the left.
         CSS leaves it at opacity: 0.6 for the no-JS state, so we
         fromTo from (scaleX:0, opacity:0) into (scaleX:1, opacity:0.6). */
      tl.fromTo(
        `.${styles.rule}`,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 0.6, duration: 0.45 },
        ">-0.1"
      );

      /* ── Gate the scroll reveals behind the header intro ────────────────
         The header intro above plays on mount; the section + signature reveals
         below are scroll-triggered. Without a gate, any section near enough to
         the top to satisfy its trigger on initial load animates in
         immediately, racing (and finishing before) the header. So: a reveal
         that fires on initial load is QUEUED and released the moment the intro
         completes; a section scrolled to later plays immediately, exactly as
         before. Below-fold content is never delayed artificially. */
      let introDone = false;
      const queued = [];
      const runWhenIntroDone = (fn) => (introDone ? fn() : queued.push(fn));
      tl.eventCallback("onComplete", () => {
        if (cancelled) return;
        introDone = true;
        queued.forEach((fn) => fn());
        queued.length = 0;
      });
      const gatedReveal = (targets, fromVars, toVars, trigger, start) => {
        const tween = gsap.fromTo(targets, fromVars, {
          ...toVars,
          paused: true,
        });
        ScrollTrigger.create({
          trigger,
          start,
          once: true,
          onEnter: () => runWhenIntroDone(() => tween.play()),
        });
      };

      /* Section reveals on scroll — each section's parts (gutter
         § marker, heading, body prose, marginalia summary) stagger in
         as the section enters the viewport. */
      if (shellRef.current) {
        const sections = shellRef.current.querySelectorAll(
          `.${styles.section}`
        );
        sections.forEach((sec) => {
          const els = sec.querySelectorAll(
            `.${styles.sectionGutter}, .${styles.sectionHeading}, .${styles.sectionBody}, .${styles.marginalia}`
          );
          if (els.length) {
            gatedReveal(
              els,
              { opacity: 0, y: 14 },
              {
                opacity: 1,
                y: 0,
                duration: 0.42,
                stagger: 0.06,
                ease: "power3.out",
              },
              sec,
              "clamp(top 90%)"
            );
          }
        });

        /* Signature block at the end. */
        gatedReveal(
          `.${styles.signature}`,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" },
          `.${styles.signature}`,
          "clamp(top 90%)"
        );
      }
    });

    return () => {
      cancelled = true;
      ctx.revert();
    };
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
    `What follows is the ${page.title.toLowerCase()} governing your relationship with Nautilus WMS, Inc. Plain-English summaries appear in the right margin throughout — they're for reference; the body text on the left is what's legally binding.`;

  return (
    <div className={styles.page}>
      <div ref={shellRef} className={styles.shell}>
        {/* ── DOC HEADER ───────────────────────────────────────────── */}
        <header ref={headerRef} className={styles.docHeader}>
          {/* Title block — per-letter rise + italic recital */}
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>
              <SplitText
                text={page.title}
                classNames={{
                  line: styles.headLine,
                  letter: styles.headLetter,
                  space: styles.headSpace,
                }}
              />
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
              <div className={styles.signatureName}>Nautilus WMS, Inc.</div>
              <div className={styles.signatureLine} aria-hidden="true" />
              <div className={styles.signatureMeta}>
                Effective {page.updated}
              </div>
            </div>
            <div className={styles.signatureContact}>
              <div className={styles.signatureLabel}>Questions</div>
              <a
                href="mailto:legal@nautilusinventory.com"
                className={styles.signatureEmail}
              >
                legal@nautilusinventory.com
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
