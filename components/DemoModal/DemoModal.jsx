"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import gsap from "gsap";
import Logo from "@/components/shared/Logo";
import { validateDemo } from "@/lib/validation";
import styles from "./DemoModal.module.css";

/* ═══════════════════════════════════════════════════════════════════════
   DemoModal — two-column, clean
   ───────────────────────────────────────────────────────────────────────
   LEFT (220px)  Topic selector + brief agenda — visually integrated
                 into the same panel surface as the center (no separate
                 gradient, just a hairline border-right).

   CENTER (1fr)  Topic-aware title/desc, Calendly express card,
                 5-field form.

   Topic selection drives the form heading, Calendly button text, and
   agenda items — all swappable elements cross-fade together when the
   topic changes.

   API contract is unchanged — POST /api/demo with the same form +
   topic + topicLabel payload. DemoContext, validation, and API route
   work as-is.
   ═══════════════════════════════════════════════════════════════════════ */

const COMMENTS_MAX = 2000;

const FIELDS = [
  {
    name: "name",
    label: "Full name",
    type: "text",
    autoComplete: "name",
    required: true,
  },
  {
    name: "email",
    label: "Work email",
    type: "email",
    autoComplete: "email",
    required: true,
  },
  {
    name: "company",
    label: "Company",
    type: "text",
    autoComplete: "organization",
    required: true,
  },
  {
    name: "warehouseSize",
    label: "Warehouse size",
    type: "text",
    required: true,
    hint: "e.g. 50,000 sq ft · 3 sections · 12 staff",
  },
];

/* ─── ICONS ────────────────────────────────────────────────────────── */
const ArrowIcon = ({ size = 12 }) => (
  <svg
    width={size}
    height={size * (10 / 12)}
    viewBox="0 0 12 10"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M1 5H11M8 1L11 5L8 9"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const CalendarIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="2"
      y="3.5"
      width="12"
      height="11"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <path d="M2 6.5H14" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M5.5 1.5V4.5M10.5 1.5V4.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);
const DemoIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <polygon points="10,9 16,12 10,15" fill="currentColor" />
  </svg>
);
const SalesIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="4"
      width="7"
      height="16"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <rect
      x="14"
      y="9"
      width="7"
      height="11"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <line
      x1="3"
      y1="8"
      x2="10"
      y2="8"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <line
      x1="14"
      y1="13"
      x2="21"
      y2="13"
      stroke="currentColor"
      strokeWidth="1.4"
    />
  </svg>
);
const MigrationIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="2"
      y="6"
      width="7"
      height="12"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <rect
      x="15"
      y="6"
      width="7"
      height="12"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <line
      x1="9"
      y1="12"
      x2="14"
      y2="12"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <polyline
      points="12,9 15,12 12,15"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IntegrationIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="18" cy="6" r="2" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.4" />
    <line
      x1="6"
      y1="8"
      x2="6"
      y2="16"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <line
      x1="18"
      y1="8"
      x2="18"
      y2="16"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <line
      x1="8"
      y1="6"
      x2="16"
      y2="6"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <line
      x1="8"
      y1="18"
      x2="16"
      y2="18"
      stroke="currentColor"
      strokeWidth="1.4"
    />
  </svg>
);

const TOPIC_ICONS = {
  demo: DemoIcon,
  sales: SalesIcon,
  migration: MigrationIcon,
  integration: IntegrationIcon,
};

/* ─── TOPIC CONFIG ─────────────────────────────────────────────────────
   Each topic drives the LEFT topic chip + agenda, and the CENTER form
   title/desc + Calendly button label. Switching the topic cross-fades
   all swappable elements in unison.
   ──────────────────────────────────────────────────────────────────── */
