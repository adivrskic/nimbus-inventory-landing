"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";
import TransitionLink from "@/components/TransitionLink/TransitionLink";

/* ── Fake status data ── */
const SERVICES = [
  {
    group: "Core Platform",
    items: [
      { name: "Web Dashboard", status: "operational", uptime: 99.98 },
      {
        name: "Mobile App (iOS / Android)",
        status: "operational",
        uptime: 99.95,
      },
      { name: "API (v3)", status: "operational", uptime: 99.99 },
      { name: "Webhooks", status: "operational", uptime: 99.97 },
      { name: "SSO / Authentication", status: "operational", uptime: 100 },
    ],
  },
  {
    group: "Warehouse Operations",
    items: [
      { name: "Receiving & Putaway", status: "operational", uptime: 99.99 },
      { name: "Pick & Pack Engine", status: "operational", uptime: 99.97 },
      { name: "Cycle Counting", status: "operational", uptime: 100 },
      { name: "Barcode Scanning", status: "operational", uptime: 99.96 },
      { name: "Label Printing", status: "degraded", uptime: 99.42 },
    ],
  },
  {
    group: "AI & Intelligence",
    items: [
      { name: "Route Optimization", status: "operational", uptime: 99.94 },
      { name: "Demand Forecasting", status: "operational", uptime: 99.91 },
      { name: "Anomaly Detection", status: "operational", uptime: 99.98 },
      { name: "Slot Recommendation", status: "operational", uptime: 99.93 },
    ],
  },
  {
    group: "Integrations",
    items: [
      { name: "Shopify Connector", status: "operational", uptime: 99.99 },
      { name: "QuickBooks Sync", status: "operational", uptime: 99.95 },
      { name: "SAP Bridge", status: "operational", uptime: 99.88 },
      { name: "ShipStation", status: "operational", uptime: 99.97 },
      { name: "Salesforce", status: "operational", uptime: 99.96 },
    ],
  },
  {
    group: "Infrastructure",
    items: [
      { name: "US-East (Primary)", status: "operational", uptime: 99.99 },
      { name: "US-West (Failover)", status: "operational", uptime: 100 },
      { name: "EU-Central", status: "operational", uptime: 99.98 },
      { name: "CDN / Static Assets", status: "operational", uptime: 100 },
      { name: "Database Cluster", status: "operational", uptime: 99.99 },
    ],
  },
];

const INCIDENTS = [
  { date: "Apr 3, 2026", items: [] },
  {
    date: "Apr 2, 2026",
    items: [
      {
        title: "Intermittent label printing delays",
        status: "investigating",
        severity: "degraded",
        updates: [
          {
            state: "Investigating",
            text: "Some users may experience slower label generation. Print queue processing is running at reduced throughput. We're investigating.",
            time: "2:14 PM EDT",
          },
        ],
      },
    ],
  },
  {
    date: "Apr 1, 2026",
    items: [
      {
        title: "Elevated API latency",
        status: "resolved",
        severity: "degraded",
        updates: [
          {
            state: "Resolved",
            text: "API latency has returned to normal levels. Root cause was a misconfigured cache invalidation rule during a routine deployment.",
            time: "4:52 PM EDT",
          },
          {
            state: "Monitoring",
            text: "A fix has been deployed. Monitoring response times.",
            time: "4:10 PM EDT",
          },
          {
            state: "Identified",
            text: "The issue has been traced to a cache misconfiguration. A fix is being rolled out.",
            time: "3:35 PM EDT",
          },
          {
            state: "Investigating",
            text: "We are seeing elevated p99 latency on API v3 endpoints. Investigating.",
            time: "2:48 PM EDT",
          },
        ],
      },
    ],
  },
  { date: "Mar 31, 2026", items: [] },
  { date: "Mar 30, 2026", items: [] },
  {
    date: "Mar 29, 2026",
    items: [
      {
        title: "Shopify sync delays during peak",
        status: "resolved",
        severity: "degraded",
        updates: [
          {
            state: "Resolved",
            text: "Sync queue fully drained. All Shopify orders now processing within normal SLA.",
            time: "11:20 AM EDT",
          },
          {
            state: "Investigating",
            text: "Shopify order sync is experiencing a backlog during high-volume period. Orders are queued and will process. No data loss.",
            time: "9:45 AM EDT",
          },
        ],
      },
    ],
  },
  { date: "Mar 28, 2026", items: [] },
  { date: "Mar 27, 2026", items: [] },
];

const STATUS_META = {
  operational: { label: "Operational", color: "#22c55e" },
  degraded: { label: "Degraded Performance", color: "#f59e0b" },
  partial: { label: "Partial Outage", color: "#f97316" },
  major: { label: "Major Outage", color: "#ef4444" },
  maintenance: { label: "Under Maintenance", color: "#3b82f6" },
};

