"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import { LEGAL_PAGES } from "./legalData";
import styles from "./LegalPage.module.css";

gsap.registerPlugin(ScrollTrigger);

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function LegalPage({ slug, onDemo }) {
  const page = LEGAL_PAGES[slug];
  const shellRef = useRef(null);

  /* ── Animations ── */
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!page || !shellRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    /* Document seal (decorative) */
    tl.fromTo(
      `.${styles.seal}`,
      { opacity: 0, scale: 0.92 },
      { opacity: 1, scale: 1, duration: 0.6 },
      0
    );

    /* Document meta block */
    tl.fromTo(
      `.${styles.docMeta}`,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5 },
      0.15
    );

    /* Per-letter title */
    const hLetters = shellRef.current.querySelectorAll(`.${styles.headLetter}`);
    tl.to(
      hLetters,
      {
        opacity: 1,
        y: "0%",
        rotateX: 0,
        duration: 0.7,
        stagger: 0.022,
      },
      0.25
    );

    /* Recital / preamble line */
    tl.fromTo(
      `.${styles.recital}`,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5 },
      0.6
    );

    /* Document-row divider */
    tl.fromTo(
      `.${styles.rule}`,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.7, transformOrigin: "left" },
      0.75
    );

    /* Section reveals on scroll */
    const sections = shellRef.current.querySelectorAll(`.${styles.section}`);
    sections.forEach((sec) => {
      const targets = sec.querySelectorAll(
        `.${styles.sectionGutter}, .${styles.sectionHeading}, .${styles.sectionBody}, .${styles.marginalia}`
      );
      gsap.fromTo(
        targets,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: { trigger: sec, start: "top 82%" },
        }
      );
    });

    /* Signature block */
    gsap.fromTo(
      `.${styles.signature}`,
      { opacity: 0, y: 14 },
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

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [slug, page]);

  if (!page) {
    return (
      <div className={styles.page}>
        <Nav onDemo={onDemo} />
        <div className={styles.notFound}>
          <div className={styles.notFoundInner}>
            <div className={styles.eyebrow}>404</div>
            <h1 className={styles.notFoundTitle}>Page not found.</h1>
            <Link href="/" className={styles.backLink}>
              Back to home →
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const titleWords = page.title.split(" ");
  /* Generate a stable document number from the slug + updated date */
  const docNumber = `NW-${slug
    .slice(0, 3)
    .toUpperCase()}-${page.updated.replace(/[^0-9]/g, "")}`.slice(0, 18);

  return (
    <div className={styles.page}>
      <Nav onDemo={onDemo} />

      <article ref={shellRef} className={styles.shell}>
        {/* ── Document header — like the heading of a contract ── */}
        <header className={styles.docHeader}>
          {/* Floating seal in top-right of the document */}
          <div className={styles.seal} aria-hidden="true">
            <svg
              viewBox="0 0 100 100"
              width="64"
              height="64"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="50" cy="50" r="46" strokeWidth="1.5" />
              <circle
                cx="50"
                cy="50"
                r="38"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <text
                x="50"
                y="40"
                fontFamily="JetBrains Mono, monospace"
                fontSize="6"
                textAnchor="middle"
                fill="currentColor"
                stroke="none"
                letterSpacing="1.5"
              >
                NIMBUS
              </text>
              <text
                x="50"
                y="54"
                fontFamily="JetBrains Mono, monospace"
                fontSize="5"
                textAnchor="middle"
                fill="currentColor"
                stroke="none"
                letterSpacing="0.5"
              >
                WMS
              </text>
              <line x1="35" y1="62" x2="65" y2="62" strokeWidth="0.6" />
              <text
                x="50"
                y="72"
                fontFamily="JetBrains Mono, monospace"
                fontSize="4"
                textAnchor="middle"
                fill="currentColor"
                stroke="none"
                letterSpacing="1"
              >
                LEGAL
              </text>
            </svg>
          </div>

          {/* Document meta — like a contract header */}
          <div className={styles.docMeta}>
            <div className={styles.docMetaItem}>
              <span className={styles.docMetaLabel}>Document</span>
              <span className={styles.docMetaValue}>{docNumber}</span>
            </div>
            <div className={styles.docMetaItem}>
              <span className={styles.docMetaLabel}>Effective</span>
              <span className={styles.docMetaValue}>{page.updated}</span>
            </div>
            <div className={styles.docMetaItem}>
              <span className={styles.docMetaLabel}>Sections</span>
              <span className={styles.docMetaValue}>
                {String(page.sections.length).padStart(2, "0")}
              </span>
            </div>
            <div className={styles.docMetaItem}>
              <span className={styles.docMetaLabel}>Jurisdiction</span>
              <span className={styles.docMetaValue}>United States</span>
            </div>
          </div>

          {/* Title block */}
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>
              <span className={styles.headLine}>
                {titleWords.map((word, wi) => (
                  <span key={wi}>
                    <span className="word">
                      {word.split("").map((c, ci) => (
                        <span key={`${wi}-${ci}`} className={styles.headLetter}>
                          {c}
                        </span>
                      ))}
                    </span>
                    {wi < titleWords.length - 1 && (
                      <span className={styles.headSpace} />
                    )}
                  </span>
                ))}
              </span>
            </h1>
            <p className={styles.recital}>
              The plain-English column on the right summarizes each section. The
              legal language on the left controls in the event of a conflict.
            </p>
          </div>

          <div className={styles.rule} />
        </header>

        {/* ── Document body — two columns: legal text + marginalia ── */}
        <div className={styles.docBody}>
          {page.sections.map((sec, i) => {
            const id = slugify(sec.heading);
            return (
              <section key={id} id={id} className={styles.section}>
                <div className={styles.sectionGutter}>
                  <span className={styles.sectionRoman}>
                    §&nbsp;{String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className={styles.sectionMain}>
                  <h2 className={styles.sectionHeading}>{sec.heading}</h2>
                  <p className={styles.sectionBody}>{sec.content}</p>
                </div>
                <aside className={styles.marginalia}>
                  {sec.summary && (
                    <>
                      <div className={styles.marginaliaLabel}>
                        In plain English
                      </div>
                      <p className={styles.marginaliaText}>{sec.summary}</p>
                    </>
                  )}
                </aside>
              </section>
            );
          })}
        </div>

        {/* ── Signature block — like the end of a contract ── */}
        <div className={styles.signature}>
          <div className={styles.signatureRule} />
          <div className={styles.signatureGrid}>
            <div className={styles.signatureBlock}>
              <div className={styles.signatureLabel}>Issuing party</div>
              <div className={styles.signatureName}>Nimbus WMS, Inc.</div>
              <div className={styles.signatureLine} />
              <div className={styles.signatureMeta}>
                Issued {page.updated} · {docNumber}
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
        </div>
      </article>

      <Footer />
    </div>
  );
}
