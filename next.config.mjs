/** @type {import('next').NextConfig} */

// Security response headers
// Applied to every route via the headers() hook below (@netlify/plugin-nextjs
// honors next.config headers). These are defense-in-depth: the app already
// escapes all user input in emails + renders chat output as escaped React
// text, so this is a second line, plus clickjacking + transport hardening.
//
// CSP is shipped in REPORT-ONLY first (Content-Security-Policy-Report-Only)
// so it can't break the inline Google Analytics bootstrap, Next.js's inline
// hydration scripts, or the heavy inline styles in the 3D sections while you
// tune it. Watch the browser console / a report endpoint for violations,
// tighten the policy (ideally move to nonces and drop 'unsafe-inline' from
// script-src), then rename the header to `Content-Security-Policy` to
// enforce. Until then it observes without blocking.
const isProd = process.env.NODE_ENV === "production";

const cspReportOnly = [
  "default-src 'self'",
  // 'unsafe-inline' is required while the GA bootstrap + Next hydration run
  // inline. Replace with per-request nonces before enforcing.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  // /api/chat SSE is same-origin; GA collects to *.google-analytics.com.
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
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
  // Observe-only CSP â€” see note above. Flip to "Content-Security-Policy"
  // once tuned.
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
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
