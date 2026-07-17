/** @type {import('next').NextConfig} */

// Security response headers
// Applied to every route via the headers() hook below (@netlify/plugin-nextjs
// honors next.config headers). These are defense-in-depth: the app already
// escapes all user input in emails + renders chat output as escaped React
// text, so this is a second line, plus clickjacking + transport hardening.
//
// CSP — ENFORCED (Content-Security-Policy). It ran as Report-Only through
// mid-July 2026 with no violations across a full route walk; the policy
// below matches everything the site actually loads. The only third party
// is Google Analytics (gtag.js), so the GA origins follow Google's official
// CSP guide for GA4 (script from *.googletagmanager.com; beacons/pixels to
// *.google-analytics.com / *.analytics.google.com).
//
// Deliberate tradeoff — script-src keeps 'unsafe-inline': every page here
// is statically prerendered (102 pages), and the App Router embeds per-page
// inline hydration/flight scripts whose content varies by page and build.
// Nonces would force every page to render per-request (killing static/CDN
// caching) and build-time hashes can't be enumerated from next.config, so
// inline scripts stay allowed. Do NOT add any 'sha256-…' hash or nonce to
// script-src while 'unsafe-inline' is present — per CSP2, the presence of a
// hash/nonce makes browsers IGNORE 'unsafe-inline', which would break the
// hydration scripts everywhere. The enforced policy still locks down every
// other vector: no foreign script origins, no objects/embeds, no base-URI
// hijack, forms only submit same-origin, and the site can't be framed.
const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  // Inline: GA bootstrap + Next's static-page hydration scripts (see note
  // above). External: gtag.js only ever loads from *.googletagmanager.com.
  // Dev additionally needs 'unsafe-eval' for the bundler's eval sourcemaps.
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://*.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  // data: covers the inline-SVG noise texture; GA falls back to <img>
  // pixels on *.google-analytics.com when sendBeacon/fetch is unavailable.
  "img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com",
  "font-src 'self' data:",
  // /api/chat SSE is same-origin; GA collects to regional
  // *.google-analytics.com / *.analytics.google.com endpoints. Dev needs
  // ws: for HMR.
  `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com${isProd ? "" : " ws:"}`,
  "media-src 'self'",
  // No third-party embeds anywhere on the site (the video modal is a local
  // placeholder). Loosen this if a YouTube/Wistia embed ever ships.
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // Prod-only: on http://localhost this would try to upgrade dev-server
  // subresources to https and break local dev in some browsers.
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable powerful APIs the site doesn't use.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Enforced CSP — see note above.
  { key: "Content-Security-Policy", value: csp },
];

// HSTS only in production (don't send it from local http dev). 2 years +
// subdomains. `preload` is intentionally omitted â€” it's a hard-to-reverse
// commitment; add it once you're confident every subdomain is HTTPS-only.
if (isProd) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  });
}

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
