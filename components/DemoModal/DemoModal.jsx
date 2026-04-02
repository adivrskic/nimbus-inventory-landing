"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Logo from "@/components/shared/Logo";
import styles from "./DemoModal.module.css";

const FIELDS = [
  { label: "Full name", placeholder: "Jane Smith", type: "text" },
  { label: "Work email", placeholder: "jane@company.com", type: "email" },
  { label: "Company", placeholder: "Company name", type: "text" },
  {
    label: "Warehouse size",
    placeholder: "e.g. 50,000 sq ft, 3 sections",
    type: "text",
  },
];

const STATS = [
  { val: "<200ms", label: "Scan speed" },
  { val: "70%", label: "Time saved" },
  { val: "99.9%", label: "Uptime" },
];

export default function DemoModal({ isOpen, onClose }) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  useEffect(() => {
    if (!mounted || !isOpen || !backdropRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(backdropRef.current, { opacity: 1, duration: 0.4 })
      .to(
        panelRef.current,
        { scale: 1, opacity: 1, duration: 0.6, ease: "power4.out" },
        "-=0.3"
      )
      .to(
        contentRef.current?.children || [],
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06 },
        "-=0.3"
      );
  }, [mounted, isOpen]);

  useEffect(() => {
    if (!isOpen && mounted && !animatingOut) {
      setAnimatingOut(true);
      const tl = gsap.timeline({
        defaults: { ease: "power3.in" },
        onComplete: () => {
          setMounted(false);
          setAnimatingOut(false);
        },
      });
      tl.to(contentRef.current?.children || [], {
        y: -20,
        opacity: 0,
        duration: 0.25,
        stagger: 0.02,
      })
        .to(
          panelRef.current,
          { scale: 0.95, opacity: 0, duration: 0.35 },
          "-=0.15"
        )
        .to(backdropRef.current, { opacity: 0, duration: 0.3 }, "-=0.2");
    }
  }, [isOpen, mounted, animatingOut]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return (
    <div
      ref={backdropRef}
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
          <h3 className={styles.leftTitle}>See Nimbus in action</h3>
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
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
          <div ref={contentRef}>
            <div className={`${styles.formTitle} gsap-hidden-sm`}>
              Request a demo
            </div>
            <p className={`${styles.formDesc} gsap-hidden-sm`}>
              Fill in the details and our team will reach out within 24 hours.
            </p>
            {FIELDS.map((field, i) => (
              <div key={i} className={`${styles.fieldWrap} gsap-hidden-sm`}>
                <label className={styles.fieldLabel}>{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  className={styles.fieldInput}
                />
              </div>
            ))}
            <div className={`${styles.fieldWrap} gsap-hidden-sm`}>
              <label className={styles.fieldLabel}>
                Comments{" "}
                <span style={{ opacity: 0.4, fontWeight: 300 }}>
                  (optional)
                </span>
              </label>
              <textarea
                placeholder="Tell us about your operation, challenges, or questions..."
                className={styles.fieldTextarea}
                rows={3}
              />
            </div>
            <button className={`${styles.submitBtn} gsap-hidden-sm`}>
              Submit request
            </button>
            <p className={`${styles.footnote} gsap-hidden-sm`}>
              No commitment required · Usually responds within 4 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
