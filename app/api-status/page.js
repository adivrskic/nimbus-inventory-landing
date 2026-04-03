"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";

const SERVICES = [
  { name: "Core Platform", status: "operational", uptime: "99.98%" },
  { name: "Barcode Scanning API", status: "operational", uptime: "99.99%" },
  { name: "AI Voice Engine", status: "operational", uptime: "99.95%" },
  { name: "Spatial Mapping", status: "operational", uptime: "99.97%" },
  { name: "Predictive Analytics", status: "operational", uptime: "99.93%" },
  { name: "Webhook Delivery", status: "operational", uptime: "99.96%" },
  { name: "Integrations Gateway", status: "operational", uptime: "99.94%" },
  {
    name: "Mobile Sync (iOS/Android)",
    status: "operational",
    uptime: "99.98%",
  },
];

const INCIDENTS = [
  {
    date: "Mar 25, 2026",
    title: "Elevated webhook latency",
    status: "resolved",
    desc: "Webhook delivery experienced 2-3s latency for approximately 18 minutes. Resolved by scaling delivery workers.",
    duration: "18 min",
  },
  {
    date: "Mar 12, 2026",
    title: "Intermittent scanning delays",
    status: "resolved",
    desc: "Barcode scanning API responded with elevated P95 latency for 7 minutes. Caused by cache invalidation. No data loss.",
    duration: "7 min",
  },
  {
    date: "Feb 28, 2026",
    title: "Scheduled maintenance",
    status: "completed",
    desc: "Planned database migration. All services available with 4 minutes of read-only mode.",
    duration: "4 min",
  },
];

const STATUS_DOT = {
  operational: "#5a9a4a",
  degraded: "#D4A853",
  down: "#cc5555",
};

function UptimeBar() {
  const days = [];
  for (let i = 0; i < 90; i++) {
    const isIncident = i === 65 || i === 78 || i === 87;
    days.push(
      <div key={i} style={{ position: "relative", flex: 1, height: 32 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isIncident
              ? "linear-gradient(180deg, rgba(212,168,83,0.6) 0%, rgba(212,168,83,0.15) 100%)"
              : "linear-gradient(180deg, rgba(90,154,74,0.4) 0%, rgba(90,154,74,0.08) 100%)",
            borderRadius: 1,
            transition: "opacity 0.2s",
          }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        borderRadius: 12,
        padding: "16px 20px",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ display: "flex", gap: 1.5 }}>{days}</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--mono)",
          fontSize: 9,
          color: "rgba(255,255,255,0.15)",
          marginTop: 10,
        }}
      >
        <span>90 days ago</span>
        <span style={{ color: "#5a9a4a", opacity: 0.8 }}>99.97% uptime</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export default function StatusPage() {
  const heroRef = useRef(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!heroRef.current) return;
    gsap.to(heroRef.current.querySelector("h1"), {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      delay: 0.2,
    });
    gsap.to(heroRef.current.querySelector("[data-badge]"), {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      delay: 0.35,
    });
  }, []);

  return (
    <div style={{ background: "var(--dark)", minHeight: "100vh" }}>
      <Nav onDemo={openDemo} />

      <div
        ref={heroRef}
        style={{
          padding: "160px 48px 48px",
          maxWidth: 800,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(36px, 5vw, 52px)",
            fontWeight: 700,
            color: "var(--white)",
            letterSpacing: "-1.5px",
            opacity: 0,
            transform: "translateY(20px)",
          }}
        >
          System Status
        </h1>
        <div
          data-badge=""
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            marginTop: 24,
            padding: "10px 20px",
            background: "rgba(90,154,74,0.06)",
            border: "1px solid rgba(90,154,74,0.15)",
            borderRadius: 100,
            opacity: 0,
            transform: "translateY(12px)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#5a9a4a",
              boxShadow: "0 0 8px rgba(90,154,74,0.5)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: 0.5,
              color: "#5a9a4a",
            }}
          >
            All systems operational
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 48px 0" }}>
        <UptimeBar />
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 48px 0" }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 20,
          }}
        >
          Services
        </div>
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {SERVICES.map((svc, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom:
                  i < SERVICES.length - 1
                    ? "1px solid rgba(255,255,255,0.03)"
                    : "none",
                background:
                  i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {svc.name}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.15)",
                  }}
                >
                  {svc.uptime}
                </span>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: STATUS_DOT[svc.status],
                    display: "inline-block",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 48px 0" }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 20,
          }}
        >
          Recent Incidents
        </div>
        {INCIDENTS.map((inc, i) => (
          <div
            key={i}
            style={{
              padding: "20px 0",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.15)",
                }}
              >
                {inc.date}
              </span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "#5a9a4a",
                  padding: "2px 8px",
                  background: "rgba(90,154,74,0.08)",
                  borderRadius: 4,
                }}
              >
                {inc.status}
              </span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.1)",
                }}
              >
                {inc.duration}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--display)",
                fontSize: 15,
                fontWeight: 500,
                color: "var(--white)",
                marginBottom: 6,
              }}
            >
              {inc.title}
            </div>
            <p
              style={{
                fontFamily: "var(--display)",
                fontSize: 13,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.25)",
              }}
            >
              {inc.desc}
            </p>
          </div>
        ))}
      </div>

      <div style={{ height: 80 }} />
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
