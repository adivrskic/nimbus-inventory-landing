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
//   import { track } from "@/lib/analytics";
//
//   // Inside an event handler, after a successful submit, etc:
//   track("contact_submit", { source: "/contact" });
//   track("demo_modal_open", { topic: "sales" });
//   track("chat_message_sent", { conversation_id: id });
//
// Convention: event names are lowercase_snake_case. Params are flat
// key→string|number|bool maps. Avoid nested objects — GA4 flattens them
// awkwardly and the explore UI can't filter on nested fields.
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
