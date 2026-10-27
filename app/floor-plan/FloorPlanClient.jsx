"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { resetScroll } from "@/lib/resetScroll";
import Footer from "@/components/Footer/Footer";
import CornerButton from "@/components/shared/CornerButton";
import SplitText from "@/components/shared/SplitText";
import { useDemo } from "@/lib/DemoContext";
import { validateFloorPlan } from "@/lib/validation";
import { trackLead, trackLeadError } from "@/lib/analytics";
/* Shares the contact page's form system so the two forms look and behave
   the same; FloorPlan.module.css adds only the file picker and the list. */
import styles from "@/app/contact/Contact.module.css";
import fp from "./FloorPlan.module.css";

/* Mirrors the API's limit (app/api/floor-plan/route.js). */
const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp";
/* The API sniffs the bytes; this only saves uploading the wrong file first.
   A dropped file skips the input's accept list, and some arrive with an
   empty MIME type, so the extension counts too. */
const OK_TYPE = /^(application\/pdf|image\/(png|jpeg|webp))$/;
const OK_EXT = /\.(pdf|png|jpe?g|webp)$/i;

const INITIAL_FORM = {
  name: "",
  email: "",
  company: "",
  notes: "",
  website: "", // honeypot
};

/* What the review covers. A person reads each plan, so this is a list of
   what they look at — not results anyone has measured. */
const LOOK_FOR = [
  "Pick paths that double back or cross the floor",
  "Fast movers stored far from packing and shipping",
  "Aisles and zones that could be grouped better",
  "Where receiving and putaway get in each other's way",
];

