"use client";

/* ──────────────────────────────────────────────────────────────────────────
   components/Analytics/GoogleAnalytics.jsx
   ──────────────────────────────────────────────────────────────────────────
   Loads gtag.js + initializes Consent Mode v2.

   Mounted once in app/layout.js, gated on NEXT_PUBLIC_GA_MEASUREMENT_ID
   being present so dev / preview environments don't send traffic.

   Consent Mode v2 defaults:
     analytics_storage   : granted   (pageviews + events work out of the box)
     ad_storage          : denied
     ad_user_data        : denied
     ad_personalization  : denied

   Rationale: this site doesn't run ads, so the ad_* signals start denied.
   analytics_storage starts granted so US/non-EU traffic tracks immediately
   without a cookie banner. Before launching in EU/UK markets, flip
   analytics_storage to 'denied' here and call setConsent({analytics:true})
   from your cookie banner after the user accepts.

   Pageview tracking is intentionally OFF for the initial config call
   (`send_page_view: false`). PageviewTracker handles every pageview
   manually because Next.js App Router doesn't fire automatic pageviews
   on client-side route changes — we'd either get none (just config-call
   firing once on hard load) or double pageviews on first load. Manual-
   only is the only approach that gets it right consistently.
   ────────────────────────────────────────────────────────────────────────── */

import Script from "next/script";

export default function GoogleAnalytics({ measurementId }) {
  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){ dataLayer.push(arguments); }
          window.gtag = gtag;
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'granted'
          });
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            send_page_view: false,
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}
