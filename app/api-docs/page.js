"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";
gsap.registerPlugin(ScrollTrigger);

const ENDPOINTS = [
  {
    method: "GET",
    path: "/v1/products",
    desc: "List all products with pagination, filtering, and sorting.",
  },
  {
    method: "POST",
    path: "/v1/products",
    desc: "Create a new product with SKU, barcode, and custom fields.",
  },
  {
    method: "GET",
    path: "/v1/products/:id",
    desc: "Retrieve a single product by ID with full inventory details.",
  },
  {
    method: "PATCH",
    path: "/v1/products/:id",
    desc: "Update product fields including quantity adjustments.",
  },
  {
    method: "GET",
    path: "/v1/locations",
    desc: "List all warehouse locations \u2014 sections, bays, and levels.",
  },
  {
    method: "POST",
    path: "/v1/scans",
    desc: "Record a scan action (pick, putaway, count, relocate, etc).",
  },
  {
    method: "GET",
    path: "/v1/analytics/stock-levels",
    desc: "Current stock levels with depletion forecasts.",
  },
  {
    method: "GET",
    path: "/v1/analytics/activity",
    desc: "Activity feed with filters for user, action, and date range.",
  },
  {
    method: "POST",
    path: "/v1/webhooks",
    desc: "Register a webhook endpoint for real-time event notifications.",
  },
  {
    method: "GET",
    path: "/v1/cycle-counts",
    desc: "List cycle count sessions with status and discrepancy data.",
  },
];
const SDKS = [
  {
    lang: "Node.js",
    install: "npm install @nimbus/sdk",
    desc: "Full-featured SDK with TypeScript support.",
  },
  {
    lang: "Python",
    install: "pip install nimbus-sdk",
    desc: "Pythonic interface with async support.",
  },
  {
    lang: "REST",
    install: "curl -H 'Authorization: Bearer ...'",
    desc: "Direct HTTP access for any language.",
  },
];
const methodColor = {
  GET: "#5a9a4a",
  POST: "#D4A853",
  PATCH: "#6a8fc7",
  DELETE: "#cc5555",
};

export default function ApiDocsPage() {
  const heroRef = useRef(null);
  const sectionRefs = useRef([]);
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);
  useEffect(() => {
    window.scrollTo(0, 0);
    const hero = heroRef.current;
    gsap.to(hero.querySelector("h1"), {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      delay: 0.2,
    });
    gsap.to(hero.querySelector("p"), {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      delay: 0.35,
    });
    sectionRefs.current.forEach((sec) => {
      if (!sec) return;
      gsap.to(sec, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: sec, start: "top 80%" },
      });
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);
  return (
    <div style={{ background: "var(--dark)", minHeight: "100vh" }}>
      <Nav onDemo={openDemo} />
      <div
        ref={heroRef}
        style={{ padding: "160px 48px 80px", maxWidth: 1000, margin: "0 auto" }}
      >
        <h1
          style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 700,
            color: "var(--white)",
            letterSpacing: "-1.5px",
            opacity: 0,
            transform: "translateY(20px)",
          }}
        >
          API Documentation
        </h1>
        <p
          style={{
            fontFamily: "var(--display)",
            fontSize: 17,
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.4)",
            maxWidth: 560,
            marginTop: 20,
            opacity: 0,
            transform: "translateY(16px)",
          }}
        >
          RESTful API with webhooks, SDKs for Node and Python, and Zapier
          integration. Base URL:{" "}
          <span style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>
            https://api.nimbuswms.com
          </span>
        </p>
      </div>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 48px 60px" }}>
        <div
          ref={(el) => (sectionRefs.current[0] = el)}
          style={{
            marginBottom: 60,
            opacity: 0,
            transform: "translateY(20px)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "var(--accent)",
              }}
            />
            SDKs
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {SDKS.map((sdk, i) => (
              <div
                key={i}
                style={{
                  padding: 24,
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--white)",
                    marginBottom: 8,
                  }}
                >
                  {sdk.lang}
                </div>
                <code
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--accent)",
                    display: "block",
                    marginBottom: 10,
                    padding: "8px 12px",
                    background: "rgba(212,168,83,0.06)",
                    borderRadius: 6,
                  }}
                >
                  {sdk.install}
                </code>
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {sdk.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          ref={(el) => (sectionRefs.current[1] = el)}
          style={{ opacity: 0, transform: "translateY(20px)" }}
        >
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "var(--accent)",
              }}
            />
            Endpoints
          </div>
          {ENDPOINTS.map((ep, i) => (
            <div
              key={i}
              style={{
                padding: "20px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: 20,
                alignItems: "start",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: methodColor[ep.method] || "var(--white)",
                  letterSpacing: 1,
                }}
              >
                {ep.method}
              </span>
              <div>
                <code
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 13,
                    color: "var(--white)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {ep.path}
                </code>
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.3)",
                    lineHeight: 1.6,
                  }}
                >
                  {ep.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          padding: "80px 48px",
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--display)",
            fontSize: 15,
            color: "rgba(255,255,255,0.35)",
            marginBottom: 24,
          }}
        >
          Need API access? Contact our developer relations team.
        </p>
        <a
          href="mailto:api@nimbuswms.com"
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: 0.5,
            color: "var(--accent)",
            textDecoration: "none",
          }}
        >
          api@nimbuswms.com
        </a>
      </div>
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
