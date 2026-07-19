"use client";

import styles from "./CornerButton.module.css";

export default function CornerButton({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  className = "",
  ariaLabel,
  href,
  target,
  rel,
}) {
  const isDisabled = disabled || loading;
  const cls = [
    "bracket-hover",
    styles.btn,
    styles[variant] || styles.primary,
    isDisabled ? styles.disabled : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  /* Link form — same treatment, real anchor semantics (external links,
     store badges). Loading/disabled don't apply to navigation. */
  if (href) {
    return (
      <a
        className={cls}
        href={href}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        <span className={styles.label}>{children}</span>
      </a>
    );
  }

  return (
    <button
      className={cls}
      onClick={onClick}
      type={type}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading ? "true" : undefined}
    >
      <span className={styles.label}>{children}</span>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
    </button>
  );
}
