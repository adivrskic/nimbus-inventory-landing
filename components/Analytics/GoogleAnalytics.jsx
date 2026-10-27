"use client";

/* ──────────────────────────────────────────────────────────────────────────
   components/Analytics/GoogleAnalytics.jsx
   ──────────────────────────────────────────────────────────────────────────
   Loads gtag.js + initializes Consent Mode v2.

   Mounted once in app/layout.js, gated on NEXT_PUBLIC_GA_MEASUREMENT_ID
   being present so dev / preview environments don't send traffic.

   Consent Mode v2 defaults — everything DENIED until the visitor accepts
   in components/CookieBanner/CookieBanner.jsx:
     analytics_storage   : denied
     ad_storage          : denied   (this site runs no ads)
     ad_user_data        : denied
     ad_personalization  : denied
     wait_for_update     : 500ms — gtag holds its first hits briefly so a
                           consent update issued on this same page load
                           (a returning visitor, below) is applied first.

   A stored choice is read from the `nautilus_consent` cookie (set by the
   banner via lib/consent.js, 12-month max-age). "granted" → an immediate
   consent update so a returning visitor is measured from the first
   pageview. "denied" or no cookie → nothing is measured; without the
   cookie the banner is shown. The cookie is deliberately the only source
   read here (localStorage is only a mirror the banner keeps for client
   convenience) so consent can never outlive its expiry.

   Pageview tracking is intentionally OFF for the initial config call
   (`send_page_view: false`). PageviewTracker handles every pageview
   manually because Next.js App Router doesn't fire automatic pageviews
   on client-side route changes — we'd either get none (just config-call
   firing once on hard load) or double pageviews on first load. Manual-
   only is the only approach that gets it right consistently.

   `anonymize_ip` is gone: GA4 never stores IP addresses and ignores the
   flag (it was a Universal Analytics setting).
   ────────────────────────────────────────────────────────────────────────── */

import Script from "next/script";
import { CONSENT_COOKIE } from "@/lib/consent";

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
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'wait_for_update': 500
          });
          (function () {
            try {
              var m = document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=(granted|denied)/);
              if (m && m[1] === 'granted') {
                gtag('consent', 'update', { 'analytics_storage': 'granted' });
              }
            } catch (e) {}
          })();
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}
