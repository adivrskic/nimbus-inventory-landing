"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import SplitText from "@/components/shared/SplitText";
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
  "Evaluating Nautilus",
  "Switching from another WMS",
  "Adding to existing stack",
  "Just exploring",
];

/* ═══════════════════════════════════════════════════════════════════════
   CUSTOM SELECT
   ───────────────────────────────────────────────────────────────────────
   Button-triggered listbox that matches the rest of the form styling. The
   button retains focus; aria-activedescendant tells screen readers which
   option is "active" via the keyboard. Outside-click closes; Esc closes
   and returns focus to the button.

   Keyboard:
     Closed:  Enter / Space / ArrowDown / ArrowUp  → open
     Open:    ArrowDown / ArrowUp                  → navigate options
              Home / End                           → first / last
              Enter / Space                        → pick highlighted
              Escape                               → close
              Tab                                  → close + advance focus
   ═══════════════════════════════════════════════════════════════════════ */
function CustomSelect({
  id,
  labelId,
  value,
  onChange,
  options,
  placeholder = "Choose one…",
  disabled = false,
  hasError = false,
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);

  /* Close when clicking anywhere outside the wrapper. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  /* When opening, jump the highlight to the current value (if any) so the
     user lands on what they already picked. Otherwise start at the top. */
  useEffect(() => {
    if (open) {
      const i = value ? options.indexOf(value) : -1;
      setHighlight(i >= 0 ? i : 0);
    }
  }, [open, value, options]);

  const selectOption = (opt) => {
    onChange(opt);
    setOpen(false);
    /* Return focus to the button so keyboard users don't lose their place. */
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  const handleKey = (e) => {
    if (disabled) return;

    /* Let Tab close the menu and move on naturally — don't trap focus. */
    if (e.key === "Tab") {
      if (open) setOpen(false);
      return;
    }

    if (!open) {
      if (
        e.key === "Enter" ||
        e.key === " " ||
        e.key === "ArrowDown" ||
        e.key === "ArrowUp"
      ) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    /* Open state */
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setHighlight(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHighlight(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlight >= 0) selectOption(options[highlight]);
    }
  };

  const listId = `${id}-listbox`;

  return (
    <div ref={wrapRef} className={styles.selectWrap}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKey}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        aria-activedescendant={
          open && highlight >= 0 ? `${id}-opt-${highlight}` : undefined
        }
        className={`${styles.selectButton} ${
          open ? styles.selectButtonOpen : ""
        } ${hasError ? styles.selectButtonError : ""}`}
      >
        <span className={value ? styles.selectValue : styles.selectPlaceholder}>
          {value || placeholder}
        </span>
        <svg
          className={`${styles.selectChevron} ${
            open ? styles.selectChevronOpen : ""
          }`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <ul
        id={listId}
        role="listbox"
        aria-labelledby={labelId}
        className={`${styles.selectList} ${open ? styles.selectListOpen : ""}`}
      >
        {options.map((opt, i) => (
          <li
            key={opt}
            id={`${id}-opt-${i}`}
            role="option"
            aria-selected={value === opt}
            onMouseEnter={() => setHighlight(i)}
            onMouseDown={(e) => {
              /* Mousedown (not click) so we beat the wrapper's mousedown
                 outside-click detection without race conditions. */
              e.preventDefault();
              selectOption(opt);
            }}
            className={`${styles.selectOption} ${
              i === highlight ? styles.selectOptionHighlight : ""
            } ${value === opt ? styles.selectOptionSelected : ""}`}
          >
            {opt}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────── */
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

  /* Full reset for the "Send another" path. Wipes form fields AND
     errors AND submitError AND status — previously this was just
     `setStatus("idle")`, which left stale validation errors and any
     last submitError lingering when the form came back into view. */
  const handleReset = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitError("");
    setStatus("idle");
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
          body: JSON.stringify({
            ...form,
            source_url:
              typeof window !== "undefined"
                ? window.location.pathname
                : "/contact",
          }),
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
        /* Success path also wipes form data + errors so if the user
           clicks "Send another" the form starts clean. handleReset
           handles all that — we just don't reset status here because
           we want to land on the success card. */
        setForm(INITIAL_FORM);
        setErrors({});
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

  /* Animations.
     The section-numeral animation block from before is kept structurally
     but is now no-op for this page because the .sectionNum element is
     gone — `if (num)` guards against that. The content stagger still
     finds .sectionLabel/.sectionTitle/.sectionDesc/.formGrid and runs. */
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

    /* Section content stagger on scroll. No more numeral selector since
       the editorial 01 has been removed — the if(num) guard makes that
       safe. .channelCard was also dropped from the list because the
       channel grid section is gone. */
    if (!pageRef.current) return;
    const sections = pageRef.current.querySelectorAll(`.${styles.section}`);
    sections.forEach((sec) => {
      const num = sec.querySelector(`.${styles.sectionNum}`);
      const content = sec.querySelectorAll(
        `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.formGrid}`
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

  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";

  return (
    <div ref={pageRef} className={styles.page}>
      {/* ── HERO ── */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroEyebrow}>Contact</div>
        <h1 className={styles.heroTitle}>
          <SplitText
            text="Let's talk."
            accentWord="talk"
            classNames={{
              line: styles.heroLine,
              letter: styles.heroLetter,
              accent: styles.heroLetterAccent,
              space: styles.heroSpace,
            }}
          />
        </h1>
        <p className={styles.heroSub}>
          Tell us about your warehouse. We&apos;ll get back within 4 business
          hours, usually faster. No bots, no qualification calls — just a real
          engineer or operator.
        </p>
      </section>

      {/* ── SEND US A NOTE ── */}
      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Send us a note</div>
          <h2 className={styles.sectionTitle}>What&apos;s on your mind?</h2>
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
                Thanks — we&apos;ve got it. You&apos;ll hear back within 4
                business hours. Check spam if you don&apos;t see us — we send
                from <strong>hello@nautilusinventory.com</strong>.
              </p>
              <button
                type="button"
                onClick={handleReset}
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
                  {/* aria-describedby points to the error div's id when
                      present, so screen readers announce "Name, required,
                      invalid entry, [error message]" on focus. The error
                      div carries role="alert" so the message announces
                      immediately when it appears. WCAG 3.3.1 + 1.3.1. */}
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
                    aria-describedby={errors.name ? "c-name-error" : undefined}
                    className={`${styles.fieldInput} ${
                      errors.name ? styles.fieldInputError : ""
                    }`}
                  />
                  {errors.name && (
                    <div
                      id="c-name-error"
                      role="alert"
                      className={styles.fieldErr}
                    >
                      {errors.name}
                    </div>
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
                    aria-describedby={
                      errors.email ? "c-email-error" : undefined
                    }
                    className={`${styles.fieldInput} ${
                      errors.email ? styles.fieldInputError : ""
                    }`}
                  />
                  {errors.email && (
                    <div
                      id="c-email-error"
                      role="alert"
                      className={styles.fieldErr}
                    >
                      {errors.email}
                    </div>
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
                  <label id="c-role-label" className={styles.fieldLabel}>
                    Role
                  </label>
                  <CustomSelect
                    id="c-role"
                    labelId="c-role-label"
                    value={form.role}
                    onChange={(v) => updateField("role", v)}
                    options={ROLES}
                    placeholder="Choose one…"
                    disabled={isSubmitting}
                  />
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
                  aria-describedby={
                    errors.message ? "c-message-error" : undefined
                  }
                  className={`${styles.fieldTextarea} ${
                    errors.message ? styles.fieldInputError : ""
                  }`}
                />
                {errors.message && (
                  <div
                    id="c-message-error"
                    role="alert"
                    className={styles.fieldErr}
                  >
                    {errors.message}
                  </div>
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

      <Footer />
    </div>
  );
}
