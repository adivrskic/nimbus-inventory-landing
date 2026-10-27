// Analytics consent (Google Consent Mode v2) — one place for the cookie
// name, the read/write helpers and the gtag update, shared by the cookie
// banner, the footer's "Cookie preferences" link and (as an inline copy)
// the GA bootstrap script in components/Analytics/GoogleAnalytics.jsx.
//
// The cookie is the source of truth: it is what the GA bootstrap reads on
// the next page load, before React mounts. localStorage only mirrors it as
// a convenience for client code; it never grants consent on its own.
//
// Values: "granted" | "denied". Absent = no choice yet → banner shows.

export const CONSENT_COOKIE = "nautilus_consent";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 12 months
/* Dispatched on window by the footer's "Cookie preferences" link; the
   banner listens and re-opens. */
export const PREFS_EVENT = "nautilus:cookie-prefs";

const VALID = new Set(["granted", "denied"]);

export function readConsent() {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${CONSENT_COOKIE}=(granted|denied)`)
  );
  return m ? m[1] : null;
}

function setCookie(value, maxAge) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

export function writeConsent(value) {
  if (!VALID.has(value) || typeof document === "undefined") return;
  setCookie(value, CONSENT_MAX_AGE);
  try {
    window.localStorage.setItem(CONSENT_COOKIE, value);
  } catch {
    /* private mode / storage disabled — the cookie is what matters */
  }
}

export function clearConsent() {
  if (typeof document === "undefined") return;
  setCookie("", 0);
  try {
    window.localStorage.removeItem(CONSENT_COOKIE);
  } catch {
    /* ignore */
  }
}

/* Tell gtag about the choice. Safe to call before gtag.js has loaded —
   `window.gtag` is the dataLayer shim defined by the bootstrap script, so
   the update is queued and honoured when the library arrives. */
export function applyConsent(value) {
  if (!VALID.has(value) || typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", { analytics_storage: value });
}
