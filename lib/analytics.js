// ──────────────────────────────────────────────────────────────────────────
// lib/analytics.js
// ──────────────────────────────────────────────────────────────────────────
// Lightweight wrapper around window.gtag (GA4).
//
// Safe to import from anywhere. Every function is a no-op when:
//   - Running on the server (typeof window === 'undefined')
//   - gtag hasn't loaded yet (script still in flight, or env var missing)
//   - the env var NEXT_PUBLIC_GA_MEASUREMENT_ID isn't set (dev/preview)
//
// Usage:
//
//   import { track, trackLead, trackLeadError } from "@/lib/analytics";
//
//   // Generic custom event:
//   track("demo_modal_open", { topic: "sales", source: "pricing_tier_enterprise" });
//
//   // Lead-form success (GA4 recommended event name):
//   trackLead({ leadType: "demo", topic: "sales", submissionId: data.submissionId });
//
//   // Lead-form failure (custom event for drop-off analysis):
//   trackLeadError({ leadType: "demo", reason: "validation" });
//
// Convention: event names are lowercase_snake_case. Params are flat
// key→string|number|bool maps. Avoid nested objects — GA4 flattens them
// awkwardly and the explore UI can't filter on nested fields.
//
// PII rule: never pass email, name, company, message content, or any
// other free-form user input as event params. IDs (UUIDs from API
// responses), enums, categories, and counts only.
// ──────────────────────────────────────────────────────────────────────────

/**
 * Send a custom event to GA4.
 *
 * @param {string} eventName  Lowercase_snake_case event name
 * @param {object} [params]   Flat parameter map (string/number/bool values)
 */
export function track(eventName, params = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  try {
    window.gtag("event", eventName, params);
  } catch (err) {
    /* gtag itself never throws under normal conditions, but the dataLayer
       shim can if it gets garbage. Swallow + log so a bad track call never
       breaks the UI. */
    console.error("[analytics] track failed:", err);
  }
}

/**
 * Fire GA4's recommended `generate_lead` event for a successful form
 * submission. Using the recommended name (vs a custom `demo_submit`)
 * unlocks GA4's built-in lead-generation reports and exploration
 * templates — no extra setup needed beyond registering the lead_type
 * and topic params as custom dimensions in the GA4 admin.
 *
 * @param {object}  opts
 * @param {string}  opts.leadType      'demo' | 'contact' | 'waitlist'
 * @param {string}  [opts.topic]       For demo: 'demo' | 'sales' | 'migration' | 'integration'
 * @param {string}  [opts.submissionId] UUID from the API response. Safe to pass — not PII.
 */
export function trackLead({ leadType, topic, submissionId } = {}) {
  if (!leadType) return;
  const params = { lead_type: leadType };
  if (topic) params.topic = topic;
  if (submissionId) params.submission_id = submissionId;
  track("generate_lead", params);
}

/**
 * Fire a lead-form error event. Pairs with trackLead() to expose
 * drop-off causes — validation errors, network failures, server 5xx,
 * rate-limit 429s. Cheap enough to fire on every error path.
 *
 * @param {object} opts
 * @param {string} opts.leadType  'demo' | 'contact' | 'waitlist'
 * @param {string} opts.reason    'validation' | 'network' | 'server' | 'rate_limited'
 */
export function trackLeadError({ leadType, reason } = {}) {
  if (!leadType || !reason) return;
  track("lead_form_error", { lead_type: leadType, reason });
}

/**
 * Update GA4 Consent Mode v2 state. Call this from a cookie banner when
 * the user grants or revokes consent — GA queues events under the
 * default state and replays them with the updated consent on call.
 *
 * Default state (set in <GoogleAnalytics>): analytics granted, ads denied.
 *
 * @param {object} consent
 * @param {boolean} [consent.analytics]  Toggle analytics_storage
 * @param {boolean} [consent.ads]        Toggle the three ad_* signals together
 */
export function setConsent({ analytics, ads = false } = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  const update = {};
  if (typeof analytics === "boolean") {
    update.analytics_storage = analytics ? "granted" : "denied";
  }
  if (typeof ads === "boolean") {
    update.ad_storage = ads ? "granted" : "denied";
    update.ad_user_data = ads ? "granted" : "denied";
    update.ad_personalization = ads ? "granted" : "denied";
  }
  try {
    window.gtag("consent", "update", update);
  } catch (err) {
    console.error("[analytics] setConsent failed:", err);
  }
}

/**
 * Fire a page_view manually. PageviewTracker does this automatically on
 * route changes, so you should rarely need it — only useful for explicit
 * virtual pageviews (e.g. a multi-step modal where each step counts as
 * its own "page" in funnel analysis).
 */
export function trackPageview(pathOverride) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  const path =
    pathOverride || window.location.pathname + window.location.search;
  try {
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.origin + path,
      page_title: document.title,
    });
  } catch (err) {
    console.error("[analytics] trackPageview failed:", err);
  }
}
