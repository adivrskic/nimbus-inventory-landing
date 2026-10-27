"use client";

/* ──────────────────────────────────────────────────────────────────────────
   components/CookieBanner/CookieBanner.jsx
   ──────────────────────────────────────────────────────────────────────────
   Consent prompt for the single analytics cookie (GA4). Google Consent
   Mode v2 starts with analytics_storage denied (see GoogleAnalytics.jsx);
   nothing is measured until the visitor accepts here, and the choice is
   remembered for 12 months in the `nautilus_consent` cookie (lib/consent).

   Shown only when GA is configured (measurementId prop from app/layout.js)
   AND no choice is stored. Not a modal: no focus trap, no backdrop, the
   page stays usable behind it. The footer's "Cookie preferences" link
   clears the stored choice and dispatches PREFS_EVENT, which re-opens it.

   Essential cookies (the chat visitor id, this consent cookie) are not
   gated — they are strictly necessary for the features that set them.
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import {
  PREFS_EVENT,
  applyConsent,
  readConsent,
  writeConsent,
} from "@/lib/consent";
import styles from "./CookieBanner.module.css";

export default function CookieBanner({ measurementId }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!measurementId) return;
    if (!readConsent()) setVisible(true);
    const reopen = () => setVisible(true);
    window.addEventListener(PREFS_EVENT, reopen);
    return () => window.removeEventListener(PREFS_EVENT, reopen);
  }, [measurementId]);

  if (!visible) return null;

  const choose = (value) => {
    writeConsent(value);
    applyConsent(value);
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className={styles.banner}
      data-reveal-exempt
    >
      <p className={styles.text}>
        We use one analytics cookie to see which pages help people. Essential
        cookies (the chat assistant, your preferences) always stay on.{" "}
        <TransitionLink href="/legal/privacy" className={styles.link}>
          Privacy policy
        </TransitionLink>
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => choose("granted")}
        >
          Accept analytics
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={() => choose("denied")}
        >
          Essential only
        </button>
      </div>
    </div>
  );
}
