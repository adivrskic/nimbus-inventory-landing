"use client";

import Link from "next/link";

export default function NotFoundClient() {
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
          color: "var(--accent)",
          marginBottom: 24,
        }}
      >
        404
      </div>

      <h1
        style={{
          fontFamily: "var(--display)",
          fontSize: "clamp(32px, 5vw, 56px)",
          fontWeight: 700,
          color: "var(--white)",
          letterSpacing: "-1.5px",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Page not found
      </h1>

      <p
        style={{
          fontFamily: "var(--display)",
          fontSize: 15,
          color: "rgba(255,255,255,0.3)",
          textAlign: "center",
          maxWidth: 400,
          lineHeight: 1.8,
          marginBottom: 36,
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        href="/"
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: 0.5,
          color: "var(--black)",
          background: "var(--white)",
          padding: "10px 28px",
          textDecoration: "none",
          transition: "background 0.3s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--accent)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "var(--white)")
        }
      >
        Back to home
      </Link>
    </div>
  );
}
