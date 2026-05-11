"use client";
import { useRef, useState, useCallback } from "react";
import {
  ResourceShell,
  ResourceTOC,
  useResourceSectionAnimations,
} from "@/components/ResourceShell";
import DemoModal from "@/components/DemoModal/DemoModal";
import shellStyles from "@/components/ResourceShell/ResourceShell.module.css";
import pageStyles from "./ApiDocs.module.css";
import { validateWaitlist } from "@/lib/validation";

/* ─────────────────────────────────────────────────────
   CONTENT
───────────────────────────────────────────────────── */

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "products", label: "Products" },
  { id: "scans", label: "Scans" },
  { id: "webhooks", label: "Webhooks" },
  { id: "capabilities", label: "Capabilities" },
  { id: "sdks", label: "SDKs" },
  { id: "versioning", label: "Versioning" },
  { id: "support", label: "Support" },
];

const METADATA = [
  { label: "Status", value: "v1 Preview" },
  { label: "Base URL", value: "api.nimbuswms.com" },
  { label: "Format", value: "JSON" },
  { label: "Auth", value: "Bearer token" },
];

const CODE_AUTH = [
  { t: "Authorization", c: "key" },
  { t: ": Bearer " },
  { t: "sk_live_4Kf2x9aQ8nL...", c: "str" },
];

const CODE_PRODUCTS = {
  request: [
    { t: "GET ", c: "method" },
    { t: "https://api.nimbuswms.com/v1/products?limit=50\n" },
    { t: "Authorization", c: "key" },
    { t: ": Bearer " },
    { t: "sk_live_4Kf2x9aQ8nL...", c: "str" },
  ],
  response: [
    { t: "{\n" },
    { t: '  "data"', c: "key" },
    { t: ": [\n    {\n" },
    { t: '      "id"', c: "key" },
    { t: ": " },
    { t: '"prod_8x4f2"', c: "str" },
    { t: ",\n" },
    { t: '      "sku"', c: "key" },
    { t: ": " },
    { t: '"OAK-PLANK-12"', c: "str" },
    { t: ",\n" },
    { t: '      "name"', c: "key" },
    { t: ": " },
    { t: '"Oak Plank 12in"', c: "str" },
    { t: ",\n" },
    { t: '      "quantity_on_hand"', c: "key" },
    { t: ": " },
    { t: "482", c: "num" },
    { t: ",\n" },
    { t: '      "location"', c: "key" },
    { t: ": " },
    { t: '"A-01-3"', c: "str" },
    { t: ",\n" },
    { t: '      "updated_at"', c: "key" },
    { t: ": " },
    { t: '"2026-05-08T14:22:01Z"', c: "str" },
    { t: "\n    }\n  ],\n" },
    { t: '  "has_more"', c: "key" },
    { t: ": " },
    { t: "true", c: "bool" },
    { t: "\n}" },
  ],
};

const CODE_SCANS = {
  request: [
    { t: "POST ", c: "method" },
    { t: "https://api.nimbuswms.com/v1/scans\n" },
    { t: "Authorization", c: "key" },
    { t: ": Bearer " },
    { t: "sk_live_4Kf2x9aQ8nL...\n", c: "str" },
    { t: "Content-Type", c: "key" },
    { t: ": application/json\n\n{\n" },
    { t: '  "action"', c: "key" },
    { t: ": " },
    { t: '"pick"', c: "str" },
    { t: ",\n" },
    { t: '  "sku"', c: "key" },
    { t: ": " },
    { t: '"OAK-PLANK-12"', c: "str" },
    { t: ",\n" },
    { t: '  "location"', c: "key" },
    { t: ": " },
    { t: '"A-01-3"', c: "str" },
    { t: ",\n" },
    { t: '  "quantity"', c: "key" },
    { t: ": " },
    { t: "24", c: "num" },
    { t: ",\n" },
    { t: '  "device_id"', c: "key" },
    { t: ": " },
    { t: '"scanner_7f"', c: "str" },
    { t: "\n}" },
  ],
  response: [
    { t: "{\n" },
    { t: '  "id"', c: "key" },
    { t: ": " },
    { t: '"scn_3k8d2"', c: "str" },
    { t: ",\n" },
    { t: '  "recorded_at"', c: "key" },
    { t: ": " },
    { t: '"2026-05-08T14:22:01Z"', c: "str" },
    { t: ",\n" },
    { t: '  "balance_after"', c: "key" },
    { t: ": " },
    { t: "458", c: "num" },
    { t: "\n}" },
  ],
};