const TOPICS = [
  {
    key: "demo",
    chip: "Live demo",
    formTitle: "Request a demo",
    formDesc:
      "Tell us a few details and our team will reach out within 24 hours.",
    bookTitle: "Book a demo slot",
    bookSub: "30 minutes, on your calendar",
    emailLabel: "Live demo",
    agenda: [
      "30-min live walkthrough",
      "Data import from your current system",
      "Mobile scanner app demo",
      "Q&A on rollout & timeline",
    ],
  },
  {
    key: "sales",
    chip: "Enterprise pricing",
    formTitle: "Talk to Sales",
    formDesc:
      "Tell us about your operation and we'll put together a tailored proposal.",
    bookTitle: "Book a pricing call",
    bookSub: "30 minutes with our sales team",
    emailLabel: "Enterprise pricing",
    agenda: [
      "Per-warehouse pricing for your footprint",
      "SSO, roles, and admin controls",
      "Dedicated CSM & onboarding",
      "Contract terms & security review",
    ],
  },
  {
    key: "migration",
    chip: "Migration",
    formTitle: "Plan a migration",
    formDesc:
      "Tell us what you're using today and we'll outline the migration path.",
    bookTitle: "Book a migration call",
    bookSub: "30 minutes with a migration engineer",
    emailLabel: "Migration from another WMS",
    agenda: [
      "Audit of your current WMS data",
      "Concept-by-concept mapping doc",
      "Pilot warehouse & cutover plan",
      "Training plan for floor staff",
    ],
  },
  {
    key: "integration",
    chip: "Custom integration",
    formTitle: "Talk to an engineer",
    formDesc:
      "Tell us about the integration you need and we'll get back within 24 hours.",
    bookTitle: "Book an engineering call",
    bookSub: "30 minutes with the integrations team",
    emailLabel: "Custom integration",
    agenda: [
      "REST + webhook API walkthrough",
      "SDK options and auth model",
      "Build vs partner discussion",
      "Sandbox account & docs",
    ],
  },
];
const TOPIC_BY_KEY = TOPICS.reduce((acc, t) => {
  acc[t.key] = t;
  return acc;
}, {});
const DEFAULT_TOPIC = "demo";
const getTopic = (key) => TOPIC_BY_KEY[key] || TOPIC_BY_KEY[DEFAULT_TOPIC];

