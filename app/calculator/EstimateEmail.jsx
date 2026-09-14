"use client";
import { useState } from "react";
import { trackLead, trackLeadError } from "@/lib/analytics";
import { EMAIL_RE } from "@/lib/validation";
import styles from "./EstimateEmail.module.css";

/* "Email me this estimate", under the calculator's total. Sends only the
   address and the four inputs; /api/estimate recomputes the numbers with
   lib/roi — the same model this page runs — so the email always matches
   what the visitor saw. */
export default function EstimateEmail({ inputs }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("Enter a valid email address.");
      setStatus("error");
      trackLeadError({ leadType: "estimate", reason: "invalid:email" });
      return;
    }

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          inputs,
          website,
          source_url: window.location.pathname,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't send your estimate. Please try again.");
        setStatus("error");
        trackLeadError({ leadType: "estimate", reason: `http_${res.status}` });
        return;
      }
      /* A filled honeypot is a bot the API silently dropped. */
      if (!website) {
        trackLead({ leadType: "estimate", submissionId: data.submissionId });
      }
      setSentTo(value);
      setStatus("done");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
      trackLeadError({ leadType: "estimate", reason: "network" });
    }
  };

  if (status === "done") {
    return (
      <div className={styles.done} role="status">
        <span className={styles.doneDot} aria-hidden="true" />
        Estimate sent to <strong>{sentTo}</strong>. If it isn&apos;t in your
        inbox in a few minutes, check spam.
        <button
          type="button"
          className={styles.again}
          onClick={() => {
            setEmail("");
            setStatus("idle");
          }}
        >
          Send it somewhere else →
        </button>
      </div>
    );
  }

  const hasError = status === "error";

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label htmlFor="estimate-email" className={styles.label}>
        Email me this estimate
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
      <div className={styles.row}>
        <input
          id="estimate-email"
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
          aria-describedby={hasError ? "estimate-error" : "estimate-note"}
          className={styles.input}
        />
        <button
          type="submit"
          className={styles.button}
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending…" : "Send"}
        </button>
      </div>
      {hasError ? (
        <p id="estimate-error" className={styles.error} role="alert">
          {error}
        </p>
      ) : (
        <p id="estimate-note" className={styles.note}>
          One email with these numbers. No newsletter.
        </p>
      )}
    </form>
  );
}
