"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  /* The detail goes to the console (and any error reporter reading it),
     never to the page: error.message can carry internal paths, env names
     or upstream response bodies. */
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div
      style={{
        background: "var(--dark)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: 48,
      }}
    >
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: 2,
          color: "#ef4444",
          marginBottom: 24,
        }}
      >
        ERROR
      </div>
      <h1
        style={{
          fontFamily: "var(--display)",
          fontSize: "clamp(24px, 4vw, 36px)",
          fontWeight: 700,
          color: "var(--white)",
          letterSpacing: "-1px",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        Something went wrong
      </h1>
      <p
        style={{
          fontFamily: "var(--display)",
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
          textAlign: "center",
          maxWidth: 400,
          lineHeight: 1.8,
          marginBottom: 32,
        }}
      >
        Something on this page failed to load. Try again, or email
        sales@nautilusinventory.com if it keeps happening.
      </p>
      <button
        onClick={reset}
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: 0.5,
          color: "var(--ink)",
          background: "var(--white)",
          padding: "10px 28px",
          border: "none",
          cursor: "pointer",
          transition: "background 0.3s",
        }}
        onMouseEnter={(e) => (e.target.style.background = "var(--accent)")}
        onMouseLeave={(e) => (e.target.style.background = "var(--white)")}
      >
        Try again
      </button>
    </div>
  );
}