const CODE_WEBHOOK = {
  request: [
    { t: "// Sent to your configured endpoint\n", c: "comment" },
    { t: "POST ", c: "method" },
    { t: "https://your-app.com/nimbus-webhook\n" },
    { t: "Content-Type", c: "key" },
    { t: ": application/json\n" },
    { t: "Nimbus-Signature", c: "key" },
    { t: ": " },
    { t: '"v1=8a2b..."', c: "str" },
    { t: "\n\n{\n" },
    { t: '  "event"', c: "key" },
    { t: ": " },
    { t: '"low_stock"', c: "str" },
    { t: ",\n" },
    { t: '  "data"', c: "key" },
    { t: ": {\n" },
    { t: '    "sku"', c: "key" },
    { t: ": " },
    { t: '"OAK-PLANK-12"', c: "str" },
    { t: ",\n" },
    { t: '    "quantity"', c: "key" },
    { t: ": " },
    { t: "12", c: "num" },
    { t: ",\n" },
    { t: '    "threshold"', c: "key" },
    { t: ": " },
    { t: "50", c: "num" },
    { t: "\n  }\n}" },
  ],
  response: [
    { t: "// Reply 200 within 5s to acknowledge\n", c: "comment" },
    {
      t: "// Otherwise Nimbus retries with exponential backoff\n\n",
      c: "comment",
    },
    { t: "{\n" },
    { t: '  "received"', c: "key" },
    { t: ": " },
    { t: "true", c: "bool" },
    { t: "\n}" },
  ],
};

const CODE_SDKS = [
  { t: "// Node.js\n", c: "comment" },
  { t: "npm install ", c: "muted" },
  { t: "@nimbuswms/sdk\n\n", c: "str" },
  { t: "// Python\n", c: "comment" },
  { t: "pip install ", c: "muted" },
  { t: "nimbuswms", c: "str" },
];

const CAPABILITIES = [
  {
    title: "Products & inventory",
    desc: "Read and update product catalog, stock levels, locations, and metadata. Bulk operations with cursor pagination.",
  },
  {
    title: "Scan events",
    desc: "Record pick, putaway, receive, relocate, count, adjust, ship, and return actions from any device.",
  },
  {
    title: "Webhooks",
    desc: "Real-time event delivery for low stock, location changes, cycle count results, and 20+ more event types.",
  },
  {
    title: "Search",
    desc: "Query the same AI-powered search that powers the app — natural language across products, locations, and history.",
  },
  {
    title: "Reports & analytics",
    desc: "Programmatic access to dashboards: throughput, accuracy, dwell time, route efficiency, anomaly scores.",
  },
  {
    title: "SDKs & Zapier",
    desc: "Official Node and Python SDKs, plus 5,000+ no-code integrations via our Zapier app.",
  },
];

const INITIAL_FORM = { email: "", website: "" };

/* ─────────────────────────────────────────────────────
   Syntax-highlighted code rendering helper
───────────────────────────────────────────────────── */
const renderCode = (parts) =>
  parts.map((p, i) => {
    const cls =
      p.c === "method"
        ? shellStyles.cMethod
        : p.c === "key"
        ? shellStyles.cKey
        : p.c === "str"
        ? shellStyles.cStr
        : p.c === "num"
        ? shellStyles.cNum
        : p.c === "bool"
        ? shellStyles.cBool
        : p.c === "comment"
        ? shellStyles.cComment
        : p.c === "muted"
        ? shellStyles.cMuted
        : null;
    return (
      <span key={i} className={cls || undefined}>
        {p.t}
      </span>
    );
  });

