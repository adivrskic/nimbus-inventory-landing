"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";
import SplitText from "@/components/shared/SplitText";
import styles from "./Status.module.css";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────
   SAMPLE DATA (preview content — swap when live)
───────────────────────────────────────────────────── */
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
  degraded: { label: "Degraded", color: "#f59e0b" },
  partial: { label: "Partial outage", color: "#f97316" },
  major: { label: "Major outage", color: "#ef4444" },
  maintenance: { label: "Maintenance", color: "#3b82f6" },
};

const STATE_COLORS = {
  Resolved: "#22c55e",
  Monitoring: "#3b82f6",
  Identified: "#f59e0b",
  Investigating: "#f97316",
};

const H_LINES = [[{ t: "System", a: false }], [{ t: "status.", a: true }]];

/* ─────────────────────────────────────────────────────
   90-day uptime visualization
───────────────────────────────────────────────────── */
function UptimeChart({ seed = 0 }) {
  const days = 90;
  const bars = useMemo(() => {
    /* Deterministic-ish but seeded so each service has a unique pattern */
    const out = [];
    let s = seed * 9301 + 49297;
    for (let i = 0; i < days; i++) {
      s = (s * 9301 + 49297) % 233280;
      const rand = s / 233280;
      const dayUp = rand > 0.04 ? 100 : 95 + rand * 5;
      const color =
        dayUp >= 99.9 ? "#22c55e" : dayUp >= 99 ? "#f59e0b" : "#ef4444";
      out.push({ color, dayUp, idx: i });
    }
    return out;
  }, [seed]);

  return (
    <div className={styles.uptimeChart}>
      <div className={styles.uptimeBars}>
        {bars.map((b) => (
          <span
            key={b.idx}
            className={styles.uptimeBar}
            style={{ background: b.color }}
            title={`Day ${days - b.idx}: ${b.dayUp.toFixed(2)}%`}
          />
        ))}
      </div>
      <div className={styles.uptimeAxis}>
        <span>90 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export default function StatusClient() {
  const shellRef = useRef(null);
  const groupRefs = useRef([]);
  const incidentRefs = useRef([]);

  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  const [expandedIncidents, setExpandedIncidents] = useState({});
  const toggleIncident = (key) =>
    setExpandedIncidents((v) => ({ ...v, [key]: !v[key] }));

  /* Computed overall state */
  const allItems = SERVICES.flatMap((s) => s.items);
  const operational = allItems.filter((i) => i.status === "operational").length;
  const total = allItems.length;
  const hasIssue = operational < total;
  const overallColor = hasIssue
    ? STATUS_META.degraded.color
    : STATUS_META.operational.color;
  const overallUptime = (
    allItems.reduce((a, b) => a + b.uptime, 0) / total
  ).toFixed(2);

  /* Subscribe form (presentational only — wire to /api/waitlist or similar) */
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState("idle");
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.match(/^\S+@\S+\.\S+$/)) return;
    setSubStatus("submitting");
    /* Stub — in production this would POST to /api/status-subscribe */
    setTimeout(() => {
      setSubStatus("success");
      setEmail("");
    }, 600);
  };

  /* ── Animations ── */
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!shellRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(
      `.${styles.topStrip}`,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.4 },
      0
    );

    tl.fromTo(
      `.${styles.preview}`,
      { opacity: 0, y: -6 },
      { opacity: 1, y: 0, duration: 0.4 },
      0.1
    );

    tl.fromTo(
      `.${styles.eyebrow}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45 },
      0.2
    );

    /* Per-letter H1 */
    const hLetters = shellRef.current.querySelectorAll(`.${styles.headLetter}`);
    tl.to(
      hLetters,
      { opacity: 1, y: "0%", rotateX: 0, duration: 0.7, stagger: 0.022 },
      0.3
    );

    tl.fromTo(
      `.${styles.sub}`,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5 },
      0.6
    );

    /* Overview metric cells */
    tl.fromTo(
      `.${styles.metricCell}`,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 },
      0.7
    );

    /* Service group cards stagger on scroll */
    const groups = groupRefs.current.filter(Boolean);
    gsap.fromTo(
      groups,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: groups[0],
          start: "top 80%",
        },
      }
    );

    /* Incidents header */
    gsap.fromTo(
      `.${styles.incidentsHeader}`,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: `.${styles.incidentsSection}`,
          start: "top 78%",
        },
      }
    );

    /* Incident rows stagger */
    const incidents = incidentRefs.current.filter(Boolean);
    if (incidents.length > 0) {
      gsap.fromTo(
        incidents,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: {
            trigger: incidents[0],
            start: "top 82%",
          },
        }
      );
    }

    /* Subscribe panel */
    gsap.fromTo(
      `.${styles.subscribe}`,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: `.${styles.subscribe}`,
          start: "top 85%",
        },
      }
    );

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  const s = (status) => STATUS_META[status] || STATUS_META.operational;

  return (
    <div className={styles.page}>
      <Nav onDemo={openDemo} />

      {/* ── Pinned top strip — overall status, last checked ── */}
      <div className={styles.topStrip}>
        <div className={styles.topStripInner}>
          <div className={styles.topStripLeft}>
            <span
              className={styles.livePulse}
              style={{ "--pulse-color": overallColor }}
            >
              <span className={styles.livePulseDot} />
              <span className={styles.livePulseRing} />
            </span>
            <span className={styles.topStripText}>
              {hasIssue
                ? "Some systems experiencing issues"
                : "All systems operational"}
            </span>
          </div>
          <div className={styles.topStripRight}>
            <span className={styles.topStripMeta}>
              Last checked · 2 min ago
            </span>
            <span className={styles.topStripDivider} />
            <span className={styles.topStripMeta}>Auto-refresh every 60s</span>
          </div>
        </div>
      </div>

      {/* ── Preview disclaimer ── */}
      <div className={styles.preview}>
        <div className={styles.previewInner}>
          <span className={styles.previewLabel}>Preview</span>
          <span className={styles.previewText}>
            Sample content. Live monitoring is coming soon — incident reports
            here aren&apos;t real.
          </span>
        </div>
      </div>

      <div ref={shellRef} className={styles.shell}>
        {/* ── Hero ── */}
        <header className={styles.hero}>
          <div className={styles.eyebrow}>System Status</div>
          <h1 className={styles.headline}>
            <SplitText
              tokens={H_LINES}
              classNames={{
                line: styles.headLine,
                letter: styles.headLetter,
                accent: styles.headLetterAccent,
                space: styles.headSpace,
              }}
            />
          </h1>
          <p className={styles.sub}>
            Service health, uptime, and incident history across the Nautilus
            platform.
          </p>
        </header>

        {/* ── Overview metrics ── */}
        <section className={styles.overview}>
          <div className={styles.metricCell}>
            <div className={styles.metricLabel}>Overall</div>
            <div className={styles.metricRow}>
              <span
                className={styles.metricDot}
                style={{ background: overallColor }}
              />
              <span className={styles.metricValue}>
                {hasIssue ? "Degraded" : "Operational"}
              </span>
            </div>
          </div>
          <div className={styles.metricCell}>
            <div className={styles.metricLabel}>Uptime — 90 days</div>
            <div className={styles.metricValueLarge}>{overallUptime}%</div>
          </div>
          <div className={styles.metricCell}>
            <div className={styles.metricLabel}>Components</div>
            <div className={styles.metricRow}>
              <span className={styles.metricValue}>
                {operational}
                <span className={styles.metricValueMuted}> / {total}</span>
              </span>
              <span className={styles.metricValueSmall}>operational</span>
            </div>
          </div>
          <div className={styles.metricCell}>
            <div className={styles.metricLabel}>Last incident</div>
            <div className={styles.metricRow}>
              <span className={styles.metricValue}>Apr 2</span>
              <span className={styles.metricValueSmall}>1 day ago</span>
            </div>
          </div>
        </section>

        {/* ── Service groups ── */}
        <section className={styles.servicesSection}>
          <div className={styles.sectionLabel}>Services</div>

          <div className={styles.serviceGrid}>
            {SERVICES.map((group, gi) => {
              const groupHasIssue = group.items.some(
                (i) => i.status !== "operational"
              );
              const groupColor = groupHasIssue
                ? STATUS_META.degraded.color
                : STATUS_META.operational.color;

              return (
                <div
                  key={group.group}
                  ref={(el) => (groupRefs.current[gi] = el)}
                  className={styles.serviceCard}
                >
                  <div className={styles.serviceCardHeader}>
                    <div className={styles.serviceCardLabel}>
                      <span className={styles.serviceCardNum}>
                        {String(gi + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.serviceCardSep}>/</span>
                      <span className={styles.serviceCardTitle}>
                        {group.group}
                      </span>
                    </div>
                    <div className={styles.serviceCardStatus}>
                      <span
                        className={styles.serviceStatusDot}
                        style={{ background: groupColor }}
                      />
                      <span
                        className={styles.serviceStatusLabel}
                        style={{ color: groupColor }}
                      >
                        {groupHasIssue ? "Issues" : "Operational"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.serviceList}>
                    {group.items.map((item) => (
                      <div key={item.name} className={styles.serviceRow}>
                        <span className={styles.serviceName}>{item.name}</span>
                        <div className={styles.serviceRight}>
                          <span className={styles.serviceUptime}>
                            {item.uptime}%
                          </span>
                          <span
                            className={styles.serviceItemDot}
                            style={{ background: s(item.status).color }}
                          />
                          <span
                            className={styles.serviceItemLabel}
                            style={{ color: s(item.status).color }}
                          >
                            {s(item.status).label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <UptimeChart seed={gi + 1} />
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            {Object.entries(STATUS_META).map(([k, m]) => (
              <div key={k} className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: m.color }}
                />
                <span className={styles.legendLabel}>{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Past incidents ── */}
        <section className={styles.incidentsSection}>
          <div className={styles.incidentsHeader}>
            <div className={styles.sectionLabel}>Incidents · Last 7 days</div>
          </div>

          <div className={styles.incidentsList}>
            {INCIDENTS.map((day, di) => (
              <div
                key={day.date}
                ref={(el) => (incidentRefs.current[di] = el)}
                className={styles.incidentDay}
              >
                <div className={styles.incidentDate}>{day.date}</div>

                {day.items.length === 0 && (
                  <div className={styles.incidentEmpty}>
                    <span className={styles.incidentEmptyDash} />
                    No incidents reported.
                  </div>
                )}

                {day.items.map((inc, ii) => {
                  const key = `${day.date}-${ii}`;
                  const isExp = expandedIncidents[key];
                  const incColor =
                    inc.status === "resolved" ? "#22c55e" : "#f59e0b";
                  return (
                    <div key={key} className={styles.incident}>
                      <button
                        type="button"
                        onClick={() => toggleIncident(key)}
                        className={styles.incidentHeader}
                        aria-expanded={isExp}
                      >
                        <div className={styles.incidentLeft}>
                          <span
                            className={styles.incidentDot}
                            style={{ background: incColor }}
                          />
                          <span className={styles.incidentTitle}>
                            {inc.title}
                          </span>
                        </div>
                        <div className={styles.incidentRight}>
                          <span
                            className={styles.incidentStatus}
                            style={{ color: incColor }}
                          >
                            {inc.status}
                          </span>
                          <svg
                            className={`${styles.incidentChevron} ${
                              isExp ? styles.incidentChevronOpen : ""
                            }`}
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="none"
                          >
                            <path
                              d="M1 1L5 5L9 1"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </button>

                      {isExp && (
                        <div className={styles.incidentUpdates}>
                          {inc.updates.map((u, ui) => (
                            <div key={ui} className={styles.incidentUpdate}>
                              <div className={styles.incidentUpdateHead}>
                                <span
                                  className={styles.incidentUpdateDot}
                                  style={{
                                    background: STATE_COLORS[u.state] || "#888",
                                  }}
                                />
                                <span
                                  className={styles.incidentUpdateState}
                                  style={{
                                    color: STATE_COLORS[u.state] || "#888",
                                  }}
                                >
                                  {u.state}
                                </span>
                                <span className={styles.incidentUpdateTime}>
                                  {u.time}
                                </span>
                              </div>
                              <p className={styles.incidentUpdateText}>
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
        </section>

        {/* ── Subscribe panel ── */}
        <section className={styles.subscribe}>
          <div className={styles.subscribeLeft}>
            <div className={styles.subscribeLabel}>Subscribe</div>
            <h2 className={styles.subscribeTitle}>
              Get notified when something breaks.
            </h2>
            <p className={styles.subscribeDesc}>
              Incident updates, status changes, and post-mortems sent to your
              inbox. One email per event, no marketing.
            </p>
          </div>
          <div className={styles.subscribeRight}>
            {subStatus === "success" ? (
              <div className={styles.subscribeSuccess}>
                <span className={styles.subscribeSuccessDot} />
                Subscribed. Check your inbox for confirmation.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className={styles.subscribeForm}>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={subStatus === "submitting"}
                  required
                  aria-label="Email address"
                  className={styles.subscribeInput}
                />
                <button
                  type="submit"
                  className={styles.subscribeBtn}
                  disabled={subStatus === "submitting"}
                >
                  {subStatus === "submitting" ? "Subscribing" : "Subscribe"}
                </button>
              </form>
            )}
            <div className={styles.subscribeMeta}>
              Prefer RSS?{" "}
              <a href="/status/rss" className={styles.subscribeMetaLink}>
                Atom feed
              </a>
            </div>
          </div>
        </section>
      </div>

      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
