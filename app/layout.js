import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import LenisProvider from "@/components/LenisProvider";
import TransitionProvider from "@/components/TransitionProvider/TransitionProvider";
import { AnimationProvider } from "@/lib/AnimationContext";
import DemoHost from "@/lib/DemoContext";
import Nav from "@/components/Nav/Nav";
import ChatProvider from "@/components/Chat/ChatProvider";
import GoogleAnalytics from "@/components/Analytics/GoogleAnalytics";
import PageviewTracker from "@/components/Analytics/PageviewTracker";
import SkipLink from "@/components/SkipLink/SkipLink";
import RouteAnnouncer from "@/components/RouteAnnouncer/RouteAnnouncer";
import { SITE_URL } from "@/lib/site";
import "./globals.css";
import "./globals.ocean-theme.css";

/* JetBrains Mono — served by Next.js's Google Fonts pipeline (self-hosted,
   stripped, fingerprinted, preloaded). The .variable exposes it as a CSS
   custom property on <html>; globals.css references it via
   var(--font-jetbrains) on the --mono token. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

/* Satoshi — self-hosted via next/font/local. Replaces the old @font-face
   declaration in globals.css that fetched from cdn.jsdelivr.net.

   Wins:
   - Same-origin, fingerprinted, served from the Next.js asset pipeline
   - <link rel="preload"> tag generated automatically — font fetch starts
     in parallel with the HTML parse, not after CSSOM construction
   - size-adjust fallback font generated automatically — no CLS when
     the variable font swaps in (the old @font-face had font-display:
     swap but no metric override, so the swap-in caused layout shift
     across every heading on the page)

   The WOFF2 file must exist at app/fonts/Satoshi-Variable.woff2.
   Download once from:
     https://cdn.jsdelivr.net/gh/nicholasgillespie/fonts@main/satoshi/Satoshi-Variable.woff2

   weight: "300 900" matches the original @font-face declaration —
   Satoshi-Variable is a variable font with the full 300-900 axis. */
const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
});

/* Canonical origin comes from the shared site config (imported at top) so
   there's a single source of truth across layout, sitemap, robots, JSON-LD. */

/* GA4 measurement id — gated env var. Missing in dev / preview = no
   tracking script loads, no events fire, no errors. Production env
   var on Netlify should be set to G-XXXXXXXXXX. Must use NEXT_PUBLIC_
   prefix so it's available client-side. */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Nautilus Inventory — AI-Powered Warehouse Management",
    template: "%s | Nautilus Inventory",
  },
  description:
    "AI-powered warehouse intelligence for modern operations teams. Scanning, spatial mapping, pick optimization, and predictive analytics in a single platform.",
  keywords: [
    "warehouse management system",
    "WMS",
    "inventory management",
    "pick optimization",
    "warehouse AI",
    "barcode scanning",
    "cycle counting",
    "spatial mapping",
    "3PL software",
    "warehouse automation",
  ],
  authors: [{ name: "Nautilus" }],
  creator: "Nautilus",
  publisher: "Nautilus",
  formatDetection: { email: false, telephone: false, address: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Nautilus Inventory",
    title: "Nautilus Inventory — AI-Powered Warehouse Management",
    description:
      "AI-powered warehouse intelligence for modern operations teams. Scanning, spatial mapping, pick optimization, and predictive analytics in a single platform.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nautilus Inventory — AI-Powered Warehouse Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nautilus Inventory — AI-Powered Warehouse Management",
    description:
      "AI-powered warehouse intelligence for modern operations teams.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: { canonical: SITE_URL },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#04091c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${satoshi.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Preconnect to GA's third-party origins so the TLS handshake
            and DNS resolution complete in parallel with the HTML parse
            rather than blocking the first GA script eval. Saves
            ~150-300ms on cold connections.

            Conditional on GA being configured — otherwise the preconnect
            triggers a useless round-trip on every page load. The
            crossorigin attribute is required for googletagmanager.com
            because gtag.js is fetched as a cross-origin script; without
            it, the preconnect's HTTP connection is silently discarded
            and reopened for the actual script fetch.

            Not in the list:
              - api.anthropic.com: client never connects directly.
                /api/chat is same-origin; the server proxies to Anthropic.
              - calendly.com: opened in window.open() new tabs, which
                get their own browsing contexts — preconnect on parent
                doesn't transfer.
              - cdn.jsdelivr.net: previously needed for the Satoshi font,
                obsoleted by the next/font/local setup above. */}
        {GA_MEASUREMENT_ID ? (
          <>
            <link
              rel="preconnect"
              href="https://www.googletagmanager.com"
              crossOrigin=""
            />
            <link
              rel="preconnect"
              href="https://www.google-analytics.com"
              crossOrigin=""
            />
          </>
        ) : null}
      </head>
      <body>
        {/* Skip link — first interactive element in the tab order on
            every page. Visually hidden until focused; lets keyboard
            users jump past the Nav. WCAG 2.4.1 (Bypass Blocks). */}
        <SkipLink />

        {/* Analytics — script loader + SPA pageview tracker. Both no-op
            when NEXT_PUBLIC_GA_MEASUREMENT_ID isn't set. Mounted outside
            the providers because they don't depend on any of them and
            shouldn't be affected by transition/animation state. */}
        <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
        {GA_MEASUREMENT_ID ? <PageviewTracker /> : null}

        <AnimationProvider>
          <LenisProvider>
            <TransitionProvider>
              {/* DemoHost owns the modal + provides openDemo via context.
                  Wraps everything below so any descendant can pop the modal.
                  DemoModal is dynamically imported inside DemoContext now
                  (Wave 1 perf), so the ~700 lines of modal JSX + GSAP
                  setup don't ship in the main bundle. */}
              <DemoHost>
                <Nav />
                {/* id + tabIndex make this the skip-link target and let
                    RouteAnnouncer move focus here on client-side
                    navigation (WCAG 2.4.3 Focus Order). data-page-content
                    is the existing attribute TransitionProvider uses to
                    find the fade target — keep it.

                    style={{ outline: "none" }} suppresses the default
                    browser focus ring on the giant container when
                    RouteAnnouncer programmatically focuses it; the
                    page change is announced via aria-live, the visual
                    ring on a full-width element is unhelpful. */}
                <main
                  id="main-content"
                  tabIndex={-1}
                  data-page-content
                  style={{ outline: "none" }}
                >
                  {children}
                </main>
                <ChatProvider />
              </DemoHost>
            </TransitionProvider>
          </LenisProvider>
        </AnimationProvider>

        {/* RouteAnnouncer — announces page changes to screen readers
            and moves focus to #main-content on SPA navigation. Renders
            nothing visible. Mounted at the end of body to keep it out
            of the tab order. */}
        <RouteAnnouncer />
      </body>
    </html>
  );
}