/* ═══════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function ApiDocsClient() {
  const contentRef = useRef(null);
  useResourceSectionAnimations(contentRef);

  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  /* Waitlist form state */
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");

  const updateField = useCallback((name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => {
      if (!e[name]) return e;
      const next = { ...e };
      delete next[name];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (status === "submitting") return;
      const validationErrors = validateWaitlist(form);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      setStatus("submitting");
      setSubmitError("");
      try {
        const res = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.fieldErrors) setErrors(data.fieldErrors);
          setSubmitError(
            data.error || "Could not save your signup. Please try again."
          );
          setStatus("error");
          return;
        }
        setStatus("success");
      } catch (err) {
        console.error(err);
        setSubmitError(
          "Network error. Please check your connection and try again."
        );
        setStatus("error");
      }
    },
    [form, status]
  );

  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";

  return (
    <>
      <ResourceShell
        topStrip={{
          text: "Early access · v1 launches Q3 2026",
          link: { href: "#overview", text: "Join the waitlist →" },
        }}
        eyebrow="API Reference"
        title="Nimbus API"
        subtitle="A REST API, webhooks, and SDKs for warehouse operations. Pull inventory, record scans, and react to real-time events."
        metadata={METADATA}
        onDemo={openDemo}
      >
        <div className={shellStyles.body}>
          <ResourceTOC sections={SECTIONS} />

          <main ref={contentRef} className={shellStyles.content}>
            {/* Overview */}
            <section id="overview" className={shellStyles.section}>
              <h2 className={shellStyles.h2}>Overview</h2>
              <p className={shellStyles.p}>
                The Nimbus API is a REST interface to warehouse operations data.
                Requests use JSON, resource-oriented URLs, and conventional HTTP
                status codes. v1 enters general availability in{" "}
                <strong>Q3 2026</strong>. Until then, we&apos;re onboarding
                select early-access customers.
              </p>

              <div className={shellStyles.inlineNote}>
                {isSuccess ? (
                  <div className={pageStyles.waitlistSuccess}>
                    <span className={pageStyles.waitlistSuccessDot} />
                    You&apos;re on the list. We&apos;ll email you when access
                    opens.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate autoComplete="on">
                    <div className={pageStyles.honeypot} aria-hidden="true">
                      <label>
                        Website
                        <input
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={form.website}
                          onChange={(e) =>
                            updateField("website", e.target.value)
                          }
                        />
                      </label>
                    </div>
                    <div className={pageStyles.waitlistRow}>
                      <input
                        id="api-waitlist-email"
                        name="email"
                        type="email"
                        placeholder="you@company.com"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        disabled={isSubmitting}
                        aria-invalid={errors.email ? "true" : "false"}
                        className={`${pageStyles.waitlistInput} ${
                          errors.email ? pageStyles.waitlistInputError : ""
                        }`}
                      />
                      <button
                        type="submit"
                        className={pageStyles.waitlistBtn}
                        disabled={isSubmitting}
                        aria-busy={isSubmitting ? "true" : "false"}
                      >
                        {isSubmitting ? "Joining" : "Join waitlist"}
                      </button>
                    </div>
                    {errors.email ? (
                      <div className={pageStyles.waitlistErr}>
                        {errors.email}
                      </div>
                    ) : submitError ? (
                      <div className={pageStyles.waitlistErr} role="alert">
                        {submitError}
                      </div>
                    ) : null}
                  </form>
                )}
              </div>
            </section>

            {/* Authentication */}
            <section id="authentication" className={shellStyles.section}>
              <h2 className={shellStyles.h2}>Authentication</h2>
              <p className={shellStyles.p}>
                All requests authenticate with a Bearer token in the{" "}
                <code className={shellStyles.inlineCode}>Authorization</code>{" "}
                header. API keys are created in the Nimbus dashboard at launch.
                Keep secret keys server-side — they grant full access to your
                warehouse data.
              </p>
              <div className={shellStyles.codeBlock}>
                <div className={shellStyles.codeBar}>
                  <span className={shellStyles.codeBarLabel}>Header</span>
                </div>
                <pre className={shellStyles.codePre}>
                  {renderCode(CODE_AUTH)}
                </pre>
              </div>
            </section>

            {/* Products */}
            <section id="products" className={shellStyles.section}>
              <h2 className={shellStyles.h2}>Products</h2>
              <p className={shellStyles.p}>
                Read and update the product catalog, stock levels, locations,
                and metadata. Bulk operations supported with cursor pagination
                via <code className={shellStyles.inlineCode}>next_cursor</code>.
              </p>
              <div className={shellStyles.codeDuo}>
                <div className={shellStyles.codeBlock}>
                  <div className={shellStyles.codeBar}>
                    <span className={shellStyles.codeBarMethod}>GET</span>
                    <span className={shellStyles.codeBarPath}>
                      /v1/products
                    </span>
                  </div>
                  <pre className={shellStyles.codePre}>
                    {renderCode(CODE_PRODUCTS.request)}
                  </pre>
                </div>
                <div className={shellStyles.codeBlock}>
                  <div className={shellStyles.codeBar}>
                    <span className={shellStyles.codeBarLabel}>
                      Response · 200 OK
                    </span>
                  </div>
                  <pre className={shellStyles.codePre}>
                    {renderCode(CODE_PRODUCTS.response)}
                  </pre>
                </div>
              </div>
            </section>

            {/* Scans */}
            <section id="scans" className={shellStyles.section}>
              <h2 className={shellStyles.h2}>Scans</h2>
              <p className={shellStyles.p}>
                Record pick, putaway, receive, relocate, count, adjust, ship,
                and return actions from any device. Scans are the source of
                truth for stock movements.
              </p>
              <div className={shellStyles.codeDuo}>
                <div className={shellStyles.codeBlock}>
                  <div className={shellStyles.codeBar}>
                    <span className={shellStyles.codeBarMethod}>POST</span>
                    <span className={shellStyles.codeBarPath}>/v1/scans</span>
                  </div>
                  <pre className={shellStyles.codePre}>
                    {renderCode(CODE_SCANS.request)}
                  </pre>
                </div>
                <div className={shellStyles.codeBlock}>
                  <div className={shellStyles.codeBar}>
                    <span className={shellStyles.codeBarLabel}>
                      Response · 201 Created
                    </span>
                  </div>
                  <pre className={shellStyles.codePre}>
                    {renderCode(CODE_SCANS.response)}
                  </pre>
                </div>
              </div>
            </section>

            {/* Webhooks */}
            <section id="webhooks" className={shellStyles.section}>
              <h2 className={shellStyles.h2}>Webhooks</h2>
              <p className={shellStyles.p}>
                Real-time event delivery for low stock, location changes, cycle
                count results, and 20+ more event types. Configure endpoints in
                the dashboard. Reply{" "}
                <code className={shellStyles.inlineCode}>200</code> within 5
                seconds to acknowledge; otherwise Nimbus retries with
                exponential backoff for 24 hours.
              </p>
              <div className={shellStyles.codeDuo}>
                <div className={shellStyles.codeBlock}>
                  <div className={shellStyles.codeBar}>
                    <span className={shellStyles.codeBarLabel}>
                      Event payload
                    </span>
                  </div>
                  <pre className={shellStyles.codePre}>
                    {renderCode(CODE_WEBHOOK.request)}
                  </pre>
                </div>
                <div className={shellStyles.codeBlock}>
                  <div className={shellStyles.codeBar}>
                    <span className={shellStyles.codeBarLabel}>
                      Your response
                    </span>
                  </div>
                  <pre className={shellStyles.codePre}>
                    {renderCode(CODE_WEBHOOK.response)}
                  </pre>
                </div>
              </div>
            </section>

            {/* Capabilities */}
            <section id="capabilities" className={shellStyles.section}>
              <h2 className={shellStyles.h2}>Capabilities</h2>
              <p className={shellStyles.p}>
                Everything in the Nimbus app is exposed through the API.
                You&apos;ll find endpoints and webhooks for each of the
                following.
              </p>
              <dl className={shellStyles.dl}>
                {CAPABILITIES.map((c) => (
                  <div key={c.title} className={shellStyles.dlRow}>
                    <dt className={shellStyles.dt}>{c.title}</dt>
                    <dd className={shellStyles.dd}>{c.desc}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* SDKs */}
            <section id="sdks" className={shellStyles.section}>
              <h2 className={shellStyles.h2}>SDKs</h2>
              <p className={shellStyles.p}>
                Official SDKs for Node and Python. Plus a Zapier app for no-code
                workflows. All SDKs follow the same naming as the REST
                resources.
              </p>
              <div className={shellStyles.codeBlock}>
                <div className={shellStyles.codeBar}>
                  <span className={shellStyles.codeBarLabel}>Install</span>
                </div>
                <pre className={shellStyles.codePre}>
                  {renderCode(CODE_SDKS)}
                </pre>
              </div>
            </section>

            {/* Versioning */}
            <section id="versioning" className={shellStyles.section}>
              <h2 className={shellStyles.h2}>Versioning</h2>
              <p className={shellStyles.p}>
                The API uses URI versioning —{" "}
                <code className={shellStyles.inlineCode}>v1</code> today.
                Breaking changes ship behind new major versions; new fields and
                endpoints are added in-place without bumping. We commit to{" "}
                <strong>12 months of advance notice</strong> before sunsetting
                any version, and to publishing migration guides at least 6
                months ahead of cutover.
              </p>
            </section>

            {/* Support */}
            <section id="support" className={shellStyles.section}>
              <h2 className={shellStyles.h2}>Support</h2>
              <p className={shellStyles.p}>
                Early-access customers get direct access to the engineering
                team. Email{" "}
                <a
                  href="mailto:developers@nimbuswms.com"
                  className={shellStyles.link}
                >
                  developers@nimbuswms.com
                </a>
                , join our developer Slack at launch, or reach out via the{" "}
                <a href="/contact" className={shellStyles.link}>
                  contact form
                </a>
                .
              </p>
              <p className={shellStyles.p}>
                If you&apos;re building something specific and want to discuss
                it before v1 ships, talk to our team — we&apos;re shaping the
                API based on real integrations.
              </p>
              <div className={pageStyles.supportCtaRow}>
                <button
                  type="button"
                  onClick={openDemo}
                  className={pageStyles.supportBtn}
                >
                  Talk to our team →
                </button>
              </div>
            </section>
          </main>
        </div>
      </ResourceShell>

      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
