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
