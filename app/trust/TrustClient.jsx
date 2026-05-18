"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import SplitText from "@/components/shared/SplitText";
import DemoModal from "@/components/DemoModal/DemoModal";
import styles from "./Trust.module.css";

gsap.registerPlugin(ScrollTrigger);

const COMPLIANCE = [
  {
    name: "SOC 2 Type II",
    status: "Certified",
    statusKind: "active",
    desc: "Audited annually by an independent firm against security, availability, and confidentiality criteria. Report available under NDA.",
    last: "Audited Mar 2026",
  },
  {
    name: "ISO 27001",
    status: "In progress",
    statusKind: "pending",
    desc: "Information security management system aligned to ISO/IEC 27001:2022. Certification audit scheduled Q3 2026.",
    last: "Audit Q3 2026",
  },
  {
    name: "GDPR",
    status: "Compliant",
    statusKind: "active",
    desc: "DPA available. EU customer data processed under standard contractual clauses. Data subject requests handled within 30 days.",
    last: "Reviewed Feb 2026",
  },
  {
    name: "HIPAA",
    status: "Compliant",
    statusKind: "active",
    desc: "BAA available for healthcare and pharmaceutical customers. PHI handling controls aligned to HIPAA Security Rule.",
    last: "Reviewed Feb 2026",
  },
  {
    name: "CCPA / CPRA",
    status: "Compliant",
    statusKind: "active",
    desc: "California consumer rights honored for all users regardless of region. Opt-out, deletion, and portability available in-product.",
    last: "Reviewed Feb 2026",
  },
  {
    name: "Penetration testing",
    status: "Annual",
    statusKind: "active",
    desc: "Third-party penetration testing every 12 months across web app, API, and mobile. Findings remediated within SLA, summary available under NDA.",
    last: "Last test Jan 2026",
  },
];

const PRACTICES = [
  {
    title: "Zero-trust architecture",
    desc: "Every request is authenticated regardless of network location. No implicit trust based on VPN or IP. Internal services authenticate to each other with mutual TLS.",
  },
  {
    title: "Encryption everywhere",
    desc: "TLS 1.3 in transit with forward secrecy. AES-256 at rest with keys rotated every 90 days through a dedicated KMS. Backups encrypted with separate keys.",
  },
  {
    title: "Least privilege access",
    desc: "RBAC across every surface. Production access is broken-glass only, time-bound, audited, and requires peer approval. No standing admin credentials.",
  },
  {
    title: "MFA + SSO required",
    desc: "MFA enforced for all internal users; required for customer admin accounts. SAML 2.0 SSO with major IDPs for enterprise customers.",
  },
  {
    title: "Secret management",
    desc: "Secrets stored in a centralized vault, never in code or environment files. Short-lived credentials for service-to-service. Automated rotation.",
  },
  {
    title: "Continuous scanning",
    desc: "Automated SAST and dependency scanning on every PR. Continuous monitoring for known vulnerabilities in production dependencies. Critical patches within 24h.",
  },
];

const INFRA = [
  { label: "Primary region", value: "US-East (Virginia)" },
  { label: "Failover region", value: "US-West (Oregon)" },
  { label: "EU region", value: "Frankfurt (enterprise)" },
  {
    label: "Database",
    value: "Multi-AZ Postgres, encrypted, point-in-time restore",
  },
  { label: "Object storage", value: "S3-class, versioned, encrypted at rest" },
  { label: "Edge / CDN", value: "Global with WAF + DDoS protection" },
  { label: "RPO / RTO", value: "1h recovery point, 4h recovery time" },
  {
    label: "Monitoring",
    value: "24/7 with sub-minute granularity, on-call < 60s alerting",
  },
];

