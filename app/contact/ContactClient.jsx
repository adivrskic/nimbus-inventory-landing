"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import { validateContact } from "@/lib/validation";
import styles from "./Contact.module.css";

gsap.registerPlugin(ScrollTrigger);

const INITIAL_FORM = {
  name: "",
  email: "",
  company: "",
  role: "",
  message: "",
  usage: "",
  website: "", // honeypot
};

const ROLES = [
  "Warehouse manager",
  "Operations director",
  "IT / Engineering",
  "Executive / Owner",
  "Other",
];

const USAGE_OPTIONS = [
  "Evaluating Nimbus",
  "Switching from another WMS",
  "Adding to existing stack",
  "Just exploring",
];

const CHANNELS = [
  {
    label: "Sales",
    email: "sales@nimbuswms.com",
    desc: "Pricing, plans, contracts, custom deployments.",
  },
  {
    label: "Support",
    email: "support@nimbuswms.com",
    desc: "Existing customers — bug reports, account questions, training.",
  },
  {
    label: "Security",
    email: "security@nimbuswms.com",
    desc: "Vulnerability reports and responsible disclosure.",
  },
  {
    label: "Press",
    email: "press@nimbuswms.com",
    desc: "Media inquiries, partnership announcements, interviews.",
  },
];

export default function ContactClient() {
  const pageRef = useRef(null);
  const heroRef = useRef(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [submitError, setSubmitError] = useState("");

  const updateField = useCallback((name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => {
      if (!e[name]) return e;
      const next = { ...e };
      delete next[name];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (status === "submitting") return;

      const validationErrors = validateContact(form);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setStatus("submitting");
      setSubmitError("");

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.fieldErrors) setErrors(data.fieldErrors);
          setSubmitError(
            data.error || "Could not send your message. Please try again."
          );
          setStatus("error");
          return;
        }
        setStatus("success");
        setForm(INITIAL_FORM);
      } catch (err) {
        console.error(err);
        setSubmitError(
          "Network error. Please check your connection and try again."
        );
        setStatus("error");
      }
    },
    [form, status]
  );

  /* Animations */
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!heroRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    /* Bracket decorations (Conversion DNA, kept in hero) */
    tl.fromTo(
      `.${styles.heroBracket}`,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.6, stagger: 0.08 },
      0
    );

    tl.fromTo(
      `.${styles.heroEyebrow}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45 },
      0.1
    );

    /* Per-letter headline */
    const letters = heroRef.current.querySelectorAll(`.${styles.heroLetter}`);
    tl.to(
      letters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.75, stagger: 0.025 },
      0.2
    );

    tl.fromTo(
      `.${styles.heroSub}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55 },
      0.6
    );

    /* Section numerals + content stagger on scroll */
    if (!pageRef.current) return;
    const sections = pageRef.current.querySelectorAll(`.${styles.section}`);
    sections.forEach((sec) => {
      const num = sec.querySelector(`.${styles.sectionNum}`);
      const content = sec.querySelectorAll(
        `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.formGrid}, .${styles.channelCard}`
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
            stagger: 0.07,
            ease: "power3.out",
            scrollTrigger: { trigger: sec, start: "top 78%" },
          }
        );
      }
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  /* Per-letter title rendering */
  const renderTitle = () => {
    const parts = [
      { t: "Let's", a: false },
      { t: " ", a: false, isSpace: true },
      { t: "talk.", a: true },
    ];
    return (
      <span className={styles.heroLine}>
        {parts.map((p, pi) => {
          if (p.isSpace) return <span key={pi} className={styles.heroSpace} />;
          return (
            <span key={pi} className="word">
              {p.t.split("").map((c, ci) => (
                <span
                  key={`${pi}-${ci}`}
                  className={`${styles.heroLetter} ${
                    p.a ? styles.heroLetterAccent : ""
                  }`}
                >
                  {c}
                </span>
              ))}
            </span>
          );
        })}
      </span>
    );
  };

  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";

  return (
    <div ref={pageRef} className={styles.page}>
      <Nav />

      {/* ── HERO ── */}
      <section ref={heroRef} className={styles.hero}>
        <span className={`${styles.heroBracket} ${styles.heroBracketTL}`}>
          <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
            <path d="M2 14 V2 H14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <span className={`${styles.heroBracket} ${styles.heroBracketBR}`}>
          <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
            <path d="M26 38 H38 V26" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>

        <div className={styles.heroEyebrow}>Contact</div>
        <h1 className={styles.heroTitle}>{renderTitle()}</h1>
        <p className={styles.heroSub}>
          Tell us about your warehouse. We&apos;ll get back within 4 business
          hours, usually faster. No bots, no qualification calls — just a real
          engineer or operator.
        </p>
      </section>

      {/* ── § 01 — SEND US A NOTE ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          01
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Send us a note</div>
          <h2 className={styles.sectionTitle}>One form. A real reply, fast.</h2>
          <p className={styles.sectionDesc}>
            Everything you tell us goes straight to the team. We don&apos;t
            route through a CRM, we don&apos;t score you, and we won&apos;t
            drip-email you.
          </p>

          {isSuccess ? (
            <div className={styles.successCard}>
              <div className={styles.successHead}>
                <span className={styles.successDot} />
                <span className={styles.successLabel}>Message sent</span>
              </div>
              <p className={styles.successText}>
                Thanks, {form.name || "we"}&apos;ve got it. You&apos;ll hear
                back within 4 business hours. Check spam if you don&apos;t see
                us — we send from <strong>hello@nimbuswms.com</strong>.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className={styles.successReset}
              >
                Send another →
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              autoComplete="on"
              className={styles.formGrid}
            >
              {/* Honeypot */}
              <div className={styles.honeypot} aria-hidden="true">
                <label>
                  Website
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => updateField("website", e.target.value)}
                  />
                </label>
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label htmlFor="c-name" className={styles.fieldLabel}>
                    Name <span className={styles.fieldRequired}>*</span>
                  </label>
                  <input
                    id="c-name"
                    name="name"
                    type="text"
                    placeholder="Jane Smith"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    disabled={isSubmitting}
                    aria-invalid={errors.name ? "true" : "false"}
                    className={`${styles.fieldInput} ${
                      errors.name ? styles.fieldInputError : ""
                    }`}
                  />
                  {errors.name && (
                    <div className={styles.fieldErr}>{errors.name}</div>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="c-email" className={styles.fieldLabel}>
                    Email <span className={styles.fieldRequired}>*</span>
                  </label>
                  <input
                    id="c-email"
                    name="email"
                    type="email"
                    placeholder="jane@company.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    disabled={isSubmitting}
                    aria-invalid={errors.email ? "true" : "false"}
                    className={`${styles.fieldInput} ${
                      errors.email ? styles.fieldInputError : ""
                    }`}
                  />
                  {errors.email && (
                    <div className={styles.fieldErr}>{errors.email}</div>
                  )}
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label htmlFor="c-company" className={styles.fieldLabel}>
                    Company
                  </label>
                  <input
                    id="c-company"
                    name="company"
                    type="text"
                    placeholder="Acme Logistics"
                    autoComplete="organization"
                    value={form.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    disabled={isSubmitting}
                    className={styles.fieldInput}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="c-role" className={styles.fieldLabel}>
                    Role
                  </label>
                  <select
                    id="c-role"
                    name="role"
                    value={form.role}
                    onChange={(e) => updateField("role", e.target.value)}
                    disabled={isSubmitting}
                    className={styles.fieldSelect}
                  >
                    <option value="">Choose one…</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="c-usage" className={styles.fieldLabel}>
                  Where are you in the process?
                </label>
                <div className={styles.usageRow}>
                  {USAGE_OPTIONS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => updateField("usage", u)}
                      className={`${styles.usageChip} ${
                        form.usage === u ? styles.usageChipActive : ""
                      }`}
                      disabled={isSubmitting}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="c-message" className={styles.fieldLabel}>
                  Message <span className={styles.fieldRequired}>*</span>
                </label>
                <textarea
                  id="c-message"
                  name="message"
                  placeholder="Tell us about your warehouse — size, current system, what's working, what isn't."
                  rows={5}
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={errors.message ? "true" : "false"}
                  className={`${styles.fieldTextarea} ${
                    errors.message ? styles.fieldInputError : ""
                  }`}
                />
                {errors.message && (
                  <div className={styles.fieldErr}>{errors.message}</div>
                )}
              </div>

              {submitError && (
                <div className={styles.submitErr} role="alert">
                  {submitError}
                </div>
              )}

              <div className={styles.submitRow}>
                <CornerButton
                  type="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  {isSubmitting ? "Sending" : "Send message"}
                </CornerButton>
                <span className={styles.submitNote}>
                  We reply within 4 business hours.
                </span>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ── § 02 — OR PICK A CHANNEL ── */}
      <section className={styles.section}>
        <div className={styles.sectionNum} aria-hidden="true">
          02
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Or pick a channel</div>
          <h2 className={styles.sectionTitle}>
            Direct emails when you need them.
          </h2>
          <p className={styles.sectionDesc}>
            All four go to a real person. We do not have a generic
            &ldquo;info@&rdquo; address.
          </p>

          <div className={styles.channelGrid}>
            {CHANNELS.map((c) => (
              <a
                key={c.label}
                href={`mailto:${c.email}`}
                className={styles.channelCard}
              >
                <div className={styles.channelLabel}>{c.label}</div>
                <div className={styles.channelEmail}>{c.email}</div>
                <p className={styles.channelDesc}>{c.desc}</p>
                <span className={styles.channelArrow}>→</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