const STATE_COLORS = {
  Resolved: "#22c55e",
  Monitoring: "#3b82f6",
  Identified: "#f59e0b",
  Investigating: "#f97316",
};

// Generate 90-day uptime bars
function UptimeBar({ uptime }) {
  const days = 90;
  const bars = [];
  for (let i = 0; i < days; i++) {
    // Simulate: most days 100%, occasional dips near current uptime
    const dayUp = Math.random() > 0.04 ? 100 : 95 + Math.random() * 5;
    const color =
      dayUp >= 99.9 ? "#22c55e" : dayUp >= 99 ? "#f59e0b" : "#ef4444";
    bars.push(
      <div
        key={i}
        style={{
          flex: 1,
          height: 28,
          background: color,
          borderRadius: 1,
          opacity: 0.8,
        }}
        title={`Day ${days - i}: ${dayUp.toFixed(2)}%`}
      />
    );
  }
  return (
    <div style={{ display: "flex", gap: 1, marginTop: 8 }}>
      {bars}
      <style>{`.uptime-labels{display:flex;justify-content:space-between;font-family:var(--mono);font-size:9px;color:rgba(255,255,255,0.2);margin-top:4px}`}</style>
    </div>
  );
}

export default function StatusClient() {
  const heroRef = useRef(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedIncidents, setExpandedIncidents] = useState({});
  const openDemo = useCallback(() => setDemoOpen(true), []);

  const toggleGroup = (g) => setExpandedGroups((v) => ({ ...v, [g]: !v[g] }));
  const toggleIncident = (key) =>
    setExpandedIncidents((v) => ({ ...v, [key]: !v[key] }));

  // Overall status
  const allItems = SERVICES.flatMap((s) => s.items);
  const hasIssue = allItems.some((i) => i.status !== "operational");
  const overallStatus = hasIssue ? "degraded" : "operational";

  useEffect(() => {
    window.scrollTo(0, 0);
    const hero = heroRef.current;
    if (!hero) return;
    gsap.to(hero.querySelector("[data-badge]"), {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "power3.out",
      delay: 0.15,
    });
    gsap.to(hero.querySelector("h1"), {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      delay: 0.25,
    });
    gsap.to(hero.querySelector("[data-sub]"), {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "power3.out",
      delay: 0.4,
    });
  }, []);

  const s = (status) => STATUS_META[status] || STATUS_META.operational;

  return (
    <div style={{ background: "var(--dark)", minHeight: "100vh" }}>
      <Nav onDemo={openDemo} />

      {/* Hero */}
      <div
        ref={heroRef}
        style={{
          padding: "160px 48px 40px",
          maxWidth: 800,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          data-badge=""
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 18px",
            borderRadius: 100,
            border: `1px solid ${s(overallStatus).color}33`,
            background: `${s(overallStatus).color}0a`,
            marginBottom: 24,
            opacity: 0,
            transform: "translateY(12px)",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: s(overallStatus).color,
              boxShadow: `0 0 8px ${s(overallStatus).color}66`,
            }}
          />
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: s(overallStatus).color,
              letterSpacing: 0.5,
            }}
          >
            {hasIssue
              ? "Some systems experiencing issues"
              : "All systems operational"}
          </span>
        </div>

        <h1
          style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 700,
            color: "var(--white)",
            letterSpacing: "-1px",
            opacity: 0,
            transform: "translateY(16px)",
          }}
        >
          System Status
        </h1>
        <p
          data-sub=""
          style={{
            fontFamily: "var(--display)",
            fontSize: 15,
            color: "rgba(255,255,255,0.3)",
            marginTop: 12,
            opacity: 0,
            transform: "translateY(10px)",
          }}
        >
          Real-time health of all Nimbus services and infrastructure.
        </p>
      </div>

      {/* Components */}
      <div
        style={{ maxWidth: 800, margin: "0 auto", padding: "20px 48px 60px" }}
      >
        {SERVICES.map((group) => {
          const groupHasIssue = group.items.some(
            (i) => i.status !== "operational"
          );
          const isOpen = expandedGroups[group.group] ?? true;

          return (
            <div key={group.group} style={{ marginBottom: 2 }}>
              {/* Group header */}
              <div
                onClick={() => toggleGroup(group.group)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  borderRadius: isOpen ? "14px 14px 0 0" : 14,
                  cursor: "pointer",
                  transition: "background 0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.035)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    style={{
                      transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                      transition: "transform 0.3s",
                    }}
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                  <span
                    style={{
                      fontFamily: "var(--display)",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--white)",
                    }}
                  >
                    {group.group}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: groupHasIssue ? "#f59e0b" : "#22c55e",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      color: groupHasIssue
                        ? "#f59e0b"
                        : "rgba(255,255,255,0.25)",
                    }}
                  >
                    {groupHasIssue ? "Issues" : "Operational"}
                  </span>
                </div>
              </div>

              {/* Items */}
              {isOpen && (
                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.04)",
                    borderTop: "none",
                    borderRadius: "0 0 14px 14px",
                    overflow: "hidden",
                  }}
                >
                  {group.items.map((item, i) => (
                    <div
                      key={item.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 20px",
                        borderTop:
                          i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--display)",
                          fontSize: 13,
                          color: "rgba(255,255,255,0.6)",
                        }}
                      >
                        {item.name}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: 9,
                            color: "rgba(255,255,255,0.15)",
                          }}
                        >
                          {item.uptime}%
                        </span>
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: s(item.status).color,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: 10,
                            color: s(item.status).color,
                          }}
                        >
                          {s(item.status).label}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Uptime bar */}
                  <div style={{ padding: "8px 20px 14px" }}>
                    <UptimeBar
                      uptime={
                        group.items.reduce((a, b) => a + b.uptime, 0) /
                        group.items.length
                      }
                    />
                    <div className="uptime-labels">
                      <span>90 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            marginTop: 32,
            marginBottom: 60,
          }}
        >
          {["operational", "degraded", "partial", "major", "maintenance"].map(
            (k) => (
              <div
                key={k}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: STATUS_META[k].color,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: 0.5,
                  }}
                >
                  {STATUS_META[k].label}
                </span>
              </div>
            )
          )}
        </div>

        {/* Past incidents */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.04)",
            paddingTop: 40,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--display)",
              fontSize: 20,
              fontWeight: 600,
              color: "var(--white)",
              marginBottom: 28,
              letterSpacing: "-0.3px",
            }}
          >
            Past Incidents
          </h2>

          {INCIDENTS.map((day) => (
            <div key={day.date} style={{ marginBottom: 8 }}>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: 0.5,
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {day.date}
              </div>

              {day.items.length === 0 && (
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.15)",
                    padding: "12px 0",
                  }}
                >
                  No incidents reported.
                </div>
              )}

              {day.items.map((inc, ii) => {
                const key = `${day.date}-${ii}`;
                const isExp = expandedIncidents[key];
                return (
                  <div
                    key={key}
                    style={{
                      padding: "14px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                    }}
                  >
                    <div
                      onClick={() => toggleIncident(key)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background:
                              inc.status === "resolved" ? "#22c55e" : "#f59e0b",
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "var(--display)",
                            fontSize: 14,
                            color: "var(--white)",
                          }}
                        >
                          {inc.title}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: 10,
                            color:
                              inc.status === "resolved" ? "#22c55e" : "#f59e0b",
                            textTransform: "capitalize",
                          }}
                        >
                          {inc.status}
                        </span>
                        <svg
                          width="10"
                          height="6"
                          viewBox="0 0 10 6"
                          style={{
                            transform: isExp
                              ? "rotate(0deg)"
                              : "rotate(-90deg)",
                            transition: "transform 0.3s",
                          }}
                        >
                          <path
                            d="M1 1L5 5L9 1"
                            stroke="rgba(255,255,255,0.25)"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                      </div>
                    </div>

                    {isExp && (
                      <div
                        style={{
                          marginTop: 14,
                          marginLeft: 16,
                          borderLeft: "2px solid rgba(255,255,255,0.04)",
                          paddingLeft: 16,
                        }}
                      >
                        {inc.updates.map((u, ui) => (
                          <div
                            key={ui}
                            style={{
                              marginBottom:
                                ui < inc.updates.length - 1 ? 16 : 0,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 4,
                              }}
                            >
                              <div
                                style={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: "50%",
                                  background: STATE_COLORS[u.state] || "#888",
                                }}
                              />
                              <span
                                style={{
                                  fontFamily: "var(--mono)",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color: STATE_COLORS[u.state] || "#888",
                                }}
                              >
                                {u.state}
                              </span>
                              <span
                                style={{
                                  fontFamily: "var(--mono)",
                                  fontSize: 9,
                                  color: "rgba(255,255,255,0.15)",
                                }}
                              >
                                {u.time}
                              </span>
                            </div>
                            <p
                              style={{
                                fontFamily: "var(--display)",
                                fontSize: 13,
                                lineHeight: 1.7,
                                color: "rgba(255,255,255,0.35)",
                                margin: 0,
                              }}
                            >
                              {u.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