export default function TrustClient() {
  const pageRef = useRef(null);
  const heroRef = useRef(null);

  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  /* Animations */
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!heroRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(
      `.${styles.heroEyebrow}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45 },
      0.1
    );

    const letters = heroRef.current.querySelectorAll(`.${styles.heroLetter}`);
    tl.to(
      letters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.75, stagger: 0.022 },
      0.2
    );

    tl.fromTo(
      `.${styles.heroSub}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55 },
      0.6
    );
    tl.fromTo(
      `.${styles.heroCTA}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5 },
      0.75
    );

    if (!pageRef.current) return;
    const sections = pageRef.current.querySelectorAll(`.${styles.section}`);
    sections.forEach((sec) => {
      const num = sec.querySelector(`.${styles.sectionNum}`);
      const content = sec.querySelectorAll(
        `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.complianceItem}, .${styles.practiceItem}, .${styles.infraRow}, .${styles.disclosureBlock}`
      );
      if (num) {
        gsap.fromTo(
          num,
          { opacity: 0, x: -20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: sec, start: "top 80%" },
          }
        );
      }
      if (content.length > 0) {
        gsap.fromTo(
          content,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.05,
            ease: "power3.out",
            scrollTrigger: { trigger: sec, start: "top 78%" },
          }
        );
      }
    });

    gsap.fromTo(
      `.${styles.finalCTA}`,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: `.${styles.finalCTA}`, start: "top 85%" },
      }
    );

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <div ref={pageRef} className={styles.page}>
      <Nav onDemo={openDemo} />

      {/* ── HERO ── */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroEyebrow}>Trust & Security</div>
        <h1 className={styles.heroTitle}>
          <SplitText
            text="Trust, built in."
            accentWord="built"
            classNames={{
              line: styles.heroLine,
              letter: styles.heroLetter,
              accent: styles.heroLetterAccent,
              space: styles.heroSpace,
            }}
          />
        </h1>
        <p className={styles.heroSub}>
          The certifications, practices, and infrastructure that keep your
          warehouse data safe. No marketing fluff — just what we do and how we
          prove it.
        </p>

        <div className={styles.heroCTA}>
          <CornerButton onClick={openDemo}>
            Request our SOC 2 report
          </CornerButton>
          <a
            href="mailto:security@Nautiluswms.com"
            className={styles.heroSecondary}
          >
            security@Nautiluswms.com →
          </a>
        </div>
      </section>

      {/* ── § 01 — COMPLIANCE & CERTIFICATIONS ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          01
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Compliance & certifications</div>
          <h2 className={styles.sectionTitle}>Audited where it matters.</h2>
          <p className={styles.sectionDesc}>
            Six external attestations and regulations. Each report or DPA
            available to enterprise customers under NDA.
          </p>

          <div className={styles.complianceGrid}>
            {COMPLIANCE.map((c) => (
              <div key={c.name} className={styles.complianceItem}>
                <div className={styles.complianceHead}>
                  <span className={styles.complianceName}>{c.name}</span>
                  <span
                    className={`${styles.complianceStatus} ${
                      c.statusKind === "pending"
                        ? styles.complianceStatusPending
                        : ""
                    }`}
                  >
                    <span className={styles.complianceStatusDot} />
                    {c.status}
                  </span>
                </div>
                <p className={styles.complianceDesc}>{c.desc}</p>
                <div className={styles.complianceFoot}>{c.last}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 02 — SECURITY PRACTICES ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          02
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Security practices</div>
          <h2 className={styles.sectionTitle}>What we do, on every request.</h2>
          <p className={styles.sectionDesc}>
            The defenses below run continuously across the platform — not
            checklist items, not annual reviews.
          </p>

          <div className={styles.practiceList}>
            {PRACTICES.map((p, i) => (
              <div key={p.title} className={styles.practiceItem}>
                <div className={styles.practiceNum}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className={styles.practiceBody}>
                  <h3 className={styles.practiceTitle}>{p.title}</h3>
                  <p className={styles.practiceDesc}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 03 — INFRASTRUCTURE ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          03
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Infrastructure</div>
          <h2 className={styles.sectionTitle}>Where it runs.</h2>
          <p className={styles.sectionDesc}>
            Multi-region by default. Encrypted top to bottom. Designed so a
            single failure never takes you down.
          </p>

          <dl className={styles.infraList}>
            {INFRA.map((row) => (
              <div key={row.label} className={styles.infraRow}>
                <dt className={styles.infraLabel}>{row.label}</dt>
                <dd className={styles.infraValue}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── § 04 — RESPONSIBLE DISCLOSURE ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          04
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Responsible disclosure</div>
          <h2 className={styles.sectionTitle}>Found something? Tell us.</h2>
          <p className={styles.sectionDesc}>
            We work with security researchers. Report a vulnerability and
            we&apos;ll acknowledge within 24 hours, fix critical issues within 7
            days, and credit you in our hall of fame.
          </p>

          <div className={styles.disclosureBlock}>
            <div className={styles.disclosureCol}>
              <div className={styles.disclosureLabel}>How to report</div>
              <p className={styles.disclosureText}>
                Email security@Nautiluswms.com. PGP key available on request.
                Include reproduction steps, affected endpoints, and your
                proposed CVSS score if you have one.
              </p>
              <a
                href="mailto:security@Nautiluswms.com"
                className={styles.disclosureLink}
              >
                security@Nautiluswms.com →
              </a>
            </div>
            <div className={styles.disclosureCol}>
              <div className={styles.disclosureLabel}>Our commitments</div>
              <ul className={styles.disclosureList}>
                <li>Acknowledge within 24 hours</li>
                <li>Critical fixes within 7 days</li>
                <li>No legal action for good-faith research</li>
                <li>Credit in our hall of fame (if you want)</li>
                <li>Bug bounty for qualifying reports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className={styles.finalCTA}>
        <div className={styles.finalCTAInner}>
          <div className={styles.finalCTALabel}>Due diligence?</div>
          <h2 className={styles.finalCTATitle}>
            We&apos;ll send you everything.
          </h2>
          <p className={styles.finalCTADesc}>
            SOC 2 Type II report, DPA, BAA, security questionnaire, pen test
            summary, sub-processor list — all available under NDA. Request the
            full security package.
          </p>
          <div className={styles.finalCTAButtons}>
            <CornerButton onClick={openDemo}>
              Request security package
            </CornerButton>
            <TransitionLink
              href="/legal/security"
              className={styles.heroSecondary}
            >
              Read the security policy →
            </TransitionLink>
          </div>
        </div>
      </section>

      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