export default function FloorPlanClient() {
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const { openDemo } = useDemo();

  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [submitError, setSubmitError] = useState("");
  const [sentTo, setSentTo] = useState("");

  const clearError = useCallback((name) => {
    setErrors((e) => {
      if (!e[name]) return e;
      const next = { ...e };
      delete next[name];
      return next;
    });
  }, []);

  const updateField = useCallback(
    (name, value) => {
      setForm((f) => ({ ...f, [name]: value }));
      clearError(name);
    },
    [clearError]
  );

  const pickFile = useCallback(
    (f) => {
      clearError("file");
      if (!f) return;
      if (!OK_TYPE.test(f.type) && !OK_EXT.test(f.name)) {
        setFile(null);
        setErrors((e) => ({
          ...e,
          file: "Upload a PDF, PNG, JPG, or WebP file.",
        }));
        return;
      }
      if (f.size > MAX_BYTES) {
        setFile(null);
        setErrors((e) => ({
          ...e,
          file: "That file is over 4 MB. Try a PDF export or a smaller image.",
        }));
        return;
      }
      setFile(f);
    },
    [clearError]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (status === "submitting") return;

      const validationErrors = validateFloorPlan(form);
      // Keep a rejected pick's reason rather than "attach" over it.
      if (!file) validationErrors.file = errors.file || "Attach your floor plan.";
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        trackLeadError({
          leadType: "floor_plan",
          reason: `invalid:${Object.keys(validationErrors).join(",")}`,
        });
        return;
      }

      setStatus("submitting");
      setSubmitError("");

      const body = new FormData();
      body.append("name", form.name);
      body.append("email", form.email);
      body.append("company", form.company);
      body.append("notes", form.notes);
      body.append("website", form.website);
      body.append("source_url", window.location.pathname);
      body.append("file", file);

      try {
        const res = await fetch("/api/floor-plan", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.fieldErrors) setErrors(data.fieldErrors);
          setSubmitError(
            data.error || "Couldn't send your plan. Please try again."
          );
          setStatus("error");
          trackLeadError({ leadType: "floor_plan", reason: `http_${res.status}` });
          return;
        }
        /* A filled honeypot is a bot the API silently dropped. */
        if (!form.website) {
          trackLead({ leadType: "floor_plan", submissionId: data.submissionId });
        }
        setSentTo(form.email);
        setForm(INITIAL_FORM);
        setFile(null);
        setErrors({});
        setStatus("success");
      } catch (err) {
        console.error(err);
        setSubmitError(
          "Network error. Please check your connection and try again."
        );
        setStatus("error");
        trackLeadError({ leadType: "floor_plan", reason: "network" });
      }
    },
    [form, file, status, errors.file]
  );

  /* ── Animations — the contact page's intro + gated reveal ────────────
     Same stylesheet, so the same elements start at opacity 0 and need the
     same choreography: eyebrow → title letters → subtitle, with the form
     section's reveal queued behind the intro (it's in view on load). */
  useEffect(() => {
    resetScroll();
    if (!heroRef.current) return;

    let cancelled = false;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        gsap.set(heroRef.current.querySelectorAll(`.${styles.heroLetter}`), {
          opacity: 1,
          y: "0%",
          rotateX: 0,
        });
        gsap.set(
          heroRef.current.querySelectorAll(
            `.${styles.heroEyebrow}, .${styles.heroSub}`
          ),
          { opacity: 1, y: 0 }
        );
        if (pageRef.current) {
          gsap.set(
            pageRef.current.querySelectorAll(
              `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.formGrid}`
            ),
            { opacity: 1, x: 0, y: 0 }
          );
        }
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(
        `.${styles.heroEyebrow}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.3 },
        0
      );

      const letters = heroRef.current.querySelectorAll(
        `.${styles.heroLetter}`
      );
      tl.to(
        letters,
        { opacity: 1, y: "0%", rotateX: 0, duration: 0.55, stagger: 0.018 },
        ">-0.05"
      );

      tl.fromTo(
        `.${styles.heroSub}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.42 },
        ">-0.2"
      );

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
        if (!trigger) return;
        const tween = gsap.fromTo(targets, fromVars, {
          ...toVars,
          paused: true,
        });
        const release = () => runWhenIntroDone(() => tween.play());
        /* Same clamp-boundary handling as the contact page: an element in
           view on load sits exactly on its trigger start, where onEnter
           never fires — check scroll() >= start directly. */
        const st = ScrollTrigger.create({
          trigger,
          start,
          once: true,
          onEnter: release,
          onRefresh: (self) => self.scroll() >= self.start && release(),
        });
        if (st.scroll() >= st.start) release();
      };

      if (!pageRef.current) return;
      pageRef.current.querySelectorAll(`.${styles.section}`).forEach((sec) => {
        const content = sec.querySelectorAll(
          `.${styles.sectionLabel}, .${styles.sectionTitle}, .${styles.sectionDesc}, .${styles.formGrid}`
        );
        if (content.length > 0) {
          gatedReveal(
            content,
            { opacity: 0, y: 12 },
            {
              opacity: 1,
              y: 0,
              duration: 0.42,
              stagger: 0.05,
              ease: "power3.out",
            },
            sec,
            "clamp(top 90%)"
          );
        }
      });
    });

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, []);

  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";
  const kb = file ? Math.max(1, Math.round(file.size / 1024)) : 0;

  return (
    <div ref={pageRef} className={styles.page}>
      {/* ── HERO ── */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroEyebrow}>Floor plan review</div>
        <h1 className={styles.heroTitle}>
          <SplitText
            text="Get your floor charted."
            accentWord="charted"
            classNames={{
              line: styles.heroLine,
              letter: styles.heroLetter,
              accent: styles.heroLetterAccent,
              space: styles.heroSpace,
            }}
          />
        </h1>
        <p className={styles.heroSub}>
          Send us your warehouse floor plan. We&apos;ll review the layout and
          email you notes on pick paths, slotting, and flow. It&apos;s free,
          and there&apos;s no call required.
        </p>
      </section>

      {/* ── FORM ── */}
      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Send your plan</div>
          <h2 className={styles.sectionTitle}>What we&apos;ll look at</h2>
          <div className={styles.sectionDesc}>
            <ul className={fp.lookFor}>
              {LOOK_FOR.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {isSuccess ? (
            <div className={styles.successCard}>
              <div className={styles.successHead}>
                <span className={styles.successDot} />
                <span className={styles.successLabel}>Plan received</span>
              </div>
              <p className={styles.successText}>
                Thanks — we&apos;ve got your floor plan. We&apos;ll email our
                notes to <strong>{sentTo}</strong>. Check spam if you don&apos;t
                see us.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className={styles.successReset}
              >
                Send another plan →
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
                  <label htmlFor="fp-name" className={styles.fieldLabel}>
                    Name <span className={styles.fieldRequired}>*</span>
                  </label>
                  <input
                    id="fp-name"
                    name="name"
                    type="text"
                    placeholder="Jane Smith"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    disabled={isSubmitting}
                    aria-invalid={errors.name ? "true" : "false"}
                    aria-describedby={errors.name ? "fp-name-error" : undefined}
                    className={`${styles.fieldInput} ${
                      errors.name ? styles.fieldInputError : ""
                    }`}
                  />
                  {errors.name && (
                    <div id="fp-name-error" role="alert" className={styles.fieldErr}>
                      {errors.name}
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="fp-email" className={styles.fieldLabel}>
                    Email <span className={styles.fieldRequired}>*</span>
                  </label>
                  <input
                    id="fp-email"
                    name="email"
                    type="email"
                    placeholder="jane@company.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    disabled={isSubmitting}
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={errors.email ? "fp-email-error" : undefined}
                    className={`${styles.fieldInput} ${
                      errors.email ? styles.fieldInputError : ""
                    }`}
                  />
                  {errors.email && (
                    <div id="fp-email-error" role="alert" className={styles.fieldErr}>
                      {errors.email}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="fp-company" className={styles.fieldLabel}>
                  Company
                </label>
                <input
                  id="fp-company"
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
                <span className={styles.fieldLabel}>
                  Floor plan <span className={styles.fieldRequired}>*</span>
                </span>
                <label
                  htmlFor="fp-file"
                  className={`${fp.drop} ${dragging ? fp.dropActive : ""} ${
                    file ? fp.dropHasFile : ""
                  } ${errors.file ? fp.dropError : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    pickFile(e.dataTransfer.files?.[0] || null);
                  }}
                >
                  <input
                    id="fp-file"
                    name="file"
                    type="file"
                    accept={ACCEPT}
                    className={fp.fileInput}
                    onChange={(e) => pickFile(e.target.files?.[0] || null)}
                    disabled={isSubmitting}
                    aria-invalid={errors.file ? "true" : "false"}
                    aria-describedby={errors.file ? "fp-file-error" : "fp-file-hint"}
                  />
                  <span className={fp.dropTitle}>
                    {file ? file.name : "Choose a file or drop it here"}
                  </span>
                  <span id="fp-file-hint" className={fp.dropHint}>
                    {file
                      ? `${kb} KB · click to change`
                      : "PDF, PNG, JPG, or WebP · up to 4 MB"}
                  </span>
                </label>
                {errors.file && (
                  <div id="fp-file-error" role="alert" className={styles.fieldErr}>
                    {errors.file}
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="fp-notes" className={styles.fieldLabel}>
                  Anything we should know?
                </label>
                <textarea
                  id="fp-notes"
                  name="notes"
                  placeholder="Rough SKU count, what you pick most, what's slowing the floor down."
                  rows={4}
                  maxLength={2000}
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  disabled={isSubmitting}
                  className={styles.fieldTextarea}
                />
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
                  {isSubmitting ? "Sending" : "Send floor plan"}
                </CornerButton>
                <span className={styles.submitNote}>
                  Free · used only for this review
                </span>
              </div>
            </form>
          )}

          <p className={fp.alt}>
            Rather talk it through?{" "}
            <button
              type="button"
              className={fp.altLink}
              onClick={() => openDemo(undefined, { source: "floor_plan_page" })}
            >
              Book a demo
            </button>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
