"use client";
import { useState } from "react";
import { trackLead, trackLeadError } from "@/lib/analytics";
import { EMAIL_RE } from "@/lib/validation";
import styles from "./Footer.module.css";

/* "Notify me when the apps launch" — sits under the footer's coming-soon
   store badges and posts to /api/waitlist with list "mobile_apps", so the
   one place that says the apps aren't out yet also collects the people who
   want them. */
export default function NotifyForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("Enter a valid email address.");
      setStatus("error");
      trackLeadError({ leadType: "app_waitlist", reason: "invalid:email" });
      return;
    }

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          list: "mobile_apps",
          website,
          source_url: window.location.pathname,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't save that. Please try again.");
        setStatus("error");
        trackLeadError({ leadType: "app_waitlist", reason: `http_${res.status}` });
        return;
      }
      if (!website) {
        trackLead({ leadType: "app_waitlist", submissionId: data.submissionId });
      }
      setStatus("done");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
      trackLeadError({ leadType: "app_waitlist", reason: "network" });
    }
  };

  if (status === "done") {
    return (
      <p className={styles.notifyDone} role="status">
        You&apos;re on the list — we&apos;ll email you when the apps launch.
      </p>
    );
  }

  const hasError = status === "error";

  return (
    <form className={styles.notifyForm} onSubmit={onSubmit} noValidate>
      <label htmlFor="notify-email" className={styles.srOnly}>
        Email me when the mobile apps launch
      </label>
      <div className={styles.honeypot} aria-hidden="true">
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <div className={styles.notifyRow}>
        <input
          id="notify-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (hasError) setStatus("idle");
          }}
          disabled={status === "sending"}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={hasError ? "notify-error" : undefined}
          className={styles.notifyInput}
        />
        <button
          type="submit"
          className={styles.notifyBtn}
          disabled={status === "sending"}
        >
          {status === "sending" ? "Saving…" : "Notify me"}
        </button>
      </div>
      {hasError && (
        <p id="notify-error" className={styles.notifyError} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
