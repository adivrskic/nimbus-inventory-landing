"use client";

import styles from './CornerButton.module.css'

export default function CornerButton({ children, variant = 'primary', onClick }) {
  const cls = `bracket-hover ${styles.btn} ${styles[variant] || styles.primary}`
  return (
    <button className={cls} onClick={onClick}>{children}</button>
  )
}
