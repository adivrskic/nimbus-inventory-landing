import { JetBrains_Mono } from "next/font/google";
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
import "./globals.css";
import "./globals.ocean-theme.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

const SITE_URL = "https://nautilusinventory.com";

/* GA4 measurement id — gated env var. Missing in dev / preview = no
   tracking script loads, no events fire, no errors. Production env
   var on Netlify should be set to G-XXXXXXXXXX. Must use NEXT_PUBLIC_
   prefix so it's available client-side. */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Nautilus WMS — AI-Powered Warehouse Management",
    template: "%s | Nautilus WMS",
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
    siteName: "Nautilus WMS",
    title: "Nautilus WMS — AI-Powered Warehouse Management",
    description:
      "AI-powered warehouse intelligence for modern operations teams. Scanning, spatial mapping, pick optimization, and predictive analytics in a single platform.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nautilus WMS — AI-Powered Warehouse Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nautilus WMS — AI-Powered Warehouse Management",
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
                  Wraps everything below so any descendant can pop the modal. */}
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