const INITIAL_FORM = {
  name: "",
  email: "",
  company: "",
  warehouseSize: "",
  comments: "",
  website: "",
};

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export default function DemoModal({ isOpen, onClose, initialTopic }) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const leftColRef = useRef(null);
  const centerColRef = useRef(null);
  const formRef = useRef(null);
  const successRef = useRef(null);

  const [mounted, setMounted] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");

  /* Topic state — seeded from initialTopic on each open. */
  const [topicKey, setTopicKey] = useState(initialTopic || DEFAULT_TOPIC);
  useEffect(() => {
    if (isOpen) setTopicKey(initialTopic || DEFAULT_TOPIC);
  }, [isOpen, initialTopic]);

  const topic = getTopic(topicKey);

  /* Calendly URL with topic carried as utm_content */
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "";
  const calendlyHref = useMemo(() => {
    if (!calendlyUrl) return "";
    try {
      const url = new URL(calendlyUrl);
      url.searchParams.set("utm_source", "nimbus_site");
      url.searchParams.set("utm_content", topicKey);
      return url.toString();
    } catch {
      return calendlyUrl;
    }
  }, [calendlyUrl, topicKey]);

  const updateField = useCallback((name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => {
      if (!e[name]) return e;
      const next = { ...e };
      delete next[name];
      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors({});
    setStatus("idle");
    setSubmitError("");
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (status === "submitting") return;

      const validationErrors = validateDemo(form);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        const firstErr = Object.keys(validationErrors)[0];
        const el = document.getElementById(`demo-${firstErr}`);
        if (el) el.focus();
        return;
      }

      setStatus("submitting");
      setSubmitError("");
      try {
        const res = await fetch("/api/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            topic: topicKey,
            topicLabel: topic.emailLabel,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.fieldErrors) setErrors(data.fieldErrors);
          setSubmitError(
            data.error || "Could not send your request. Please try again."
          );
          setStatus("error");
          return;
        }
        setStatus("success");
      } catch (err) {
        console.error(err);
        setSubmitError(
          "Network error. Please check your connection and try again."
        );
        setStatus("error");
      }
    },
    [form, status, topicKey, topic.emailLabel]
  );

  /* ── Mount/unmount + open/close animations ────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setAnimatingOut(false);
    } else if (mounted) {
      setAnimatingOut(true);
      const t = setTimeout(() => {
        setMounted(false);
        setAnimatingOut(false);
        resetForm();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isOpen, mounted, resetForm]);

  useEffect(() => {
    if (!mounted) return;
    if (isOpen && !animatingOut) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      )
        .fromTo(
          panelRef.current,
          { scale: 0.96, opacity: 0, y: 16 },
          { scale: 1, opacity: 1, y: 0, duration: 0.45 },
          "-=0.18"
        )
        .fromTo(
          [leftColRef.current, centerColRef.current].filter(Boolean),
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 },
          "-=0.3"
        );
    } else if (animatingOut) {
      const tl = gsap.timeline({ defaults: { ease: "power2.in" } });
      tl.to([leftColRef.current, centerColRef.current].filter(Boolean), {
        opacity: 0,
        y: -8,
        duration: 0.2,
        stagger: 0.04,
      })
        .to(
          panelRef.current,
          { scale: 0.95, opacity: 0, duration: 0.3 },
          "-=0.1"
        )
        .to(backdropRef.current, { opacity: 0, duration: 0.25 }, "-=0.18");
    }
  }, [isOpen, mounted, animatingOut]);

  /* Smooth topic-swap animation */
  const lastTopicRef = useRef(topicKey);
  useEffect(() => {
    if (!mounted) {
      lastTopicRef.current = topicKey;
      return;
    }
    if (lastTopicRef.current === topicKey) return;
    lastTopicRef.current = topicKey;
    const targets = document.querySelectorAll(`.${styles.topicSwap}`);
    if (targets.length === 0) return;
    gsap.fromTo(
      targets,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.02 }
    );
  }, [topicKey, mounted]);

  /* Escape key */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  /* Success view intro animation */
  useEffect(() => {
    if (status === "success" && successRef.current) {
      gsap.fromTo(
        successRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        successRef.current.querySelectorAll("[data-success-item]"),
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.15,
        }
      );
    }
  }, [status]);

  if (!mounted) return null;

  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";

  const isFieldValid = (name) => {
    const val = (form[name] || "").trim();
    if (!val) return false;
    if (errors[name]) return false;
    if (name === "email") {
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
    }
    return true;
  };

  return (
    <div
      ref={backdropRef}
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      <div
        ref={panelRef}
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gold corner brackets */}
        <div
          className={`${styles.cornerBracket} ${styles.cornerTL}`}
          aria-hidden="true"
        />
        <div
          className={`${styles.cornerBracket} ${styles.cornerBR}`}
          aria-hidden="true"
        />

        {/* Close button */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close dialog"
          type="button"
        >
          ✕
        </button>

        {isSuccess ? (
          /* ═══════════════════════════════════════════════════════════
             SUCCESS VIEW — single-column, centered
             ═════════════════════════════════════════════════════════ */
          <div ref={successRef} className={styles.successWrap}>
            <div className={styles.successIcon} data-success-item>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle
                  cx="16"
                  cy="16"
                  r="15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 16.5L14.5 21L22 12.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={styles.successTitle} data-success-item>
              Thanks{form.name ? `, ${form.name.split(" ")[0]}` : ""}.
            </div>
            <p className={styles.successDesc} data-success-item>
              We received your request. Our team will reach out within 24 hours.
            </p>
            {calendlyHref ? (
              <>
                <div className={styles.successDivider} data-success-item>
                  <span>or skip the wait</span>
                </div>
                <a
                  href={calendlyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.calendlyBtn}
                  data-success-item
                >
                  Book a time directly
                  <span style={{ marginLeft: 8, display: "inline-flex" }}>
                    <ArrowIcon />
                  </span>
                </a>
              </>
            ) : null}
            <button
              className={styles.successClose}
              onClick={onClose}
              data-success-item
              type="button"
            >
              Close
            </button>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════
             MAIN VIEW — two columns
             ═════════════════════════════════════════════════════════ */
          <>
            {/* ─── LEFT — topic + agenda ────────────────────────────── */}
            <div ref={leftColRef} className={styles.leftCol}>
              <div className={styles.logoMark}>
                <Logo size={28} />
                <span className={styles.logoMarkText}>Nimbus</span>
              </div>

              <div className={styles.leftSection}>
                <span className={styles.eyebrow}>Topic</span>
                <ul
                  role="radiogroup"
                  aria-label="Meeting topic"
                  className={styles.topicList}
                >
                  {TOPICS.map((t) => {
                    const Icon = TOPIC_ICONS[t.key];
                    const active = topicKey === t.key;
                    return (
                      <li key={t.key}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setTopicKey(t.key)}
                          className={`${styles.topicItem} ${
                            active ? styles.topicItemActive : ""
                          }`}
                        >
                          <span className={styles.topicIcon}>
                            <Icon />
                          </span>
                          <span className={styles.topicName}>{t.chip}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div
                className={`${styles.leftSection} ${styles.topicSwap}`}
                key={`agenda-${topicKey}`}
              >
                <span className={styles.eyebrow}>We'll cover</span>
                <ul className={styles.agendaList}>
                  {topic.agenda.map((item, i) => (
                    <li key={i} className={styles.agendaItem}>
                      <span
                        className={styles.agendaItemDot}
                        aria-hidden="true"
                      />
                      <span className={styles.agendaItemText}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ─── CENTER — form ─────────────────────────────────────── */}
            <div ref={centerColRef} className={styles.centerCol}>
              <div className={styles.formHeader}>
                <h2
                  id="demo-modal-title"
                  className={`${styles.formTitle} ${styles.topicSwap}`}
                  key={`title-${topicKey}`}
                >
                  {topic.formTitle}
                </h2>
                <p
                  className={`${styles.formDesc} ${styles.topicSwap}`}
                  key={`desc-${topicKey}`}
                >
                  {topic.formDesc}
                </p>
              </div>

              {/* Calendly express card */}
              {calendlyHref ? (
                <a
                  href={calendlyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.calendlyCard} ${styles.topicSwap}`}
                  key={`cal-${topicKey}`}
                >
                  <span className={styles.calendlyCardIcon}>
                    <CalendarIcon />
                  </span>
                  <span className={styles.calendlyCardText}>
                    <span className={styles.calendlyCardTitle}>
                      {topic.bookTitle}
                    </span>
                    <span className={styles.calendlyCardSub}>
                      {topic.bookSub}
                    </span>
                  </span>
                  <span className={styles.calendlyCardArrow}>
                    <ArrowIcon size={14} />
                  </span>
                </a>
              ) : null}

              <div className={styles.formDivider}>
                <span>or share details below</span>
              </div>

              <form
                ref={formRef}
                onSubmit={handleSubmit}
                noValidate
                autoComplete="on"
                className={styles.form}
              >
                {/* Honeypot */}
                <div className={styles.honeypot} aria-hidden="true">
                  <label htmlFor="demo-website">Website</label>
                  <input
                    id="demo-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => updateField("website", e.target.value)}
                  />
                </div>

                {FIELDS.map((field) => {
                  const valid = isFieldValid(field.name);
                  const err = errors[field.name];
                  return (
                    <div key={field.name} className={styles.fieldGroup}>
                      <div
                        className={`${styles.fieldShell} ${
                          err ? styles.fieldShellError : ""
                        } ${valid ? styles.fieldShellValid : ""}`}
                      >
                        <input
                          id={`demo-${field.name}`}
                          name={field.name}
                          type={field.type}
                          autoComplete={field.autoComplete || "off"}
                          placeholder=" "
                          value={form[field.name]}
                          onChange={(e) =>
                            updateField(field.name, e.target.value)
                          }
                          disabled={isSubmitting}
                          aria-invalid={err ? "true" : "false"}
                          aria-describedby={
                            err
                              ? `demo-${field.name}-error`
                              : field.hint
                              ? `demo-${field.name}-hint`
                              : undefined
                          }
                          className={styles.fieldInput}
                        />
                        <label
                          htmlFor={`demo-${field.name}`}
                          className={styles.floatLabel}
                        >
                          {field.label}
                          {field.required ? (
                            <span className={styles.req}>*</span>
                          ) : null}
                        </label>
                        {valid ? (
                          <span
                            className={styles.fieldCheck}
                            data-show="true"
                            aria-hidden="true"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                d="M4 8.5L7 11.5L12.5 5.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ) : null}
                      </div>
                      {err ? (
                        <span
                          id={`demo-${field.name}-error`}
                          className={styles.fieldError}
                          role="alert"
                        >
                          {err}
                        </span>
                      ) : field.hint ? (
                        <span
                          id={`demo-${field.name}-hint`}
                          className={styles.fieldHint}
                        >
                          {field.hint}
                        </span>
                      ) : null}
                    </div>
                  );
                })}

                {/* Comments */}
                <div className={styles.fieldGroup}>
                  <div
                    className={`${styles.fieldShell} ${
                      errors.comments ? styles.fieldShellError : ""
                    }`}
                  >
                    <textarea
                      id="demo-comments"
                      name="comments"
                      placeholder=" "
                      value={form.comments}
                      onChange={(e) => updateField("comments", e.target.value)}
                      disabled={isSubmitting}
                      maxLength={COMMENTS_MAX}
                      rows={3}
                      className={`${styles.fieldInput} ${styles.fieldTextarea}`}
                    />
                    <label
                      htmlFor="demo-comments"
                      className={styles.floatLabel}
                    >
                      Anything else? (optional)
                    </label>
                  </div>
                  <div className={styles.fieldMetaRow}>
                    {errors.comments ? (
                      <span className={styles.fieldError}>
                        {errors.comments}
                      </span>
                    ) : (
                      <span className={styles.fieldHint}>
                        Integrations you use, pain points, timeline…
                      </span>
                    )}
                    <span className={styles.charCount}>
                      {form.comments.length}/{COMMENTS_MAX}
                    </span>
                  </div>
                </div>

                {submitError ? (
                  <div className={styles.submitError} role="alert">
                    {submitError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                  aria-busy={isSubmitting ? "true" : "false"}
                >
                  <span className={styles.submitBtnLabel}>
                    {isSubmitting ? (
                      <>
                        <span className={styles.spinner} aria-hidden="true" />
                        Sending…
                      </>
                    ) : (
                      <>
                        Send request
                        <span className={styles.submitArrow} aria-hidden="true">
                          <ArrowIcon />
                        </span>
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
