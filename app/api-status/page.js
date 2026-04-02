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
    desc: "Webhook delivery experienced 2-3s latency for approximately 18 minutes. Root cause: connection pool saturation during traffic spike. Resolved by scaling delivery workers.",
    duration: "18 min",
  },
  {
    date: "Mar 12, 2026",
    title: "Intermittent scanning delays",
    status: "resolved",
    desc: "Barcode scanning API responded with P95 latency of 800ms (vs normal 180ms) for 7 minutes. Caused by a cache invalidation event. No data loss.",
    duration: "7 min",
  },
  {
    date: "Feb 28, 2026",
    title: "Scheduled maintenance",
    status: "completed",
    desc: "Planned database migration to improve query performance. All services were available during migration with read-only mode for 4 minutes.",
    duration: "4 min",
  },
];

const STATUS_COLORS = {
  operational: "#5a9a4a",
  degraded: "#D4A853",
  down: "#cc5555",
};

function UptimeBar() {
  const bars = [];
  for (let i = 0; i < 90; i++) {
    const isIncident = i === 65 || i === 78 || i === 87;
    bars.push(
      <div
        key={i}
        style={{
          flex: 1,
          height: 28,
          background: isIncident
            ? "rgba(212,168,83,0.5)"
            : "rgba(90,154,74,0.35)",
          borderRadius: 2,
        }}
      />
    );
  }
  return (
    <div style={{ display: "flex", gap: 1.5, marginTop: 24, marginBottom: 8 }}>
      {bars}
    </div>
  );
}

export default function ApiStatusPage() {
  const heroRef = useRef(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!heroRef.current) return;
    const title = heroRef.current.querySelector("h1");
    const badge = heroRef.current.querySelector("span[data-badge]");
    if (title)
      gsap.to(title, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.2,
      });
    if (badge)
      gsap.to(badge, {
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
          padding: "160px 48px 60px",
          maxWidth: 900,
          margin: "0 auto",
          textAlign: "center",
        }}
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
          System Status
        </h1>
        <span
          data-badge="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            marginTop: 24,
            padding: "12px 24px",
            border: "1px solid rgba(90,154,74,0.3)",
            borderRadius: 100,
            opacity: 0,
            transform: "translateY(12px)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#5a9a4a",
              boxShadow: "0 0 8px rgba(90,154,74,0.5)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              letterSpacing: 0.5,
              color: "#5a9a4a",
            }}
          >
            All systems operational
          </span>
        </span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 48px" }}>
        <UptimeBar />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "rgba(255,255,255,0.2)",
            marginBottom: 60,
          }}
        >
          <span>90 days ago</span>
          <span>99.97% uptime</span>
          <span>Today</span>
        </div>

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
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "inline-block",
            }}
          />
          Current Status
        </div>
        {SERVICES.map((svc, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--display)",
                fontSize: 14,
                color: "var(--white)",
              }}
            >
              {svc.name}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.2)",
                }}
              >
                {svc.uptime}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: STATUS_COLORS[svc.status],
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    color: STATUS_COLORS[svc.status],
                    textTransform: "capitalize",
                  }}
                >
                  {svc.status}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--accent)",
            marginTop: 60,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "inline-block",
            }}
          />
          Recent Incidents
        </div>
        {INCIDENTS.map((inc, i) => (
          <div
            key={i}
            style={{
              padding: "24px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.2)",
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
                }}
              >
                {inc.status}
              </span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.15)",
                }}
              >
                {inc.duration}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--display)",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--white)",
                marginBottom: 8,
              }}
            >
              {inc.title}
            </div>
            <p
              style={{
                fontFamily: "var(--display)",
                fontSize: 13,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.3)",
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
