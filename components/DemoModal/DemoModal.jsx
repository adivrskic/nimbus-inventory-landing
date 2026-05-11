"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import Logo from "@/components/shared/Logo";
import { validateDemo } from "@/lib/validation";
import styles from "./DemoModal.module.css";

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

const STATS = [
  { val: "<200ms", label: "Scan speed" },
  { val: "70%", label: "Time saved" },
  { val: "99.9%", label: "Uptime" },
];

const COMMENTS_MAX = 2000;

const INITIAL_FORM = {
  name: "",
  email: "",
  company: "",
  warehouseSize: "",
  comments: "",
  website: "",
};

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path
      d="M4 8.5L7 11.5L12.5 5.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function DemoModal({ isOpen, onClose }) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const successRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");

  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "";

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
          body: JSON.stringify(form),
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
    [form, status]
  );

  // Mount/unmount lifecycle
  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  // Intro animation — uses fromTo so elements default to visible if JS hiccups
  useEffect(() => {
    if (!mounted || !isOpen || !backdropRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(backdropRef.current, { opacity: 1, duration: 0.4 }).to(
      panelRef.current,
      { scale: 1, opacity: 1, duration: 0.6, ease: "power4.out" },
      "-=0.3"
    );

    const children = contentRef.current?.children;
    if (children && children.length) {
      tl.fromTo(
        children,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.05 },
        "-=0.3"
      );
    }
  }, [mounted, isOpen]);

  // Outro animation — animates whichever view is currently mounted (form OR success)
  // so closing from the success screen feels identical to closing from the form.
  useEffect(() => {
    if (!isOpen && mounted && !animatingOut) {
      setAnimatingOut(true);
      const tl = gsap.timeline({
        defaults: { ease: "power3.in" },
        onComplete: () => {
          setMounted(false);
          setAnimatingOut(false);
          resetForm();
        },
      });

      // Pick whichever view is currently rendered
      const formChildren = contentRef.current?.children;
      const successItems = successRef.current?.querySelectorAll(
        "[data-success-item]"
      );
      const target =
        formChildren && formChildren.length
          ? formChildren
          : successItems && successItems.length
          ? successItems
          : null;

      if (target) {
        tl.to(target, {
          y: -16,
          opacity: 0,
          duration: 0.22,
          stagger: 0.02,
        });
      }

      tl.to(
        panelRef.current,
        { scale: 0.95, opacity: 0, duration: 0.35 },
        "-=0.15"
      ).to(backdropRef.current, { opacity: 0, duration: 0.3 }, "-=0.2");
    }
  }, [isOpen, mounted, animatingOut, resetForm]);

  // Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Intro animation for the success view (when it first appears after submit)
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
        <div className={styles.left}>
          <div className={styles.leftGrid} />
          <div style={{ marginBottom: 32 }}>
            <Logo size={80} />
          </div>
          <h3 className={styles.leftTitle} id="demo-modal-title">
            See Nimbus in action
          </h3>
          <p className={styles.leftDesc}>
            Get a personalized walkthrough tailored to your warehouse
            operations.
          </p>
          <div className={styles.stats}>
            {STATS.map((s, i) => (
              <div key={i}>
                <div className={styles.statVal}>{s.val}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
            type="button"
          >
            ✕
          </button>

          {isSuccess ? (
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
                We received your request. Our team will reach out within 24
                hours.
              </p>

              {calendlyUrl ? (
                <>
                  <div className={styles.successDivider} data-success-item>
                    <span>or skip the wait</span>
                  </div>
                  <a
                    href={calendlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.calendlyBtn}
                    data-success-item
                  >
                    Book a time directly
                    <svg
                      width="12"
                      height="10"
                      viewBox="0 0 12 10"
                      fill="none"
                      style={{ marginLeft: 8 }}
                    >
                      <path
                        d="M1 5H11M8 1L11 5L8 9"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
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
            <form
              ref={contentRef}
              onSubmit={handleSubmit}
              noValidate
              autoComplete="on"
            >
              <div className={styles.formTitle}>Request a demo</div>
              <p className={styles.formDesc}>
                Fill in the details and our team will reach out within 24 hours.
              </p>

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

              {FIELDS.map((field) => {
                const err = errors[field.name];
                const valid = isFieldValid(field.name);
                const id = `demo-${field.name}`;
                return (
                  <div key={field.name} className={styles.fieldGroup}>
                    <div
                      className={`${styles.fieldShell} ${
                        err ? styles.fieldShellError : ""
                      } ${valid ? styles.fieldShellValid : ""}`}
                    >
                      <input
                        id={id}
                        name={field.name}
                        type={field.type}
                        placeholder=" "
                        autoComplete={field.autoComplete}
                        className={styles.fieldInput}
                        value={form[field.name]}
                        onChange={(e) =>
                          updateField(field.name, e.target.value)
                        }
                        disabled={isSubmitting}
                        required={field.required}
                        aria-required={field.required ? "true" : undefined}
                        aria-invalid={err ? "true" : "false"}
                        aria-describedby={
                          err
                            ? `${id}-error`
                            : field.hint
                            ? `${id}-hint`
                            : undefined
                        }
                      />
                      <label className={styles.floatLabel} htmlFor={id}>
                        {field.label}
                        {field.required ? (
                          <span className={styles.req} aria-hidden="true">
                            *
                          </span>
                        ) : null}
                      </label>
                      <div
                        className={styles.fieldCheck}
                        aria-hidden="true"
                        data-show={valid ? "true" : "false"}
                      >
                        <CheckIcon />
                      </div>
                    </div>
                    {err ? (
                      <div id={`${id}-error`} className={styles.fieldError}>
                        {err}
                      </div>
                    ) : field.hint ? (
                      <div id={`${id}-hint`} className={styles.fieldHint}>
                        {field.hint}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <div className={styles.fieldGroup}>
                <div
                  className={`${styles.fieldShell} ${
                    errors.comments ? styles.fieldShellError : ""
                  } ${isFieldValid("comments") ? styles.fieldShellValid : ""}`}
                >
                  <textarea
                    id="demo-comments"
                    name="comments"
                    placeholder=" "
                    className={`${styles.fieldInput} ${styles.fieldTextarea}`}
                    rows={3}
                    maxLength={COMMENTS_MAX}
                    value={form.comments}
                    onChange={(e) => updateField("comments", e.target.value)}
                    disabled={isSubmitting}
                    required
                    aria-required="true"
                    aria-invalid={errors.comments ? "true" : "false"}
                    aria-describedby={
                      errors.comments
                        ? "demo-comments-error"
                        : "demo-comments-meta"
                    }
                  />
                  <label className={styles.floatLabel} htmlFor="demo-comments">
                    Comments
                    <span className={styles.req} aria-hidden="true">
                      *
                    </span>
                  </label>
                </div>
                <div id="demo-comments-meta" className={styles.fieldMetaRow}>
                  {errors.comments ? (
                    <span
                      id="demo-comments-error"
                      className={styles.fieldError}
                    >
                      {errors.comments}
                    </span>
                  ) : (
                    <span className={styles.fieldHint}>
                      Tell us about your operation, challenges, or questions
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
                      Submit request
                      <svg
                        width="14"
                        height="10"
                        viewBox="0 0 14 10"
                        fill="none"
                        className={styles.submitArrow}
                        aria-hidden="true"
                      >
                        <path
                          d="M1 5H13M9 1L13 5L9 9"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </span>
              </button>

              <p className={styles.footnote}>
                <span className={styles.req}>*</span> Required · No commitment ·
                Usually responds within 4 hours
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
