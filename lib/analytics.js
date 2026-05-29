export function track(eventName, params = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  try {
    window.gtag("event", eventName, params);
  } catch (err) {
    console.error("[analytics] track failed:", err);
  }
}

export function trackLead({ leadType, topic, submissionId } = {}) {
  if (!leadType) return;
  const params = { lead_type: leadType };
  if (topic) params.topic = topic;
  if (submissionId) params.submission_id = submissionId;
  track("generate_lead", params);
}

export function trackLeadError({ leadType, reason } = {}) {
  if (!leadType || !reason) return;
  track("lead_form_error", { lead_type: leadType, reason });
}

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
